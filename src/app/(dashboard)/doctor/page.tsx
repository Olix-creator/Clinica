import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Clock,
  Mail,
  MoreHorizontal,
  Plus,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDoctorByProfile } from "@/lib/data/doctors";
import {
  getAppointmentsByRole,
  type AppointmentWithRelations,
} from "@/lib/data/appointments";
import { clinicMemberService } from "@/lib/services/clinicMemberService";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";
import { ClinicManagementPanel } from "@/components/doctor/ClinicManagementPanel";
import {
  PlanStatusBanner,
  type ClinicPlanSnapshot,
} from "@/components/doctor/PlanStatusBanner";
import { DashTopbar } from "@/components/layout/DashTopbar";

function patientInitials(a: AppointmentWithRelations) {
  const name = a.patient?.full_name ?? a.patient?.email ?? "Patient";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function patientName(a: AppointmentWithRelations) {
  return a.patient?.full_name ?? a.patient?.email ?? "Patient";
}

function timeFor(a: AppointmentWithRelations) {
  return a.time_slot ?? new Date(a.appointment_date).toISOString().slice(11, 16);
}

function fmtFullDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_META = {
  done: { label: "Done", cls: "success" },
  "in-progress": { label: "In progress", cls: "primary" },
  pending: { label: "Pending", cls: "warn" },
  cancelled: { label: "Cancelled", cls: "danger" },
  confirmed: { label: "Confirmed", cls: "success" },
} as const;

/**
 * Clinic / Doctor home — Clinica handoff design (`DashboardHome`).
 *
 * Layout:
 *   - DashTopbar with greeting + "New booking" action
 *   - 4-card stat row (today, completed, pending, new patients)
 *   - 2-column body: today's schedule timeline (left) +
 *     quick actions / weekly chart / premium banner (right)
 *
 * Existing data wiring is preserved — we still call
 * `getAppointmentsByRole`, `clinicMemberService`, etc.
 */
export default async function DoctorPage() {
  const profile = await requireRole("doctor");
  const [doctor, ownedRaw] = await Promise.all([
    getDoctorByProfile(profile.id),
    clinicMemberService.listOwnedClinics(),
  ]);

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

  // Plan snapshots for owners (trial banner + usage display).
  let planSnapshots: ClinicPlanSnapshot[] = [];
  if (ownedClinicIds.length > 0) {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("clinics")
      .select(
        "id, name, status, plan_type, trial_end_date, monthly_appointments_count",
      )
      .in("id", ownedClinicIds);
    planSnapshots = (rows ?? []) as ClinicPlanSnapshot[];
  }

  const isOwner = ownedClinics.length > 0;

  // Empty state for new doctors with no clinic membership.
  if (!doctor && !isOwner) {
    return (
      <>
        <DashTopbar
          title={`Welcome, Dr. ${profile.full_name?.split(" ").slice(-1)[0] ?? ""}.`}
          subtitle="Set up your first clinic to start inviting staff and booking patients."
        />
        <div style={{ padding: "24px 32px 40px", maxWidth: 880 }}>
          <ClinicManagementPanel clinics={[]} />
          <div style={{ marginTop: 16 }}>
            <EmptyState
              icon={Building2}
              title="You're not attached to a clinic yet"
              description="Create one above, or ask a receptionist to add you to their clinic."
            />
          </div>
        </div>
      </>
    );
  }

  const { data: todayAppointmentsRaw } = await getAppointmentsByRole({
    todayOnly: true,
  });
  const todayAppointments = [...todayAppointmentsRaw].sort((a, b) =>
    timeFor(a).localeCompare(timeFor(b)),
  );

  const total = todayAppointments.length;
  const doneCount = todayAppointments.filter((a) => a.status === "done").length;
  const pendingCount = todayAppointments.filter(
    (a) => a.status === "pending",
  ).length;
  const cancelledCount = todayAppointments.filter(
    (a) => a.status === "cancelled",
  ).length;
  const completedPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const firstName = profile.full_name?.split(" ")[0] ?? "Dr.";

  return (
    <>
      <DashboardRealtime
        channelKey={`doctor:${doctor?.id ?? profile.id}`}
      />
      <DashTopbar
        title={`Good morning, ${firstName}`}
        subtitle={
          total > 0
            ? `You have ${total} ${total === 1 ? "patient" : "patients"} scheduled today.`
            : fmtFullDate()
        }
        actions={
          <Link href="/booking" className="btn primary">
            <Plus size={15} /> New booking
          </Link>
        }
      />

      <div
        style={{
          padding: "24px 32px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Plan banner for owners */}
        {isOwner && planSnapshots.length > 0 ? (
          <PlanStatusBanner clinics={planSnapshots} />
        ) : null}

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <StatCard
            label="Today's appointments"
            value={total}
            hint={
              cancelledCount > 0
                ? `${cancelledCount} cancelled`
                : "All confirmed"
            }
            Ic={Calendar}
            tone="primary"
          />
          <StatCard
            label="Completed"
            value={doneCount}
            hint={total > 0 ? `${completedPct}% so far` : "—"}
            Ic={Check}
            tone="success"
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            hint={pendingCount > 0 ? "Next up" : "All caught up"}
            Ic={Clock}
            tone="warn"
          />
          <StatCard
            label="Owned clinics"
            value={ownedClinics.length}
            hint={
              ownedClinics.length > 0
                ? `${ownedClinics.reduce((acc, c) => acc + c.members.length, 0)} team members`
                : "None yet"
            }
            Ic={Users}
            tone="default"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: 20,
          }}
          className="lg-grid"
        >
          {/* Today's schedule */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--outline-variant)",
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  Today&apos;s schedule
                </div>
                <div className="t-small">
                  {total} {total === 1 ? "appointment" : "appointments"}
                  {cancelledCount > 0 ? ` · ${cancelledCount} cancelled` : ""}
                </div>
              </div>
              <Link href="/booking" className="btn ghost sm">
                Book new <ArrowRight size={13} />
              </Link>
            </div>

            {todayAppointments.length === 0 ? (
              <div
                style={{
                  padding: "60px 22px",
                  textAlign: "center",
                  color: "var(--text-subtle)",
                  fontSize: 14,
                }}
              >
                No appointments scheduled for today.
              </div>
            ) : (
              <ScheduleTimeline appts={todayAppointments} />
            )}
          </div>

          {/* Right rail */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Quick actions */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
                Quick actions
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <QuickAction
                  Ic={Plus}
                  label="New booking"
                  href="/booking"
                />
                <QuickAction Ic={User} label="Patients" href="/patients" />
                <QuickAction Ic={Clock} label="Edit hours" href="/settings" />
                <QuickAction Ic={Mail} label="Settings" href="/settings" />
              </div>
            </div>

            {/* Premium banner */}
            <div
              className="card"
              style={{
                padding: 18,
                background:
                  "linear-gradient(135deg, var(--primary-50), #fff)",
                borderColor: "var(--primary-100)",
              }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--primary)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    Approaching your free limit
                  </div>
                  <div
                    className="t-small"
                    style={{ marginTop: 4, lineHeight: 1.5 }}
                  >
                    Upgrade to Premium to unlock unlimited bookings and remove
                    the 50/month cap.
                  </div>
                  <Link
                    href="/pricing"
                    className="btn primary sm"
                    style={{ marginTop: 10 }}
                  >
                    Go Premium
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  Ic,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  Ic: React.ComponentType<{ size?: number }>;
  tone: "primary" | "success" | "warn" | "default";
}) {
  const tones = {
    primary: { bg: "var(--primary-50)", fg: "var(--primary-600)" },
    success: { bg: "var(--success-50)", fg: "var(--success)" },
    warn: { bg: "var(--warn-50)", fg: "var(--warn)" },
    default: { bg: "var(--bg-muted)", fg: "var(--text-muted)" },
  }[tone];
  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: tones.bg,
            color: tones.fg,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Ic size={16} />
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-subtle)" }}>{label}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginTop: 2,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      {hint ? (
        <div className="t-small" style={{ marginTop: 4 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function QuickAction({
  Ic,
  label,
  href,
}: {
  Ic: React.ComponentType<{ size?: number }>;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        padding: "14px 12px",
        borderRadius: 10,
        border: "1px solid var(--outline-variant)",
        background: "var(--surface-bright)",
        textDecoration: "none",
        color: "var(--on-surface)",
        transition: "background .1s ease",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: "var(--primary-50)",
          color: "var(--primary-600)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Ic size={14} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </Link>
  );
}

function ScheduleTimeline({
  appts,
}: {
  appts: AppointmentWithRelations[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {appts.map((a, i) => {
        const meta =
          STATUS_META[a.status as keyof typeof STATUS_META] ?? STATUS_META.pending;
        const inProgress = a.status === "pending" && i === 0;
        const railColor =
          a.status === "done"
            ? "var(--success)"
            : a.status === "cancelled"
              ? "var(--danger)"
              : inProgress
                ? "var(--primary)"
                : "var(--border-strong)";

        return (
          <div
            key={a.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 22px",
              borderTop: i ? "1px solid var(--outline-variant)" : "none",
              background: inProgress ? "var(--primary-tint)" : "transparent",
            }}
          >
            <div style={{ width: 54, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {timeFor(a)}
              </div>
              <div
                style={{ fontSize: 11, color: "var(--text-subtle)" }}
              >
                {a.doctor?.specialty ?? "—"}
              </div>
            </div>
            <div
              style={{
                width: 2,
                height: 36,
                background: railColor,
                borderRadius: 999,
              }}
            />
            <span
              className="avatar"
              style={{
                width: 36,
                height: 36,
                background: "#dbeafe",
                color: "#1d4ed8",
                fontSize: 12,
              }}
            >
              {patientInitials(a)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {patientName(a)}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-subtle)",
                  marginTop: 2,
                }}
              >
                {a.doctor?.name ??
                  a.doctor?.profile?.full_name ??
                  "Doctor"}
              </div>
            </div>
            <span className={`chip dot ${meta.cls}`}>{meta.label}</span>
            <button
              type="button"
              className="btn ghost sm"
              aria-label="More"
              style={{ padding: 8 }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
