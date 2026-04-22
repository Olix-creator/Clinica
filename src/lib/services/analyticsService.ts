import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export type ClinicAnalytics = {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
  perDay: Array<{ day: string; count: number }>;
  cancellationRate: number;
  upcoming: number;
  doctorPerformance: Array<{
    doctor_id: string;
    name: string;
    total: number;
    done: number;
    cancelled: number;
  }>;
};

const EMPTY_STATUS: Record<AppointmentStatus, number> = {
  pending: 0,
  confirmed: 0,
  done: 0,
  cancelled: 0,
};

/**
 * Compute simple clinic-level KPIs. Everything runs through RLS —
 * caller must already be a clinic_member of `clinicId`.
 *
 * windowDays controls the rolling window for per-day + perf metrics
 * (default 30). Totals are all-time.
 */
export async function getClinicAnalytics(
  clinicId: string,
  options?: { windowDays?: number },
): Promise<ClinicAnalytics> {
  const supabase = await createClient();
  const windowDays = options?.windowDays ?? 30;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - windowDays + 1);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, status, appointment_date, doctor_id, doctor:doctors(id, name, profile:profiles!doctors_profile_id_fkey(full_name, email))",
    )
    .eq("clinic_id", clinicId);

  if (error) {
    console.error("[clinica] getClinicAnalytics:", error.message);
    return {
      total: 0,
      byStatus: { ...EMPTY_STATUS },
      perDay: [],
      cancellationRate: 0,
      upcoming: 0,
      doctorPerformance: [],
    };
  }

  type DoctorRel = {
    id: string;
    name: string | null;
    profile:
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
  };
  type Row = {
    id: string;
    status: AppointmentStatus;
    appointment_date: string;
    doctor_id: string;
    doctor: DoctorRel | DoctorRel[] | null;
  };

  const rows = ((data ?? []) as unknown) as Row[];
  function firstDoctor(d: Row["doctor"]): DoctorRel | null {
    if (!d) return null;
    return Array.isArray(d) ? d[0] ?? null : d;
  }
  function firstProfile(p: DoctorRel["profile"]): { full_name: string | null; email: string | null } | null {
    if (!p) return null;
    return Array.isArray(p) ? p[0] ?? null : p;
  }
  const byStatus: Record<AppointmentStatus, number> = { ...EMPTY_STATUS };
  const now = Date.now();
  let upcoming = 0;

  // per-day bucketing
  const dayMap = new Map<string, number>();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, 0);
  }

  // doctor aggregation
  const docMap = new Map<
    string,
    { doctor_id: string; name: string; total: number; done: number; cancelled: number }
  >();

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    const t = new Date(row.appointment_date).getTime();
    if (!Number.isNaN(t) && t >= now && row.status !== "cancelled") upcoming++;

    if (t >= since.getTime()) {
      const key = row.appointment_date.slice(0, 10);
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    const doc = firstDoctor(row.doctor);
    const docProfile = firstProfile(doc?.profile ?? null);
    const dName =
      doc?.name ??
      docProfile?.full_name ??
      docProfile?.email ??
      "Doctor";
    const existing = docMap.get(row.doctor_id) ?? {
      doctor_id: row.doctor_id,
      name: dName,
      total: 0,
      done: 0,
      cancelled: 0,
    };
    existing.total += 1;
    if (row.status === "done") existing.done += 1;
    if (row.status === "cancelled") existing.cancelled += 1;
    docMap.set(row.doctor_id, existing);
  }

  const total = rows.length;
  const cancellationRate = total === 0 ? 0 : byStatus.cancelled / total;

  const perDay = Array.from(dayMap.entries()).map(([day, count]) => ({ day, count }));
  const doctorPerformance = Array.from(docMap.values()).sort((a, b) => b.total - a.total);

  return {
    total,
    byStatus,
    perDay,
    cancellationRate,
    upcoming,
    doctorPerformance,
  };
}

