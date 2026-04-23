-- =====================================================================
-- 0010 — Doctor availability + breaks
--
-- Adds two tables:
--   * doctor_availability — recurring weekly working hours per doctor.
--   * doctor_breaks       — one-off unavailability (vacation, half-days,
--                           blocked slots).
--
-- Plus one RPC (`get_unavailable_slots`) that the booking/reschedule UIs
-- call to know which of the canonical TIME_SLOTS a patient cannot pick,
-- combining booked + outside-hours + on-break in one round trip.
--
-- Backward compatibility:
--   A doctor with ZERO availability rows is treated as "available at all
--   slots". That means existing doctors keep working exactly as before
--   until they explicitly set hours.
--
-- IDEMPOTENT & SAFE — re-run freely.
-- =====================================================================

-- 1. Tables --------------------------------------------------------------
create table if not exists public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (doctor_id, day_of_week, start_time, end_time)
);

create index if not exists doctor_availability_doctor_idx
  on public.doctor_availability(doctor_id);
create index if not exists doctor_availability_dow_idx
  on public.doctor_availability(doctor_id, day_of_week);

create table if not exists public.doctor_breaks (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  break_date date not null,
  start_time time,    -- null = full-day break
  end_time time,      -- null = full-day break
  reason text,
  created_at timestamptz not null default now(),
  check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index if not exists doctor_breaks_doctor_date_idx
  on public.doctor_breaks(doctor_id, break_date);

-- 2. RLS -----------------------------------------------------------------
alter table public.doctor_availability enable row level security;
alter table public.doctor_breaks       enable row level security;

-- Helper: does the current user own this doctor row?
-- (Self-manage availability: the doctor, OR a clinic owner for that clinic.)
create or replace function public.can_manage_doctor(p_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.doctors d
    where d.id = p_doctor_id
      and (
        d.profile_id = auth.uid()
        or exists (
          select 1 from public.clinic_members m
          where m.clinic_id = d.clinic_id
            and m.user_id = auth.uid()
            and m.role in ('owner','receptionist')
        )
      )
  );
$$;
revoke all on function public.can_manage_doctor(uuid) from public;
grant execute on function public.can_manage_doctor(uuid) to authenticated;

-- doctor_availability policies ------------------------------------------
drop policy if exists "avail_select_all_authed"   on public.doctor_availability;
drop policy if exists "avail_insert_owner"        on public.doctor_availability;
drop policy if exists "avail_update_owner"        on public.doctor_availability;
drop policy if exists "avail_delete_owner"        on public.doctor_availability;

create policy "avail_select_all_authed"
  on public.doctor_availability
  for select to authenticated
  using (true);

create policy "avail_insert_owner"
  on public.doctor_availability
  for insert to authenticated
  with check (public.can_manage_doctor(doctor_id));

create policy "avail_update_owner"
  on public.doctor_availability
  for update to authenticated
  using (public.can_manage_doctor(doctor_id))
  with check (public.can_manage_doctor(doctor_id));

create policy "avail_delete_owner"
  on public.doctor_availability
  for delete to authenticated
  using (public.can_manage_doctor(doctor_id));

-- doctor_breaks policies ------------------------------------------------
drop policy if exists "breaks_select_all_authed" on public.doctor_breaks;
drop policy if exists "breaks_insert_owner"      on public.doctor_breaks;
drop policy if exists "breaks_update_owner"      on public.doctor_breaks;
drop policy if exists "breaks_delete_owner"      on public.doctor_breaks;

create policy "breaks_select_all_authed"
  on public.doctor_breaks
  for select to authenticated
  using (true);

create policy "breaks_insert_owner"
  on public.doctor_breaks
  for insert to authenticated
  with check (public.can_manage_doctor(doctor_id));

create policy "breaks_update_owner"
  on public.doctor_breaks
  for update to authenticated
  using (public.can_manage_doctor(doctor_id))
  with check (public.can_manage_doctor(doctor_id));

create policy "breaks_delete_owner"
  on public.doctor_breaks
  for delete to authenticated
  using (public.can_manage_doctor(doctor_id));

-- 3. RPC: get_unavailable_slots -----------------------------------------
-- Returns every TIME_SLOT the patient CANNOT pick for this (doctor, day)
-- because it's booked, outside working hours, or inside a break.
--
-- Backward-compat: if the doctor has no `doctor_availability` rows at
-- all, we treat them as 24/7 (only booked+break block slots).
create or replace function public.get_unavailable_slots(
  p_doctor_id uuid,
  p_day date
)
returns setof text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  slots constant text[] := array[
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '12:00','12:30','13:00','13:30','14:00','14:30',
    '15:00','15:30','16:00','16:30'
  ];
  s text;
  slot_time time;
  has_avail boolean;
begin
  select exists (
    select 1 from public.doctor_availability
    where doctor_id = p_doctor_id
  ) into has_avail;

  foreach s in array slots loop
    slot_time := (s || ':00')::time;

    -- Booked?
    if exists (
      select 1 from public.appointments
      where doctor_id = p_doctor_id
        and appointment_date::date = p_day
        and time_slot = s
        and status <> 'cancelled'
    ) then
      return next s;
      continue;
    end if;

    -- Outside working hours?
    if has_avail then
      if not exists (
        select 1 from public.doctor_availability da
        where da.doctor_id = p_doctor_id
          and da.day_of_week = extract(dow from p_day)::smallint
          and slot_time >= da.start_time
          and slot_time < da.end_time
      ) then
        return next s;
        continue;
      end if;
    end if;

    -- On break?
    if exists (
      select 1 from public.doctor_breaks b
      where b.doctor_id = p_doctor_id
        and b.break_date = p_day
        and (
          (b.start_time is null and b.end_time is null)
          or (slot_time >= b.start_time and slot_time < b.end_time)
        )
    ) then
      return next s;
    end if;
  end loop;
end;
$$;

grant execute on function public.get_unavailable_slots(uuid, date) to authenticated;

-- 4. RPC: is_slot_available --------------------------------------------
-- Single-slot check used by createAppointment / rescheduleAppointment
-- for defense-in-depth. Returns true if the slot is free to book.
create or replace function public.is_slot_available(
  p_doctor_id uuid,
  p_day date,
  p_slot text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.get_unavailable_slots(p_doctor_id, p_day) u(slot)
    where u.slot = p_slot
  );
$$;

grant execute on function public.is_slot_available(uuid, date, text) to authenticated;

-- 5. Self-check (commented) --------------------------------------------
-- select * from public.get_unavailable_slots('<doctor-uuid>', current_date);
-- select public.is_slot_available('<doctor-uuid>', current_date, '10:00');
