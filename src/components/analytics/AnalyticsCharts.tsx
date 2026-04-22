"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

type TimeseriesPoint = { day: string; count: number };
type DoctorPoint = { name: string; total: number; done: number };

function formatDay(day: unknown): string {
  if (typeof day !== "string") return "";
  const d = new Date(day + "T00:00:00");
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AppointmentsLineChart({ data }: { data: TimeseriesPoint[] }) {
  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--color-outline-variant)"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tickFormatter={(v) => formatDay(v)}
            stroke="var(--color-on-surface-variant)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--color-on-surface-variant)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.3 }}
            contentStyle={{
              background: "var(--color-surface-container-highest)",
              border: "none",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--color-on-surface)",
            }}
            labelFormatter={(label) => formatDay(label)}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--color-primary)" }}
            activeDot={{ r: 5 }}
            fill="url(#lineFill)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DoctorBarChart({ data }: { data: DoctorPoint[] }) {
  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--color-outline-variant)"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="var(--color-on-surface-variant)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            stroke="var(--color-on-surface-variant)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: "var(--color-primary)", fillOpacity: 0.08 }}
            contentStyle={{
              background: "var(--color-surface-container-highest)",
              border: "none",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--color-on-surface)",
            }}
          />
          <Bar
            dataKey="total"
            fill="var(--color-primary)"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
