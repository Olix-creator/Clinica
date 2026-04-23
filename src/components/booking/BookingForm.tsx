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
  Moon,
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
  { n: 1, label: "Clinic", icon: Building2 },
  { n: 2, label: "Doctor", icon: Stethoscope },
  { n: 3, label: "Time", icon: CalendarClock },
  { n: 4, label: "Confirm", icon: CheckCircle2 },
];

// Build a 7-day strip starting today.
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

// Consider a slot "past" if we're booking today and the slot already elapsed.
function isSlotPast(dayISO: string, slot: string): boolean {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  if (dayISO !== todayISO) return false;
  const [h, m] = slot.split(":").map(Number);
  const slotDate = new Date(now);
  slotDate.setHours(h, m, 0, 0);
  return slotDate.getTime() <= now.getTime();
}

export function BookingForm({
  clinics,
  action,
  loadSlots,
  findSuggestion,
  initialPhone = "",
}: {
  clinics: Clinic[];
  action: (formData: FormData) => Promise<BookAppointmentResult>;
  loadSlots: (doctorId: string, dayISO: string) => Promise<LoadSlotsResult>;
  findSuggestion: (doctorId: string, fromDayISO: string) => Promise<SuggestResult>;
  initialPhone?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clinicId, setClinicId] = useState("");
  const [doctorId, setDoctorId] = useState("");
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

  // Load doctors when a clinic is picked.
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
        setDoctors(((data ?? []) as unknown) as Doctor[]);
        setDoctorId("");
        setLoadingDoctors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  // Load booked + unavailable slots when (doctor, day) changes.
  useEffect(() => {
    if (!doctorId || !dayISO) {
      setBookedSlots([]);
      setUnavailableSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setTimeSlot(""); // reset any prior selection when scope changes
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

  // Any time the doctor changes we recompute the "next available" suggestion
  // starting from today — this is what powers the Smart Rescheduling banner.
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
      <div className="py-16 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <CheckCircle2 className="w-10 h-10 text-primary animate-checkmark" />
        </div>
        <h3 className="font-headline text-2xl font-semibold mb-2">Booking confirmed.</h3>
        <p className="text-on-surface-variant">Taking you to your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto hide-scrollbar">
        {STEPS.map((s, i) => {
          const active = s.n === step;
          const done = s.n < step;
          return (
            <div key={s.n} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition ${
                  active
                    ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                    : done
                    ? "bg-surface-container-highest text-on-surface"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    active
                      ? "bg-primary text-on-primary-fixed"
                      : done
                      ? "bg-surface-bright text-on-surface"
                      : "bg-surface-container-highest"
                  }`}
                >
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
                </span>
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={`w-6 h-px ${done ? "bg-primary/40" : "bg-outline-variant/40"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-error-container/30 border border-error/30 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Step 1: Clinic */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-1">Step 1</p>
            <h2 className="font-headline text-2xl font-semibold">Pick a clinic.</h2>
          </div>
          {clinics.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-8 text-center text-on-surface-variant">
              No clinics are available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clinics.map((c) => {
                const active = c.id === clinicId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClinicId(c.id)}
                    className={`group text-left p-6 rounded-2xl transition ${
                      active
                        ? "bg-surface-container-highest ring-2 ring-primary"
                        : "bg-surface-container-low hover:bg-surface-container ring-1 ring-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          active ? "bg-primary/20" : "bg-surface-container-highest"
                        }`}
                      >
                        <Building2 className={`w-5 h-5 ${active ? "text-primary" : "text-on-surface-variant"}`} />
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-on-surface-variant mt-1">General practice</p>
                      </div>
                      {active && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Doctor */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-1">Step 2</p>
            <h2 className="font-headline text-2xl font-semibold">Choose a doctor.</h2>
            <p className="text-sm text-on-surface-variant mt-1">{selectedClinic?.name}</p>
          </div>
          {loadingDoctors ? (
            <div className="rounded-2xl bg-surface-container-low p-10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-8 text-center text-on-surface-variant">
              No doctors available at this clinic.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map((d) => {
                const active = d.id === doctorId;
                const name = doctorDisplayName(d);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDoctorId(d.id)}
                    className={`text-left p-6 rounded-2xl transition ${
                      active
                        ? "bg-surface-container-highest ring-2 ring-primary"
                        : "bg-surface-container-low hover:bg-surface-container ring-1 ring-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          active ? "bg-primary/20" : "bg-surface-container-highest"
                        }`}
                      >
                        <Stethoscope className={`w-5 h-5 ${active ? "text-primary" : "text-on-surface-variant"}`} />
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold">{name}</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {d.specialty ?? "General Practice"}
                        </p>
                      </div>
                      {active && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Date & time slot grid + phone */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-1">Step 3</p>
            <h2 className="font-headline text-2xl font-semibold">Pick a time.</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              30-minute slot at {selectedClinic?.name}
              {selectedDoctor ? ` with ${doctorDisplayName(selectedDoctor)}` : ""}.
            </p>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-5 sm:p-6 ring-1 ring-outline-variant/20">
            {/* Date strip */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto hide-scrollbar pb-4 mb-5 border-b border-outline-variant/20">
              {dateStrip.map((d) => {
                const active = d.iso === dayISO;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setDayISO(d.iso)}
                    className={`flex flex-col items-center justify-center py-2.5 px-4 rounded-xl min-w-[76px] transition ${
                      active
                        ? "bg-primary text-on-primary-fixed ring-2 ring-primary shadow-emerald"
                        : "bg-surface-container hover:bg-surface-container-highest text-on-surface"
                    }`}
                  >
                    <span
                      className={`text-[10px] mb-1 uppercase font-semibold tracking-wider ${
                        active ? "opacity-90" : "text-on-surface-variant"
                      }`}
                    >
                      {d.dayLabel}
                    </span>
                    <span className="text-lg font-bold">{d.dateLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Time slots grid */}
            {loadingSlots ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <SlotSection
                  title="Morning"
                  Icon={Sun}
                  slots={MORNING as unknown as string[]}
                  dayISO={dayISO}
                  bookedSlots={bookedSlots}
                  unavailableSlots={unavailableSlots}
                  value={timeSlot}
                  onChange={setTimeSlot}
                />
                <SlotSection
                  title="Afternoon"
                  Icon={CloudSun}
                  slots={AFTERNOON as unknown as string[]}
                  dayISO={dayISO}
                  bookedSlots={bookedSlots}
                  unavailableSlots={unavailableSlots}
                  value={timeSlot}
                  onChange={setTimeSlot}
                />
              </div>
            )}

            {/* Smart suggestion — shown when the user hasn't picked a slot and
                we know of a next-available alternative. */}
            {!timeSlot && !loadingSlots && suggestion && (
              <div className="mt-5 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface">
                      Next available:{" "}
                      {new Date(suggestion.dayISO + "T00:00:00").toLocaleDateString(
                        undefined,
                        { weekday: "short", month: "short", day: "numeric" },
                      )}{" "}
                      at {suggestion.slot}
                    </p>
                    <p className="text-xs text-on-surface-variant">
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
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition"
                >
                  Use this
                </button>
              </div>
            )}

            {loadingSuggestion && !timeSlot && !loadingSlots && (
              <p className="mt-5 text-xs text-on-surface-variant inline-flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Finding the earliest available slot…
              </p>
            )}

            {timeSlot && (
              <div className="mt-5 rounded-xl bg-primary-container/20 border border-primary/30 px-4 py-3 text-sm text-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Selected {selectedDayLabel} at {timeSlot}.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-surface-container-low p-5 sm:p-6">
            <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3 block">
              Phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                autoComplete="tel"
                required
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-surface-container-highest border-0 text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary transition"
              />
            </div>
            <p
              className={`text-xs mt-2 ${
                phone && !phoneOk ? "text-error" : "text-on-surface-variant"
              }`}
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
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-1">Step 4</p>
            <h2 className="font-headline text-2xl font-semibold">Review & confirm.</h2>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-6 space-y-4">
            {[
              { label: "Clinic", value: selectedClinic?.name, icon: Building2 },
              {
                label: "Doctor",
                value: selectedDoctor ? doctorDisplayName(selectedDoctor) : undefined,
                sub: selectedDoctor?.specialty,
                icon: Stethoscope,
              },
              {
                label: "When",
                value:
                  selectedDayLabel && timeSlot
                    ? `${selectedDayLabel} · ${timeSlot}`
                    : "—",
                icon: CalendarClock,
              },
              {
                label: "Phone",
                value: phone || "—",
                icon: Phone,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-4 py-2">
                <span className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                  <row.icon className="w-4 h-4 text-primary" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">{row.label}</p>
                  <p className="font-medium">{row.value ?? "—"}</p>
                  {"sub" in row && row.sub && (
                    <p className="text-xs text-on-surface-variant">{row.sub}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || pending}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container-highest text-on-surface font-medium text-sm hover:bg-surface-bright transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold text-sm shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold text-sm shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {pending ? "Booking…" : "Confirm booking"}
          </button>
        )}
      </div>
    </div>
  );
}

function SlotSection({
  title,
  Icon,
  slots,
  dayISO,
  bookedSlots,
  unavailableSlots,
  value,
  onChange,
}: {
  title: string;
  Icon: typeof Sun;
  slots: string[];
  dayISO: string;
  bookedSlots: string[];
  unavailableSlots: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-on-surface-variant">
        <Icon className="w-4 h-4" />
        <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {slots.map((slot) => {
          const isBooked = bookedSlots.includes(slot);
          const isUnavailable = unavailableSlots.includes(slot);
          const isPast = isSlotPast(dayISO, slot);
          const disabled = isUnavailable || isBooked || isPast;
          const active = value === slot;
          if (disabled) {
            // Label priority: Past > Booked > Unavailable (outside hours / on break)
            const label = isPast ? "Past" : isBooked ? "Booked" : "Unavailable";
            return (
              <button
                key={slot}
                type="button"
                disabled
                className="py-3 px-2 rounded-xl bg-surface-container-lowest text-on-surface-variant/50 ring-1 ring-outline-variant/20 flex flex-col items-center justify-center cursor-not-allowed relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(120,120,120,0.08)_10px,rgba(120,120,120,0.08)_20px)]" />
                <span className="font-medium text-sm relative z-10 line-through">{slot}</span>
                <span className="text-[10px] mt-0.5 relative z-10">{label}</span>
              </button>
            );
          }
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onChange(slot)}
              className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center transition ${
                active
                  ? "bg-primary text-on-primary-fixed ring-2 ring-primary shadow-emerald scale-[1.02]"
                  : "bg-surface-container ring-1 ring-outline-variant/30 hover:bg-surface-container-highest hover:scale-[1.02]"
              }`}
            >
              <span className="font-medium text-sm">{slot}</span>
              {active && <span className="text-[10px] mt-0.5 font-semibold">Selected</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Unused export kept for legacy; Moon icon imported but not needed.
void Moon;