// =====================================================================
// Global (multi-clinic) analytics scoped to the current user
// =====================================================================
//
// These helpers resolve the set of clinics the caller can see via
// `clinic_members` (owner / doctor / receptionist) and aggregate KPIs
// across all of them. Patients fall back to their own personal data
// (their own appointments + their own profile) so we can render the
// same dashboard without branching in every page.

async function getVisibleClinicIds(): Promise<{
  userId: string | null;
  role: Database["public"]["Enums"]["app_role"] | null;
  clinicIds: string[];
}> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { userId: null, role: null, clinicIds: [] };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile) return { userId: userData.user.id, role: null, clinicIds: [] };

  if (profile.role === "patient") {
    return { userId: userData.user.id, role: profile.role, clinicIds: [] };
  }

  const { data: memberships } = await supabase
    .from("clinic_members")
    .select("clinic_id")
    .eq("user_id", userData.user.id);

  const ids = Array.from(
    new Set((memberships ?? []).map((r) => r.clinic_id as string)),
  );
  return { userId: userData.user.id, role: profile.role, clinicIds: ids };
}

export type KpiCard = {
  value: number;
  label: string;
  delta?: number | null;
};

/**
 * Count of appointments happening today across all visible clinics.
 * Patients see only their own appointments.
 */
export async function getAppointmentsToday(): Promise<KpiCard> {
  const supabase = await createClient();
  const { userId, role, clinicIds } = await getVisibleClinicIds();
  if (!userId) return { value: 0, label: "Appointments today" };

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  let query = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .gte("appointment_date", start.toISOString())
    .lt("appointment_date", end.toISOString());

  if (role === "patient") {
    query = query.eq("patient_id", userId);
  } else if (clinicIds.length > 0) {
    query = query.in("clinic_id", clinicIds);
  } else {
    return { value: 0, label: "Appointments today" };
  }

  const { count, error } = await query;
  if (error) {
    console.error("[clinica] getAppointmentsToday:", error.message);
    return { value: 0, label: "Appointments today" };
  }
  return { value: count ?? 0, label: "Appointments today" };
}

/**
 * Unique patient count. For staff this is the distinct set of patient_ids
 * across all appointments in visible clinics (proxy for active patient base).
 */
