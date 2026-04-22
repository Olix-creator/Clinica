import { Calendar } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import WhatsAppReminderButton from "@/components/dashboard/WhatsAppReminderButton";
import CallButton from "@/components/dashboard/CallButton";
import CancelAppointmentButton from "@/components/dashboard/CancelAppointmentButton";
import RescheduleModal from "@/components/dashboard/RescheduleModal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AppointmentWithRelations } from "@/lib/data/appointments";
import {
  cancelAppointmentAction,
  rescheduleAction,
} from "@/app/(dashboard)/receptionist/actions";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function AppointmentsTable({ appointments }: { appointments: AppointmentWithRelations[] }) {
  if (appointments.length === 0) {
    return (
      <div className="py-4">
        <EmptyState
          icon={Calendar}
          title="No appointments match"
          description="Try a different filter or add a new appointment."
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header row (desktop) */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
        <div className="col-span-2">When</div>
        <div className="col-span-2">Clinic</div>
        <div className="col-span-3">Doctor</div>
        <div className="col-span-3">Patient</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      {appointments.map((a) => (
        <div
          key={a.id}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-4 py-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition"
        >
          <div className="md:col-span-2">
            <p className="font-semibold text-sm">
              {a.time_slot ?? fmtTime(a.appointment_date)}
            </p>
            <p className="text-xs text-on-surface-variant">{fmtDate(a.appointment_date)}</p>
          </div>
          <div className="md:col-span-2 text-sm truncate">{a.clinic?.name ?? "—"}</div>
          <div className="md:col-span-3 text-sm truncate">
            {a.doctor?.name ?? a.doctor?.profile?.full_name ?? a.doctor?.profile?.email ?? "—"}
            {a.doctor?.specialty && (
              <span className="text-on-surface-variant"> · {a.doctor.specialty}</span>
            )}
          </div>
          <div className="md:col-span-3 text-sm truncate">
            <p className="truncate">{a.patient?.full_name ?? a.patient?.email ?? "—"}</p>
            {a.patient?.phone && (
              <p className="text-xs text-primary truncate">{a.patient.phone}</p>
            )}
          </div>
          <div className="md:col-span-2 md:text-right flex md:justify-end items-center gap-2 flex-wrap">
            <CallButton phone={a.patient?.phone ?? null} variant="icon" />
            <WhatsAppReminderButton
              patientName={a.patient?.full_name ?? a.patient?.email ?? null}
              patientPhone={a.patient?.phone ?? null}
              timeSlot={a.time_slot ?? null}
              appointmentDate={a.appointment_date}
              variant="icon"
            />
            <StatusBadge status={a.status} />
            {a.status !== "cancelled" && a.status !== "done" && (
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
      ))}
    </div>
  );
}
