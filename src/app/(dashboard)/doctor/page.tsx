import {
  Building2,
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Phone,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDoctorByProfile } from "@/lib/data/doctors";
import { getAppointmentsByRole, type AppointmentWithRelations } from "@/lib/data/appointments";
import { clinicMemberService } from "@/lib/services/clinicMemberService";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { analyticsService } from "@/lib/services/analyticsService";
import { AppointmentStatusActions } from "@/components/dashboard/AppointmentStatusActions";
import { EmptyState } from "@/components/ui/EmptyState";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";
import { ClinicManagementPanel } from "@/components/doctor/ClinicManagementPanel";
import { AnalyticsStrip } from "@/components/doctor/AnalyticsStrip";

function patientLabel(a: AppointmentWithRelations): string {
  return a.patient?.full_name ?? a.patient?.email ?? "Patient";
}

function doctorLabel(profileFullName: string | null, doctorName: string | null): string {
  return doctorName ?? profileFullName ?? "Doctor";
}

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
  const [doctor, ownedRaw] = await Promise.all([
    getDoctorByProfile(profile.id),
    clinicMemberService.listOwnedClinics(),
  ]);

  // Fan out clinic details (members + subscription) in parallel.
  const ownedClinicIds = ownedRaw.map((c) => c.id);
  const [memberLists, subMap] = await Promise.all([
    Promise.all(ownedRaw.map((c) => clinicMemberService.list(c.id))),
    subscriptionService.getMany(ownedClinicIds),
  ]);

  const ownedClinics = ownedRaw.map((c, i) => {
    const sub = subMap[c.id];
    return {
      id: c.id,
      name: c.name,
      plan: sub?.plan ?? "free",
      seats: sub?.seats ?? subscriptionService.seatLimit(sub?.plan ?? "free"),
      members: memberLists[i] ?? [],
    };
  });

  const primaryClinicId = doctor?.clinic_id ?? ownedClinics[0]?.id ?? null;
  const primaryClinicName =
    ownedClinics.find((c) => c.id === primaryClinicId)?.name ??
    memberLists.flat().find((m) => m.clinic_id === primaryClinicId)?.profile?.full_name ??
    "Your clinic";

  const analytics = primaryClinicId
    ? await analyticsService.forClinic(primaryClinicId)
    : null;

  if (!doctor && ownedClinics.length === 0) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Your clinic</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Welcome, Dr. {profile.full_name?.split(" ").slice(-1)[0] ?? ""}.
          </h1>
          <p className="text-on-surface-variant mt-2">
            Set up your first clinic to start inviting staff and booking patients.
          </p>
        </div>
        <ClinicManagementPanel clinics={[]} />
        <EmptyState
          icon={Building2}
          title="You&rsquo;re not attached to a clinic yet"
          description="Create one above, or ask a receptionist to add you to their clinic."
        />
      </div>
    );
  }

  // Today's list (used by the schedule section) + all appointments for Upcoming (next 14 days).
  const { data: todayAppointments } = await getAppointmentsByRole({ todayOnly: true });
  const { data: allAppointments } = await getAppointmentsByRole();

  const now = Date.now();
  const twoWeeks = now + 14 * 24 * 60 * 60 * 1000;
  const startOfTomorrow = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d.getTime();
  })();

  const upcoming = allAppointments.filter((a) => {
    const t = new Date(a.appointment_date).getTime();
    return t >= startOfTomorrow && t <= twoWeeks && a.status !== "cancelled";
  });

  const pending = todayAppointments.filter((a) => a.status === "pending");
  const doneCount = todayAppointments.filter((a) => a.status === "done").length;
  const priority = [...todayAppointments, ...upcoming]
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .slice(0, 4);

  const doctorDisplay = doctorLabel(profile.full_name, doctor?.name ?? null);
  const channelKey = doctor?.id ?? primaryClinicId ?? profile.id;
  const isOwner = ownedClinics.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <DashboardRealtime channelKey={`doctor:${channelKey}`} />

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">
            {isOwner ? "Your practice" : "Today’s shift"}
          </p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Welcome, {doctorDisplay}.
          </h1>
          <p className="text-on-surface-variant mt-2">
            {fmtDate(new Date().toISOString())}
            {doctor?.specialty ? ` · ${doctor.specialty}` : ""}
          </p>
        </div>
      </header>

      {/* Clinic management (owners) */}
      {isOwner && <ClinicManagementPanel clinics={ownedClinics} />}

      {/* Analytics strip */}
      {analytics && primaryClinicId && (
        <AnalyticsStrip clinicName={primaryClinicName} analytics={analytics} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today", value: todayAppointments.length, icon: CalendarDays },
          { label: "Pending", value: pending.length, icon: AlertCircle },
          { label: "Completed", value: doneCount, icon: CheckCircle2 },
          {
            label: "Next slot",
            value: todayAppointments.find(
              (a) => new Date(a.appointment_date).getTime() >= Date.now(),
            )
              ? fmtTime(
                  todayAppointments.find(
                    (a) => new Date(a.appointment_date).getTime() >= Date.now(),
                  )!.appointment_date
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
            <span className="text-xs text-on-surface-variant">{todayAppointments.length} total</span>
          </div>

          {todayAppointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointments today" description="Enjoy the calm." />
          ) : (
            <div className="space-y-2">
              {todayAppointments.map((a) => {
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
                      <p className="font-medium truncate">{patientLabel(a)}</p>
                      <p className="text-xs text-on-surface-variant truncate flex items-center gap-2">
                        <span>{a.clinic?.name ?? "Clinic"}</span>
                        {a.patient?.phone && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Phone className="w-3 h-3" />
                            {a.patient.phone}
                          </span>
                        )}
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
                    <p className="text-sm font-medium truncate">{patientLabel(a)}</p>
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

      {/* Upcoming (next 14 days, excluding today) */}
      <section className="rounded-[2rem] bg-surface-container-low p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Next 14 days</p>
            <h2 className="font-headline text-xl font-semibold mt-1">Upcoming appointments</h2>
          </div>
          <span className="text-xs text-on-surface-variant">{upcoming.length} total</span>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming appointments"
            description="New bookings will appear here automatically."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {upcoming.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-4 rounded-2xl bg-surface-container hover:bg-surface-container-highest transition"
              >
                <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{patientLabel(a)}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {fmtDate(a.appointment_date)} · {fmtTime(a.appointment_date)}
                  </p>
                  {a.patient?.phone && (
                    <p className="text-xs text-primary mt-1 inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {a.patient.phone}
                    </p>
                  )}
                </div>
                <AppointmentStatusActions id={a.id} revalidate="/doctor" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
