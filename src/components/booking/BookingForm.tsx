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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { BookAppointmentResult } from "@/app/(dashboard)/booking/actions";

type Clinic = { id: string; name: string };
type Doctor = {
  id: string;
  specialty: string | null;
  profile: { full_name: string | null; email: string | null } | null;
};

const STEPS = [
  { n: 1, label: "Clinic", icon: Building2 },
  { n: 2, label: "Doctor", icon: Stethoscope },
  { n: 3, label: "Time", icon: CalendarClock },
  { n: 4, label: "Confirm", icon: CheckCircle2 },
];

function minLocalDateTime() {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BookingForm({
  clinics,
  action,
}: {
  clinics: Clinic[];
  action: (formData: FormData) => Promise<BookAppointmentResult>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clinicId, setClinicId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      .select("id, specialty, profile:profiles!doctors_profile_id_fkey(full_name, email)")
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

  const selectedClinic = useMemo(() => clinics.find((c) => c.id === clinicId), [clinics, clinicId]);
  const selectedDoctor = useMemo(() => doctors.find((d) => d.id === doctorId), [doctors, doctorId]);

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("clinicId", clinicId);
    fd.set("doctorId", doctorId);
    fd.set("appointmentDate", appointmentDate);
    startTransition(async () => {
      const res = await action(fd);
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
                const name = d.profile?.full_name ?? d.profile?.email ?? "Unnamed doctor";
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

      {/* Step 3: Date & time */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-1">Step 3</p>
            <h2 className="font-headline text-2xl font-semibold">Pick a time.</h2>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-6">
            <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3 block">
              Date & time
            </label>
            <input
              type="datetime-local"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={minLocalDateTime()}
              className="w-full rounded-xl bg-surface-container-highest border-0 px-4 py-4 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition [color-scheme:dark]"
              required
            />
            <p className="text-xs text-on-surface-variant mt-3">
              Only future times are allowed. You&apos;ll be reminded 24 hours before.
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
                value: selectedDoctor?.profile?.full_name ?? selectedDoctor?.profile?.email,
                sub: selectedDoctor?.specialty,
                icon: Stethoscope,
              },
              {
                label: "When",
                value: appointmentDate
                  ? new Date(appointmentDate).toLocaleString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—",
                icon: CalendarClock,
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
              (step === 3 && !appointmentDate)
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
