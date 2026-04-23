import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDoctorPatientRoster } from "@/lib/data/patient-stats";
import { getDoctorByProfile } from "@/lib/data/doctors";
import { PatientsList } from "@/components/patients/PatientsList";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Doctor-facing patient roster.
 *
 * Shows every patient the caller has seen or is scheduled to see, with
 * aggregated stats (last visit, total visits, upcoming count) and a
 * per-row "View history" trigger. Scope is RLS-enforced: receptionists
 * and owners don't land here (they use /receptionist for operational
 * views).
 */
export default async function PatientsPage() {
  const profile = await requireRole("doctor");
  const [doctor, patients] = await Promise.all([
    getDoctorByProfile(profile.id),
    getDoctorPatientRoster(),
  ]);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <Link
        href="/doctor"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to today
      </Link>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Roster</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Your patients
          </h1>
          <p className="text-on-surface-variant mt-2">
            {patients.length} {patients.length === 1 ? "patient" : "patients"} in
            your book · tap a name to see their full history.
          </p>
        </div>
      </header>

      {!doctor ? (
        <EmptyState
          icon={Users}
          title="You're not attached to a clinic yet"
          description="Ask an owner or receptionist to add you, then your patient roster will appear here."
        />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients yet"
          description="Once appointments are booked with you, your roster will populate automatically."
        />
      ) : (
        <PatientsList patients={patients} />
      )}
    </div>
  );
}
