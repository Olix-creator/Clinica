import { Clock, UserCircle2 } from "lucide-react";
import type { AppointmentWithRelations } from "@/lib/data/appointments";

function patientLabel(a: AppointmentWithRelations): string {
  return a.patient?.full_name ?? a.patient?.email ?? "Patient";
}

function initials(label: string): string {
  return label
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtTime(iso: string, slot: string | null) {
  if (slot) return slot;
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Queue bento: CURRENT (first pending / in-session) + NEXT (second pending).
 * When there's no queue, renders a "You're clear" idle state.
 */
export default function TodayQueue({
  appointments,
}: {
  appointments: AppointmentWithRelations[];
}) {
  // Queue = pending or confirmed today, sorted by time_slot (which is also
  // the natural appointment_date order since the DB is sorted ascending).
  const queue = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed",
  );
  const current = queue[0] ?? null;
  const next = queue[1] ?? null;

  if (!current && !next) {
    return (
      <div className="rounded-[2rem] bg-surface-container-low p-10 text-center">
        <p className="text-on-surface-variant">No patients in today&rsquo;s queue.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current */}
      {current ? (
        <div className="bg-surface-container-highest rounded-[2rem] p-7 shadow-emerald/10 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          />
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(78,222,163,0.5)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              In Session
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-5 relative z-10">
            <div className="w-20 h-20 rounded-[1.5rem] bg-surface-container flex items-center justify-center flex-shrink-0 border border-outline-variant/15">
              <span className="text-2xl font-bold text-primary">
                {initials(patientLabel(current))}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold font-headline truncate">
                {patientLabel(current)}
              </h3>
              <div className="flex items-center gap-2 text-on-surface-variant mt-1 mb-3">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {fmtTime(current.appointment_date, current.time_slot)}
                </span>
              </div>
              {current.patient?.phone && (
                <p className="text-xs text-primary">{current.patient.phone}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] bg-surface-container-low p-8 flex items-center justify-center text-sm text-on-surface-variant border border-outline-variant/10">
          No one in session
        </div>
      )}

      {/* Next */}
      {next ? (
        <div className="bg-surface-container-low rounded-[2rem] p-7 border border-outline-variant/15">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Up Next
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-20 h-20 rounded-[1.5rem] bg-surface-container flex items-center justify-center flex-shrink-0 border border-outline-variant/15 opacity-80">
              <UserCircle2 className="w-8 h-8 text-on-surface-variant" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold font-headline truncate">
                {patientLabel(next)}
              </h3>
              <div className="flex items-center gap-2 text-on-surface-variant mt-1 mb-3">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {fmtTime(next.appointment_date, next.time_slot)}
                </span>
              </div>
              {next.patient?.phone && (
                <p className="text-xs text-on-surface-variant">{next.patient.phone}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] bg-surface-container-low p-8 flex items-center justify-center text-sm text-on-surface-variant border border-outline-variant/10">
          No one queued up next
        </div>
      )}
    </div>
  );
}
