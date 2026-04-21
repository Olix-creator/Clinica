-- Step 3 — Notifications + double-booking prevention + cancellation tracking
-- Apply via Supabase Dashboard → SQL Editor (MCP deploy was not available when this was authored).

-- =============================================================
-- NOTIFICATIONS TABLE
-- =============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info',
  message text not null,
  appointment_id uuid references public.appointments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id) where read = false;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Receptionists can insert any notification (e.g. reminders); patients cannot forge.
drop policy if exists "notifications_insert_staff" on public.notifications;
create policy "notifications_insert_staff" on public.notifications
  for insert to authenticated with check (
    public.is_receptionist() or auth.uid() = user_id
  );

-- Let realtime stream notification changes.
-- (Supabase Realtime automatically respects RLS on select.)
alter publication supabase_realtime add table public.notifications;

-- =============================================================
-- DOUBLE-BOOKING PREVENTION
-- =============================================================
-- A doctor cannot have two non-cancelled appointments at the exact same slot.
create unique index if not exists appointments_doctor_slot_unique
  on public.appointments(doctor_id, appointment_date)
  where status <> 'cancelled';

-- =============================================================
-- NOTIFICATION TRIGGER FUNCTIONS
-- =============================================================
-- When an appointment is created, notify the doctor and receptionists.
create or replace function public.notify_on_appointment_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  doctor_profile_id uuid;
  doctor_name text;
  patient_name text;
  when_text text;
begin
  -- Look up the doctor's profile id.
  select d.profile_id into doctor_profile_id
  from public.doctors d where d.id = new.doctor_id;

  -- Best-effort display names for the message.
  select coalesce(full_name, email, 'A patient') into patient_name
  from public.profiles where id = new.patient_id;
  select coalesce(full_name, email, 'your doctor') into doctor_name
  from public.profiles where id = doctor_profile_id;

  when_text := to_char(new.appointment_date at time zone 'UTC', 'Mon DD, HH24:MI');

  -- Patient: confirmation of their own booking.
  insert into public.notifications (user_id, type, message, appointment_id)
  values (
    new.patient_id,
    'appointment.booked',
    'Your appointment with ' || doctor_name || ' is booked for ' || when_text || '.',
    new.id
  );

  -- Doctor (if linked to a profile): new appointment on their calendar.
  if doctor_profile_id is not null then
    insert into public.notifications (user_id, type, message, appointment_id)
    values (
      doctor_profile_id,
      'appointment.new',
      'New appointment with ' || patient_name || ' on ' || when_text || '.',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_appointment_inserted on public.appointments;
create trigger on_appointment_inserted
  after insert on public.appointments
  for each row execute function public.notify_on_appointment_insert();

-- When status changes, notify the patient.
create or replace function public.notify_on_appointment_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  when_text text;
  msg text;
begin
  if (new.status is distinct from old.status) then
    when_text := to_char(new.appointment_date at time zone 'UTC', 'Mon DD, HH24:MI');
    msg := case new.status
      when 'confirmed' then 'Your appointment on ' || when_text || ' was confirmed.'
      when 'cancelled' then 'Your appointment on ' || when_text || ' was cancelled.'
      when 'done' then 'Your visit on ' || when_text || ' was marked complete.'
      else 'Your appointment on ' || when_text || ' was updated.'
    end;

    insert into public.notifications (user_id, type, message, appointment_id)
    values (new.patient_id, 'appointment.status', msg, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_appointment_status_changed on public.appointments;
create trigger on_appointment_status_changed
  after update on public.appointments
  for each row execute function public.notify_on_appointment_status_change();

-- =============================================================
-- REALTIME: ensure appointments stream too
-- =============================================================
alter publication supabase_realtime add table public.appointments;
