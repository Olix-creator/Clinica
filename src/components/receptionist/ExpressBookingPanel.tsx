"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TIME_SLOTS } from "@/lib/appointments/slots";
import type { PatientSearchHit } from "@/lib/data/appointments";
import { expressBookAction } from "@/app/(dashboard)/receptionist/actions";
import PatientSearchCombobox from "./PatientSearchCombobox";

type DoctorOption = {
  id: string;
  name: string | null;
  specialty: string | null;
  clinic_id: string;
  profile: { full_name: string | null; email: string | null } | null;
};

function doctorLabel(d: DoctorOption): string {
  return d.name ?? d.profile?.full_name ?? d.profile?.email ?? "Doctor";
}

/**
 * Receptionist Express Booking — a compact, one-line flow to get a patient
 * on a doctor's schedule with minimal fields. Everything is client-side
 * except the final insert which runs through `expressBookAction`.
 */
export default function ExpressBookingPanel() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [patient, setPatient] = useState<PatientSearchHit | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState("");
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  // Load every doctor the receptionist can see. RLS on `doctors` is
  // read-all for authenticated users, so this returns the full roster.
  useEffect(() => {
    let cancelled = false;
    setLoadingDoctors(true);
    const supabase = createClient();
    supabase
      .from("doctors")
      .select(
        "id, name, specialty, clinic_id, profile:profiles!doctors_profile_id_fkey(full_name, email)",
      )
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error("Could not load doctors");
        setDoctors(((data ?? []) as unknown) as DoctorOption[]);
        setLoadingDoctors(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh booked slots whenever doctor/day changes.
  useEffect(() => {
    if (!doctorId || !day) {
      setBooked(new Set());
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .rpc("get_booked_slots", { p_doctor_id: doctorId, p_day: day })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setBooked(new Set());
        } else {
          setBooked(new Set(((data ?? []) as string[]).filter(Boolean)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, day]);

  const minDay = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const disabled = !patient || !doctorId || !day || !slot || pending;

  function reset() {
    setPatient(null);
    setDoctorId("");
    setSlot("");
    setDay(new Date().toISOString().slice(0, 10));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patient) {
      toast.error("Pick a patient");
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await expressBookAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Appointment booked");
      reset();
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] bg-surface-container-low p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Zap className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-lg font-bold font-headline text-on-surface">Express Booking</h3>
          <p className="text-xs text-on-surface-variant">
            Find a patient, pick a doctor &amp; slot, and book in one step.
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start"
      >
        <div className="space-y-1.5 xl:col-span-2">
          <label className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant ml-1">
            Patient
          </label>
          <PatientSearchCombobox
            selected={patient}
            onSelect={setPatient}
            disabled={pending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant ml-1">
            Doctor
          </label>
          <select
            name="doctorId"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={loadingDoctors || pending}
            className="w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition disabled:opacity-60 [color-scheme:light]"
          >
            <option value="">
              {loadingDoctors ? "Loading…" : "Select doctor…"}
            </option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {doctorLabel(d)}
                {d.specialty ? ` — ${d.specialty}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant ml-1">
            Date
          </label>
          <input
            type="date"
            name="appointmentDate"
            value={day}
            min={minDay}
            onChange={(e) => setDay(e.target.value)}
            disabled={pending}
            className="w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition [color-scheme:light]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant ml-1">
            Time
          </label>
          <select
            name="timeSlot"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={!doctorId || pending}
            className="w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition disabled:opacity-60 [color-scheme:light]"
          >
            <option value="">Select time…</option>
            {TIME_SLOTS.map((s) => (
              <option key={s} value={s} disabled={booked.has(s)}>
                {s}
                {booked.has(s) ? " — booked" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 xl:col-span-5 flex justify-end">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold text-sm shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {pending ? "Booking…" : "Book Now"}
          </button>
        </div>
      </form>
    </section>
  );
}
