import Link from "next/link";
import { requireUserForOnboarding } from "./actions";
import { ClinicSetupForm } from "@/components/onboarding/ClinicSetupForm";

export const metadata = {
  title: "Set up your clinic — Clinica",
};

export const dynamic = "force-dynamic";

/**
 * Clinic setup — 3-step onboarding wizard, matching the handoff design.
 * Steps: choose plan → clinic info → review/submit.
 *
 * The actual progress + form logic lives in `ClinicSetupForm`
 * (client component) since it's stateful. This server page just
 * provides the page chrome (top bar + step counter) and the
 * default plan from the URL.
 */
export default async function ClinicOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  await requireUserForOnboarding();
  const sp = await searchParams;
  const plan = sp.plan === "premium" ? "premium" : "free";

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
        <Link href="/" className="btn ghost sm">
          Save &amp; exit
        </Link>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 32px" }}>
        <ClinicSetupForm plan={plan} />
      </div>
    </div>
  );
}
