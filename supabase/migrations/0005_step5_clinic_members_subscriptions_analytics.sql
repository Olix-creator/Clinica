-- Step 5 — SaaS-ready architecture
--   * clinic_members: generic user↔clinic↔role membership
--   * subscriptions: per-clinic plan (free / pro / enterprise)
--   * notifications: phone + template_key for WhatsApp-ready fan-out
--   * RLS: staff can read profiles of patients they share a clinic with
--   * find_profile_by_email(): safe email lookup for invitation UI
--
-- Apply via Supabase Dashboard → SQL Editor on mixppfepddefteaelthu.

-- =============================================================
-- CLINIC MEMBERS (membership + role per clinic)
-- =============================================================
create type public.clinic_member_role as enum ('doctor', 'receptionist', 'owner');

create table if not exists public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.clinic_member_role not null,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id, role)
);

create index if not exists clinic_members_user_idx on public.clinic_members(user_id);
create index if not exists clinic_members_clinic_idx on public.clinic_members(clinic_id);

alter table public.clinic_members enable row level security;

-- Backfill: creator → owner; existing doctors → doctor members.
insert into public.clinic_members (clinic_id, user_id, role, invited_by)
select c.id, c.created_by, 'owner', c.created_by
from public.clinics c
on conflict do nothing;

insert into public.clinic_members (clinic_id, user_id, role, invited_by)
select d.clinic_id, d.profile_id, 'doctor', c.created_by
from public.doctors d
join public.clinics c on c.id = d.clinic_id
on conflict do nothing;

-- Helpers --------------------------------------------------------
create or replace function public.is_clinic_owner(clinic_row uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.clinics where id = clinic_row and created_by = auth.uid()
  );
$$;

create or replace function public.is_clinic_member(clinic_row uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.clinic_members
    where clinic_id = clinic_row
      and user_id = auth.uid()
  ) or exists (
    select 1 from public.doctors
    where clinic_id = clinic_row
      and profile_id = auth.uid()
  );
$$;

create or replace function public.is_clinic_staff(clinic_row uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.clinic_members
    where clinic_id = clinic_row
      and user_id = auth.uid()
      and role in ('owner','doctor','receptionist')
  ) or exists (
    select 1 from public.doctors
    where clinic_id = clinic_row
      and profile_id = auth.uid()
  );
$$;

-- RLS: clinic_members
drop policy if exists "clinic_members_select_self_or_staff" on public.clinic_members;
create policy "clinic_members_select_self_or_staff" on public.clinic_members
  for select to authenticated using (
    user_id = auth.uid() or public.is_clinic_member(clinic_id)
  );

drop policy if exists "clinic_members_insert_owner" on public.clinic_members;
create policy "clinic_members_insert_owner" on public.clinic_members
  for insert to authenticated with check (
    public.is_clinic_owner(clinic_id) or user_id = auth.uid()
  );

drop policy if exists "clinic_members_delete_owner" on public.clinic_members;
create policy "clinic_members_delete_owner" on public.clinic_members
  for delete to authenticated using (
    public.is_clinic_owner(clinic_id) or user_id = auth.uid()
  );

-- Auto-add the creator as owner when a new clinic is inserted.
create or replace function public.add_creator_as_clinic_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.clinic_members (clinic_id, user_id, role, invited_by)
  values (new.id, new.created_by, 'owner', new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_clinic_created_add_owner on public.clinics;
create trigger on_clinic_created_add_owner
  after insert on public.clinics
  for each row execute function public.add_creator_as_clinic_owner();

-- Auto-add doctor rows as doctor members of their home clinic.
create or replace function public.mirror_doctor_membership()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.clinic_members (clinic_id, user_id, role, invited_by)
  values (new.clinic_id, new.profile_id, 'doctor', auth.uid())
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_doctor_added_mirror_membership on public.doctors;
create trigger on_doctor_added_mirror_membership
  after insert on public.doctors
  for each row execute function public.mirror_doctor_membership();

-- =============================================================
-- SUBSCRIPTIONS (per-clinic plan)
-- =============================================================
create type public.plan_tier as enum ('free', 'pro', 'enterprise');

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  plan public.plan_tier not null default 'free',
  status text not null default 'active',
  seats int not null default 3,
  started_at timestamptz not null default now(),
  renewed_at timestamptz,
  cancelled_at timestamptz
);

alter table public.subscriptions enable row level security;

-- Backfill free plan for existing clinics.
insert into public.subscriptions (clinic_id, plan, status)
select id, 'free', 'active' from public.clinics
on conflict (clinic_id) do nothing;

drop policy if exists "subscriptions_select_clinic_members" on public.subscriptions;
create policy "subscriptions_select_clinic_members" on public.subscriptions
  for select to authenticated using (
    public.is_clinic_member(clinic_id)
  );

drop policy if exists "subscriptions_update_owner" on public.subscriptions;
create policy "subscriptions_update_owner" on public.subscriptions
  for update to authenticated using (
    public.is_clinic_owner(clinic_id)
  ) with check (
    public.is_clinic_owner(clinic_id)
  );

