"use server";

import { revalidatePath } from "next/cache";
import { createAppointment } from "@/lib/data/appointments";
import { lookupPatientByEmail } from "@/lib/data/appointments";
import { createClinic } from "@/lib/data/clinics";
import { addDoctorToClinic } from "@/lib/data/doctors";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

export async function addAppointmentAction(formData: FormData): Promise<Result> {
  const clinicId = String(formData.get("clinicId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "");
  const patientEmail = String(formData.get("patientEmail") ?? "").trim();

  if (!patientEmail) return { ok: false, error: "Patient email is required" };
  const patient = await lookupPatientByEmail(patientEmail);
  if (!patient) return { ok: false, error: "No patient found with that email" };

  const { error } = await createAppointment({
    clinicId,
    doctorId,
    appointmentDate,
    patientId: patient.id,
  });
  if (error) return { ok: false, error };

  revalidatePath("/receptionist");
  return { ok: true };
}

export async function addClinicAction(formData: FormData): Promise<Result> {
  const name = String(formData.get("name") ?? "");
  const { error } = await createClinic({ name });
  if (error) return { ok: false, error };
  revalidatePath("/receptionist");
  return { ok: true };
}

export async function attachDoctorAction(formData: FormData): Promise<Result> {
  const clinicId = String(formData.get("clinicId") ?? "");
  const doctorEmail = String(formData.get("doctorEmail") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim() || undefined;

  if (!clinicId) return { ok: false, error: "Please select a clinic" };
  if (!doctorEmail) return { ok: false, error: "Doctor email is required" };

  const supabase = await createClient();
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role")
    .ilike("email", doctorEmail)
    .maybeSingle();
  if (profileErr) return { ok: false, error: profileErr.message };
  if (!profile) return { ok: false, error: "No user found with that email" };
  if (profile.role !== "doctor") return { ok: false, error: "That user is not a doctor" };

  const { error } = await addDoctorToClinic({
    profileId: profile.id,
    clinicId,
    specialty,
  });
  if (error) return { ok: false, error };

  revalidatePath("/receptionist");
  return { ok: true };
}
