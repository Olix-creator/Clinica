import Link from "next/link";
import {
  CalendarPlus,
  Clock,
  Stethoscope,
  Building2,
  HeartPulse,
  Activity,
  Thermometer,
  Wind,
  ArrowRight,
  CheckCircle2,
  FileText,
  CalendarDays,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAppointmentsByRole } from "@/lib/data/appointments";
import { AppointmentCard } from "@/components/dashboard/AppointmentCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export default async function PatientPage() {
  const profile = await requireRole("patient");
  const { data: appointments } = await getAppointmentsByRole();

  const now = Date.now();
  const upcoming = appointments
    .filter((a) => a.status !== "cancelled" && new Date(a.appointment_date).getTime() >= now)
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
  const past = appointments.filter((a) => !upcoming.includes(a)).slice(0, 10);
  const next = upcoming[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <DashboardRealtime channelKey={`patient:${profile.id}`} />

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Your dashboard</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Good to see you, {profile.full_name?.split(" ")[0] ?? "friend"}.
          </h1>
          <p className="text-on-surface-variant mt-2">Your next steps, at a glance.</p>
        </div>
        <Link
          href="/booking"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition self-start sm:self-auto"
        >
          <CalendarPlus className="w-4 h-4" />
          Book appointment
        </Link>
      </header>

      <div className="grid grid-cols-12 gap-4">
        {/* Next appointment — hero */}
        <div className="col-span-12 lg:col-span-8 rounded-[2rem] bg-surface-container-low p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl -z-0" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-4">Next appointment</p>
            {next ? (
              <>
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary-container/20 ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-semibold tracking-tight">
                      {next.doctor?.profile?.full_name ?? "Your doctor"}
                    </h2>
                    <p className="text-on-surface-variant">
                      {next.doctor?.specialty ?? "General Practice"} · {next.clinic?.name ?? "Clinic"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-highest text-sm font-medium">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    {formatDateTime(next.appointment_date).date}
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-highest text-sm font-medium">
                    <Clock className="w-4 h-4 text-primary" />
                    {formatDateTime(next.appointment_date).time}
                  </span>
                  <StatusBadge status={next.status} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition">
                    <CheckCircle2 className="w-4 h-4" />
                    Check in online
                  </button>
                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container-highest text-on-surface font-medium hover:bg-surface-bright transition"
                  >
                    Reschedule
                  </Link>
                </div>
              </>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming visits"
                description="Book your next appointment to see it here."
                action={{ href: "/booking", label: "Book now" }}
              />
            )}
          </div>
        </div>

        {/* Vitals placeholder */}
        <div className="col-span-12 lg:col-span-4 rounded-[2rem] bg-surface-container p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Latest vitals</p>
            <span className="text-[10px] text-on-surface-variant">From your last visit</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: HeartPulse, label: "Heart rate", value: "72", unit: "bpm" },
              { icon: Activity, label: "Blood pressure", value: "118/76", unit: "mmHg" },
              { icon: Thermometer, label: "Temperature", value: "36.7", unit: "°C" },
              { icon: Wind, label: "Oxygen", value: "98", unit: "%" },
            ].map((v) => (
              <div key={v.label} className="bg-surface-container-highest rounded-xl p-4">
                <v.icon className="w-4 h-4 text-primary mb-3" />
                <p className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant mb-1">{v.label}</p>
                <p className="font-headline text-xl font-semibold leading-tight">
                  {v.value}
                  <span className="text-xs text-on-surface-variant font-normal ml-1">{v.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="col-span-12 lg:col-span-5 rounded-[2rem] bg-surface-container-low p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-5">Quick actions</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/booking"
              className="group flex flex-col gap-3 p-5 rounded-2xl bg-surface-container-highest hover:bg-surface-bright transition"
            >
              <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <CalendarPlus className="w-4 h-4 text-primary" />
              </span>
              <div>
                <p className="font-medium text-sm">Book visit</p>
                <p className="text-xs text-on-surface-variant">Three-step flow</p>
              </div>
              <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition ml-auto" />
            </Link>
            <button
              disabled
              className="flex flex-col gap-3 p-5 rounded-2xl bg-surface-container-highest opacity-60 cursor-not-allowed text-left"
            >
              <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </span>
              <div>
                <p className="font-medium text-sm">Medical record</p>
                <p className="text-xs text-on-surface-variant">Coming soon</p>
              </div>
            </button>
          </div>
        </div>

        {/* Live clinic queue */}
        <div className="col-span-12 lg:col-span-7 rounded-[2rem] bg-gradient-to-br from-surface-container-high to-surface-container-low p-6 ring-1 ring-outline-variant/30">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Live clinic queue</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Realtime
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none" className="text-surface-container-highest" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * 0.35}`}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="font-headline text-2xl font-semibold">7</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">queue</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-on-surface">Estimated wait: <span className="font-semibold">~22 min</span></p>
              <p className="text-xs text-on-surface-variant">You&apos;ll see a notification when it&apos;s your turn.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming list */}
      {upcoming.length > 1 && (
        <section>
          <h2 className="font-headline text-2xl font-semibold tracking-tight mb-4">More upcoming</h2>
          <div className="space-y-3">
            {upcoming.slice(1).map((a) => (
              <AppointmentCard key={a.id} appointment={a} perspective="patient" />
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {past.length > 0 && (
        <section>
          <h2 className="font-headline text-2xl font-semibold tracking-tight mb-4">History</h2>
          <div className="space-y-3">
            {past.map((a) => (
              <AppointmentCard key={a.id} appointment={a} perspective="patient" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
