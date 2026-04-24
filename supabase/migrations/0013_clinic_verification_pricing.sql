-- Migration 0013 — Clinic verification + pricing (free trial / premium)
--
-- Adds the fields the onboarding spec calls for, WITHOUT touching any of
-- the existing subscription / seats machinery from migration 0005. The new
-- columns live on `public.clinics` so the free-tier gate can be evaluated
-- with zero joins at booking time.
--
-- Fields:
--   phone                         — required for verification (manual approval)
--   status                        — 'pending' | 'approved' | 'rejected'
--   plan_type                     — 'free' | 'premium'
--   trial_end_date                — now + 30 days at creation
--   monthly_appointments_count    — cached count (authoritative value is
--                                   always `select count(*) from appointments
--                                   where clinic_id = … and created_at >=
--                                   date_trunc('month', now())` — this cached
--                                   copy exists so dashboards can read one row
--                                   instead of running the count everywhere)
--
-- RLS: the existing "anon can SELECT any clinic" policy added in 0011 is
-- tightened here to require `status = 'approved'`. Pending / rejected clinics
-- remain visible to their owner (authenticated policy, unchanged) so the
-- owner can finish the setup form without seeing their own clinic vanish.
--
-- Data safety: the three legacy demo clinics from migration 0012 are flipped
-- to status='approved' so /search doesn't go blank for the user right after
-- this migration runs.

-- 1. Add the new columns. Nullable at first so the legacy rows survive.
alter table public.clinics
  add column if not exists phone                      text,
  add column if not exists status                     text,
  add column if not exists plan_type                  text,
  add column if not exists trial_end_date             timestamptz,
  add column if not exists monthly_appointments_count int;

-- 2. Backfill existing rows to a sensible default so nothing breaks.
update public.clinics
set status                     = coalesce(status, 'approved'),
    plan_type                  = coalesce(plan_type, 'free'),
    trial_end_date             = coalesce(trial_end_date, now() + interval '30 days'),
    monthly_appointments_count = coalesce(monthly_appointments_count, 0)
where status is null
   or plan_type is null
   or trial_end_date is null
   or monthly_appointments_count is null;

-- 3. Now that every row has values, enforce NOT NULL + defaults for future inserts.
alter table public.clinics
  alter column status                     set default 'pending',
  alter column status                     set not null,
  alter column plan_type                  set default 'free',
  alter column plan_type                  set not null,
  alter column trial_end_date             set default (now() + interval '30 days'),
  alter column trial_end_date             set not null,
  alter column monthly_appointments_count set default 0,
  alter column monthly_appointments_count set not null;

-- 4. Value constraints.
alter table public.clinics drop constraint if exists clinics_status_check;
alter table public.clinics
  add constraint clinics_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table public.clinics drop constraint if exists clinics_plan_type_check;
alter table public.clinics
  add constraint clinics_plan_type_check
  check (plan_type in ('free', 'premium'));

create index if not exists clinics_status_idx on public.clinics (status);

-- 5. Tighten the public SELECT RLS so only approved clinics show up to anon.
drop policy if exists "clinics_select_public" on public.clinics;
create policy "clinics_select_public" on public.clinics
  for select to anon
  using (status = 'approved');

-- Public-visible doctors are scoped the same way: only doctors of approved
-- clinics show up in anonymous queries.
drop policy if exists "doctors_select_public" on public.doctors;
create policy "doctors_select_public" on public.doctors
  for select to anon
  using (
    exists (
      select 1 from public.clinics c
      where c.id = doctors.clinic_id and c.status = 'approved'
    )
  );

-- 6. Owner can update their own clinic's profile fields (for the settings
-- form). Add policy if it doesn't already exist — we don't want to widen
-- access beyond created_by.
drop policy if exists "clinics_update_own" on public.clinics;
create policy "clinics_update_own" on public.clinics
  for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- 7. `clinic_can_accept_booking` — the one-shot check the booking server
-- action calls before inserting an appointment. SECURITY DEFINER so it can
-- read `clinics` and `appointments` even under restrictive RLS.
create or replace function public.clinic_can_accept_booking(p_clinic_id uuid)
returns table (
  ok              boolean,
  reason          text,
  plan_type       text,
  trial_days_left int,
  count_this_month int,
  trial_end_date  timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.clinics;
  cnt int;
  days_left int;
begin
  select * into c from public.clinics where id = p_clinic_id;
  if not found then
    return query select false, 'Clinic not found', null::text, 0, 0, null::timestamptz;
    return;
  end if;

  if c.status <> 'approved' then
    return query select false, 'Clinic is not approved yet',
      c.plan_type, 0, 0, c.trial_end_date;
    return;
  end if;

  select count(*)::int into cnt
  from public.appointments
  where clinic_id = p_clinic_id
    and created_at >= date_trunc('month', now());

  days_left := greatest(
    0,
    extract(epoch from (c.trial_end_date - now()))::int / 86400
  );

  if c.plan_type = 'premium' then
    -- Premium bypasses all free-tier caps.
    return query select true, null::text, c.plan_type, days_left, cnt, c.trial_end_date;
    return;
  end if;

  if now() >= c.trial_end_date then
    return query select false, 'Free trial expired — upgrade to continue',
      c.plan_type, 0, cnt, c.trial_end_date;
    return;
  end if;

  if cnt >= 50 then
    return query select false, 'Free plan limit reached (50 appointments this month). Upgrade to continue.',
      c.plan_type, days_left, cnt, c.trial_end_date;
    return;
  end if;

  return query select true, null::text, c.plan_type, days_left, cnt, c.trial_end_date;
end;
$$;

grant execute on function public.clinic_can_accept_booking(uuid) to anon, authenticated;
