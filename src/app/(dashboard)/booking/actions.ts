"use server";

import { revalidatePath } from "next/cache";
import {
  createAppointment,
  isValidPhone,
  updateProfilePhone,
} from "@/lib/data/appointments";

export type BookAppointmentResult = { ok: true } | { ok: false; error: string };

export async function bookAppointment(formData: FormData): Promise<BookAppointmentResult> {
  const clinicId = String(formData.get("clinicId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

  if (!phone) return { ok: false, error: "Please provide a phone number so the clinic can reach you." };
  if (!isValidPhone(phone)) return { ok: false, error: "Please enter a valid phone number." };

  // Persist the phone on the patient's profile before booking so staff can reach them.
  const phoneRes = await updateProfilePhone(phone);
  if (phoneRes.error) return { ok: false, error: phoneRes.error };

  const { error } = await createAppointment({ clinicId, doctorId, appointmentDate });
  if (error) return { ok: false, error };

  revalidatePath("/patient");
  revalidatePath("/doctor");
  revalidatePath("/receptionist");
  return { ok: true };
}
