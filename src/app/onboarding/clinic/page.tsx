import { requireUserForOnboarding } from "./actions";
import { ClinicSetupForm } from "@/components/onboarding/ClinicSetupForm";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export const metadata = {
  title: "Set up your clinic — MedDiscover",
};

export const dynamic = "force-dynamic";

/**
 * Clinic setup step of the owner onboarding flow.
 *
 * Flow:   /pricing  →  here  →  /doctor (or /receptionist)
 *
 * The server action inserts the clinic row with `status='pending'`.
 * Admins approve manually from the DB today; a dashboard for that
 * is out of scope for this step.
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
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-10 pb-16">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Step 2 of 2
          </p>
          <h1 className="mt-2 font-headline text-3xl sm:text-4xl font-semibold tracking-tight text-on-surface">
            Tell us about your clinic.
          </h1>
          <p className="mt-3 text-on-surface-variant">
            We manually verify new clinics before they appear in public
            search. Phone and address help us confirm you&apos;re a real
            practice — we never share them with patients without your
            permission.
          </p>
        </div>

        <ClinicSetupForm plan={plan} />
      </main>

      <PublicFooter />
    </div>
  );
}
