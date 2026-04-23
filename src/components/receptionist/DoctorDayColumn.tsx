import { Stethoscope } from "lucide-react";
import type { AppointmentWithRelations } from "@/lib/data/appointments";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import CallButton from "@/components/dashboard/CallButton";
import WhatsAppReminderButton from "@/components/dashboard/WhatsAppReminderButton";
import CancelAppointmentButton from "@/components/dashboard/CancelAppointmentButton";
import RescheduleModal from "@/components/dashboard/RescheduleModal";
import {
  cancelAppointmentAction,
  rescheduleAction,
} from "@/app/(dashboard)/receptionist/actions";

function patientLabel(a: AppointmentWithRelations): string {
  return a.patient?.full_name ?? a.patient?.email ?? "Patient";
}

function fmtSlot(iso: string, slot: string | null): string {
  if (slot) return slot;
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusAccent(s: AppointmentWithRelations["status"]): string {
  switch (s) {
    case "confirmed":
      return "bg-secondary-container";
    case "pending":
      return "bg-tertiary-container";
    case "done":
      return "bg-primary";
    case "cancelled":
      return "bg-error/60";
    default:
      return "bg-outline-variant";
  }
}

/**
 * Renders one doctor's column in the receptionist's "Full Day View" — a
 * vertical stack of today's appointments for a single doctor, each with
 * hover-reveal reschedule / cancel actions.
 */
export default function DoctorDayColumn({
  doctor,
  appointments,
}: {
  doctor: {
    id: string;
    name: string | null;
    specialty: string | null;
    profile: { full_name: string | null; email: string | null } | null;
  };
  appointments: AppointmentWithRelations[];
}) {
  const displayName = doctor.name ?? doctor.profile?.full_name ?? doctor.profile?.email ?? "Doctor";
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sorted = [...appointments].sort((a, b) => {
    const aKey = a.time_slot ?? new Date(a.appointment_date).toISOString().slice(11, 16);
    const bKey = b.time_slot ?? new Date(b.appointment_date).toISOString().slice(11, 16);
    return aKey.localeCompare(bKey);
  });

  return (
    <div className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col gap-6">
      <div className="flex items-center gap-4 pb-5 border-b border-surface-container-highest">
        <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0 border border-outline-variant/20">
          <span className="text-base font-bold text-primary">{initials}</span>
        </div>
        <div className="min-w-0">
          <h4 className="text-lg sm:text-xl font-bold text-on-surface truncate">
            Dr. {displayName}
          </h4>
          <p className="text-xs text-on-surface-variant font-medium inline-flex items-center gap-1.5 mt-0.5">
            <Stethoscope className="w-3 h-3" />
            {doctor.specialty ?? "General"}
            <span className="mx-1.5 text-outline-variant">•</span>
            {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-sm text-on-surface-variant py-6">
          No appointments today.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((a) => {
            const isCancelled = a.status === "cancelled";
            const isDone = a.status === "done";
            return (
              <div
                key={a.id}
                className={[
                  "bg-surface-container-highest rounded-[1.25rem] p-5 relative overflow-hidden group transition",
                  isCancelled ? "opacity-60 border border-error/20" : "border border-outline-variant hover:shadow-[0_8px_20px_rgba(16,24,40,0.08)]",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-0 bottom-0 w-1 ${statusAccent(a.status)}`}
                />
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex gap-4 items-start min-w-0">
                    <span
                      className={`text-lg sm:text-xl font-bold w-16 flex-shrink-0 ${
                        isCancelled ? "text-on-surface-variant line-through" : "text-on-surface"
                      }`}
                    >
                      {fmtSlot(a.appointment_date, a.time_slot)}
                    </span>
                    <div className="min-w-0">
                      <h5
                        className={`text-sm sm:text-base font-semibold truncate ${
                          isCancelled ? "line-through text-on-surface-variant" : "text-on-surface"
                        }`}
                      >
                        {patientLabel(a)}
                      </h5>
                      {a.patient?.phone && (
                        <p className="text-xs text-on-surface-variant truncate">
                          {a.patient.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <div className="flex justify-end items-center gap-2 flex-wrap pt-3 border-t border-outline-variant/10 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <CallButton phone={a.patient?.phone ?? null} variant="icon" />
                  <WhatsAppReminderButton
                    patientName={a.patient?.full_name ?? a.patient?.email ?? null}
                    patientPhone={a.patient?.phone ?? null}
                    timeSlot={a.time_slot ?? null}
                    appointmentDate={a.appointment_date}
                    variant="icon"
                  />
                  {!isCancelled && !isDone && (
                    <>
                      <RescheduleModal
                        id={a.id}
                        clinicId={a.clinic_id}
                        currentDoctorId={a.doctor_id}
                        currentDay={new Date(a.appointment_date).toISOString().slice(0, 10)}
                        currentSlot={a.time_slot}
                        allowDoctorChange
                        action={rescheduleAction}
                      />
                      <CancelAppointmentButton id={a.id} action={cancelAppointmentAction} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
