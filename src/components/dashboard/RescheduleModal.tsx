"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { TIME_SLOTS } from "@/lib/appointments/slots";

type ActionResult = { ok: true } | { ok: false; error: string };

type DoctorLite = {
  id: string;
  name: string | null;
  specialty: string | null;
  profile: { full_name: string | null; email: string | null } | null;
};

export default function RescheduleModal({
  id,
  clinicId,
  currentDoctorId,
  currentDay,
  currentSlot,
  allowDoctorChange = true,
  action,
  trigger,
}: {
  id: string;
  clinicId: string;
  currentDoctorId: string;
  currentDay: string; // YYYY-MM-DD
  currentSlot: string | null; // HH:MM
  allowDoctorChange?: boolean;
  action: (formData: FormData) => Promise<ActionResult>;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState(currentDoctorId);
  const [day, setDay] = useState(currentDay);
  const [slot, setSlot] = useState<string>(currentSlot ?? "");
  const [doctors, setDoctors] = useState<DoctorLite[]>([]);
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pending, startTransition] = useTransition();

  // Load doctors for the clinic when we open (only if the UI allows switching).
  useEffect(() => {
    if (!open || !allowDoctorChange) return;
    let cancelled = false;
    setLoadingDoctors(true);
    const supabase = createClient();
    supabase
      .from("doctors")
      .select("id, name, specialty, profile:profiles!doctors_profile_id_fkey(full_name, email)")
      .eq("clinic_id", clinicId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error("Could not load doctors");
        setDoctors(((data ?? []) as unknown) as DoctorLite[]);
        setLoadingDoctors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clinicId, allowDoctorChange]);

  // Refresh booked slots whenever (doctor, day) changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingSlots(true);
    const supabase = createClient();
    supabase
      .rpc("get_booked_slots", { p_doctor_id: doctorId, p_day: day })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // Ignore — pre-flight will catch collisions server-side.
          setBooked(new Set());
        } else {
          setBooked(new Set(((data ?? []) as string[]).filter(Boolean)));
        }
        setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, doctorId, day]);

  // When the user opens, reset the form to the current values.
  useEffect(() => {
    if (open) {
      setDoctorId(currentDoctorId);
      setDay(currentDay);
      setSlot(currentSlot ?? "");
    }
  }, [open, currentDoctorId, currentDay, currentSlot]);

  const todayISO = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  function doctorLabel(d: DoctorLite): string {
    return d.name ?? d.profile?.full_name ?? d.profile?.email ?? "Doctor";
  }

  function submit() {
    if (!slot) {
      toast.error("Pick a time slot");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("appointmentDate", day);
      fd.set("timeSlot", slot);
      fd.set("doctorId", doctorId);
      const res = await action(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Appointment rescheduled");
      setOpen(false);
      router.refresh();
    });
  }

  const defaultTrigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-medium transition border border-outline-variant/15"
    >
      <CalendarClock className="w-3.5 h-3.5 text-primary" />
      Reschedule
    </button>
  );

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </span>
      ) : (
        defaultTrigger
      )}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Reschedule appointment"
        description="Change the date, time, or doctor."
      >
        <div className="space-y-4">
          {allowDoctorChange && (
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                Doctor
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                disabled={loadingDoctors || pending}
                className="w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition disabled:opacity-60 [color-scheme:dark]"
              >
                {doctors.length === 0 && <option value={doctorId}>Current doctor</option>}
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {doctorLabel(d)}
                    {d.specialty ? ` — ${d.specialty}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant ml-1">
              Date
            </label>
            <input
              type="date"
              value={day}
              min={todayISO}
              onChange={(e) => setDay(e.target.value)}
              disabled={pending}
              className="w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition [color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.18em] text-on-surface-variant ml-1">
              Time slot {loadingSlots && <span className="ml-2 text-on-surface-variant/60">loading…</span>}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {TIME_SLOTS.map((s) => {
                const isBooked =
                  booked.has(s) &&
                  !(s === currentSlot && doctorId === currentDoctorId && day === currentDay);
                const selected = s === slot;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => !isBooked && setSlot(s)}
                    disabled={isBooked || pending}
                    className={[
                      "py-2 rounded-xl text-sm font-medium transition border",
                      selected
                        ? "bg-primary text-on-primary-fixed border-primary shadow-emerald"
                        : isBooked
                          ? "bg-surface-container text-on-surface-variant/60 border-outline-variant/10 line-through cursor-not-allowed"
                          : "bg-surface-container-highest text-on-surface hover:bg-surface-bright border-outline-variant/15",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="px-5 py-3 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-medium text-sm transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending || !slot}
              className="px-5 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold text-sm shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
