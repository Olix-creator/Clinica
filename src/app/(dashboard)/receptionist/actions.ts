"use server";

import { revalidatePath } from "next/cache";
import {
  createAppointment,
  lookupPatientByEmail,
  rescheduleAppointment,
  searchPatients,
  updateAppointmentStatus,
  type PatientSearchHit,
} from "@/lib/data/appointments";
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
  const name = String(formData.get("name") ?? "").trim() || undefined;

  if (!clinicId) return { ok: false, error: "Please select a clinic" };
  if (!doctorEmail) return { ok: false, error: "Doctor email is required" };

  const supabase = await createClient();
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role")
    .ilike("email", doctorEmail)
    .maybeSingle();
  if (profileErr) return { ok: false, error: profileErr.message };
  if (!profile) return { ok: false, error: "No user found with that email. Ask them to sign up first." };
  if (profile.role !== "doctor") return { ok: false, error: "That user is not registered as a doctor" };

  const { error } = await addDoctorToClinic({
    profileId: profile.id,
    clinicId,
    specialty,
    name,
  });
  if (error) {
    // Friendly message if the doctor is already attached (unique constraint on profile_id).
    if (error.includes("doctors_profile_id_key") || error.includes("unique")) {
      return { ok: false, error: "That doctor is already attached to a clinic." };
    }
    return { ok: false, error };
  }

  revalidatePath("/receptionist");
  revalidatePath("/booking");
  return { ok: true };
}

/**
 * Express Booking — receptionist fast-flow. Expects:
 *  - patientId (pre-resolved in the client via searchPatientsAction)
 *  - doctorId (doctor belongs to some clinic; we look up the clinic_id)
 *  - appointmentDate (YYYY-MM-DD)
 *  - timeSlot (HH:MM)
 *
 * Keeps the form minimal — receptionists usually have a patient already
 * in mind and just need to slot them into a doctor's schedule.
 */
export async function expressBookAction(formData: FormData): Promise<Result> {
  const patientId = String(formData.get("patientId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "");
  const timeSlot = String(formData.get("timeSlot") ?? "");

  if (!patientId) return { ok: false, error: "Pick a patient" };
  if (!doctorId) return { ok: false, error: "Pick a doctor" };
  if (!appointmentDate) return { ok: false, error: "Pick a date" };
  if (!timeSlot) return { ok: false, error: "Pick a time slot" };

  const supabase = await createClient();
  const { data: doctorRow, error: doctorErr } = await supabase
    .from("doctors")
    .select("id, clinic_id")
    .eq("id", doctorId)
    .maybeSingle();
  if (doctorErr) return { ok: false, error: doctorErr.message };
  if (!doctorRow) return { ok: false, error: "Doctor not found" };

  const { error } = await createAppointment({
    clinicId: doctorRow.clinic_id,
    doctorId,
    appointmentDate,
    timeSlot,
    patientId,
  });
  if (error) return { ok: false, error };

  revalidatePath("/receptionist");
  revalidatePath("/doctor");
  return { ok: true };
}

export async function rescheduleAction(formData: FormData): Promise<Result> {
  const id = String(formData.get("id") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "").trim();
  const timeSlot = String(formData.get("timeSlot") ?? "").trim();
  const doctorId = String(formData.get("doctorId") ?? "").trim();

  if (!id) return { ok: false, error: "Missing appointment id" };

  const { error } = await rescheduleAppointment(id, {
    appointmentDate: appointmentDate || undefined,
    timeSlot: timeSlot || undefined,
    doctorId: doctorId || undefined,
  });
  if (error) return { ok: false, error };

  revalidatePath("/receptionist");
  revalidatePath("/doctor");
  revalidatePath("/patient");
  return { ok: true };
}

export async function cancelAppointmentAction(formData: FormData): Promise<Result> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing appointment id" };
  const { error } = await updateAppointmentStatus(id, "cancelled");
  if (error) return { ok: false, error };
  revalidatePath("/receptionist");
  revalidatePath("/doctor");
  revalidatePath("/patient");
  return { ok: true };
}

export async function searchPatientsAction(query: string): Promise<PatientSearchHit[]> {
  return searchPatients(query);
}
