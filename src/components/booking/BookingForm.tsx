"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { BookAppointmentResult } from "@/app/(dashboard)/booking/actions";

type Clinic = { id: string; name: string };
type Doctor = {
  id: string;
  specialty: string | null;
  profile: { full_name: string | null; email: string | null } | null;
};

const SELECT_CLS =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-400";

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
  const [clinicId, setClinicId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
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
        if (error) {
          toast.error("Could not load doctors");
          setDoctors([]);
        } else {
          setDoctors((data ?? []) as unknown as Doctor[]);
        }
        setDoctorId("");
        setLoadingDoctors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  const disabled = !clinicId || !doctorId || !appointmentDate || pending;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) {
        toast.success("Appointment booked");
        router.push("/patient");
        router.refresh();
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="clinicId" className="text-sm font-medium text-gray-700">
          Clinic
        </label>
        <select
          id="clinicId"
          name="clinicId"
          value={clinicId}
          onChange={(e) => setClinicId(e.target.value)}
          className={SELECT_CLS}
          disabled={pending}
          required
        >
          <option value="">Select a clinic…</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="doctorId" className="text-sm font-medium text-gray-700">
          Doctor
        </label>
        <select
          id="doctorId"
          name="doctorId"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          className={SELECT_CLS}
          disabled={!clinicId || loadingDoctors || pending}
          required
        >
          <option value="">
            {!clinicId
              ? "Pick a clinic first"
              : loadingDoctors
                ? "Loading…"
                : doctors.length === 0
                  ? "No doctors at this clinic"
                  : "Select a doctor…"}
          </option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.profile?.full_name ?? d.profile?.email ?? "Unnamed doctor"}
              {d.specialty ? ` — ${d.specialty}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700">
          Date & time
        </label>
        <input
          id="appointmentDate"
          name="appointmentDate"
          type="datetime-local"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          min={minLocalDateTime()}
          className={SELECT_CLS}
          disabled={pending}
          required
        />
      </div>

      <Button type="submit" disabled={disabled} className="w-full">
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Booking…
          </span>
        ) : (
          "Book appointment"
        )}
      </Button>
    </form>
  );
}
