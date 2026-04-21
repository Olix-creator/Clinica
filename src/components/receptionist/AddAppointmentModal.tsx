"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { addAppointmentAction } from "@/app/(dashboard)/receptionist/actions";

type Clinic = { id: string; name: string };
type Doctor = {
  id: string;
  name: string | null;
  specialty: string | null;
  profile: { full_name: string | null; email: string | null } | null;
};

function doctorLabel(d: Doctor): string {
  return d.name ?? d.profile?.full_name ?? d.profile?.email ?? "Unnamed doctor";
}

const INPUT =
  "w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary transition disabled:opacity-60 [color-scheme:dark]";

function minLocalDateTime() {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddAppointmentModal({ clinics }: { clinics: Clinic[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clinicId, setClinicId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      .select("id, name, specialty, profile:profiles!doctors_profile_id_fkey(full_name, email)")
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

  function reset() {
    setClinicId("");
    setDoctorId("");
    setDoctors([]);
    setError(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addAppointmentAction(fd);
      if (res.ok) {
        toast.success("Appointment added");
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={clinics.length === 0}
        title={clinics.length === 0 ? "Create a clinic first" : undefined}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-medium text-sm shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        Add appointment
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="New appointment"
        description="Book a visit on behalf of a patient."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-error-container/30 border border-error/30 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
          <Field label="Clinic" htmlFor="clinicId">
            <select
              id="clinicId"
              name="clinicId"
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className={INPUT}
              disabled={pending}
              required
            >
              <option value="">Select clinic…</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Doctor" htmlFor="doctorId">
            <select
              id="doctorId"
              name="doctorId"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className={INPUT}
              disabled={!clinicId || loadingDoctors || pending}
              required
            >
              <option value="">
                {!clinicId
                  ? "Pick a clinic first"
                  : loadingDoctors
                    ? "Loading…"
                    : doctors.length === 0
                      ? "No doctors in this clinic"
                      : "Select doctor…"}
              </option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {doctorLabel(d)}
                  {d.specialty ? ` — ${d.specialty}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Patient email" htmlFor="patientEmail">
            <input
              id="patientEmail"
              name="patientEmail"
              type="email"
              className={INPUT}
              placeholder="patient@example.com"
              disabled={pending}
              required
            />
          </Field>
          <Field label="Date & time" htmlFor="appointmentDate">
            <input
              id="appointmentDate"
              name="appointmentDate"
              type="datetime-local"
              min={minLocalDateTime()}
              className={INPUT}
              disabled={pending}
              required
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={pending}
              className="px-5 py-3 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-medium text-sm transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold text-sm shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {pending ? "Adding…" : "Add appointment"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs uppercase tracking-[0.18em] text-on-surface-variant ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}
