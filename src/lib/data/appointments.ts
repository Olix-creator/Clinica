import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export type AppointmentWithRelations = Appointment & {
  doctor: {
    id: string;
    name: string | null;
    specialty: string | null;
    profile: { id: string; full_name: string | null; email: string | null } | null;
  } | null;
  clinic: { id: string; name: string } | null;
  patient: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

const SELECT_WITH_RELATIONS =
  "*, doctor:doctors(id, name, specialty, profile:profiles!doctors_profile_id_fkey(id, full_name, email)), clinic:clinics(id, name), patient:profiles!appointments_patient_id_fkey(id, full_name, email, phone)";

export function isValidPhone(raw: string): boolean {
  // Accept +, digits, spaces, dashes, parens. Require 7–20 total digits.
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 20;
}

export async function updateProfilePhone(phone: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not authenticated" };
  const { error } = await supabase
    .from("profiles")
    .update({ phone: phone.trim() || null })
    .eq("id", userData.user.id);
  if (error) {
    console.error("[clinica] updateProfilePhone:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

// Canonical 30-minute grid used everywhere in the UI. Keep this list in sync
// with whatever the clinic actually supports — these 16 slots cover 09:00 →
// 16:30 which matches the current schedule.
export const TIME_SLOTS: string[] = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

export function isValidTimeSlot(raw: string): boolean {
  return TIME_SLOTS.includes(raw);
}

/**
 * Return the set of already-booked time_slots for a given doctor on a given
 * calendar day (ISO "YYYY-MM-DD"). Uses the `get_booked_slots` RPC so we
 * bypass the per-row RLS filter — the RPC only returns opaque slot strings,
 * never patient-identifying columns.
 */
export async function getBookedSlots(
  doctorId: string,
  dayISO: string,
): Promise<string[]> {
  if (!doctorId || !dayISO) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_booked_slots", {
    p_doctor_id: doctorId,
    p_day: dayISO,
  });
  if (error) {
    // The RPC may not be deployed yet in older environments — fall back to
    // a direct read that will still succeed for the user's own bookings.
    console.error("[clinica] getBookedSlots RPC:", error.message);
    const start = new Date(dayISO + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const { data: rows, error: fallbackErr } = await supabase
      .from("appointments")
      .select("time_slot, status")
      .eq("doctor_id", doctorId)
      .gte("appointment_date", start.toISOString())
      .lt("appointment_date", end.toISOString());
    if (fallbackErr) {
      console.error("[clinica] getBookedSlots fallback:", fallbackErr.message);
      return [];
    }
    return (rows ?? [])
      .filter((r) => r.status !== "cancelled" && r.time_slot)
      .map((r) => r.time_slot as string);
  }
  // `data` comes back as string[] from `returns setof text`.
  return ((data ?? []) as unknown as string[]).filter(Boolean);
}

export async function createAppointment({
  doctorId,
  clinicId,
  appointmentDate,
  timeSlot,
  patientId,
}: {
  doctorId: string;
  clinicId: string;
  appointmentDate: string; // "YYYY-MM-DD" (calendar day) OR full ISO
  timeSlot?: string;
  patientId?: string;
}): Promise<{ data: Appointment | null; error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  if (!doctorId) return { data: null, error: "Please select a doctor" };
  if (!clinicId) return { data: null, error: "Please select a clinic" };
  if (!appointmentDate) return { data: null, error: "Please pick a date" };

  // Resolve the final appointment timestamp. If the caller sent us
  // a calendar day + explicit slot ("2026-04-22" + "10:30") we compose
  // them. Otherwise we fall back to the legacy datetime-local path.
  let when: Date;
  let slot: string | null = null;

  if (timeSlot) {
    if (!isValidTimeSlot(timeSlot)) {
      return { data: null, error: "Please pick a valid time slot" };
    }
    const day = appointmentDate.slice(0, 10); // tolerate full ISO too
    when = new Date(`${day}T${timeSlot}:00`);
    slot = timeSlot;
  } else {
    when = new Date(appointmentDate);
    // Derive a slot from the datetime for the legacy callers so the
    // unique index still catches collisions.
    if (!Number.isNaN(when.getTime())) {
      const hh = String(when.getHours()).padStart(2, "0");
      const mm = String(when.getMinutes()).padStart(2, "0");
      const derived = `${hh}:${mm}`;
      slot = isValidTimeSlot(derived) ? derived : null;
    }
  }

  if (Number.isNaN(when.getTime())) return { data: null, error: "Invalid date" };
  if (when.getTime() < Date.now()) return { data: null, error: "Date must be in the future" };

  const { data: doctorRow, error: doctorErr } = await supabase
    .from("doctors")
    .select("id")
    .eq("id", doctorId)
    .eq("clinic_id", clinicId)
    .maybeSingle();
  if (doctorErr) {
    console.error("[clinica] createAppointment doctor lookup:", doctorErr.message);
    return { data: null, error: "Could not verify doctor/clinic" };
  }
  if (!doctorRow) return { data: null, error: "Selected doctor does not belong to this clinic" };

  // Belt-and-braces pre-check for double-booking so we can surface a nice
  // error even if the unique index hasn't been applied to the DB yet.
  if (slot) {
    const dayISO = when.toISOString().slice(0, 10);
    const booked = await getBookedSlots(doctorId, dayISO);
    if (booked.includes(slot)) {
      return { data: null, error: "This time slot is already booked" };
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId ?? userData.user.id,
      doctor_id: doctorId,
      clinic_id: clinicId,
      appointment_date: when.toISOString(),
      time_slot: slot,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[clinica] createAppointment insert:", error.message, error.code);
    // 23505 = unique_violation (double-booking partial index)
    if (error.code === "23505") {
      return { data: null, error: "This time slot is already booked" };
    }
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function getAppointmentsByRole(options?: {
  dateISO?: string;
  todayOnly?: boolean;
}): Promise<{ data: AppointmentWithRelations[]; role: Database["public"]["Enums"]["app_role"] | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: [], role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile) return { data: [], role: null };

  let query = supabase.from("appointments").select(SELECT_WITH_RELATIONS);

  if (profile.role === "patient") {
    query = query.eq("patient_id", userData.user.id);
  } else if (profile.role === "doctor") {
    // A doctor should see every appointment they are involved with:
    //  (1) any row in `doctors` where profile_id = me  → match by doctor_id
    //  (2) any clinic_members row with role in (owner, doctor) → match by clinic_id
    // We compute both sets, then filter with OR so a doctor-owner who hasn't
    // been added to the `doctors` table yet still sees their clinic's schedule.
    const [docRes, memberRes] = await Promise.all([
      supabase
        .from("doctors")
        .select("id, clinic_id")
        .eq("profile_id", userData.user.id),
      supabase
        .from("clinic_members")
        .select("clinic_id, role")
        .eq("user_id", userData.user.id)
        .in("role", ["owner", "doctor"]),
    ]);

    if (docRes.error) {
      console.error("[clinica] getAppointmentsByRole doctor lookup:", docRes.error.message);
    }
    if (memberRes.error) {
      console.error("[clinica] getAppointmentsByRole member lookup:", memberRes.error.message);
    }

    const doctorIds = (docRes.data ?? []).map((r) => r.id);
    const clinicIds = Array.from(
      new Set<string>([
        ...(docRes.data ?? []).map((r) => r.clinic_id),
        ...(memberRes.data ?? []).map((r) => r.clinic_id),
      ]),
    );

    if (doctorIds.length === 0 && clinicIds.length === 0) {
      console.warn(
        "[clinica] getAppointmentsByRole: doctor profile is not linked to any clinic — dashboard will be empty.",
      );
      return { data: [], role: profile.role };
    }

    // Supabase `or()` takes a comma-joined expression. We build it defensively
    // so single-set cases still work.
    const clauses: string[] = [];
    if (doctorIds.length > 0) clauses.push(`doctor_id.in.(${doctorIds.join(",")})`);
    if (clinicIds.length > 0) clauses.push(`clinic_id.in.(${clinicIds.join(",")})`);
    if (clauses.length === 1) {
      // Single clause → use native in() for clearer SQL.
      if (doctorIds.length > 0) query = query.in("doctor_id", doctorIds);
      else query = query.in("clinic_id", clinicIds);
    } else {
      query = query.or(clauses.join(","));
    }
  }

  if (options?.todayOnly) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query.gte("appointment_date", start.toISOString()).lt("appointment_date", end.toISOString());
  } else if (options?.dateISO) {
    const start = new Date(options.dateISO);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query.gte("appointment_date", start.toISOString()).lt("appointment_date", end.toISOString());
  }

  const { data, error } = await query.order("appointment_date", { ascending: true });
  if (error) {
    console.error("[clinica] getAppointmentsByRole:", error.message);
    return { data: [], role: profile.role };
  }
  return { data: (data ?? []) as AppointmentWithRelations[], role: profile.role };
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) {
    console.error("[clinica] updateAppointmentStatus:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function lookupPatientByEmail(email: string): Promise<{ id: string; full_name: string | null; email: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "patient")
    .ilike("email", email.trim())
    .maybeSingle();
  if (error) {
    console.error("[clinica] lookupPatientByEmail:", error.message);
    return null;
  }
  return data;
}
