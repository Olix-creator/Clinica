"use server";

import { revalidatePath } from "next/cache";
import { createAppointment } from "@/lib/data/appointments";

export type BookAppointmentResult = { ok: true } | { ok: false; error: string };

export async function bookAppointment(formData: FormData): Promise<BookAppointmentResult> {
  const clinicId = String(formData.get("clinicId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "");

  const { error } = await createAppointment({ clinicId, doctorId, appointmentDate });
  if (error) return { ok: false, error };

  revalidatePath("/patient");
  return { ok: true };
}
