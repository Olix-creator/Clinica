-- Migration 0015 — Creator-only clinic deletion
--
-- Locks DELETE on `public.clinics` to the user that originally created
-- the row. Without this policy the table has no DELETE policy at all,
-- which under RLS means *no one* can delete — but we want the creator
-- to be able to. Anyone else (other doctors, receptionists, admins
-- without ownership) is denied.
--
-- The UI surfaces the delete button only to the creator (see
-- `DeleteClinicButton` in /settings), but RLS is the source of truth:
-- a curl-bypass attempt to call DELETE without `created_by = auth.uid()`
-- will be rejected by Postgres regardless of what the client sent.
--
-- Cascading rows (doctors, appointments, clinic_members, etc.) follow
-- their own ON DELETE CASCADE / RESTRICT rules from prior migrations:
--   - doctors.clinic_id      ON DELETE CASCADE   (auto-removed)
--   - clinic_members.clinic_id ON DELETE CASCADE (auto-removed)
--   - appointments.clinic_id ON DELETE RESTRICT  (blocks delete if any
--                              appointments still reference the clinic)
--
-- That last constraint is intentional — we don't want to silently
-- nuke booking history. Owners must cancel/archive appointments first.

drop policy if exists "clinics_delete_own" on public.clinics;
create policy "clinics_delete_own" on public.clinics
  for delete to authenticated
  using (auth.uid() = created_by);
