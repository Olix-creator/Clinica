"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { addAppointmentAction } from "@/app/(dashboard)/receptionist/actions";

type Clinic = { id: string; name: string };
type Doctor = {
  id: string;
  specialty: string | null;
  profile: { full_name: string | null; email: string | null } | null;
};

const INPUT =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-400";

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
      <Button
        onClick={() => setOpen(true)}
        disabled={clinics.length === 0}
        title={clinics.length === 0 ? "Create a clinic first" : undefined}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add appointment
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add appointment">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
                  {d.profile?.full_name ?? d.profile?.email ?? "Unnamed doctor"}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding…
                </span>
              ) : (
                "Add appointment"
              )}
            </Button>
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
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}