export async function getTotalPatients(): Promise<KpiCard> {
  const supabase = await createClient();
  const { userId, role, clinicIds } = await getVisibleClinicIds();
  if (!userId) return { value: 0, label: "Total patients" };

  if (role === "patient") {
    // A patient is always one patient — themself.
    return { value: 1, label: "Total patients" };
  }
  if (clinicIds.length === 0) {
    return { value: 0, label: "Total patients" };
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("patient_id")
    .in("clinic_id", clinicIds);

  if (error) {
    console.error("[clinica] getTotalPatients:", error.message);
    return { value: 0, label: "Total patients" };
  }
  const unique = new Set<string>(
    (data ?? []).map((r) => r.patient_id as string).filter(Boolean),
  );
  return { value: unique.size, label: "Total patients" };
}

/**
 * Active doctor count + per-doctor appointment totals across visible clinics.
 */
export async function getDoctorStats(): Promise<{
  card: KpiCard;
  perDoctor: Array<{ doctor_id: string; name: string; total: number; done: number }>;
}> {
  const supabase = await createClient();
  const { userId, role, clinicIds } = await getVisibleClinicIds();
  if (!userId || role === "patient" || clinicIds.length === 0) {
    return { card: { value: 0, label: "Doctors active" }, perDoctor: [] };
  }

  const { data: doctors, error: docErr } = await supabase
    .from("doctors")
    .select(
      "id, name, profile:profiles!doctors_profile_id_fkey(full_name, email)",
    )
    .in("clinic_id", clinicIds);

  if (docErr) {
    console.error("[clinica] getDoctorStats doctors:", docErr.message);
    return { card: { value: 0, label: "Doctors active" }, perDoctor: [] };
  }

  const { data: appts, error: apptErr } = await supabase
    .from("appointments")
    .select("doctor_id, status")
    .in("clinic_id", clinicIds);

  if (apptErr) {
    console.error("[clinica] getDoctorStats appts:", apptErr.message);
  }

  type DocRow = {
    id: string;
    name: string | null;
    profile:
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
  };
  const docs = ((doctors ?? []) as unknown) as DocRow[];

  const counts = new Map<string, { total: number; done: number }>();
  for (const a of (appts ?? []) as Array<{ doctor_id: string; status: AppointmentStatus }>) {
    const cur = counts.get(a.doctor_id) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (a.status === "done") cur.done += 1;
    counts.set(a.doctor_id, cur);
  }

  const perDoctor = docs.map((d) => {
    const profile = Array.isArray(d.profile) ? d.profile[0] ?? null : d.profile;
    const name = d.name ?? profile?.full_name ?? profile?.email ?? "Doctor";
    const c = counts.get(d.id) ?? { total: 0, done: 0 };
    return { doctor_id: d.id, name, total: c.total, done: c.done };
  });
  perDoctor.sort((a, b) => b.total - a.total);

  return {
    card: { value: docs.length, label: "Doctors active" },
    perDoctor,
  };
}

/**
 * Completion rate = done / (total - cancelled). Expressed as 0..1 on `.value`
 * for a KpiCard; UI formats as percentage.
 */
export async function getCompletionRate(): Promise<KpiCard & { percent: number }> {
  const supabase = await createClient();
  const { userId, role, clinicIds } = await getVisibleClinicIds();
  if (!userId) return { value: 0, percent: 0, label: "Completion rate" };

  let query = supabase.from("appointments").select("status");

  if (role === "patient") {
    query = query.eq("patient_id", userId);
  } else if (clinicIds.length > 0) {
    query = query.in("clinic_id", clinicIds);
  } else {
    return { value: 0, percent: 0, label: "Completion rate" };
  }

  const { data, error } = await query;
  if (error) {
    console.error("[clinica] getCompletionRate:", error.message);
    return { value: 0, percent: 0, label: "Completion rate" };
  }

  let done = 0;
  let counted = 0;
  for (const r of (data ?? []) as Array<{ status: AppointmentStatus }>) {
    if (r.status === "cancelled") continue;
    counted += 1;
    if (r.status === "done") done += 1;
  }
  const ratio = counted === 0 ? 0 : done / counted;
  return {
    value: Math.round(ratio * 100),
    percent: Math.round(ratio * 100),
    label: "Completion rate",
  };
}

/**
 * Per-day appointment counts across visible clinics for charting.
 * Returns an array of {day: 'YYYY-MM-DD', count} length `windowDays`.
 */
export async function getAppointmentsTimeseries(
  windowDays = 14,
): Promise<Array<{ day: string; count: number }>> {
  const supabase = await createClient();
  const { userId, role, clinicIds } = await getVisibleClinicIds();
  if (!userId) return [];

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - windowDays + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + windowDays);

  let query = supabase
    .from("appointments")
    .select("appointment_date")
    .gte("appointment_date", start.toISOString())
    .lt("appointment_date", end.toISOString());

  if (role === "patient") {
    query = query.eq("patient_id", userId);
  } else if (clinicIds.length > 0) {
    query = query.in("clinic_id", clinicIds);
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) {
    console.error("[clinica] getAppointmentsTimeseries:", error.message);
    return [];
  }

  const dayMap = new Map<string, number>();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of (data ?? []) as Array<{ appointment_date: string }>) {
    const key = r.appointment_date.slice(0, 10);
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  return Array.from(dayMap.entries()).map(([day, count]) => ({ day, count }));
}

export const analyticsService = {
  forClinic: getClinicAnalytics,
  appointmentsToday: getAppointmentsToday,
  totalPatients: getTotalPatients,
  doctorStats: getDoctorStats,
  completionRate: getCompletionRate,
  timeseries: getAppointmentsTimeseries,
};
