"use server";

import { revalidatePath } from "next/cache";
import {
  setWeeklyAvailability,
  addBreak,
  deleteBreak,
  type AvailabilityBlock,
  type DayOfWeek,
} from "@/lib/data/availability";
import { getDoctorByProfile } from "@/lib/data/doctors";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityActionResult = { ok: true } | { ok: false; error: string };

/**
 * Resolve the `doctors.id` to act on — either the doctor acting on their
 * own row, or an owner/receptionist acting on a doctor they manage.
 *
 * `doctorIdOverride` lets an owner update another doctor's availability
 * from the clinic management UI; when omitted we default to the caller's
 * own `doctors` row.
 */
async function resolveDoctorId(doctorIdOverride?: string): Promise<
  { doctorId: string } | { error: string }
> {
  if (doctorIdOverride) return { doctorId: doctorIdOverride };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not authenticated" };
  const doctor = await getDoctorByProfile(userData.user.id);
  if (!doctor) return { error: "No doctor profile found — attach to a clinic first." };
  return { doctorId: doctor.id };
}

export async function saveWeeklyAvailabilityAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const doctorIdOverride = (formData.get("doctorId") as string | null) || undefined;
  const resolved = await resolveDoctorId(doctorIdOverride);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const raw = String(formData.get("blocks") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid availability payload" };
  }
  if (!Array.isArray(parsed)) return { ok: false, error: "Invalid availability payload" };

  const blocks: AvailabilityBlock[] = [];
  for (const item of parsed) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as AvailabilityBlock).day_of_week !== "number" ||
      typeof (item as AvailabilityBlock).start_time !== "string" ||
      typeof (item as AvailabilityBlock).end_time !== "string"
    ) {
      return { ok: false, error: "Invalid availability block" };
    }
    const block = item as AvailabilityBlock;
    blocks.push({
      day_of_week: block.day_of_week as DayOfWeek,
      start_time: block.start_time,
      end_time: block.end_time,
    });
  }

  const { error } = await setWeeklyAvailability(resolved.doctorId, blocks);
  if (error) return { ok: false, error };

  revalidatePath("/doctor");
  revalidatePath("/booking");
  return { ok: true };
}

export async function addBreakAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const doctorIdOverride = (formData.get("doctorId") as string | null) || undefined;
  const resolved = await resolveDoctorId(doctorIdOverride);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const breakDate = String(formData.get("breakDate") ?? "").trim();
  const startTime = (formData.get("startTime") as string | null)?.trim() || null;
  const endTime = (formData.get("endTime") as string | null)?.trim() || null;
  const reason = (formData.get("reason") as string | null)?.trim() || null;

  if (!breakDate) return { ok: false, error: "Please pick a date" };

  const { error } = await addBreak({
    doctorId: resolved.doctorId,
    breakDate,
    startTime: startTime || null,
    endTime: endTime || null,
    reason,
  });
  if (error) return { ok: false, error };

  revalidatePath("/doctor");
  revalidatePath("/booking");
  return { ok: true };
}

export async function deleteBreakAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing break id" };
  const { error } = await deleteBreak(id);
  if (error) return { ok: false, error };

  revalidatePath("/doctor");
  revalidatePath("/booking");
  return { ok: true };
}
