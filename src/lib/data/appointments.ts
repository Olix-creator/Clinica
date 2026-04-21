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

export async function createAppointment({
  doctorId,
  clinicId,
  appointmentDate,
  patientId,
}: {
  doctorId: string;
  clinicId: string;
  appointmentDate: string;
  patientId?: string;
}): Promise<{ data: Appointment | null; error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  if (!doctorId) return { data: null, error: "Please select a doctor" };
  if (!clinicId) return { data: null, error: "Please select a clinic" };
  if (!appointmentDate) return { data: null, error: "Please pick a date and time" };

  const when = new Date(appointmentDate);
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

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId ?? userData.user.id,
      doctor_id: doctorId,
      clinic_id: clinicId,
      appointment_date: when.toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("[clinica] createAppointment insert:", error.message, error.code);
    // 23505 = unique_violation (double-booking partial index)
    if (error.code === "23505") {
      return { data: null, error: "That time slot is already taken. Please pick another." };
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
    const { data: doctorRows, error: docErr } = await supabase
      .from("doctors")
      .select("id")
      .eq("profile_id", userData.user.id);
    if (docErr) {
      console.error("[clinica] getAppointmentsByRole doctor lookup:", docErr.message);
      return { data: [], role: profile.role };
    }
    const ids = (doctorRows ?? []).map((r) => r.id);
    if (ids.length === 0) {
      console.warn(
        "[clinica] getAppointmentsByRole: doctor profile has no doctors row — dashboard will be empty.",
      );
      return { data: [], role: profile.role };
    }
    query = query.in("doctor_id", ids);
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
