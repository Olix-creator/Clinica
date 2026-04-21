-- =====================================================================
-- 0006 — Fix doctor dashboard visibility + ensure clinic_members exists
--
-- IDEMPOTENT & SAFE.
-- Works whether or not migration 0005 was applied.
-- Touches only:
--   * enum public.clinic_member_role        (create if missing)
--   * table public.clinic_members           (create if missing)
--   * table public.doctors                  (insert backfill only)
--   * policies on appointments / members    (drop-if-exists + create)
--   * helper functions & triggers           (create or replace)
--
-- Does NOT:
--   * drop any existing table / column
--   * truncate any existing data
--   * rename anything
--
-- Run in Supabase → SQL editor on project mixppfepddefteaelthu.
-- =====================================================================


-- =====================================================================
-- SECTION A — clinic_members (TASK 1)
-- =====================================================================

-- A.1 Enum type, created only if missing.
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'clinic_member_role'
      and n.nspname = 'public'
  ) then
    create type public.clinic_member_role as enum ('owner', 'doctor', 'receptionist');
  end if;
end
$$;

-- A.2 Table. `create table if not exists` → no-op on re-run.
-- NOTE on uniqueness: we use (clinic_id, user_id, role) rather than the
-- tighter (clinic_id, user_id) so a single user can, if needed, carry more
-- than one role in the same clinic (e.g. an owner-doctor). This matches
-- existing Step 5 behaviour and the service-layer code that already
-- relies on it. Adding the tighter constraint here would break owner-
-- doctors who also appear as doctor members.
create table if not exists public.clinic_members (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.clinic_member_role not null,
  invited_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- A.3 Make sure the composite uniqueness exists, even on a table created
-- by an older, laxer version of this migration.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clinic_members_clinic_id_user_id_role_key'
      and conrelid = 'public.clinic_members'::regclass
  ) then
    alter table public.clinic_members
      add constraint clinic_members_clinic_id_user_id_role_key
      unique (clinic_id, user_id, role);
  end if;
end
$$;

-- A.4 Indexes for the hot lookups. `if not exists` → safe.
create index if not exists clinic_members_user_idx   on public.clinic_members(user_id);
create index if not exists clinic_members_clinic_idx on public.clinic_members(clinic_id);


-- =====================================================================
-- SECTION B — RLS on clinic_members (TASKS 2 + 3)
-- =====================================================================
alter table public.clinic_members enable row level security;

-- B.1 Helper: is the current user the owner of this clinic?
-- Reading public.clinics is safe here because SECURITY DEFINER bypasses RLS.
create or replace function public.is_clinic_owner(clinic_row uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.clinics
    where id = clinic_row
      and created_by = auth.uid()
  );
$$;

-- B.2 Helper: is the current user ANY member of this clinic (membership
-- table OR legacy doctors row)?  This is what the doctor RLS relies on.
create or replace function public.is_clinic_member(clinic_row uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.clinic_members
    where clinic_id = clinic_row
      and user_id   = auth.uid()
  )
  or exists (
    select 1 from public.doctors
    where clinic_id  = clinic_row
      and profile_id = auth.uid()
  );
$$;

-- B.3 Helper: owner / doctor / receptionist role scoped to a clinic.
create or replace function public.is_clinic_staff(clinic_row uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.clinic_members
    where clinic_id = clinic_row
      and user_id   = auth.uid()
      and role in ('owner','doctor','receptionist')
  )
  or exists (
    select 1 from public.doctors
    where clinic_id  = clinic_row
      and profile_id = auth.uid()
  );
$$;

-- B.4 Policies (idempotent).
drop policy if exists "clinic_members_select_self_or_member" on public.clinic_members;
create policy "clinic_members_select_self_or_member"
  on public.clinic_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_clinic_member(clinic_id)
    or public.is_clinic_owner(clinic_id)
  );

drop policy if exists "clinic_members_insert_owner_or_self" on public.clinic_members;
create policy "clinic_members_insert_owner_or_self"
  on public.clinic_members
  for insert to authenticated
  with check (
    public.is_clinic_owner(clinic_id)
    or user_id = auth.uid()
  );

drop policy if exists "clinic_members_update_owner" on public.clinic_members;
create policy "clinic_members_update_owner"
  on public.clinic_members
  for update to authenticated
  using (public.is_clinic_owner(clinic_id))
  with check (public.is_clinic_owner(clinic_id));

drop policy if exists "clinic_members_delete_owner_or_self" on public.clinic_members;
create policy "clinic_members_delete_owner_or_self"
  on public.clinic_members
  for delete to authenticated
  using (
    public.is_clinic_owner(clinic_id)
    or user_id = auth.uid()
  );


-- =====================================================================
-- SECTION C — Triggers that keep clinic_members in sync (TASK 4)
-- =====================================================================

