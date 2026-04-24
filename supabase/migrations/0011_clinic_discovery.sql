-- Migration 0011 — Patient-facing clinic discovery
--
-- Phase 1 of the public search + booking experience. Extends the `clinics`
-- table with the fields the directory needs (specialty / city / address /
-- description) and opens read-only access so an unauthenticated visitor can
-- browse the clinic catalogue + read doctor names.
--
-- Writes remain locked down — nothing in this migration loosens insert/
-- update/delete. RLS for appointments is untouched, so booking still
-- requires an authenticated patient session.

-- 1. Add discovery columns (idempotent so re-running is safe).
alter table public.clinics
  add column if not exists specialty   text,
  add column if not exists city        text,
  add column if not exists address     text,
  add column if not exists description text;

-- Case-insensitive search indexes (ILIKE 'prefix%' + trigram-style ILIKE '%q%').
create index if not exists clinics_city_lower_idx      on public.clinics (lower(city));
create index if not exists clinics_specialty_lower_idx on public.clinics (lower(specialty));

-- 2. Public SELECT on clinics — anonymous visitors can browse the directory.
-- The old `clinics_select_all_authenticated` stays in place; this just adds
-- an additional policy for the `anon` role.
drop policy if exists "clinics_select_public" on public.clinics;
create policy "clinics_select_public" on public.clinics
  for select to anon using (true);

-- 3. Public SELECT on doctors — needed so the clinic detail page can list
-- who works there without logging in. Only the `doctors` row itself is
-- exposed; the profile join is handled by a separate policy below.
drop policy if exists "doctors_select_public" on public.doctors;
create policy "doctors_select_public" on public.doctors
  for select to anon using (true);

-- 4. Public SELECT on profiles — BUT only the tiny subset that belongs to
-- someone who's a doctor. Patient/staff profiles stay invisible. We use a
-- SECURITY DEFINER helper so the policy itself is concise and the check
-- can't recurse through profiles.
create or replace function public.is_doctor_profile(profile_row uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.doctors d where d.profile_id = profile_row
  );
$$;

drop policy if exists "profiles_select_doctor_public" on public.profiles;
create policy "profiles_select_doctor_public" on public.profiles
  for select to anon
  using (public.is_doctor_profile(id));

-- Note for operators: after applying this migration, optionally seed a few
-- demo clinics with the new columns so the /search page has something to
-- render on first visit. See `supabase/seed.sql`.
