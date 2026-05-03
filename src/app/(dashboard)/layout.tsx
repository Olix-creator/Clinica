import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { clinicMemberService } from "@/lib/services/clinicMemberService";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { createClient } from "@/lib/supabase/server";
import {
  getDoctorByProfile,
  isDoctorProfileComplete,
} from "@/lib/data/doctors";

/**
 * Dashboard chrome — Clinica handoff design.
 *
 * 240px fixed sidebar on the left, the page itself on the right.
 * The page content provides its own DashTopbar so the title +
 * subtitle stay tight to that page's data.
 *
 * On mobile we drop the sidebar and surface a compact branding bar
 * + the existing bottom nav, since the handoff design is desktop-first.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireProfile();

  // PART 3 spec: doctors with an incomplete profile must complete it
  // before reaching the dashboard. Patients + receptionists pass
  // through unchanged. Doctors WITHOUT a doctors row (newly signed up,
  // never attached to a clinic) also pass through — they need to see
  // the empty state on /doctor that explains how to get attached.
  if (profile.role === "doctor") {
    const doctor = await getDoctorByProfile(profile.id);
    if (doctor && !isDoctorProfileComplete(doctor)) {
      redirect("/onboarding/doctor");
    }
  }

  // Staff (doctor / receptionist) get a "home clinic" chip + usage card.
  let homeClinic: { name: string; plan: string; role: string } | null = null;
  let trial: { used: number; limit: number; planLabel: string } | null = null;
  if (profile.role !== "patient") {
    const clinics = await clinicMemberService.listClinicsForUser();
    if (clinics.length > 0) {
      const first = clinics[0];
      const sub = await subscriptionService.get(first.id);
      homeClinic = {
        name: first.name,
        plan: subscriptionService.label(sub?.plan ?? "free"),
        role: first.role,
      };

      // Pull the live free-tier counters off the clinics row.
      const supabase = await createClient();
      const { data: c } = await supabase
        .from("clinics")
        .select("plan_type, monthly_appointments_count")
        .eq("id", first.id)
        .maybeSingle();
      if (c) {
        trial = {
          used: c.monthly_appointments_count ?? 0,
          limit: c.plan_type === "premium" ? 999 : 50,
          planLabel: c.plan_type === "premium" ? "Premium" : "Free trial",
        };
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar
        role={profile.role}
        fullName={profile.full_name}
        email={profile.email}
        homeClinic={homeClinic}
        trial={trial}
      />

      {/* Mobile chrome */}
      <div
        className="lg:hidden"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          padding: "10px 16px",
          background: "var(--surface-bright)",
          borderBottom: "1px solid var(--outline-variant)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--on-surface)",
            textDecoration: "none",
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: "var(--primary)" }}
            aria-hidden
          >
            <path d="M12 2a7 7 0 0 0-7 7v6.2a4.8 4.8 0 1 0 2.4 0V9a4.6 4.6 0 1 1 9.2 0v.2a3.2 3.2 0 1 0 1.6 0V9a7 7 0 0 0-6.2-7Z" />
            <circle cx="6.2" cy="18.8" r="2" />
            <circle cx="18.2" cy="10.8" r="1.6" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Clinica</span>
        </Link>
      </div>

      <div className="lg:pl-[240px]">
        <main style={{ minHeight: "calc(100vh - 56px)" }}>{children}</main>
      </div>

      <MobileBottomNav role={profile.role} />
    </div>
  );
}