-- C.1 Auto-add the creator as owner when a clinic is inserted.
create or replace function public.add_creator_as_clinic_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.clinic_members (clinic_id, user_id, role, invited_by)
  values (new.id, new.created_by, 'owner', new.created_by)
  on conflict (clinic_id, user_id, role) do nothing;
  return new;
end;
$$;

drop trigger if exists on_clinic_created_add_owner on public.clinics;
create trigger on_clinic_created_add_owner
  after insert on public.clinics
  for each row execute function public.add_creator_as_clinic_owner();

-- C.2 Auto-mirror a `doctors` insert into a `clinic_members(doctor)` row.
create or replace function public.mirror_doctor_membership()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.clinic_members (clinic_id, user_id, role, invited_by)
  values (new.clinic_id, new.profile_id, 'doctor', auth.uid())
  on conflict (clinic_id, user_id, role) do nothing;
  return new;
end;
$$;

drop trigger if exists on_doctor_added_mirror_membership on public.doctors;
create trigger on_doctor_added_mirror_membership
  after insert on public.doctors
  for each row execute function public.mirror_doctor_membership();

-- C.3 Backfill: every existing clinic → owner row; every existing doctor →
-- doctor member row. `on conflict do nothing` makes this safe on re-run.
insert into public.clinic_members (clinic_id, user_id, role, invited_by)
select c.id, c.created_by, 'owner', c.created_by
from public.clinics c
on conflict (clinic_id, user_id, role) do nothing;

insert into public.clinic_members (clinic_id, user_id, role, invited_by)
select d.clinic_id, d.profile_id, 'doctor', c.created_by
from public.doctors d
join public.clinics c on c.id = d.clinic_id
on conflict (clinic_id, user_id, role) do nothing;


-- =====================================================================
-- SECTION D — Owner-doctors get a public.doctors row
-- A doctor-role user who creates a clinic must be bookable. Without this
-- the booking form wouldn't list them and the dashboard wouldn't match
-- any appointment for them.
-- =====================================================================

create or replace function public.ensure_doctor_row_for_creator()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  creator_role  public.app_role;
  creator_name  text;
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

-- Backfill existing doctor-role creators without a doctors row.
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


-- =====================================================================
-- SECTION E — RLS on appointments now honours clinic_members (fix)
-- =====================================================================

-- Drop older versions, if any (any of the three names from 0002 / 0004).
drop policy if exists "appointments_doctor_select"        on public.appointments;
drop policy if exists "appointments_doctor_update"        on public.appointments;
drop policy if exists "appointments_doctor_select_clinic" on public.appointments;
drop policy if exists "appointments_doctor_update_clinic" on public.appointments;

create policy "appointments_doctor_select_clinic"
  on public.appointments
  for select to authenticated
  using (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id  = public.appointments.clinic_id
    )
    or exists (
      select 1 from public.clinic_members m
      where m.user_id  = auth.uid()
        and m.clinic_id = public.appointments.clinic_id
        and m.role in ('owner','doctor')
    )
  );

create policy "appointments_doctor_update_clinic"
  on public.appointments
  for update to authenticated
  using (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id  = public.appointments.clinic_id
    )
    or exists (
      select 1 from public.clinic_members m
      where m.user_id  = auth.uid()
        and m.clinic_id = public.appointments.clinic_id
        and m.role in ('owner','doctor')
    )
  )
  with check (
    exists (
      select 1 from public.doctors me
      where me.profile_id = auth.uid()
        and me.clinic_id  = public.appointments.clinic_id
    )
    or exists (
      select 1 from public.clinic_members m
      where m.user_id  = auth.uid()
        and m.clinic_id = public.appointments.clinic_id
        and m.role in ('owner','doctor')
    )
  );


-- =====================================================================
-- SECTION F — Deterministic read RPCs for the doctor dashboard (TASK 6)
-- =====================================================================

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
  p_date_to   timestamptz default null
)
returns table (
  id                 uuid,
  patient_id         uuid,
  doctor_id          uuid,
  clinic_id          uuid,
  appointment_date   timestamptz,
  status             public.appointment_status,
  created_at         timestamptz,
  patient_full_name  text,
  patient_email      text,
  patient_phone      text,
  doctor_name        text,
  doctor_specialty   text,
  clinic_name        text
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


-- =====================================================================
-- SECTION G — Quick self-check (TASK 7)
--
-- Paste these into the SQL editor after running the migration to verify.
-- They are commented out so the migration itself never fails on them.
-- =====================================================================

-- -- 1. Every clinic has an owner row in clinic_members?
-- select c.id, c.name,
--        exists(select 1 from clinic_members m
--               where m.clinic_id = c.id and m.role='owner') as has_owner
--   from clinics c;
--
-- -- 2. My memberships (run while signed in as a user):
-- select * from clinic_members where user_id = auth.uid();
--
-- -- 3. My visible clinic ids (should include every clinic I own / doctor in):
-- select * from doctor_visible_clinic_ids(auth.uid());
--
-- -- 4. Doctor dashboard contents for the current session:
-- select * from get_doctor_appointments();
