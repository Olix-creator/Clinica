import Link from "next/link";
import { requireDoctorForOnboarding } from "./actions";
import { DoctorProfileSetupForm } from "@/components/onboarding/DoctorProfileSetupForm";
import { createClient } from "@/lib/supabase/server";
import { getDoctorByProfile } from "@/lib/data/doctors";

export const metadata = {
  title: "Complete your doctor profile — Clinica",
};

export const dynamic = "force-dynamic";

/**
 * Doctor profile completion gate.
 *
 * Doctors land here on first login (and any subsequent login that
 * leaves the profile incomplete) before they can access the
 * dashboard. The dashboard layout enforces the gate; this page
 * collects the missing fields.
 */
export default async function DoctorOnboardingPage() {
  await requireDoctorForOnboarding();

  // Pre-fill from any existing doctor row + profile so partial
  // completion still feels continuous.
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  const doctor = await getDoctorByProfile(userId);

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <div
        style={{
          borderBottom: "1px solid var(--outline-variant)",
          background: "var(--surface-bright)",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--on-surface)",
            textDecoration: "none",
          }}
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: "var(--primary)" }}
            aria-hidden
          >
            <path d="M12 2a7 7 0 0 0-7 7v6.2a4.8 4.8 0 1 0 2.4 0V9a4.6 4.6 0 1 1 9.2 0v.2a3.2 3.2 0 1 0 1.6 0V9a7 7 0 0 0-6.2-7Z" />
            <circle cx="6.2" cy="18.8" r="2" />
            <circle cx="18.2" cy="10.8" r="1.6" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Clinica</span>
        </Link>
      </div>

      <div
        className="resp-page-pad"
        style={{ maxWidth: 720, margin: "0 auto", padding: "48px 32px 64px" }}
      >
        <div style={{ marginBottom: 24 }}>
          <p className="t-eyebrow">Profile setup</p>
          <h1 className="t-h2 resp-h2" style={{ margin: "8px 0 0" }}>
            Complete your doctor profile
          </h1>
          <p className="t-body" style={{ margin: "8px 0 0" }}>
            Patients see this on the booking page and on every clinic where
            you practice. You only need to do this once.
          </p>
        </div>

        <DoctorProfileSetupForm
          initialFullName={profile?.full_name ?? ""}
          initialSpecialty={doctor?.specialty ?? ""}
          initialDiploma={doctor?.diploma ?? ""}
          initialSinceYear={
            doctor?.since_year != null ? String(doctor.since_year) : ""
          }
          initialDescription={doctor?.description ?? ""}
          hasDoctorRow={Boolean(doctor)}
        />
      </div>
    </div>
  );
}
