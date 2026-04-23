// Client-safe helpers + types for patient stats. Keeping these out of
// `patient-stats.ts` avoids pulling the Supabase server client into any
// component that only needs the shapes or the "is this patient stale"
// predicate.

export type PatientStats = {
  patient_id: string;
  last_visit: string | null; // ISO timestamp
  total_visits: number;
};

export type PatientSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  last_visit: string | null;
  total_visits: number;
  upcoming_count: number;
};

const SIX_MONTHS_MS = 182 * 24 * 60 * 60 * 1000; // ~6 months

export function isInactive(lastVisit: string | null | undefined): boolean {
  if (!lastVisit) return false;
  const ts = new Date(lastVisit).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts > SIX_MONTHS_MS;
}