create or replace function public.add_default_subscription()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (clinic_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (clinic_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_clinic_created_add_subscription on public.clinics;
create trigger on_clinic_created_add_subscription
  after insert on public.clinics
  for each row execute function public.add_default_subscription();

-- =============================================================
-- NOTIFICATIONS: phone + template_key (WhatsApp-ready)
-- =============================================================
alter table public.notifications
  add column if not exists phone text;
alter table public.notifications
  add column if not exists template_key text;

-- Rebuild the insert trigger to capture phone + a template key
-- so a future worker can fan out to WhatsApp / SMS.
create or replace function public.notify_on_appointment_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  doctor_profile_id uuid;
  doctor_display text;
  patient_display text;
  patient_phone text;
  when_text text;
begin
  select d.profile_id, coalesce(d.name, p.full_name, p.email, 'your doctor')
    into doctor_profile_id, doctor_display
  from public.doctors d
  left join public.profiles p on p.id = d.profile_id
  where d.id = new.doctor_id;

  select coalesce(full_name, email, 'A patient'), phone
    into patient_display, patient_phone
  from public.profiles where id = new.patient_id;

  when_text := to_char(new.appointment_date at time zone 'UTC', 'Mon DD, HH24:MI');

  insert into public.notifications (user_id, type, message, appointment_id, phone, template_key)
  values (
    new.patient_id,
    'appointment.booked',
    'Your appointment with ' || doctor_display || ' is booked for ' || when_text || '.',
    new.id,
    patient_phone,
    'appointment_booked_patient'
  );

  if doctor_profile_id is not null then
    insert into public.notifications (user_id, type, message, appointment_id, phone, template_key)
    values (
      doctor_profile_id,
      'appointment.new',
      'New appointment with ' || patient_display || ' on ' || when_text || '.',
      new.id,
      patient_phone,
      'appointment_new_doctor'
    );
  end if;

  return new;
end;
$$;

create or replace function public.notify_on_appointment_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  when_text text;
  msg text;
  tkey text;
  patient_phone text;
begin
  if (new.status is distinct from old.status) then
    when_text := to_char(new.appointment_date at time zone 'UTC', 'Mon DD, HH24:MI');
    select phone into patient_phone from public.profiles where id = new.patient_id;

    if new.status = 'confirmed' then
      msg  := 'Your appointment on ' || when_text || ' was confirmed.';
      tkey := 'appointment_confirmed';
    elsif new.status = 'cancelled' then
      msg  := 'Your appointment on ' || when_text || ' was cancelled.';
      tkey := 'appointment_cancelled';
    elsif new.status = 'done' then
      msg  := 'Your visit on ' || when_text || ' was marked complete.';
      tkey := 'appointment_done';
    else
      msg  := 'Your appointment on ' || when_text || ' was updated.';
      tkey := 'appointment_updated';
    end if;

    insert into public.notifications (user_id, type, message, appointment_id, phone, template_key)
    values (new.patient_id, 'appointment.status', msg, new.id, patient_phone, tkey);
  end if;

  return new;
end;
$$;

-- =============================================================
-- PROFILES: staff can read patient profiles for their clinic
-- =============================================================
drop policy if exists "profiles_select_as_staff" on public.profiles;
create policy "profiles_select_as_staff" on public.profiles
  for select to authenticated using (
    -- Self is always allowed (covered by profiles_select_own too, kept for explicitness).
    id = auth.uid()
    or
    -- Patient profiles readable by anyone who shares a clinic via an appointment.
    exists (
      select 1 from public.appointments a
      where a.patient_id = public.profiles.id
        and public.is_clinic_member(a.clinic_id)
    )
    or
    -- Coworker profiles (same clinic_members row).
    exists (
      select 1 from public.clinic_members me
      join public.clinic_members them
        on me.clinic_id = them.clinic_id
      where me.user_id = auth.uid()
        and them.user_id = public.profiles.id
    )
  );

-- =============================================================
-- SAFE EMAIL LOOKUP (for the "invite by email" flow)
-- Returns a minimal row if a profile with that email exists.
-- SECURITY DEFINER so it bypasses RLS for this single lookup.
-- =============================================================
create or replace function public.find_profile_by_email(lookup_email text)
returns table (id uuid, full_name text, email text, role public.app_role)
language sql
stable
security definer set search_path = public
as $$
  select id, full_name, email, role
  from public.profiles
  where lower(email) = lower(trim(lookup_email))
  limit 1;
$$;

revoke all on function public.find_profile_by_email(text) from public;
grant execute on function public.find_profile_by_email(text) to authenticated;

-- =============================================================
-- RECEPTIONIST appointments scope (tighten to clinic members)
-- =============================================================
drop policy if exists "appointments_receptionist_all" on public.appointments;
create policy "appointments_receptionist_all" on public.appointments
  for all to authenticated
  using (
    public.is_clinic_staff(clinic_id)
  )
  with check (
    public.is_clinic_staff(clinic_id)
  );

-- Ensure the double-booking guard covers edits too (already covered by
-- the partial unique index from 0003).
