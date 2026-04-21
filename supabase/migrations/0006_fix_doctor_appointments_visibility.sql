-- Step 6 — Fix doctor dashboard visibility of appointments.
--
-- Symptom: a patient books an appointment, it appears in the patient
-- dashboard, but the doctor dashboard is empty.
--
-- Root causes closed here:
--   1. Owner-doctors (profile.role='doctor' who created a clinic) may not
--      have a row in public.doctors, so getDoctorByProfile() returns null
--      and the dashboard renders empty. A trigger now auto-creates a
--      doctors row on clinic creation when the creator is a doctor profile.
--   2. The RLS policy appointments_doctor_select_clinic only passed when
--      public.doctors had a row matching the clinic — it did not honor the
--      newer clinic_members model. It's now augmented to also pass when
--      the caller is a clinic_member with role in (owner, doctor).
--   3. An RPC (get_doctor_appointments_for_user) gives the server a
--      deterministic, RLS-safe read path that bypasses subtle nested-policy
--      evaluation when joining relations.
--
-- Apply via Supabase Dashboard → SQL Editor on mixppfepddefteaelthu.

-- =============================================================
-- 1. Auto-create a doctors row for doctor-role clinic creators
-- =============================================================
create or replace function public.ensure_doctor_row_for_creator()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  creator_role public.app_role;
  creator_name text;
  creator_email text;
begin
  select role, full_name, email
    into creator_role, creator_name, creator_email
  from public.profiles
  where id = new.created_by;

  if creator_role = 'doctor' then
    insert into public.doctors (profile_id, clinic_id, name)
    values (new.created_by, new.id, coalesce(creator_name, creator_email, 'Doctor'))
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_clinic_created_ensure_doctor on public.clinics;
create trigger on_clinic_created_ensure_doctor
  after insert on public.clinics
  for each row execute function public.ensure_doctor_row_for_creator();

-- Backfill: any existing doctor-role creator without a doctors row gets one
-- in the clinic they created. `doctors.profile_id` is UNIQUE, so we pick
-- the earliest clinic per such creator.
insert into public.doctors (profile_id, clinic_id, name)
select distinct on (p.id)
  p.id,
  c.id,
  coalesce(p.full_name, p.email, 'Doctor')
from public.profiles p
join public.clinics c on c.created_by = p.id
where p.role = 'doctor'
  and not exists (select 1 from public.doctors d where d.profile_id = p.id)
order by p.id, c.created_at asc
on conflict (profile_id) do nothing;

-- =============================================================
-- 2. Harden the doctor SELECT/UPDATE policies on appointments
--    to also honor clinic_members membership (owner / doctor).
-- =============================================================
drop policy if exists "appointments_doctor_select_clinic" on public.appointments;
create policy "appointments_doctor_select_clinic" on public.appointments
  for select to authenticated using (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id = public.appointments.clinic_id
    )
    or exists (
      select 1 from public.clinic_members m
      where m.user_id = auth.uid()
        and m.clinic_id = public.appointments.clinic_id
        and m.role in ('owner','doctor')
    )
  );

drop policy if exists "appointments_doctor_update_clinic" on public.appointments;
create policy "appointments_doctor_update_clinic" on public.appointments
  for update to authenticated using (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id = public.appointments.clinic_id
    )
    or exists (
      select 1 from public.clinic_members m
      where m.user_id = auth.uid()
        and m.clinic_id = public.appointments.clinic_id
        and m.role in ('owner','doctor')
    )
  ) with check (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id = public.appointments.clinic_id
    )
    or exists (
      select 1 from public.clinic_members m
      where m.user_id = auth.uid()
        and m.clinic_id = public.appointments.clinic_id
        and m.role in ('owner','doctor')
    )
  );

-- =============================================================
-- 3. Deterministic read RPC for the doctor dashboard.
--    Returns every appointment the caller should see as a doctor,
--    along with joined patient + clinic + doctor fields. Bypasses
--    nested-RLS evaluation surprises.
-- =============================================================
create or replace function public.doctor_visible_clinic_ids(p_user_id uuid)
returns setof uuid
language sql
stable
security definer set search_path = public
as $$
  select clinic_id from public.doctors where profile_id = p_user_id
  union
  select clinic_id from public.clinic_members
   where user_id = p_user_id and role in ('owner','doctor');
$$;

revoke all on function public.doctor_visible_clinic_ids(uuid) from public;
grant execute on function public.doctor_visible_clinic_ids(uuid) to authenticated;

create or replace function public.get_doctor_appointments(
  p_date_from timestamptz default null,
  p_date_to timestamptz default null
)
returns table (
  id uuid,
  patient_id uuid,
  doctor_id uuid,
  clinic_id uuid,
  appointment_date timestamptz,
  status public.appointment_status,
  created_at timestamptz,
  patient_full_name text,
  patient_email text,
  patient_phone text,
  doctor_name text,
  doctor_specialty text,
  clinic_name text
)
language sql
stable
security definer set search_path = public
as $$
  select
    a.id,
    a.patient_id,
    a.doctor_id,
    a.clinic_id,
    a.appointment_date,
    a.status,
    a.created_at,
    p.full_name,
    p.email,
    p.phone,
    d.name,
    d.specialty,
    c.name
  from public.appointments a
  left join public.profiles p on p.id = a.patient_id
  left join public.doctors  d on d.id = a.doctor_id
  left join public.clinics  c on c.id = a.clinic_id
  where a.clinic_id in (select public.doctor_visible_clinic_ids(auth.uid()))
    and (p_date_from is null or a.appointment_date >= p_date_from)
    and (p_date_to   is null or a.appointment_date <  p_date_to)
  order by a.appointment_date asc;
$$;

revoke all on function public.get_doctor_appointments(timestamptz, timestamptz) from public;
grant execute on function public.get_doctor_appointments(timestamptz, timestamptz) to authenticated;
