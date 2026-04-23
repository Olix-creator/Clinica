import {
  Building2,
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Phone,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDoctorByProfile } from "@/lib/data/doctors";
import { getAppointmentsByRole, type AppointmentWithRelations } from "@/lib/data/appointments";
import { clinicMemberService } from "@/lib/services/clinicMemberService";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { analyticsService } from "@/lib/services/analyticsService";
import WhatsAppReminderButton from "@/components/dashboard/WhatsAppReminderButton";
import { AppointmentStatusActions } from "@/components/dashboard/AppointmentStatusActions";
import { EmptyState } from "@/components/ui/EmptyState";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";
import { ClinicManagementPanel } from "@/components/doctor/ClinicManagementPanel";
import { AnalyticsStrip } from "@/components/doctor/AnalyticsStrip";
import TodayQueue from "@/components/doctor/TodayQueue";
import DoctorAppointmentRow from "@/components/doctor/DoctorAppointmentRow";
import { AvailabilitySetup } from "@/components/doctor/AvailabilitySetup";
import { getAvailability, getBreaks } from "@/lib/data/availability";

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

  // Availability + upcoming breaks (only meaningful if the caller has a
  // `doctors` row, which is what availability rows FK to).
  const todayDateISO = new Date().toISOString().slice(0, 10);
  const [availability, breaks] = doctor
    ? await Promise.all([
        getAvailability(doctor.id),
        getBreaks(doctor.id, todayDateISO),
      ])
    : [[], []];
  const needsAvailabilitySetup = !!doctor && availability.length === 0;

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
  const { data: todayAppointmentsRaw } = await getAppointmentsByRole({ todayOnly: true });
  const { data: allAppointments } = await getAppointmentsByRole();

  // Sort today's list explicitly by time_slot (fallback to appointment_date)
  // so the queue + upcoming list always render in real chronological order.
  const todayAppointments = [...todayAppointmentsRaw].sort((a, b) => {
    const keyA = a.time_slot ?? new Date(a.appointment_date).toISOString().slice(11, 16);
    const keyB = b.time_slot ?? new Date(b.appointment_date).toISOString().slice(11, 16);
    return keyA.localeCompare(keyB);
  });

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

      {/* Availability setup — shown prominently if not configured, otherwise
          collapsed into the "Your working hours" section at the bottom. */}
      {needsAvailabilitySetup && doctor && (
        <div className="rounded-[2rem] bg-tertiary-container/40 border border-tertiary/30 p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-on-tertiary-container" />
            </span>
            <div>
              <h3 className="font-semibold text-on-surface">Finish setting up your schedule</h3>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Patients cannot book you until you set your working hours.
              </p>
            </div>
          </div>
          <AvailabilitySetup
            doctorId={doctor.id}
            initialAvailability={availability}
            initialBreaks={breaks}
          />
        </div>
      )}

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

      {/* Queue: current + next */}
      <TodayQueue appointments={todayAppointments} />

      {/* Full today list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
          <h2 className="font-headline text-xl font-semibold">Today&rsquo;s schedule</h2>
          <span className="text-xs text-on-surface-variant">{todayAppointments.length} total</span>
        </div>

        {todayAppointments.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No appointments today" description="Enjoy the calm." />
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((a) => (
              <DoctorAppointmentRow key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </section>

      {/* Availability + breaks — always visible for doctors who have a clinic,
          so they can update hours without digging through settings. */}
      {doctor && !needsAvailabilitySetup && (
        <AvailabilitySetup
          doctorId={doctor.id}
          initialAvailability={availability}
          initialBreaks={breaks}
        />
      )}

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
                <div className="flex items-center gap-2">
                  <WhatsAppReminderButton
                    patientName={a.patient?.full_name ?? a.patient?.email ?? null}
                    patientPhone={a.patient?.phone ?? null}
                    timeSlot={a.time_slot ?? null}
                    appointmentDate={a.appointment_date}
                    variant="icon"
                  />
                  <AppointmentStatusActions id={a.id} revalidate="/doctor" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
