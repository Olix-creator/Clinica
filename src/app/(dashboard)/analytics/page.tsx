import { redirect } from "next/navigation";
import {
  CalendarCheck2,
  Users,
  Stethoscope,
  CheckCircle2,
  LineChart as LineChartIcon,
  BarChart3,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  getAppointmentsToday,
  getTotalPatients,
  getDoctorStats,
  getCompletionRate,
  getAppointmentsTimeseries,
} from "@/lib/services/analyticsService";
import {
  AppointmentsLineChart,
  DoctorBarChart,
} from "@/components/analytics/AnalyticsCharts";

export const dynamic = "force-dynamic";

const KPI_ICONS = {
  appointments: CalendarCheck2,
  patients: Users,
  doctors: Stethoscope,
  completion: CheckCircle2,
} as const;

function KpiCard({
  label,
  value,
  suffix,
  Icon,
  tone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  Icon: typeof CalendarCheck2;
  tone: "primary" | "tertiary" | "secondary" | "success";
}) {
  const toneBg: Record<typeof tone, string> = {
    primary: "bg-primary/15 text-primary",
    tertiary: "bg-tertiary/15 text-tertiary",
    secondary: "bg-secondary/15 text-secondary",
    success: "bg-primary-container/30 text-primary",
  } as const;
  return (
    <div className="bg-surface-container-low rounded-3xl p-6 sm:p-7 flex flex-col gap-5 min-h-[148px]">
      <div className="flex items-center justify-between">
        <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${toneBg[tone]}`}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <div>
        <p className="text-3xl sm:text-4xl font-headline font-semibold tracking-tight">
          {value}
          {suffix ? <span className="text-xl text-on-surface-variant ml-1">{suffix}</span> : null}
        </p>
        <p className="text-sm text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const { profile } = await requireProfile();
  if (profile.role === "patient") {
    // Patients don't have the analytics dashboard surface.
    redirect("/patient");
  }

  const [today, patients, docs, completion, series] = await Promise.all([
    getAppointmentsToday(),
    getTotalPatients(),
    getDoctorStats(),
    getCompletionRate(),
    getAppointmentsTimeseries(14),
  ]);

  const doctorData = docs.perDoctor.slice(0, 8).map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 12) + "…" : d.name,
    total: d.total,
    done: d.done,
  }));

  const hasSeries = series.some((p) => p.count > 0);
  const hasDoctors = doctorData.some((d) => d.total > 0);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Analytics</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Clinic performance at a glance
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-xl">
            Live KPIs pulled from your clinics. Use this to spot quiet days, busy
            doctors, and cancellations before they pile up.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          label={today.label}
          value={today.value}
          Icon={KPI_ICONS.appointments}
          tone="primary"
        />
        <KpiCard
          label={patients.label}
          value={patients.value}
          Icon={KPI_ICONS.patients}
          tone="tertiary"
        />
        <KpiCard
          label={docs.card.label}
          value={docs.card.value}
          Icon={KPI_ICONS.doctors}
          tone="secondary"
        />
        <KpiCard
          label={completion.label}
          value={completion.percent}
          suffix="%"
          Icon={KPI_ICONS.completion}
          tone="success"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-low rounded-3xl p-6 sm:p-7 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <LineChartIcon className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Appointments over time</h2>
                <p className="text-xs text-on-surface-variant">Last 14 days</p>
              </div>
            </div>
          </div>
          {hasSeries ? (
            <AppointmentsLineChart data={series} />
          ) : (
            <EmptyChart message="No appointments in the last 14 days yet." />
          )}
        </div>

        <div className="bg-surface-container-low rounded-3xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-tertiary/15 text-tertiary flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Per doctor</h2>
                <p className="text-xs text-on-surface-variant">All-time totals</p>
              </div>
            </div>
          </div>
          {hasDoctors ? (
            <DoctorBarChart data={doctorData} />
          ) : (
            <EmptyChart message="No doctor activity to chart yet." />
          )}
        </div>
      </section>

      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-7">
        <h2 className="text-base font-semibold mb-4">Doctor roster</h2>
        {docs.perDoctor.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            No doctors linked to your clinics yet. Invite one from the Team page.
          </p>
        ) : (
          <div className="divide-y divide-outline-variant/30">
            {docs.perDoctor.slice(0, 10).map((d) => (
              <div key={d.doctor_id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
                    {d.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium truncate">{d.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-on-surface-variant">
                    <span className="text-on-surface font-semibold">{d.total}</span> total
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold">
                    {d.done} done
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-72 sm:h-80 rounded-2xl bg-surface-container/50 border border-dashed border-outline-variant/40 flex items-center justify-center text-sm text-on-surface-variant px-6 text-center">
      {message}
    </div>
  );
}
