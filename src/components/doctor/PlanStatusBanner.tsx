import Link from "next/link";
import { AlertTriangle, Clock3, Crown, Sparkles } from "lucide-react";

export type ClinicPlanSnapshot = {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  plan_type: "free" | "premium";
  trial_end_date: string | null;
  monthly_appointments_count: number;
};

function daysLeft(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const end = new Date(trialEnd).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

/**
 * Pill of clinic plan state + a call to action when the clinic is
 * approaching (or past) the free-tier limits. Rendered on the doctor
 * dashboard so owners see it first thing.
 *
 * We keep the banner compact on good days ("Trial: 27 days left · 3/50 this
 * month") and switch to an urgent variant when action is required
 * (trial expired / cap hit / still pending verification).
 */
export function PlanStatusBanner({ clinics }: { clinics: ClinicPlanSnapshot[] }) {
  if (clinics.length === 0) return null;

  // Pick the most "at-risk" clinic to headline the banner. Priority:
  //   rejected > expired trial > pending > near cap > premium/ok.
  const ranked = [...clinics].sort((a, b) => score(b) - score(a));
  const c = ranked[0];

  const trialDays = daysLeft(c.trial_end_date);
  const atCap = c.plan_type === "free" && c.monthly_appointments_count >= 50;
  const trialExpired =
    c.plan_type === "free" && c.trial_end_date !== null && trialDays === 0;
  const needsAction =
    c.status !== "approved" || trialExpired || atCap;

  if (c.plan_type === "premium" && c.status === "approved") {
    return (
      <div className="rounded-2xl bg-primary/10 ring-1 ring-primary/20 px-5 py-3 flex items-center gap-3">
        <Crown className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-on-surface">
            <span className="font-semibold">{c.name}</span> is on Premium — no
            limits apply.
          </p>
        </div>
      </div>
    );
  }

  if (!needsAction) {
    // Healthy free-tier clinic — subtle status strip.
    return (
      <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/30 px-5 py-3 flex flex-wrap items-center gap-3">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">{c.name}</span> ·{" "}
          Trial: {trialDays} day{trialDays === 1 ? "" : "s"} left · This month:{" "}
          <span className="font-semibold text-on-surface">
            {c.monthly_appointments_count}
          </span>
          /50
        </p>
        <Link
          href="/pricing"
          className="ml-auto text-xs font-semibold text-primary hover:underline"
        >
          Compare plans →
        </Link>
      </div>
    );
  }

  // Urgent variant.
  const headline =
    c.status === "rejected"
      ? "Clinic verification was rejected"
      : c.status === "pending"
        ? "Clinic is pending verification"
        : trialExpired
          ? "Free trial has ended"
          : "Free plan monthly limit reached";
  const subtext =
    c.status === "pending"
      ? "Your public listing and bookings are on hold until our team verifies your clinic."
      : c.status === "rejected"
        ? "Contact support so we can review the verification again."
        : trialExpired
          ? "Upgrade to Premium to continue accepting bookings."
          : "You've used all 50 appointments for this month. Upgrade for unlimited bookings.";

  return (
    <div className="rounded-2xl bg-tertiary-container/30 border border-tertiary/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="w-10 h-10 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center flex-shrink-0">
          {c.status !== "approved" ? (
            <Clock3 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface">
            {headline} — {c.name}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">{subtext}</p>
        </div>
      </div>
      {c.status === "approved" ? (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed text-sm font-semibold shadow-emerald hover:brightness-110 transition"
        >
          <Crown className="w-4 h-4" />
          Upgrade
        </Link>
      ) : null}
    </div>
  );
}

function score(c: ClinicPlanSnapshot): number {
  let s = 0;
  if (c.status === "rejected") s += 100;
  if (c.status === "pending") s += 60;
  const trialDays = daysLeft(c.trial_end_date);
  if (c.plan_type === "free" && c.trial_end_date && trialDays === 0) s += 80;
  if (c.plan_type === "free" && c.monthly_appointments_count >= 50) s += 70;
  if (c.plan_type === "free" && trialDays > 0 && trialDays <= 7) s += 20;
  return s;
}
