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

export const analyticsService = {
  forClinic: getClinicAnalytics,
};
