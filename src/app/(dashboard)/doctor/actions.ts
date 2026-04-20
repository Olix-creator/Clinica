"use server";

import { revalidatePath } from "next/cache";
import { updateAppointmentStatus, type AppointmentStatus } from "@/lib/data/appointments";

const ALLOWED: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];

export async function changeStatus(
  id: string,
  status: AppointmentStatus,
  revalidate: string = "/doctor",
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Missing appointment id" };
  if (!ALLOWED.includes(status)) return { ok: false, error: "Invalid status" };
  const { error } = await updateAppointmentStatus(id, status);
  if (error) return { ok: false, error };
  revalidatePath(revalidate);
  return { ok: true };
}
