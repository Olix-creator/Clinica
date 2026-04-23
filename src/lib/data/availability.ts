import { createClient } from "@/lib/supabase/server";
import { TIME_SLOTS } from "@/lib/appointments/slots";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export type AvailabilityRow = {
  id: string;
  doctor_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
};

export type AvailabilityBlock = {
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
};

export type DoctorBreak = {
  id: string;
  doctor_id: string;
  break_date: string; // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

// -----------------------------------------------------------------------
// Normalization helpers
// -----------------------------------------------------------------------

/** Strip seconds from a PG `time` value so UI always sees "HH:MM". */
function short(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

// -----------------------------------------------------------------------
// Reads
// -----------------------------------------------------------------------

export async function getAvailability(doctorId: string): Promise<AvailabilityRow[]> {
  if (!doctorId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctor_availability")
    .select("id, doctor_id, day_of_week, start_time, end_time")
    .eq("doctor_id", doctorId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) {
    console.error("[clinica] getAvailability:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    ...(r as AvailabilityRow),
    start_time: short((r as AvailabilityRow).start_time),
    end_time: short((r as AvailabilityRow).end_time),
  }));
}

export async function getBreaks(
  doctorId: string,
  fromDateISO?: string,
): Promise<DoctorBreak[]> {
  if (!doctorId) return [];
  const supabase = await createClient();
  let query = supabase
    .from("doctor_breaks")
    .select("id, doctor_id, break_date, start_time, end_time, reason")
    .eq("doctor_id", doctorId)
    .order("break_date", { ascending: true });
  if (fromDateISO) query = query.gte("break_date", fromDateISO);
  const { data, error } = await query;
  if (error) {
    console.error("[clinica] getBreaks:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    ...(r as DoctorBreak),
    start_time: (r as DoctorBreak).start_time
      ? short((r as DoctorBreak).start_time as string)
      : null,
    end_time: (r as DoctorBreak).end_time
      ? short((r as DoctorBreak).end_time as string)
      : null,
  }));
}

/**
 * Returns slots the patient CANNOT pick for this (doctor, day) — booked,
 * outside working hours, or inside a break. Uses the `get_unavailable_slots`
 * RPC from migration 0010 and falls back to booked-only if the RPC is
 * missing (older environments that haven't run the migration yet).
 */
export async function getUnavailableSlots(
  doctorId: string,
  dayISO: string,
): Promise<string[]> {
  if (!doctorId || !dayISO) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_unavailable_slots", {
    p_doctor_id: doctorId,
    p_day: dayISO,
  });
  if (!error) {
    return ((data ?? []) as unknown as string[]).filter(Boolean);
  }
  // Fallback — migration 0010 not applied yet. Emulate booked-only behavior.
  console.warn(
    "[clinica] get_unavailable_slots missing, falling back to booked slots:",
    error.message,
  );
  const { data: booked, error: fbErr } = await supabase.rpc("get_booked_slots", {
    p_doctor_id: doctorId,
    p_day: dayISO,
  });
  if (fbErr) {
    console.error("[clinica] getUnavailableSlots fallback:", fbErr.message);
    return [];
  }
  return ((booked ?? []) as unknown as string[]).filter(Boolean);
}

// -----------------------------------------------------------------------
// Writes — only the doctor (or clinic owner) can mutate; RLS enforces it.
// -----------------------------------------------------------------------

/**
 * Replace the doctor's entire weekly availability with `blocks`.
 * Implemented as delete-then-insert so the UI can always present a
 * "full-week editor" without tracking individual row ids.
 */
export async function setWeeklyAvailability(
  doctorId: string,
  blocks: AvailabilityBlock[],
): Promise<{ error: string | null }> {
  if (!doctorId) return { error: "Missing doctor" };
  const supabase = await createClient();

  // Validate payload (must match known slot grid + end>start).
  for (const b of blocks) {
    if (b.day_of_week < 0 || b.day_of_week > 6) return { error: "Invalid day" };
    if (b.start_time >= b.end_time) return { error: "End time must be after start time" };
  }

  const { error: delErr } = await supabase
    .from("doctor_availability")
    .delete()
    .eq("doctor_id", doctorId);
  if (delErr) {
    console.error("[clinica] setWeeklyAvailability delete:", delErr.message);
    return { error: delErr.message };
  }

  if (blocks.length === 0) return { error: null };

  const rows = blocks.map((b) => ({
    doctor_id: doctorId,
    day_of_week: b.day_of_week,
    start_time: b.start_time,
    end_time: b.end_time,
  }));

  const { error: insErr } = await supabase.from("doctor_availability").insert(rows);
  if (insErr) {
    console.error("[clinica] setWeeklyAvailability insert:", insErr.message);
    return { error: insErr.message };
  }
  return { error: null };
}

export async function addBreak(input: {
  doctorId: string;
  breakDate: string; // YYYY-MM-DD
  startTime?: string | null; // HH:MM, null = full day
  endTime?: string | null;
  reason?: string | null;
}): Promise<{ error: string | null }> {
  const { doctorId, breakDate, startTime, endTime, reason } = input;
  if (!doctorId || !breakDate) return { error: "Missing break data" };
  if (
    (startTime && !endTime) ||
    (!startTime && endTime)
  ) {
    return { error: "Partial break needs both start and end time" };
  }
  if (startTime && endTime && startTime >= endTime) {
    return { error: "End time must be after start time" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("doctor_breaks").insert({
    doctor_id: doctorId,
    break_date: breakDate,
    start_time: startTime ?? null,
    end_time: endTime ?? null,
    reason: reason ?? null,
  });
  if (error) {
    console.error("[clinica] addBreak:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function deleteBreak(id: string): Promise<{ error: string | null }> {
  if (!id) return { error: "Missing break id" };
  const supabase = await createClient();
  const { error } = await supabase.from("doctor_breaks").delete().eq("id", id);
  if (error) {
    console.error("[clinica] deleteBreak:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

// -----------------------------------------------------------------------
// Smart rescheduling — next-available slot finder
// -----------------------------------------------------------------------

export type NextAvailable = {
  dayISO: string;
  slot: string;
};

/**
 * Walk forward up to `maxDays` calendar days from `fromDayISO` and return
 * the first (day, slot) that is bookable for this doctor:
 *   * not in `get_unavailable_slots`,
 *   * not in the past (same-day case).
 *
 * Returns null if nothing is available inside the window.
 */
export async function suggestNextAvailable(
  doctorId: string,
  fromDayISO: string,
  maxDays: number = 14,
): Promise<NextAvailable | null> {
  if (!doctorId || !fromDayISO) return null;
  const start = new Date(fromDayISO + "T00:00:00");
  if (Number.isNaN(start.getTime())) return null;

  for (let i = 0; i < maxDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayISO = d.toISOString().slice(0, 10);
    const unavailable = new Set(await getUnavailableSlots(doctorId, dayISO));

    for (const slot of TIME_SLOTS) {
      if (unavailable.has(slot)) continue;
      // Same-day: skip slots that already elapsed.
      if (i === 0) {
        const [hh, mm] = slot.split(":").map((s) => parseInt(s, 10));
        const slotDate = new Date(d);
        slotDate.setHours(hh, mm, 0, 0);
        if (slotDate.getTime() <= Date.now()) continue;
      }
      return { dayISO, slot };
    }
  }
  return null;
}
