"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  Stethoscope,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Sun,
  CloudSun,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  BookAppointmentResult,
  LoadSlotsResult,
  SuggestResult,
} from "@/app/(dashboard)/booking/actions";

type Clinic = { id: string; name: string };
type Doctor = {
  id: string;
  name: string | null;
  specialty: string | null;
  profile: { full_name: string | null; email: string | null } | null;
};

// Must match TIME_SLOTS in src/lib/data/appointments.ts
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

const MORNING = TIME_SLOTS.filter((s) => Number(s.slice(0, 2)) < 12);
const AFTERNOON = TIME_SLOTS.filter(
  (s) => Number(s.slice(0, 2)) >= 12 && Number(s.slice(0, 2)) < 17,
);

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 20;
}

function doctorDisplayName(d: Doctor): string {
  return d.name ?? d.profile?.full_name ?? d.profile?.email ?? "Unnamed doctor";
}

const STEPS = [
  { n: 1, label: "Clinic", Ic: Building2 },
  { n: 2, label: "Doctor", Ic: Stethoscope },
  { n: 3, label: "Time", Ic: CalendarClock },
  { n: 4, label: "Confirm", Ic: CheckCircle2 },
];

function buildDateStrip(days = 7) {
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

/**
 * Master booking UI — the ONE patient booking experience used by every
 * entry point in the app (landing CTA, /search → /clinic/[id], /patient
 * dashboard). Every surface that wants to start a booking links to
 * `/booking` (with optional `?clinicId=&doctorId=` deep-link) and lands
 * on this exact form.
 *
 * Style is Clinica handoff: light surface, blue primary, slate text,
 * rounded-10/14, .btn / .chip / .input utility classes from globals.css.
 */
export function BookingForm({
  clinics,
  action,
  loadSlots,
  findSuggestion,
  initialPhone = "",
  initialClinicId = "",
  initialDoctorId = "",
}: {
  clinics: Clinic[];
  action: (formData: FormData) => Promise<BookAppointmentResult>;
  loadSlots: (doctorId: string, dayISO: string) => Promise<LoadSlotsResult>;
  findSuggestion: (doctorId: string, fromDayISO: string) => Promise<SuggestResult>;
  initialPhone?: string;
  initialClinicId?: string;
  initialDoctorId?: string;
}) {
  const router = useRouter();
  const initialStep = initialDoctorId ? 3 : initialClinicId ? 2 : 1;
  const [step, setStep] = useState(initialStep);
  const [clinicId, setClinicId] = useState(initialClinicId);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [dayISO, setDayISO] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [phone, setPhone] = useState(initialPhone);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<{ dayISO: string; slot: string } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const phoneOk = phone.trim() !== "" && isValidPhone(phone);
  const dateStrip = useMemo(() => buildDateStrip(7), []);

  useEffect(() => {
    if (!clinicId) {
      setDoctors([]);
      setDoctorId("");
      return;
    }
    let cancelled = false;
    setLoadingDoctors(true);
    const supabase = createClient();
    supabase
      .from("doctors")
      .select(
        "id, name, specialty, profile:profiles!doctors_profile_id_fkey(full_name, email)",
      )
      .eq("clinic_id", clinicId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error("Could not load doctors");
        const list = ((data ?? []) as unknown) as Doctor[];
        setDoctors(list);
        setDoctorId((prev) => (prev && list.some((d) => d.id === prev) ? prev : ""));
        setLoadingDoctors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

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

  useEffect(() => {
    if (!doctorId) {
      setSuggestion(null);
      return;
    }
    let cancelled = false;
    setLoadingSuggestion(true);
    const todayISO = new Date().toISOString().slice(0, 10);
    findSuggestion(doctorId, todayISO).then((res) => {
      if (cancelled) return;
      setSuggestion(res.ok ? res.suggestion : null);
      setLoadingSuggestion(false);
    });
    return () => {
      cancelled = true;
    };
  }, [doctorId, findSuggestion]);

  const selectedClinic = useMemo(
    () => clinics.find((c) => c.id === clinicId),
    [clinics, clinicId],
  );
  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorId),
    [doctors, doctorId],
  );
  const selectedDayLabel = useMemo(() => {
    if (!dayISO) return "";
    const d = new Date(dayISO + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [dayISO]);

  function submit() {
    setError(null);
    if (!phoneOk) {
      setError("Please enter a valid phone number.");
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!timeSlot) {
      setError("Please pick a time slot");
      toast.error("Please pick a time slot");
      return;
    }
    const fd = new FormData();
    fd.set("clinicId", clinicId);
    fd.set("doctorId", doctorId);
    fd.set("appointmentDate", dayISO);
    fd.set("timeSlot", timeSlot);
    fd.set("phone", phone.trim());
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) {
        setSuccess(true);
        toast.success("Appointment booked successfully");
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

  if (success) {
    return (
      <div style={{ padding: "48px 8px", textAlign: "center" }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            background: "var(--success-50)",
            color: "var(--success)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 22px",
            boxShadow: "0 0 0 8px rgba(5, 150, 105, 0.06)",
          }}
        >
          <CheckCircle2 size={42} strokeWidth={2.4} />
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Appointment booked
        </h2>
        <p className="t-body" style={{ marginTop: 8 }}>
          Taking you to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="anim-fade">
      {/* Progress indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 28,
          overflowX: "auto",
          paddingBottom: 4,
        }}
        className="hide-scrollbar"
      >
        {STEPS.map((s, i) => {
          const active = s.n === step;
          const done = s.n < step;
          return (
            <div
              key={s.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: active
                    ? "var(--primary-tint)"
                    : done
                      ? "var(--bg-muted)"
                      : "transparent",
                  color: active
                    ? "var(--primary-600)"
                    : done
                      ? "var(--on-surface)"
                      : "var(--text-subtle)",
                  border: active
                    ? "1px solid var(--primary-100)"
                    : "1px solid transparent",
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: active
                      ? "var(--primary)"
                      : done
                        ? "var(--on-surface)"
                        : "var(--outline-variant)",
                    color: active || done ? "#fff" : "var(--text-muted)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {done ? <CheckCircle2 size={12} /> : s.n}
                </span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <span
                  style={{
                    width: 14,
                    height: 1,
                    background: done
                      ? "var(--primary)"
                      : "var(--outline-variant)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
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

      {/* Step 1: Clinic */}
      {step === 1 && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p className="t-eyebrow">Step 1</p>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Pick a clinic.
            </h2>
          </div>
          {clinics.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--text-muted)",
                background: "var(--bg-muted)",
                borderRadius: 14,
                fontSize: 14,
              }}
            >
              No clinics are available yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 10,
              }}
            >
              {clinics.map((c) => {
                const active = c.id === clinicId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClinicId(c.id)}
                    style={{
                      textAlign: "left",
                      padding: 18,
                      borderRadius: 12,
                      cursor: "pointer",
                      background: "var(--surface-bright)",
                      border: active
                        ? "1.5px solid var(--primary)"
                        : "1px solid var(--outline-variant)",
                      boxShadow: active
                        ? "0 0 0 3px var(--primary-tint)"
                        : "none",
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      transition: "all .12s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: active
                          ? "var(--primary-50)"
                          : "var(--bg-muted)",
                        color: active ? "var(--primary-600)" : "var(--text-muted)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={18} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.name}
                      </div>
                    </div>
                    {active ? (
                      <CheckCircle2
                        size={18}
                        style={{ color: "var(--primary)", flexShrink: 0 }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Doctor */}
      {step === 2 && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p className="t-eyebrow">Step 2</p>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Choose a doctor.
            </h2>
            <p className="t-body" style={{ margin: "4px 0 0" }}>
              {selectedClinic?.name}
            </p>
          </div>
          {loadingDoctors ? (
            <div
              style={{
                padding: 32,
                display: "grid",
                placeItems: "center",
                background: "var(--bg-muted)",
                borderRadius: 14,
              }}
            >
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
          ) : doctors.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--text-muted)",
                background: "var(--bg-muted)",
                borderRadius: 14,
                fontSize: 14,
              }}
            >
              No doctors available at this clinic.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 10,
              }}
            >
              {doctors.map((d) => {
                const active = d.id === doctorId;
                const name = doctorDisplayName(d);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDoctorId(d.id)}
                    style={{
                      textAlign: "left",
                      padding: 18,
                      borderRadius: 12,
                      cursor: "pointer",
                      background: "var(--surface-bright)",
                      border: active
                        ? "1.5px solid var(--primary)"
                        : "1px solid var(--outline-variant)",
                      boxShadow: active ? "0 0 0 3px var(--primary-tint)" : "none",
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      transition: "all .12s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: active
                          ? "var(--primary-50)"
                          : "var(--bg-muted)",
                        color: active ? "var(--primary-600)" : "var(--text-muted)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Stethoscope size={18} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-subtle)",
                          marginTop: 2,
                        }}
                      >
                        {d.specialty ?? "General Practice"}
                      </div>
                    </div>
                    {active ? (
                      <CheckCircle2
                        size={18}
                        style={{ color: "var(--primary)", flexShrink: 0 }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Date & time slot */}
      {step === 3 && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <p className="t-eyebrow">Step 3</p>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Pick a time.
            </h2>
            <p className="t-body" style={{ margin: "4px 0 0" }}>
              30-minute slot at {selectedClinic?.name}
              {selectedDoctor ? ` with ${doctorDisplayName(selectedDoctor)}` : ""}.
            </p>
          </div>

          <div
            style={{
              padding: 18,
              borderRadius: 14,
              border: "1px solid var(--outline-variant)",
              background: "var(--surface-bright)",
            }}
          >
            {/* Date strip */}
            <div
              style={{
                display: "flex",
                gap: 6,
                overflowX: "auto",
                paddingBottom: 14,
                marginBottom: 14,
                borderBottom: "1px solid var(--outline-variant)",
              }}
              className="hide-scrollbar"
            >
              {dateStrip.map((d) => {
                const active = d.iso === dayISO;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setDayISO(d.iso)}
                    style={{
                      flexShrink: 0,
                      minWidth: 64,
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: active ? "var(--primary)" : "var(--bg-muted)",
                      color: active ? "#fff" : "var(--on-surface)",
                      border: "1px solid",
                      borderColor: active
                        ? "var(--primary)"
                        : "var(--outline-variant)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      transition: "all .12s ease",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        opacity: active ? 0.9 : 0.7,
                      }}
                    >
                      {d.dayLabel}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>
                      {d.dateLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time slot grid */}
            {loadingSlots ? (
              <div
                style={{
                  padding: 28,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary)" }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SlotSection
                  title="Morning"
                  Ic={Sun}
                  slots={MORNING as unknown as string[]}
                  dayISO={dayISO}
                  bookedSlots={bookedSlots}
                  unavailableSlots={unavailableSlots}
                  value={timeSlot}
                  onChange={setTimeSlot}
                />
                <SlotSection
                  title="Afternoon"
                  Ic={CloudSun}
                  slots={AFTERNOON as unknown as string[]}
                  dayISO={dayISO}
                  bookedSlots={bookedSlots}
                  unavailableSlots={unavailableSlots}
                  value={timeSlot}
                  onChange={setTimeSlot}
                />
              </div>
            )}

            {/* Smart suggestion */}
            {!timeSlot && !loadingSlots && suggestion ? (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--primary-100)",
                  background: "var(--primary-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}
                >
                  <Sparkles
                    size={16}
                    style={{ color: "var(--primary-600)", marginTop: 2, flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                      Next available:{" "}
                      {new Date(suggestion.dayISO + "T00:00:00").toLocaleDateString(
                        undefined,
                        { weekday: "short", month: "short", day: "numeric" },
                      )}{" "}
                      at {suggestion.slot}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: "var(--text-subtle)",
                      }}
                    >
                      One tap to jump to the earliest free slot.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDayISO(suggestion.dayISO);
                    setTimeSlot(suggestion.slot);
                  }}
                  className="btn primary sm"
                  style={{ flexShrink: 0 }}
                >
                  Use this
                </button>
              </div>
            ) : null}

            {loadingSuggestion && !timeSlot && !loadingSlots ? (
              <p
                className="t-small"
                style={{
                  marginTop: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Loader2 size={11} className="animate-spin" /> Finding the
                earliest available slot…
              </p>
            ) : null}

            {timeSlot ? (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--primary-100)",
                  background: "var(--primary-50)",
                  color: "var(--primary-600)",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={15} />
                Selected {selectedDayLabel} at {timeSlot}.
              </div>
            ) : null}
          </div>

          {/* Phone */}
          <div>
            <label className="field-label">Phone number</label>
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
                placeholder="+1 555 123 4567"
                autoComplete="tel"
                required
                className="input"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <p
              className="t-small"
              style={{
                marginTop: 6,
                color: phone && !phoneOk ? "var(--danger)" : undefined,
              }}
            >
              {phone && !phoneOk
                ? "That doesn't look like a valid phone number."
                : "So the clinic can reach you if plans change."}
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p className="t-eyebrow">Step 4</p>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Review &amp; confirm.
            </h2>
          </div>
          <div
            className="card"
            style={{ padding: 20, display: "flex", flexDirection: "column", gap: 4 }}
          >
            {[
              { label: "Clinic", value: selectedClinic?.name, Ic: Building2 },
              {
                label: "Doctor",
                value: selectedDoctor ? doctorDisplayName(selectedDoctor) : undefined,
                sub: selectedDoctor?.specialty,
                Ic: Stethoscope,
              },
              {
                label: "When",
                value:
                  selectedDayLabel && timeSlot
                    ? `${selectedDayLabel} · ${timeSlot}`
                    : "—",
                Ic: CalendarClock,
              },
              {
                label: "Phone",
                value: phone || "—",
                Ic: Phone,
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "10px 0",
                  borderTop: "1px solid var(--outline-variant)",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--primary-50)",
                    color: "var(--primary-600)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <row.Ic size={16} />
                </span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--text-subtle)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                    }}
                  >
                    {row.label}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 500 }}>
                    {row.value ?? "—"}
                  </p>
                  {"sub" in row && row.sub ? (
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 12,
                        color: "var(--text-subtle)",
                      }}
                    >
                      {row.sub}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 28,
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || pending}
          className="btn ghost"
        >
          <ChevronLeft size={14} />
          Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={
              pending ||
              (step === 1 && !clinicId) ||
              (step === 2 && !doctorId) ||
              (step === 3 && (!timeSlot || !phoneOk))
            }
            className="btn primary"
          >
            Continue
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="btn primary"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {pending ? "Booking…" : "Confirm booking"}
          </button>
        )}
      </div>
    </div>
  );
}

function SlotSection({
  title,
  Ic,
  slots,
  dayISO,
  bookedSlots,
  unavailableSlots,
  value,
  onChange,
}: {
  title: string;
  Ic: typeof Sun;
  slots: string[];
  dayISO: string;
  bookedSlots: string[];
  unavailableSlots: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        <Ic size={14} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
          gap: 6,
        }}
      >
        {slots.map((slot) => {
          const isBooked = bookedSlots.includes(slot);
          const isUnavailable = unavailableSlots.includes(slot);
          const isPast = isSlotPast(dayISO, slot);
          const disabled = isUnavailable || isBooked || isPast;
          const active = value === slot;

          if (disabled) {
            const label = isPast ? "Past" : isBooked ? "Booked" : "Unavailable";
            return (
              <button
                key={slot}
                type="button"
                disabled
                style={{
                  padding: "9px 0",
                  borderRadius: 8,
                  border: "1px solid var(--outline-variant)",
                  background: "var(--bg-muted)",
                  color: "var(--text-faint)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "not-allowed",
                  textDecoration: "line-through",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0,
                }}
                title={label}
              >
                <span>{slot}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 500,
                    textDecoration: "none",
                    opacity: 0.7,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          }
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onChange(slot)}
              style={{
                padding: "9px 0",
                borderRadius: 8,
                border: active
                  ? "1.5px solid var(--primary)"
                  : "1px solid var(--outline-variant)",
                background: active ? "var(--primary)" : "var(--surface-bright)",
                color: active ? "#fff" : "var(--on-surface)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .12s ease",
              }}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
