"use server";

import { revalidatePath } from "next/cache";
import {
  createAppointment,
  getBookedSlots,
  isValidPhone,
  updateProfilePhone,
} from "@/lib/data/appointments";
import {
  getUnavailableSlots,
  suggestNextAvailable,
  type NextAvailable,
} from "@/lib/data/availability";

export type BookAppointmentResult = { ok: true } | { ok: false; error: string };
export type LoadSlotsResult =
  | { ok: true; booked: string[]; unavailable: string[] }
  | { ok: false; error: string };
export type SuggestResult =
  | { ok: true; suggestion: NextAvailable | null }
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
 * Fetch both the booked slots and the full unavailable-slot list (booked +
 * outside working hours + on break) for a (doctor, day) combo. The UI uses
 * `unavailable` to gray out every blocked slot but can inspect `booked`
 * when it wants to show a specific "booked" vs "outside hours" hint.
 */
export async function loadBookedSlots(
  doctorId: string,
  dayISO: string,
): Promise<LoadSlotsResult> {
  if (!doctorId) return { ok: false, error: "Pick a doctor first" };
  if (!dayISO) return { ok: false, error: "Pick a day first" };
  try {
    const [booked, unavailable] = await Promise.all([
      getBookedSlots(doctorId, dayISO),
      getUnavailableSlots(doctorId, dayISO),
    ]);
    return { ok: true, booked, unavailable };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Smart rescheduling: return the next bookable (day, slot) for this doctor
 * within a 14-day lookahead. Used by the booking form + reschedule modal
 * to offer a one-click alternative when the patient's preferred slot is
 * blocked.
 */
export async function findNextAvailable(
  doctorId: string,
  fromDayISO: string,
): Promise<SuggestResult> {
  if (!doctorId) return { ok: false, error: "Pick a doctor first" };
  if (!fromDayISO) return { ok: false, error: "Pick a starting day first" };
  try {
    const suggestion = await suggestNextAvailable(doctorId, fromDayISO, 14);
    return { ok: true, suggestion };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
