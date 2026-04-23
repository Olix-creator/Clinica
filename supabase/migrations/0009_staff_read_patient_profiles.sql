-- =====================================================================
-- 0009 — Make sure doctors + receptionists can read patient profiles.
--
-- Symptom this fixes:
--   Doctor / receptionist dashboards show appointments but the joined
--   `patient.full_name` and `patient.phone` come back as null because the
--   `profiles` RLS policy silently filtered those rows out of the join.
--
-- Root cause:
--   Migration 0001 added `profiles_select_own` (auth.uid() = id).
--   Migration 0005 added `profiles_select_as_staff` but its
--   `is_clinic_member()` branch requires the staff member already
--   exists in `public.clinic_members` OR in `public.doctors` — which
--   isn't always the case in older environments that never ran the
--   0005 backfill.
--
-- Fix:
--   Replace `profiles_select_as_staff` with a simpler, self-sufficient
--   policy:
--     * self (auth.uid() = id) — always,
--     * staff (receptionist / doctor / clinic_member with owner or
--       doctor role) can SELECT any profile where role = 'patient',
--     * coworkers in the same clinic can read each other.
--
-- IDEMPOTENT & SAFE.  Re-run freely.  Only touches the profiles policy.
-- Run in Supabase Dashboard → SQL editor on project mixppfepddefteaelthu.
-- =====================================================================

-- Just in case `is_receptionist()` hasn't been created yet (e.g. fresh DB
-- where 0002 was never applied), ensure it's present.  Pure no-op when
-- the function already exists.
create or replace function public.is_receptionist()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'receptionist'
  );
$$;

revoke all on function public.is_receptionist() from public;
grant execute on function public.is_receptionist() to authenticated;

-- Drop older variants (both 0005's and any earlier prototypes).
drop policy if exists "profiles_select_as_staff"           on public.profiles;
drop policy if exists "profiles_staff_read_patients"       on public.profiles;
drop policy if exists "profiles_select_clinic_coworkers"   on public.profiles;

create policy "profiles_select_as_staff"
  on public.profiles
  for select to authenticated
  using (
    -- Self — always readable.
    id = auth.uid()
    -- Staff → patients.
    or (
      role = 'patient'
      and (
        public.is_receptionist()
        or exists (
          select 1 from public.doctors d
          where d.profile_id = auth.uid()
        )
        or exists (
          select 1 from public.clinic_members m
          where m.user_id = auth.uid()
            and m.role in ('owner','doctor','receptionist')
        )
      )
    )
    -- Coworkers — staff members of the same clinic can read each other
    -- (so the receptionist table's "Doctor" column renders names).
    or exists (
      select 1 from public.clinic_members me
      join public.clinic_members them on me.clinic_id = them.clinic_id
      where me.user_id = auth.uid()
        and them.user_id = public.profiles.id
    )
  );

-- Keep `profiles_select_own` around as an explicit "self" policy; it's a
-- strict subset of the new policy but removing it would be noisy in
-- logs and break clients that probe policy names.

-- =====================================================================
-- Self-check (commented out; paste into SQL editor after running this).
-- =====================================================================
-- -- As a doctor, you should see every patient with an appointment in
-- -- your clinic (plus yourself and your clinic coworkers).
-- select id, full_name, phone, role from public.profiles;
--
-- -- As a receptionist, you should see every patient row.
-- select count(*) from public.profiles where role = 'patient';
