-- Step 4 — Add profiles.phone, doctors.name, and fix doctor RLS to be clinic-wide.
-- Apply via Supabase Dashboard → SQL Editor on project mixppfepddefteaelthu.

-- =============================================================
-- PROFILES: phone number
-- =============================================================
alter table public.profiles
  add column if not exists phone text;

-- =============================================================
-- DOCTORS: display name (overrides linked profile name when set)
-- =============================================================
alter table public.doctors
  add column if not exists name text;

-- Backfill existing doctor rows with the linked profile's name.
update public.doctors d
set name = coalesce(p.full_name, p.email, 'Doctor')
from public.profiles p
where d.profile_id = p.id
  and (d.name is null or d.name = '');

-- =============================================================
-- handle_new_user: also capture phone from auth metadata
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'patient')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- =============================================================
-- RLS: doctors now have clinic-wide read + update on appointments
-- =============================================================
-- Drop the doctor_id-scoped policies from migration 0002.
drop policy if exists "appointments_doctor_select" on public.appointments;
drop policy if exists "appointments_doctor_update" on public.appointments;

-- New: a doctor can read every appointment belonging to any clinic
-- they are attached to (so they can see their colleagues' schedule).
create policy "appointments_doctor_select_clinic" on public.appointments
  for select to authenticated using (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id = public.appointments.clinic_id
    )
  );

-- New: a doctor can update any appointment in their clinic
-- (mark as done / waiting / confirmed). Receptionist policy still applies.
create policy "appointments_doctor_update_clinic" on public.appointments
  for update to authenticated using (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id = public.appointments.clinic_id
    )
  ) with check (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id = public.appointments.clinic_id
    )
  );

-- =============================================================
-- Patients: ensure they can read their own profile's doctor info
-- (no schema change, just making intent explicit in comments)
-- =============================================================

-- =============================================================
-- Doctor profile write: let a doctor or receptionist update
-- doctors.name / specialty on their own row.
-- =============================================================
drop policy if exists "doctors_update_self_or_receptionist" on public.doctors;
create policy "doctors_update_self_or_receptionist" on public.doctors
  for update to authenticated using (
    auth.uid() = profile_id or public.is_receptionist()
  ) with check (
    auth.uid() = profile_id or public.is_receptionist()
  );
