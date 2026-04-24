-- Migration 0012 — Backfill demo clinics with discovery metadata.
--
-- The three clinics that were created before migration 0011 live in the
-- database without city / specialty / address / description, so filtering
-- `/search` by city or specialty silently drops them and the clinic
-- detail page has nothing to show beyond the name.
--
-- This migration backfills realistic values for the three known demo
-- clinic IDs. It is a one-time data migration; re-running it is safe
-- because it uses `update ... where id = ...` and the values are idempotent.
--
-- Going forward, anyone who creates a clinic through `createClinic()` in
-- `src/lib/data/clinics.ts` can supply these fields — the server action
-- accepts them — so this backfill is only for the legacy demo data.

update public.clinics
set
  specialty   = 'General Medicine',
  city        = 'Algiers',
  address     = '12 Rue Didouche Mourad, Algiers Centre',
  description = 'AZZOUZI Clinic is a family-run general practice in central Algiers offering consultations, minor procedures, and paediatric care. Walk-ins welcome; online booking guarantees a confirmed time slot.'
where id = '9e8eaf35-b40e-40eb-b222-ee3cb6ca7a72';

update public.clinics
set
  specialty   = 'Cardiology',
  city        = 'Oran',
  address     = '48 Boulevard de la Soummam, Oran',
  description = 'Belbali Cardiology specialises in heart health — ECGs, echocardiograms, and long-term management of hypertension and arrhythmia. Modern equipment, multilingual staff (AR / FR / EN).'
where id = '9412082b-e57e-405b-b784-00455a373c2a';

update public.clinics
set
  specialty   = 'Dermatology',
  city        = 'Constantine',
  address     = '5 Avenue Aouati Mostefa, Constantine',
  description = 'DR Adi Cabinet is a dermatology practice focused on acne, eczema, and cosmetic procedures. Same-week appointments available for most common conditions.'
where id = 'effed8c0-d841-4b73-b7fa-b2bf9f588857';
