-- Migration 0008 — production-safe double-booking guard
--
-- Postgres won't let us build a unique index on `(appointment_date::date)`
-- because casting `timestamptz` → `date` depends on the session's TimeZone
-- setting and is therefore NOT IMMUTABLE. An index expression MUST be
-- immutable (same input → same output, always).
--
-- The production-safe pattern is:
--   1. Store the calendar day in its own plain `date` column
--      (`appointment_day`), kept in sync with `appointment_date` by a
--      BEFORE INSERT/UPDATE trigger.
--   2. Build the unique index on that stored column.
--
-- This migration is fully idempotent. It cleans up any broken artifacts
-- from earlier attempts, adds the column, backfills, wires the trigger,
-- creates the correct unique index, and updates `get_booked_slots` to
-- use the new column.

-- ----------------------------------------------------------------------
-- Step 1 — Clean up any previously-attempted index that referenced
--           the non-immutable `appointment_date::date` expression.
-- ----------------------------------------------------------------------
--
-- We drop by name because the CREATE UNIQUE INDEX statement in 0007
-- used this exact name. If it never existed (fresh DB), DROP ... IF
-- EXISTS is a no-op.
drop index if exists public.appointments_doctor_slot_unique;

-- ----------------------------------------------------------------------
-- Step 2 — Add the stored calendar-day column (idempotent)
-- ----------------------------------------------------------------------
alter table public.appointments
  add column if not exists appointment_day date;

-- ----------------------------------------------------------------------
-- Step 3 — Backfill from existing rows (only where null, so re-running
--           this migration never touches rows that were maintained by
--           the trigger on a later insert).
-- ----------------------------------------------------------------------
update public.appointments
   set appointment_day = (appointment_date at time zone 'UTC')::date
 where appointment_day is null;

-- ----------------------------------------------------------------------
-- Step 4 — Keep `appointment_day` in sync automatically
-- ----------------------------------------------------------------------
--
-- We compute the day in UTC so the value is stable regardless of the
-- session timezone — same reason the cast is not immutable in the first
-- place. Once the app decides to become timezone-aware per clinic, this
-- is the single knob to turn.
create or replace function public.set_appointment_day()
returns trigger
language plpgsql
as $$
begin
  new.appointment_day := (new.appointment_date at time zone 'UTC')::date;
  return new;
end;
$$;

drop trigger if exists appointments_set_day on public.appointments;

create trigger appointments_set_day
  before insert or update of appointment_date
  on public.appointments
  for each row
  execute function public.set_appointment_day();

-- Make sure every existing row now has a day set (covers any rows
-- written between the backfill above and the trigger creation).
update public.appointments
   set appointment_day = (appointment_date at time zone 'UTC')::date
 where appointment_day is null;

-- Once populated, enforce NOT NULL so the unique index never sees NULLs
-- (NULL != NULL in Postgres → multiple NULL-day rows would all be
-- "unique"). We only flip the column to NOT NULL if no nulls remain.
do $$
begin
  if not exists (
    select 1 from public.appointments where appointment_day is null
  ) then
    begin
      alter table public.appointments
        alter column appointment_day set not null;
    exception when others then
      -- Another session may have raced us; ignore.
      null;
    end;
  end if;
end $$;

-- ----------------------------------------------------------------------
-- Step 5 — The unique index that actually prevents double-booking.
-- ----------------------------------------------------------------------
--
-- Partial index: cancelled rows are excluded so a freed-up slot is
-- re-bookable. Rows with a null time_slot are ignored (legacy / import
-- data) to avoid blocking them.
create unique index if not exists appointments_doctor_day_slot_unique
  on public.appointments (doctor_id, appointment_day, time_slot)
  where status <> 'cancelled' and time_slot is not null;

-- Helpful secondary index for date-range dashboards that filter by day.
create index if not exists appointments_day_idx
  on public.appointments (appointment_day);

-- ----------------------------------------------------------------------
-- Step 6 — Update the booked-slot lookup to use the stored column
-- ----------------------------------------------------------------------
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
     and appointment_day = p_day
     and status <> 'cancelled'
     and time_slot is not null;
$$;

grant execute on function public.get_booked_slots(uuid, date) to authenticated;

-- ----------------------------------------------------------------------
-- Step 7 — Self-check (no-op; documents intent)
-- ----------------------------------------------------------------------
--   -- Should return zero rows (no duplicate live bookings):
--   select doctor_id, appointment_day, time_slot, count(*)
--     from public.appointments
--    where status <> 'cancelled' and time_slot is not null
--    group by 1, 2, 3
--   having count(*) > 1;
