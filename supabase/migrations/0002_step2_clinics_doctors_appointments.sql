-- Step 2: clinics, doctors, appointments + RLS helpers

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.clinics enable row level security;

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  specialty text
);
create index doctors_clinic_id_idx on public.doctors(clinic_id);
alter table public.doctors enable row level security;

create type public.appointment_status as enum ('pending','confirmed','done','cancelled');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  appointment_date timestamptz not null,
  status public.appointment_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (appointment_date > now() - interval '1 day')
);
create index appointments_patient_idx on public.appointments(patient_id);
create index appointments_doctor_idx on public.appointments(doctor_id);
create index appointments_clinic_idx on public.appointments(clinic_id);
create index appointments_date_idx on public.appointments(appointment_date);
alter table public.appointments enable row level security;

create or replace function public.is_receptionist()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'receptionist');
$$;

create or replace function public.is_doctor(doctor_row uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.doctors d
    where d.id = doctor_row and d.profile_id = auth.uid()
  );
$$;

create policy "clinics_select_all_authenticated" on public.clinics
  for select to authenticated using (true);
create policy "clinics_insert_authenticated" on public.clinics
  for insert to authenticated with check (auth.uid() = created_by);

create policy "doctors_select_all_authenticated" on public.doctors
  for select to authenticated using (true);
create policy "doctors_insert_self_or_receptionist" on public.doctors
  for insert to authenticated with check (
    auth.uid() = profile_id or public.is_receptionist()
  );
create policy "doctors_update_self_or_receptionist" on public.doctors
  for update to authenticated using (
    auth.uid() = profile_id or public.is_receptionist()
  );

create policy "appointments_patient_insert" on public.appointments
  for insert to authenticated with check (auth.uid() = patient_id);

create policy "appointments_patient_select" on public.appointments
  for select to authenticated using (auth.uid() = patient_id);

create policy "appointments_doctor_select" on public.appointments
  for select to authenticated using (public.is_doctor(doctor_id));

create policy "appointments_doctor_update" on public.appointments
  for update to authenticated using (public.is_doctor(doctor_id));

create policy "appointments_receptionist_all" on public.appointments
  for all to authenticated
  using (public.is_receptionist())
  with check (public.is_receptionist());
