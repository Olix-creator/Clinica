import { createClient } from "@/lib/supabase/server";
import { getDoctorByProfile } from "@/lib/data/doctors";
import type { AppointmentWithRelations } from "@/lib/data/appointments";
import type { PatientStats, PatientSummary } from "@/lib/data/patient-stats-utils";

// Re-export the shared shapes + predicate so callers that already import
// from here keep working. New client-side callers should import from
// `patient-stats-utils` directly to avoid pulling in the server client.
export type { PatientStats, PatientSummary };
export { isInactive } from "@/lib/data/patient-stats-utils";

/**
 * Per-patient summary derived from the appointments table.
 *
 *   last_visit    = max(appointment_date) where status = 'done'
 *   total_visits  = count(*) where status = 'done'
 *
 * We only count *completed* visits so that pending/cancelled rows don't
 * inflate the counter. This matches what a doctor would actually mean
 * by "how many times have I seen this patient."
 */

/**
 * Aggregate patient stats for the signed-in *doctor's* patient roster.
 * Returns a Map keyed by patient_id so callers can O(1) look up a stat
 * while rendering an appointment row.
 *
 * Relies on RLS: the doctor only sees appointments tied to their own
 * `doctors.id` (via `appointments_doctor_select`) so the aggregate is
 * implicitly scoped — no extra filter needed.
 */
export async function getDoctorPatientStatsMap(
  doctorId: string,
  patientIds?: string[],
): Promise<Map<string, PatientStats>> {
  if (!doctorId) return new Map();
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("patient_id, appointment_date, status")
    .eq("doctor_id", doctorId);

  if (patientIds && patientIds.length > 0) {
    query = query.in("patient_id", patientIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[clinica] getDoctorPatientStatsMap:", error.message);
    return new Map();
  }

  const map = new Map<string, PatientStats>();
  for (const row of data ?? []) {
    if (!row.patient_id) continue;
    const existing = map.get(row.patient_id);
    const isDone = row.status === "done";
    const current: PatientStats = existing ?? {
      patient_id: row.patient_id,
      last_visit: null,
      total_visits: 0,
    };
    if (isDone) {
      current.total_visits += 1;
      const prev = current.last_visit
        ? new Date(current.last_visit).getTime()
        : 0;
      const next = new Date(row.appointment_date).getTime();
      if (next > prev) current.last_visit = row.appointment_date;
    }
    map.set(row.patient_id, current);
  }
  return map;
}

/**
 * Full patient roster for the signed-in doctor — one row per patient,
 * augmented with last_visit / total_visits / upcoming_count.
 *
 * Used by the `/patients` page. Scope is implicitly "patients this
 * doctor has seen or is scheduled to see" because RLS gates the
 * appointments read.
 */
export async function getDoctorPatientRoster(): Promise<PatientSummary[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const doctor = await getDoctorByProfile(userData.user.id);
  if (!doctor) return [];

  // Pull every appointment this doctor can see, then bucket client-side.
  // Volume stays reasonable for a single-doctor roster; if this ever
  // grows we can push the aggregate into an RPC.
  const { data: rows, error } = await supabase
    .from("appointments")
    .select(
      "patient_id, appointment_date, status, patient:profiles!appointments_patient_id_fkey(id, full_name, email, phone)",
    )
    .eq("doctor_id", doctor.id);

  if (error) {
    console.error("[clinica] getDoctorPatientRoster:", error.message);
    return [];
  }

  type PatientRow = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  const now = Date.now();
  const bucket = new Map<
    string,
    PatientSummary & { profile?: PatientRow }
  >();
  for (const row of (rows ?? []) as unknown as Array<{
    patient_id: string;
    appointment_date: string;
    status: string;
    patient: PatientRow | null;
  }>) {
    if (!row.patient_id) continue;
    const current =
      bucket.get(row.patient_id) ??
      ({
        id: row.patient_id,
        full_name: row.patient?.full_name ?? null,
        email: row.patient?.email ?? null,
        phone: row.patient?.phone ?? null,
        last_visit: null,
        total_visits: 0,
        upcoming_count: 0,
      } as PatientSummary);

    // Keep the freshest profile snapshot we see.
    if (row.patient?.full_name && !current.full_name)
      current.full_name = row.patient.full_name;
    if (row.patient?.phone && !current.phone) current.phone = row.patient.phone;
    if (row.patient?.email && !current.email) current.email = row.patient.email;

    if (row.status === "done") {
      current.total_visits += 1;
      const prev = current.last_visit
        ? new Date(current.last_visit).getTime()
        : 0;
      const next = new Date(row.appointment_date).getTime();
      if (next > prev) current.last_visit = row.appointment_date;
    } else if (row.status !== "cancelled" && new Date(row.appointment_date).getTime() >= now) {
      current.upcoming_count += 1;
    }

    bucket.set(row.patient_id, current);
  }

  return Array.from(bucket.values()).sort((a, b) => {
    // Upcoming patients float to top, then most-recent last_visit.
    if (a.upcoming_count !== b.upcoming_count)
      return b.upcoming_count - a.upcoming_count;
    const av = a.last_visit ? new Date(a.last_visit).getTime() : 0;
    const bv = b.last_visit ? new Date(b.last_visit).getTime() : 0;
    return bv - av;
  });
}

/**
 * Small helper that derives stats from an already-fetched history list,
 * avoiding a second DB round-trip when the modal already has the rows.
 */
export function deriveStatsFromHistory(
  history: AppointmentWithRelations[],
): { last_visit: string | null; total_visits: number } {
  let lastVisit: string | null = null;
  let total = 0;
  for (const row of history) {
    if (row.status !== "done") continue;
    total += 1;
    const prev = lastVisit ? new Date(lastVisit).getTime() : 0;
    const next = new Date(row.appointment_date).getTime();
    if (next > prev) lastVisit = row.appointment_date;
  }
  return { last_visit: lastVisit, total_visits: total };
}
