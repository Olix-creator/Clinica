"use server";

import { revalidatePath } from "next/cache";
import {
  createAppointment,
  getBookedSlots,
  isValidPhone,
  updateProfilePhone,
} from "@/lib/data/appointments";

export type BookAppointmentResult = { ok: true } | { ok: false; error: string };
export type LoadSlotsResult =
  | { ok: true; booked: string[] }
  | { ok: false; error: string };

export async function bookAppointment(formData: FormData): Promise<BookAppointmentResult> {
  const clinicId = String(formData.get("clinicId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  // Either send (appointmentDate = "YYYY-MM-DD" + timeSlot = "HH:MM")
  // for the new flow, or a full ISO datetime for the legacy one.
  const appointmentDate = String(formData.get("appointmentDate") ?? "");
  const timeSlot = String(formData.get("timeSlot") ?? "").trim() || undefined;
  const phone = String(formData.get("phone") ?? "").trim();

  if (!phone) return { ok: false, error: "Please provide a phone number so the clinic can reach you." };
  if (!isValidPhone(phone)) return { ok: false, error: "Please enter a valid phone number." };
  if (!timeSlot) return { ok: false, error: "Please pick a time slot" };

  // Persist the phone on the patient's profile before booking so staff can reach them.
  const phoneRes = await updateProfilePhone(phone);
  if (phoneRes.error) return { ok: false, error: phoneRes.error };

  const { error } = await createAppointment({
    clinicId,
    doctorId,
    appointmentDate,
    timeSlot,
  });
  if (error) return { ok: false, error };

  revalidatePath("/patient");
  revalidatePath("/doctor");
  revalidatePath("/receptionist");
  return { ok: true };
}

/**
 * Server action used by the BookingForm to fetch the booked-slot list for
 * a (doctor, day) combo without exposing other patients' data.
 */
export async function loadBookedSlots(
  doctorId: string,
  dayISO: string,
): Promise<LoadSlotsResult> {
  if (!doctorId) return { ok: false, error: "Pick a doctor first" };
  if (!dayISO) return { ok: false, error: "Pick a day first" };
  try {
    const booked = await getBookedSlots(doctorId, dayISO);
    return { ok: true, booked };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
