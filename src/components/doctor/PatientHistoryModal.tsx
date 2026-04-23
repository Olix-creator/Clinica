"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Calendar, Stethoscope, Building2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { AppointmentWithRelations } from "@/lib/data/appointments";
import {
  loadPatientHistoryAction,
  type PatientHistoryResult,
} from "@/app/(dashboard)/doctor/actions";

type Props = {
  patientId: string;
  patientName: string;
  currentAppointmentId?: string;
  trigger: React.ReactNode;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso: string, slot: string | null): string {
  if (slot) return slot;
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Patient history modal — opens from the doctor's dashboard when a doctor
 * taps a patient name. Fetches every appointment the caller is allowed to
 * see for that patient (RLS handles access control), ordered newest first.
 */
export default function PatientHistoryModal({
  patientId,
  patientName,
  currentAppointmentId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AppointmentWithRelations[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadPatientHistoryAction(patientId).then((res: PatientHistoryResult) => {
      if (cancelled) return;
      if (res.ok) {
        setHistory(res.history);
      } else {
        setError(res.error);
        setHistory([]);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, patientId]);

  // Past visits only — exclude the current appointment and anything in the future.
  const now = Date.now();
  const past = history.filter(
    (a) =>
      a.id !== currentAppointmentId &&
      new Date(a.appointment_date).getTime() < now,
  );

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="cursor-pointer"
      >
        {trigger}
      </span>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Patient history — ${patientName}`}
        description="Every visit you're allowed to see, newest first."
        size="lg"
      >
        <div className="space-y-3">
          {loading && (
            <div className="py-10 flex items-center justify-center text-on-surface-variant">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl bg-error-container/30 border border-error/30 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {!loading && !error && past.length === 0 && (
            <div className="rounded-2xl bg-surface-container-low px-5 py-10 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <History className="w-6 h-6 opacity-60" />
              <p className="text-sm">No previous visits on file.</p>
            </div>
          )}

          {!loading && !error && past.length > 0 && (
            <ul className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {past.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                        <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{fmtDate(a.appointment_date)}</span>
                        <span className="text-on-surface-variant font-normal">
                          · {fmtTime(a.appointment_date, a.time_slot)}
                        </span>
                      </div>
                      {a.doctor && (
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Stethoscope className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {a.doctor.name ??
                              a.doctor.profile?.full_name ??
                              a.doctor.profile?.email ??
                              "Doctor"}
                            {a.doctor.specialty ? ` · ${a.doctor.specialty}` : ""}
                          </span>
                        </div>
                      )}
                      {a.clinic && (
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{a.clinic.name}</span>
                        </div>
                      )}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
