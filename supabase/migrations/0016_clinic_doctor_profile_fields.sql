-- Migration 0016 — Trust + experience fields for clinics and doctors
--
-- Adds the four "complete profile" columns the spec calls for:
--
--   public.clinics
--     since_year   int   — year the clinic opened (e.g. 1998)
--     trust_reason text  — short paragraph: "why patients should trust us"
--
--   public.doctors
--     diploma     text  — diploma / qualification string ("MD, Univ. d'Alger")
--     since_year  int   — year the doctor started practicing
--     description text  — short bio (optional)
--
-- These columns are nullable at the DB level so the migration runs
-- against existing rows without breaking. Required-ness is enforced at
-- the application layer (server actions + forms): new clinics created
-- through /onboarding/clinic must supply all clinic fields, and doctors
-- whose row is missing diploma/since_year are bounced to /onboarding/doctor
-- before they can use the dashboard. That keeps validation in one place
-- and lets us evolve the rules without ALTER TABLE migrations.

alter table public.clinics
  add column if not exists since_year   int,
  add column if not exists trust_reason text;

alter table public.doctors
  add column if not exists diploma     text,
  add column if not exists since_year  int,
  add column if not exists description text;

-- Sanity: years are 4-digit positive ints. Guard against weird inputs.
alter table public.clinics drop constraint if exists clinics_since_year_check;
alter table public.clinics
  add constraint clinics_since_year_check
  check (since_year is null or (since_year >= 1800 and since_year <= 2100));

alter table public.doctors drop constraint if exists doctors_since_year_check;
alter table public.doctors
  add constraint doctors_since_year_check
  check (since_year is null or (since_year >= 1900 and since_year <= 2100));
