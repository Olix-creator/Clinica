import { Calendar, Clock, Stethoscope, Building2, User, Phone } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { AppointmentWithRelations } from "@/lib/data/appointments";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function AppointmentCard({
  appointment,
  perspective = "patient",
  actions,
  tone = "default",
}: {
  appointment: AppointmentWithRelations;
  perspective?: "patient" | "doctor" | "receptionist";
  actions?: React.ReactNode;
  tone?: "default" | "raised";
}) {
  const { date, time } = formatDateTime(appointment.appointment_date);
  const doctorName =
    appointment.doctor?.name ??
    appointment.doctor?.profile?.full_name ??
    appointment.doctor?.profile?.email ??
    "Doctor";
  const patientName = appointment.patient?.full_name ?? appointment.patient?.email ?? "Patient";
  const patientPhone = appointment.patient?.phone ?? null;
  const clinicName = appointment.clinic?.name ?? "Clinic";

  const base =
    tone === "raised"
      ? "bg-surface-container-highest"
      : "bg-surface-container-low hover:bg-surface-container transition";

  return (
    <div className={`rounded-2xl p-5 ${base}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {date}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {time}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-on-surface-variant">
            {perspective !== "doctor" && (
              <span className="inline-flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-on-surface-variant/70" />
                <span className="text-on-surface">{doctorName}</span>
                {appointment.doctor?.specialty ? (
                  <span className="text-on-surface-variant">· {appointment.doctor.specialty}</span>
                ) : null}
              </span>
            )}
            {perspective !== "patient" && (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4 text-on-surface-variant/70" />
                <span className="text-on-surface">{patientName}</span>
              </span>
            )}
            {perspective !== "patient" && patientPhone && (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <Phone className="w-4 h-4" />
                {patientPhone}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-on-surface-variant/70" />
              {clinicName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={appointment.status} />
          {actions}
        </div>
      </div>
    </div>
  );
}
