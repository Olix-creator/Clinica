import Link from "next/link";
import {
  Stethoscope,
  Building2,
  User,
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDoctorByProfile } from "@/lib/data/doctors";
import { getAppointmentsByRole, type AppointmentWithRelations } from "@/lib/data/appointments";
import { AppointmentStatusActions } from "@/components/dashboard/AppointmentStatusActions";
import { EmptyState } from "@/components/ui/EmptyState";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

type ScheduleState = "done" | "active" | "upcoming";

function stateForAppt(a: AppointmentWithRelations): ScheduleState {
  if (a.status === "done") return "done";
  const start = new Date(a.appointment_date).getTime();
  const diff = start - Date.now();
  // Active window: within 30 minutes window around the slot.
  if (diff <= 15 * 60 * 1000 && diff >= -45 * 60 * 1000) return "active";
  return "upcoming";
}

export default async function DoctorPage() {
  const profile = await requireRole("doctor");
  const doctor = await getDoctorByProfile(profile.id);

  if (!doctor) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Your clinic</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Welcome, Dr. {profile.full_name?.split(" ").slice(-1)[0] ?? ""}.
          </h1>
        </div>
        <EmptyState
          icon={Building2}
          title="You&rsquo;re not attached to a clinic yet"
          description="Ask a receptionist to add you to their clinic to start seeing patients."
        />
      </div>
    );
  }

  const { data: appointments } = await getAppointmentsByRole({ todayOnly: true });

  const pending = appointments.filter((a) => a.status === "pending");
  const doneCount = appointments.filter((a) => a.status === "done").length;
  const priority = appointments
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <DashboardRealtime channelKey={`doctor:${doctor.id}`} />

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Today&rsquo;s shift</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Welcome, Dr. {profile.full_name?.split(" ").slice(-1)[0] ?? profile.full_name ?? ""}.
          </h1>
          <p className="text-on-surface-variant mt-2">
            {fmtDate(new Date().toISOString())}
            {doctor.specialty ? ` · ${doctor.specialty}` : ""}
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Scheduled", value: appointments.length, icon: CalendarDays },
          { label: "Pending", value: pending.length, icon: AlertCircle },
          { label: "Completed", value: doneCount, icon: CheckCircle2 },
          {
            label: "Next slot",
            value: appointments.find((a) => new Date(a.appointment_date).getTime() >= Date.now())
              ? fmtTime(
                  appointments.find((a) => new Date(a.appointment_date).getTime() >= Date.now())!
                    .appointment_date
                )
              : "—",
            icon: Clock,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-surface-container-low p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">{s.label}</p>
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-headline text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Today's schedule */}
        <section className="col-span-12 lg:col-span-8 rounded-[2rem] bg-surface-container-low p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Today&rsquo;s schedule</p>
              <h2 className="font-headline text-xl font-semibold mt-1">Your appointments</h2>
            </div>
            <span className="text-xs text-on-surface-variant">{appointments.length} total</span>
          </div>

          {appointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointments today" description="Enjoy the calm." />
          ) : (
            <div className="space-y-2">
              {appointments.map((a) => {
                const state = stateForAppt(a);
                const indicator =
                  state === "active"
                    ? "bg-primary"
                    : state === "done"
                    ? "bg-outline-variant"
                    : "bg-surface-bright";
                const rowClass =
                  state === "active"
                    ? "bg-surface-container-highest ring-1 ring-primary/30"
                    : state === "done"
                    ? "opacity-70 bg-surface-container"
                    : "bg-surface-container hover:bg-surface-container-highest transition";
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-4 p-4 pr-5 rounded-2xl relative overflow-hidden ${rowClass}`}
                  >
                    <span className={`absolute left-0 top-0 bottom-0 w-1 ${indicator}`} />
                    <div className="w-16 text-center flex-shrink-0">
                      <p className="font-headline text-lg font-semibold">{fmtTime(a.appointment_date)}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                        {state === "active" ? "Now" : state === "done" ? "Done" : "Next"}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {a.patient?.full_name ?? a.patient?.email ?? "Patient"}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {a.clinic?.name ?? "Clinic"}
                      </p>
                    </div>
                    <AppointmentStatusActions id={a.id} revalidate="/doctor" />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Priority review */}
        <aside className="col-span-12 lg:col-span-4 rounded-[2rem] bg-gradient-to-br from-surface-container-high to-surface-container-low p-6 ring-1 ring-outline-variant/30">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Priority review</p>
              <h2 className="font-headline text-lg font-semibold mt-1">Needs attention</h2>
            </div>
            {priority.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            )}
          </div>

          {priority.length === 0 ? (
            <div className="text-center py-8 text-sm text-on-surface-variant">
              Nothing urgent right now.
            </div>
          ) : (
            <div className="space-y-2">
              {priority.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-surface-container-highest"
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      a.status === "pending" ? "bg-tertiary animate-pulse" : "bg-primary"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {a.patient?.full_name ?? a.patient?.email ?? "Patient"}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {fmtTime(a.appointment_date)} · {a.status}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
