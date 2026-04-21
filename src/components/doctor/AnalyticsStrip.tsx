import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Users,
  XCircle,
} from "lucide-react";
import type { ClinicAnalytics } from "@/lib/services/analyticsService";

function pct(n: number): string {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

export function AnalyticsStrip({
  clinicName,
  analytics,
}: {
  clinicName: string;
  analytics: ClinicAnalytics;
}) {
  const max = Math.max(1, ...analytics.perDay.map((d) => d.count));
  const kpis = [
    {
      label: "Total (all time)",
      value: analytics.total.toString(),
      icon: CalendarRange,
    },
    {
      label: "Upcoming",
      value: analytics.upcoming.toString(),
      icon: BarChart3,
    },
    {
      label: "Completed",
      value: analytics.byStatus.done.toString(),
      icon: CheckCircle2,
    },
    {
      label: "Cancel rate",
      value: pct(analytics.cancellationRate),
      icon: XCircle,
    },
  ];

  const topDoctors = analytics.doctorPerformance.slice(0, 3);

  return (
    <section className="rounded-[2rem] bg-surface-container-low p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
            Clinic analytics
          </p>
          <h2 className="font-headline text-xl font-semibold mt-1">{clinicName}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Last 30 days
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-surface-container-highest p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                {k.label}
              </p>
              <k.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-headline text-2xl font-semibold">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Per-day sparkbars + top doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="rounded-2xl bg-surface-container p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-4">
            Bookings per day
          </p>
          {analytics.perDay.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No data yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-28">
              {analytics.perDay.map((d) => {
                const h = Math.round((d.count / max) * 100);
                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col justify-end"
                    title={`${d.day}: ${d.count}`}
                  >
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary-container"
                      style={{ height: `${Math.max(h, d.count > 0 ? 8 : 2)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant">
            <span>{analytics.perDay[0]?.day ?? ""}</span>
            <span>{analytics.perDay[analytics.perDay.length - 1]?.day ?? ""}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-4 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Top doctors
          </p>
          {topDoctors.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No appointments yet.</p>
          ) : (
            <ul className="space-y-3">
              {topDoctors.map((d) => {
                const completionRate = d.total === 0 ? 0 : d.done / d.total;
                return (
                  <li key={d.doctor_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate pr-2">{d.name}</span>
                      <span className="text-on-surface-variant text-xs whitespace-nowrap">
                        {d.done}/{d.total} done
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.round(completionRate * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
