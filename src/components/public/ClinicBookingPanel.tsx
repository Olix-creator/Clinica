"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
  Stethoscope,
} from "lucide-react";
import type {
  BookAppointmentResult,
  LoadSlotsResult,
  SuggestResult,
} from "@/app/clinic/[id]/booking-actions";

type Doctor = {
  id: string;
  name: string | null;
  specialty: string | null;
};

// Must match TIME_SLOTS in src/lib/data/appointments.ts.
const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
] as const;

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 20;
}

function buildDateStrip(days = 5) {
  const out: { iso: string; dayLabel: string; dateLabel: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      dayLabel: d.toLocaleDateString(undefined, { weekday: "short" }),
      dateLabel: String(d.getDate()),
    });
  }
  return out;
}

function isSlotPast(dayISO: string, slot: string): boolean {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  if (dayISO !== todayISO) return false;
  const [h, m] = slot.split(":").map(Number);
  const slotDate = new Date(now);
  slotDate.setHours(h, m, 0, 0);
  return slotDate.getTime() <= now.getTime();
}

function avatarInitials(name: string | null): string {
  if (!name) return "DR";
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Inline booking flow embedded on /clinic/[id] — the ONLY booking UI in
 * the app. Patients reach it from anywhere (landing, /search, dashboard,
 * /patient reschedule) — every entry point first sends them to the
 * clinic detail page, then this panel is what they see.
 *
 * Steps:
 *   1. Pick doctor (skipped if `initialDoctorId` is set or only one doctor)
 *   2. Pick date (5-day strip starting today)
 *   3. Pick time slot
 *   4. Phone + Book
 *
 * For unauthenticated visitors we render a "Sign in to book" CTA that
 * deep-links back to this page after auth.
 */
export function ClinicBookingPanel({
  clinicId,
  clinicName,
  doctors,
  isSignedIn,
  initialPhone = "",
  initialDoctorId = "",
  initialDateISO,
  bookAppointment,
  loadSlots,
  findSuggestion,
}: {
  clinicId: string;
  clinicName: string;
  doctors: Doctor[];
  isSignedIn: boolean;
  initialPhone?: string;
  initialDoctorId?: string;
  initialDateISO?: string;
  bookAppointment: (formData: FormData) => Promise<BookAppointmentResult>;
  loadSlots: (doctorId: string, dayISO: string) => Promise<LoadSlotsResult>;
  findSuggestion: (
    doctorId: string,
    fromDayISO: string,
  ) => Promise<SuggestResult>;
}) {
  const router = useRouter();
  // If a doctor was passed in (e.g. from /patient reschedule deep link)
  // and it's valid, pre-select. Otherwise auto-pick when there's only one.
  const resolvedInitialDoctor = useMemo(() => {
    if (initialDoctorId && doctors.some((d) => d.id === initialDoctorId)) {
      return initialDoctorId;
    }
    if (doctors.length === 1) return doctors[0].id;
    return "";
  }, [doctors, initialDoctorId]);

  const [doctorId, setDoctorId] = useState(resolvedInitialDoctor);
  const [dayISO, setDayISO] = useState<string>(
    initialDateISO ?? (() => new Date().toISOString().slice(0, 10))(),
  );
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [phone, setPhone] = useState(initialPhone);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [suggestion, setSuggestion] = useState<{ dayISO: string; slot: string } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const phoneOk = phone.trim() !== "" && isValidPhone(phone);
  const dateStrip = useMemo(() => buildDateStrip(5), []);
  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorId) ?? null,
    [doctors, doctorId],
  );

  // Load slot availability whenever (doctor, day) changes.
  useEffect(() => {
    if (!doctorId || !dayISO) {
      setBookedSlots([]);
      setUnavailableSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setTimeSlot("");
    loadSlots(doctorId, dayISO).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setBookedSlots(res.booked);
        setUnavailableSlots(res.unavailable);
      } else {
        setBookedSlots([]);
        setUnavailableSlots([]);
        toast.error(res.error);
      }
      setLoadingSlots(false);
    });
    return () => {
      cancelled = true;
    };
  }, [doctorId, dayISO, loadSlots]);

  // Smart-suggestion: next-available across the 14-day window.
  useEffect(() => {
    if (!doctorId) {
      setSuggestion(null);
      return;
    }
    let cancelled = false;
    const todayISO = new Date().toISOString().slice(0, 10);
    findSuggestion(doctorId, todayISO).then((res) => {
      if (cancelled) return;
      setSuggestion(res.ok ? res.suggestion : null);
    });
    return () => {
      cancelled = true;
    };
  }, [doctorId, findSuggestion]);

  function submit() {
    setError(null);
    if (!doctorId) {
      setError("Please pick a doctor.");
      toast.error("Please pick a doctor.");
      return;
    }
    if (!phoneOk) {
      setError("Please enter a valid phone number.");
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!timeSlot) {
      setError("Please pick a time slot.");
      toast.error("Please pick a time slot.");
      return;
    }
    const fd = new FormData();
    fd.set("clinicId", clinicId);
    fd.set("doctorId", doctorId);
    fd.set("appointmentDate", dayISO);
    fd.set("timeSlot", timeSlot);
    fd.set("phone", phone.trim());
    startTransition(async () => {
      const res = await bookAppointment(fd);
      if (res.ok) {
        setSuccess(true);
        toast.success("Appointment booked");
        setTimeout(() => {
          router.push("/patient");
          router.refresh();
        }, 1200);
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  }

  // ───────────────────────────────────────────────────────────
  // Unauthenticated visitor — show sign-in nudge instead of form.
  // ───────────────────────────────────────────────────────────
  if (!isSignedIn) {
    const next = `/clinic/${clinicId}`;
    return (
      <div className="card" style={{ padding: 24 }}>
        <p className="t-eyebrow">Book a visit</p>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: "6px 0 6px",
            letterSpacing: "-0.01em",
          }}
        >
          Sign in to book at {clinicName}
        </h3>
        <p className="t-small" style={{ marginBottom: 16, lineHeight: 1.5 }}>
          We&apos;ll bring you back here right after — your selection is preserved.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(next)}`}
          className="btn primary"
          style={{ width: "100%", padding: "12px 16px" }}
        >
          Sign in <ArrowRight size={15} />
        </Link>
        <Link
          href={`/signup?redirect=${encodeURIComponent(next)}`}
          className="btn ghost"
          style={{
            width: "100%",
            padding: "12px 16px",
            marginTop: 6,
            justifyContent: "center",
          }}
        >
          Create an account
        </Link>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  // Booked confirmation card.
  // ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="card" style={{ padding: 28, textAlign: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "var(--success-50)",
            color: "var(--success)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
            boxShadow: "0 0 0 8px rgba(5, 150, 105, 0.06)",
          }}
        >
          <CheckCircle2 size={36} strokeWidth={2.4} />
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Appointment booked
        </h3>
        <p className="t-body" style={{ marginTop: 6 }}>
          Taking you to your dashboard…
        </p>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="card" style={{ padding: 22 }}>
        <p className="t-eyebrow">Book a visit</p>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "6px 0 4px",
          }}
        >
          No doctors available yet
        </h3>
        <p className="t-small" style={{ lineHeight: 1.5 }}>
          {clinicName} hasn&apos;t added any doctors. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 22 }} id="book">
      <p className="t-eyebrow">Book a visit</p>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          margin: "6px 0 4px",
          letterSpacing: "-0.01em",
        }}
      >
        Pick a doctor and time
      </h3>
      <p className="t-small" style={{ marginBottom: 16, lineHeight: 1.5 }}>
        At {clinicName}.
      </p>

      {error ? (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #fecaca",
            background: "var(--danger-50)",
            color: "var(--danger)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Doctor picker (skip when only one doctor + pre-resolved) */}
      {doctors.length > 1 ? (
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Doctor</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {doctors.map((d) => {
              const active = d.id === doctorId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDoctorId(d.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    cursor: "pointer",
                    background: "var(--surface-bright)",
                    border: active
                      ? "1.5px solid var(--primary)"
                      : "1px solid var(--outline-variant)",
                    boxShadow: active
                      ? "0 0 0 3px var(--primary-tint)"
                      : "none",
                    textAlign: "left",
                    transition: "all .12s ease",
                  }}
                >
                  <span
                    className="avatar"
                    style={{
                      width: 32,
                      height: 32,
                      background: active ? "var(--primary-50)" : "var(--bg-muted)",
                      color: active ? "var(--primary-600)" : "var(--text-muted)",
                      fontSize: 11,
                    }}
                  >
                    {avatarInitials(d.name)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {d.name ?? "Doctor"}
                    </div>
                    {d.specialty ? (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-subtle)",
                        }}
                      >
                        {d.specialty}
                      </div>
                    ) : null}
                  </div>
                  {active ? (
                    <CheckCircle2 size={16} style={{ color: "var(--primary)" }} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : selectedDoctor ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            background: "var(--bg-muted)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--primary-50)",
              color: "var(--primary-600)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Stethoscope size={16} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {selectedDoctor.name ?? "Doctor"}
            </div>
            {selectedDoctor.specialty ? (
              <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>
                {selectedDoctor.specialty}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Date strip */}
      <div style={{ marginBottom: 16 }}>
        <label className="field-label">Date</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 6,
          }}
        >
          {dateStrip.map((d) => {
            const active = d.iso === dayISO;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setDayISO(d.iso)}
                style={{
                  padding: "10px 0",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: active ? "var(--primary-50)" : "var(--surface-bright)",
                  color: active ? "var(--primary-600)" : "var(--on-surface)",
                  border: active
                    ? "1.5px solid var(--primary)"
                    : "1px solid var(--outline-variant)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0,
                  transition: "all .12s ease",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: active ? "var(--primary-600)" : "var(--text-subtle)",
                  }}
                >
                  {d.dayLabel}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, marginTop: 1 }}>
                  {d.dateLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slot grid */}
      <div style={{ marginBottom: 16 }}>
        <label className="field-label">Time</label>
        {loadingSlots ? (
          <div
            style={{
              padding: 20,
              display: "grid",
              placeItems: "center",
              borderRadius: 10,
              background: "var(--bg-muted)",
            }}
          >
            <Loader2
              size={16}
              className="animate-spin"
              style={{ color: "var(--primary)" }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
            }}
          >
            {TIME_SLOTS.map((slot) => {
              const isBooked = bookedSlots.includes(slot);
              const isUnavailable = unavailableSlots.includes(slot);
              const isPast = isSlotPast(dayISO, slot);
              const disabled = isUnavailable || isBooked || isPast;
              const active = timeSlot === slot;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => !disabled && setTimeSlot(slot)}
                  disabled={disabled}
                  style={{
                    padding: "9px 0",
                    borderRadius: 8,
                    border: active
                      ? "1.5px solid var(--primary)"
                      : "1px solid var(--outline-variant)",
                    background: active
                      ? "var(--primary)"
                      : disabled
                        ? "var(--bg-muted)"
                        : "var(--surface-bright)",
                    color: active
                      ? "#fff"
                      : disabled
                        ? "var(--text-faint)"
                        : "var(--on-surface)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: disabled ? "not-allowed" : "pointer",
                    textDecoration: disabled ? "line-through" : "none",
                    transition: "all .12s ease",
                  }}
                  title={
                    isPast
                      ? "Past"
                      : isBooked
                        ? "Booked"
                        : isUnavailable
                          ? "Unavailable"
                          : ""
                  }
                >
                  {slot}
                </button>
              );
            })}
          </div>
        )}

        {!timeSlot && !loadingSlots && suggestion ? (
          <button
            type="button"
            onClick={() => {
              setDayISO(suggestion.dayISO);
              setTimeSlot(suggestion.slot);
            }}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--primary-100)",
              background: "var(--primary-50)",
              color: "var(--primary-600)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Next available:{" "}
            {new Date(suggestion.dayISO + "T00:00:00").toLocaleDateString(
              undefined,
              { weekday: "short", month: "short", day: "numeric" },
            )}{" "}
            at {suggestion.slot}
            <ArrowRight size={13} style={{ marginLeft: "auto" }} />
          </button>
        ) : null}
      </div>

      {/* Phone */}
      <div style={{ marginBottom: 16 }}>
        <label className="field-label">Phone</label>
        <div style={{ position: "relative" }}>
          <Phone
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
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+213 …"
            autoComplete="tel"
            required
            className="input"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <p
          className="t-small"
          style={{
            marginTop: 4,
            color: phone && !phoneOk ? "var(--danger)" : undefined,
          }}
        >
          {phone && !phoneOk
            ? "That doesn't look like a valid phone number."
            : "So the clinic can reach you if plans change."}
        </p>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending || !doctorId || !timeSlot || !phoneOk}
        className="btn primary"
        style={{ width: "100%", padding: "12px 16px" }}
      >
        {pending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            Book appointment <ChevronRight size={15} />
          </>
        )}
      </button>
    </div>
  );
}

// Tree-shake-friendly named import for icons that might be useful externally.
export { ChevronLeft };
