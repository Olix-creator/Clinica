-- Migration 0007 — time-slot booking
--
-- Adds explicit `time_slot` text column (e.g. "10:00", "10:30") to the
-- appointments table so the UI can show a discrete grid of slots and the
-- DB can enforce "one booking per (doctor, date, slot)" via a unique index.
--
-- All changes are idempotent — safe to re-run.

-- 1. Column --------------------------------------------------------------
alter table public.appointments
  add column if not exists time_slot text;

-- 2. Backfill time_slot from existing appointment_date rows -------------
--    (takes HH:MM in the server's timezone — good enough for existing demo
--    data; new rows always get time_slot from the client explicitly).
update public.appointments
   set time_slot = to_char(appointment_date, 'HH24:MI')
 where time_slot is null;

-- 3. Enforce "one booking per doctor per calendar day + slot" ----------
--    NOTE: The unique index that enforces this lives in migration 0008.
--    We can't index `(appointment_date::date)` directly because casting
--    `timestamptz` → `date` is not IMMUTABLE (it depends on the session
--    timezone). Migration 0008 adds a stored `appointment_day date`
--    column + trigger and indexes that column instead.

-- 4. Helper RPC to surface booked slots for a (doctor, day) combo ------
--    Lets the booking UI gray out the unavailable buttons without the
--    browser peeking at other users' rows directly. Runs as SECURITY
--    DEFINER so RLS on appointments doesn't hide slots from the patient
--    trying to book — we only return the opaque time_slot strings, never
--    patient-identifying data.
create or replace function public.get_booked_slots(
  p_doctor_id uuid,
  p_day date
)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select time_slot
    from public.appointments
   where doctor_id = p_doctor_id
     and appointment_date::date = p_day
     and status <> 'cancelled'
     and time_slot is not null;
$$;

grant execute on function public.get_booked_slots(uuid, date) to authenticated;
