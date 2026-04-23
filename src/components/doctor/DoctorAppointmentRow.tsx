import { Clock, Repeat, AlertCircle } from "lucide-react";
import type { AppointmentWithRelations } from "@/lib/data/appointments";
import type { PatientStats } from "@/lib/data/patient-stats-utils";
import { isInactive } from "@/lib/data/patient-stats-utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AppointmentStatusActions } from "@/components/dashboard/AppointmentStatusActions";
import WhatsAppReminderButton from "@/components/dashboard/WhatsAppReminderButton";
import CallButton from "@/components/dashboard/CallButton";
import CancelAppointmentButton from "@/components/dashboard/CancelAppointmentButton";
import RescheduleModal from "@/components/dashboard/RescheduleModal";
import PatientHistoryModal from "@/components/doctor/PatientHistoryModal";
import { cancelAppointmentAction, rescheduleAction } from "@/app/(dashboard)/doctor/actions";

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

function fmtSlot(iso: string, slot: string | null) {
  if (slot) return slot;
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayOf(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** "Mar 12" style short date for patient-history badges. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DoctorAppointmentRow({
  appointment,
  patientStats,
}: {
  appointment: AppointmentWithRelations;
  /**
   * Optional aggregated history for this patient. When provided we render
   * "Last visit" + "Visits" badges next to the patient's name; when the
   * patient is new (no prior done visits) we show a small "First visit"
   * pill instead.
   */
  patientStats?: PatientStats;
}) {
  const a = appointment;
  const isCancelled = a.status === "cancelled";
  const isDone = a.status === "done";
  const inactive = isInactive(patientStats?.last_visit);
  const hasPriorVisits = (patientStats?.total_visits ?? 0) > 0;

  return (
    <div
      className={[
        "rounded-[1.5rem] p-2 pr-3 sm:pr-5 flex flex-col lg:flex-row items-start lg:items-center gap-3 transition group",
        isCancelled
          ? "bg-surface-container-low opacity-60"
          : "bg-surface-container-low hover:bg-surface-container",
      ].join(" ")}
    >
      {/* Time slot */}
      <div className="bg-surface-container rounded-[1.25rem] px-5 py-3 flex flex-col justify-center min-w-[120px] text-center border border-outline-variant/10 self-stretch lg:self-auto">
        <span
          className={`text-base font-bold ${
            isCancelled ? "text-on-surface-variant line-through" : "text-on-surface"
          }`}
        >
          {fmtSlot(a.appointment_date, a.time_slot)}
        </span>
        <span className="text-[10px] font-medium text-on-surface-variant mt-0.5 uppercase tracking-wider">
          {a.status === "done" ? "Done" : a.status === "cancelled" ? "Cancelled" : "30 min"}
        </span>
      </div>

      {/* Patient */}
      <div className="flex-1 px-2 py-1 flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 w-full">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-on-surface-variant">
              {initials(patientLabel(a))}
            </span>
          </div>
          <div className="min-w-0">
            {a.patient?.id ? (
              <PatientHistoryModal
                patientId={a.patient.id}
                patientName={patientLabel(a)}
                currentAppointmentId={a.id}
                trigger={
                  <h4
                    className={`text-sm sm:text-base font-semibold truncate hover:text-primary hover:underline underline-offset-2 decoration-primary/50 transition-colors ${
                      isCancelled
                        ? "line-through text-on-surface-variant"
                        : "text-on-surface"
                    }`}
                    title="View patient history"
                  >
                    {patientLabel(a)}
                  </h4>
                }
              />
            ) : (
              <h4
                className={`text-sm sm:text-base font-semibold truncate ${
                  isCancelled ? "line-through text-on-surface-variant" : "text-on-surface"
                }`}
              >
                {patientLabel(a)}
              </h4>
            )}
            {a.patient?.phone && (
              <p className="text-xs text-on-surface-variant truncate">{a.patient.phone}</p>
            )}
            {/* Visit history — "Last visit" + "Visits" pills. Warning tint
                when the gap is over ~6 months so the doctor can spot
                returning patients at a glance. */}
            {patientStats && (
              <div className="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1">
                {hasPriorVisits ? (
                  <>
                    <span
                      className={[
                        "inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5",
                        inactive
                          ? "bg-tertiary-container/50 text-on-tertiary-container ring-1 ring-tertiary/40"
                          : "bg-surface-container-highest text-on-surface-variant",
                      ].join(" ")}
                      title={
                        inactive
                          ? "It's been over 6 months since this patient's last visit."
                          : "Most recent completed visit."
                      }
                    >
                      {inactive ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      Last visit:{" "}
                      {patientStats.last_visit
                        ? shortDate(patientStats.last_visit)
                        : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant bg-surface-container-highest rounded-full px-2 py-0.5">
                      <Repeat className="w-3 h-3" />
                      {patientStats.total_visits}{" "}
                      {patientStats.total_visits === 1 ? "visit" : "visits"}
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 ring-1 ring-primary/20 rounded-full px-2 py-0.5">
                    First visit
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sm:ml-auto">
          <StatusBadge status={a.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-end lg:self-auto w-full lg:w-auto justify-end pt-3 border-t border-outline-variant/10 lg:border-none lg:pt-0">
        {/* Contact */}
        <div className="flex items-center gap-1.5 pr-3 mr-1 border-r border-outline-variant/20">
          <CallButton phone={a.patient?.phone ?? null} variant="icon" />
          <WhatsAppReminderButton
            patientName={a.patient?.full_name ?? a.patient?.email ?? null}
            patientPhone={a.patient?.phone ?? null}
            timeSlot={a.time_slot ?? null}
            appointmentDate={a.appointment_date}
            variant="icon"
          />
        </div>

        {/* Quick status */}
        {!isDone && !isCancelled && <AppointmentStatusActions id={a.id} revalidate="/doctor" />}

        {/* Reschedule + Cancel (hidden on done/cancelled) */}
        {!isDone && !isCancelled && (
          <>
            <RescheduleModal
              id={a.id}
              clinicId={a.clinic_id}
              currentDoctorId={a.doctor_id}
              currentDay={dayOf(a.appointment_date)}
              currentSlot={a.time_slot}
              allowDoctorChange={false}
              action={rescheduleAction}
            />
            <CancelAppointmentButton id={a.id} action={cancelAppointmentAction} />
          </>
        )}
      </div>
    </div>
  );
}
