import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDoctorPatientRoster } from "@/lib/data/patient-stats";
import { getDoctorByProfile } from "@/lib/data/doctors";
import { DashTopbar } from "@/components/layout/DashTopbar";
import { PatientsTable } from "@/components/patients/PatientsTable";

export const dynamic = "force-dynamic";

/**
 * Patients page — mirrors `.design-handoff/pages/dashboard-rest.jsx → PatientsPage`.
 *
 *   DashTopbar (title + count + "Add patient" action)
 *   Card containing search + filter row, then a full-width data table:
 *   Patient · Age/Gender · Phone · Last visit · Visits · Tag · ›
 *
 * Rows are clickable — they open `/patients/[id]` for the detail view.
 */
export default async function PatientsPage() {
  const profile = await requireRole("doctor");
  const [doctor, patients] = await Promise.all([
    getDoctorByProfile(profile.id),
    getDoctorPatientRoster(),
  ]);

  return (
    <>
      <DashTopbar
        title="Patients"
        subtitle={`${patients.length} ${patients.length === 1 ? "patient" : "patients"}`}
        actions={
          <button className="btn primary" type="button" disabled>
            <Plus size={15} /> Add patient
          </button>
        }
      />
      <div className="resp-page-pad" style={{ padding: "24px 32px 40px" }}>
        {!doctor ? (
          <EmptyAttachment />
        ) : (
          <PatientsTable patients={patients} />
        )}
      </div>
    </>
  );
}

function EmptyAttachment() {
  return (
    <div
      className="card"
      style={{
        padding: 60,
        textAlign: "center",
        color: "var(--text-muted)",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--on-surface)" }}>
        You&apos;re not attached to a clinic yet
      </div>
      <p className="t-body" style={{ maxWidth: 360, margin: "8px auto 0" }}>
        Ask an owner or receptionist to add you, then your patient roster
        will appear here.
      </p>
    </div>
  );
}
