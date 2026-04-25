"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserRound } from "lucide-react";

type Doctor = { id: string; name: string | null; specialty: string | null };

/**
 * Public booking CTA — Clinica handoff design.
 *
 * Doctor picker + primary CTA. Deep-links into the existing
 * `/booking` flow with `?clinicId=&doctorId=` so we never fork
 * appointment-creation logic.
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
    const href = isSignedIn
      ? target
      : `/login?redirect=${encodeURIComponent(target)}`;
    router.push(href);
  }

  const anyDoctor = doctors.length > 0;

  return (
    <div className="card" style={{ padding: 22 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "var(--primary-600)",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        Book a visit
      </p>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          margin: "6px 0 4px",
          letterSpacing: "-0.01em",
        }}
      >
        Pick a doctor to continue
      </h3>
      <p className="t-small" style={{ marginBottom: 16, lineHeight: 1.5 }}>
        {isSignedIn
          ? "We'll open the booking wizard with your selection pre-filled."
          : "We'll ask you to sign in, then drop you straight into the booking wizard."}
      </p>

      <label style={{ position: "relative", display: "block", marginBottom: 12 }}>
        <UserRound
          size={15}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-subtle)",
            pointerEvents: "none",
          }}
        />
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          disabled={!anyDoctor}
          className="select"
          style={{
            paddingLeft: 38,
            cursor: anyDoctor ? "pointer" : "not-allowed",
            opacity: anyDoctor ? 1 : 0.6,
          }}
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
        className="btn primary"
        style={{ width: "100%", padding: "12px 16px" }}
      >
        {pending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            Book appointment
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
}
