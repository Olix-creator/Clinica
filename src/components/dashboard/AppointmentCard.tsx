import { Calendar, Clock, Stethoscope, Building2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "./StatusBadge";
import type { AppointmentWithRelations } from "@/lib/data/appointments";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function AppointmentCard({
  appointment,
  perspective = "patient",
  actions,
}: {
  appointment: AppointmentWithRelations;
  perspective?: "patient" | "doctor" | "receptionist";
  actions?: React.ReactNode;
}) {
  const { date, time } = formatDateTime(appointment.appointment_date);
  const doctorName =
    appointment.doctor?.profile?.full_name ??
    appointment.doctor?.profile?.email ??
    "Doctor";
  const patientName =
    appointment.patient?.full_name ?? appointment.patient?.email ?? "Patient";
  const clinicName = appointment.clinic?.name ?? "Clinic";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              {date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              {time}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {perspective !== "doctor" && (
              <span className="inline-flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-gray-400" />
                {doctorName}
                {appointment.doctor?.specialty ? (
                  <span className="text-gray-400">· {appointment.doctor.specialty}</span>
                ) : null}
              </span>
            )}
            {perspective !== "patient" && (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                {patientName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-gray-400" />
              {clinicName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={appointment.status} />
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
