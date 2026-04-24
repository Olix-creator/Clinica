"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserRound } from "lucide-react";

type Doctor = { id: string; name: string | null; specialty: string | null };

/**
 * Public booking entry point for a clinic detail page.
 *
 * We intentionally DO NOT try to replicate the full booking wizard here —
 * that would fork the appointment-creation logic and invite double-booking
 * bugs. Instead the CTA simply deep-links the visitor into the existing
 * `/booking` page with `?clinicId=&doctorId=` pre-filled. The auth gate on
 * `/booking` handles the sign-in redirect cleanly and the server action
 * there is the single source of truth for appointment writes.
 *
 * Props:
 *   - `clinicId` — required; used as the deep-link target.
 *   - `doctors` — narrow list; passed in by the server page.
 *   - `isSignedIn` — if false, we route through `/login?next=…` so the
 *     visitor lands on the booking page after auth.
 */
export function ClinicBookingCta({
  clinicId,
  doctors,
  isSignedIn,
}: {
  clinicId: string;
  doctors: Doctor[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState<string>("");
  const [pending, setPending] = useState(false);

  function go() {
    setPending(true);
    const params = new URLSearchParams({ clinicId });
    if (doctorId) params.set("doctorId", doctorId);
    const target = `/booking?${params.toString()}`;
    // Match the auth proxy's convention (`?redirect=`) so the login page
    // works the same whether the user hit it via a gated route or via our
    // explicit redirect here.
    const href = isSignedIn
      ? target
      : `/login?redirect=${encodeURIComponent(target)}`;
    router.push(href);
  }

  const anyDoctor = doctors.length > 0;

  return (
    <div className="rounded-3xl bg-surface-container-lowest ring-1 ring-outline-variant/30 shadow-sm p-5 sm:p-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Book a visit
        </p>
        <h2 className="font-headline text-lg sm:text-xl font-semibold text-on-surface mt-1">
          Pick a doctor to continue
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          {isSignedIn
            ? "We'll open the booking wizard with your selection pre-filled."
            : "We'll ask you to sign in, then drop you straight into the booking wizard."}
        </p>
      </div>

      <label className="relative flex items-center">
        <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          disabled={!anyDoctor}
          className="w-full pl-11 pr-9 py-3 rounded-xl bg-surface-container-highest border-0 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 transition appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">
            {anyDoctor ? "Any available specialist" : "No doctors listed yet"}
          </option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name ?? "Doctor"}
              {d.specialty ? ` — ${d.specialty}` : ""}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition shadow-sm disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Book appointment
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
