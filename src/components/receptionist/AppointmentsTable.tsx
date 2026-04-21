import { Calendar } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AppointmentWithRelations } from "@/lib/data/appointments";

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
      {/* Header row */}
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
            <p className="font-semibold text-sm">{fmtTime(a.appointment_date)}</p>
            <p className="text-xs text-on-surface-variant">{fmtDate(a.appointment_date)}</p>
          </div>
          <div className="md:col-span-2 text-sm truncate">{a.clinic?.name ?? "—"}</div>
          <div className="md:col-span-3 text-sm truncate">
            {a.doctor?.profile?.full_name ?? a.doctor?.profile?.email ?? "—"}
            {a.doctor?.specialty && (
              <span className="text-on-surface-variant"> · {a.doctor.specialty}</span>
            )}
          </div>
          <div className="md:col-span-3 text-sm truncate">
            {a.patient?.full_name ?? a.patient?.email ?? "—"}
          </div>
          <div className="md:col-span-2 md:text-right">
            <StatusBadge status={a.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
