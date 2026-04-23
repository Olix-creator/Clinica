import { createClient } from "@/lib/supabase/server";
import type { AppointmentWithRelations } from "@/lib/data/appointments";

/**
 * Return every appointment for `patientId`, newest first.
 *
 * RLS gating (current policies):
 *   - The patient themselves always sees their own history (via
 *     `appointments_patient_select`).
 *   - Doctors see appointments where they are the doctor
 *     (`appointments_doctor_select`), or where the clinic matches one
 *     they belong to (clinic_members).
 *   - Receptionists see all (`appointments_receptionist_all`).
 *
 * So when a doctor calls this with a patient's id, they get back only
 * the slice of that patient's history that intersects with their own
 * clinic — which is exactly what a "Patient history" panel should show.
 */
export async function getPatientHistory(
  patientId: string,
): Promise<AppointmentWithRelations[]> {
  if (!patientId) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "*, doctor:doctors(id, name, specialty, profile:profiles!doctors_profile_id_fkey(id, full_name, email)), clinic:clinics(id, name), patient:profiles!appointments_patient_id_fkey(id, full_name, email, phone)",
    )
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false });

  if (error) {
    console.error("[clinica] getPatientHistory:", error.message);
    return [];
  }
  return (data ?? []) as AppointmentWithRelations[];
}
