"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { updateClinicProfileAction } from "@/app/(dashboard)/settings/actions";

export type EditableClinic = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  specialty: string | null;
  description: string | null;
  since_year: number | null;
  trust_reason: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "pending" | "approved" | "rejected";
  plan_type: "free" | "premium";
  trial_end_date: string | null;
  monthly_appointments_count: number;
};

const INPUT =
  "w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60";

const STATUS_META = {
  pending: {
    label: "Pending verification",
    tone: "bg-tertiary/15 text-tertiary",
    Icon: Clock3,
  },
  approved: {
    label: "Approved",
    tone: "bg-primary/15 text-primary",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    tone: "bg-error-container/30 text-error",
    Icon: XCircle,
  },
} as const;

function daysLeft(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const end = new Date(trialEnd).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

/**
 * Editor the clinic owner sees on /settings for each clinic they own.
 *
 * The "plan banner" on top reads the cached columns we populated in
 * migration 0013 — status, plan_type, trial_end_date, and
 * monthly_appointments_count. These fields are the source of truth
 * for the free-tier gate, so displaying them here mirrors exactly
 * what the booking API will see.
 */
export function ClinicProfileEditor({ clinic }: { clinic: EditableClinic }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const status = STATUS_META[clinic.status] ?? STATUS_META.pending;
  const trialDays = daysLeft(clinic.trial_end_date);
  const trialExpired =
    clinic.trial_end_date !== null && trialDays === 0 && clinic.plan_type === "free";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("clinicId", clinic.id);
    startTransition(async () => {
      const res = await updateClinicProfileAction(fd);
      if (res.ok) {
        toast.success("Clinic profile updated");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="rounded-2xl bg-surface-container-highest overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-bright/60 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{clinic.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-[0.14em] ${status.tone}`}
              >
                <status.Icon className="w-3 h-3" />
                {status.label}
              </span>
              {clinic.plan_type === "premium" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-[0.14em] bg-primary/15 text-primary">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-[0.14em] bg-surface-bright text-on-surface-variant">
                  Free
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs text-on-surface-variant">
          {open ? "Hide" : "Edit"}
        </span>
      </button>

      {/* Plan status banner — visible even when collapsed closed-feel is
          preserved by only showing banner when open OR when there's an
          actionable state. Here we always show trial/usage while open. */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-outline-variant/30 space-y-4">
          {/* Plan snapshot */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-container p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
                {clinic.plan_type === "premium"
                  ? "Premium plan"
                  : "Trial ends in"}
              </p>
              <p className="text-lg font-semibold text-on-surface mt-1">
                {clinic.plan_type === "premium"
                  ? "Active"
                  : trialExpired
                    ? "Expired"
                    : `${trialDays} day${trialDays === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
                This month
              </p>
              <p className="text-lg font-semibold text-on-surface mt-1">
                {clinic.monthly_appointments_count}
                {clinic.plan_type === "free" ? (
                  <span className="text-sm text-on-surface-variant font-normal">
                    {" "}
                    / 50
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {clinic.plan_type === "free" && (trialExpired || clinic.monthly_appointments_count >= 50) ? (
            <div className="rounded-xl bg-error-container/30 border border-error/30 p-3 text-xs text-error">
              {trialExpired
                ? "Free trial has ended. Upgrade to continue accepting bookings."
                : "You've hit the 50 appointments / month free-tier cap. Upgrade to continue."}
            </div>
          ) : null}

          {/* Profile edit form */}
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Clinic name
              </label>
              <input
                name="name"
                defaultValue={clinic.name}
                className={INPUT}
                disabled={pending}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                  Phone
                </label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={clinic.phone ?? ""}
                  className={INPUT}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                  City
                </label>
                <input
                  name="city"
                  defaultValue={clinic.city ?? ""}
                  className={INPUT}
                  disabled={pending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                  Latitude (optional)
                </label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={clinic.latitude ?? ""}
                  className={INPUT}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                  Longitude (optional)
                </label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={clinic.longitude ?? ""}
                  className={INPUT}
                  disabled={pending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Address
              </label>
              <input
                name="address"
                defaultValue={clinic.address ?? ""}
                className={INPUT}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Specialty
              </label>
              <input
                name="specialty"
                defaultValue={clinic.specialty ?? ""}
                className={INPUT}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={clinic.description ?? ""}
                className={`${INPUT} leading-relaxed`}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Year clinic opened
              </label>
              <input
                name="sinceYear"
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                defaultValue={clinic.since_year ?? ""}
                className={INPUT}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Why patients should trust your clinic
              </label>
              <textarea
                name="trustReason"
                rows={3}
                defaultValue={clinic.trust_reason ?? ""}
                className={`${INPUT} leading-relaxed`}
                disabled={pending}
                placeholder="Board-certified team, modern equipment, multilingual staff…"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed text-sm font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-70"
            >
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
