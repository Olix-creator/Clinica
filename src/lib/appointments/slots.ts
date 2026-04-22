// Client-safe constants & helpers for time slots.
//
// These MUST NOT import anything from `@/lib/supabase/server` or any other
// server-only module — they are used by client components (`RescheduleModal`,
// `ExpressBookingPanel`, …) where pulling in `next/headers` would explode
// the Turbopack build.

export const TIME_SLOTS: string[] = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

export function isValidTimeSlot(raw: string): boolean {
  return TIME_SLOTS.includes(raw);
}
