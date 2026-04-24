"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  ClipboardList,
  Loader2,
  MapPin,
  Phone,
  Stethoscope,
} from "lucide-react";
import { createClinicOnboardingAction } from "@/app/onboarding/clinic/actions";

const INPUT =
  "w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60";

/**
 * Client form for /onboarding/clinic.
 *
 * We keep this component dumb — it only collects text, calls the
 * server action, and routes on success. All validation/inserts
 * happen server-side so a curl bypass doesn't skip the verification
 * requirements.
 */
export function ClinicSetupForm({ plan }: { plan: "free" | "premium" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("plan", plan);
    setError("");
    startTransition(async () => {
      const res = await createClinicOnboardingAction(fd);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(
        "Clinic submitted for verification. Your 30-day trial starts now.",
      );
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <div className="px-4 py-3 rounded-xl bg-error-container/30 border border-error/30 text-sm text-error">
          {error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-semibold">
          Clinic name <span className="text-error">*</span>
        </label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            name="name"
            required
            placeholder="e.g. Clinique Al Amal"
            className={`${INPUT} pl-11`}
            disabled={pending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-semibold">
            Phone <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="phone"
              required
              type="tel"
              placeholder="+213 …"
              className={`${INPUT} pl-11`}
              disabled={pending}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-semibold">
            City
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="city"
              placeholder="e.g. Algiers"
              className={`${INPUT} pl-11`}
              disabled={pending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-semibold">
          Address <span className="text-error">*</span>
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            name="address"
            required
            placeholder="Street, number, district"
            className={`${INPUT} pl-11`}
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-semibold">
          Specialty
        </label>
        <div className="relative">
          <Stethoscope className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            name="specialty"
            placeholder="e.g. Cardiology, General Medicine"
            className={`${INPUT} pl-11`}
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-semibold">
          Description
        </label>
        <div className="relative">
          <ClipboardList className="w-4 h-4 text-on-surface-variant absolute left-4 top-4 pointer-events-none" />
          <textarea
            name="description"
            rows={4}
            placeholder="What do patients need to know about your practice?"
            className={`${INPUT} pl-11 pt-3 leading-relaxed`}
            disabled={pending}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/30 p-4 text-xs text-on-surface-variant leading-relaxed">
        <p>
          <span className="font-semibold text-on-surface">What happens next:</span>{" "}
          We review new clinics within one business day. You&apos;ll be able to
          invite staff immediately, but the clinic stays hidden from public
          search until approved. Your 30-day free trial starts the moment you
          submit this form.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed text-sm font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-70"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {pending ? "Submitting…" : "Create clinic"}
      </button>
    </form>
  );
}
