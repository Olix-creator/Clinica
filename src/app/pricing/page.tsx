import Link from "next/link";
import {
  ArrowRight,
  Check,
  Crown,
  Mail,
  Sparkles,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PremiumEnquiryButton } from "@/components/pricing/PremiumEnquiryButton";

export const metadata = {
  title: "Pricing — MedDiscover",
  description:
    "Start with a 30-day free trial or go Premium for €12/month. Simple, clinic-friendly pricing.",
};

export const dynamic = "force-dynamic";

/**
 * Public pricing page.
 *
 * The page has two jobs:
 *   1. Show the two plans so anyone researching the product can compare.
 *   2. Act as a checkpoint in the clinic onboarding flow —
 *      "Create Clinic" on the dashboard links here with `?onboarding=1`,
 *      which swaps the Free-tier CTA from "Start free trial" (generic)
 *      to "Continue with Free Trial" (proceeds to /onboarding/clinic).
 *
 * We don't charge for Premium today — Part 4 of the spec says premium
 * requests are captured via a prefilled mailto until real billing lands.
 * `PremiumEnquiryButton` handles that client-side so the email body can
 * include the clinic owner's name / email when they're signed in.
 */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const sp = await searchParams;
  const isOnboarding = sp.onboarding === "1";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let ownerName: string | null = null;
  let ownerEmail: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    ownerName = profile?.full_name ?? null;
    ownerEmail = profile?.email ?? user.email ?? null;
  }

  const freeHref = isOnboarding
    ? "/onboarding/clinic?plan=free"
    : user
      ? "/onboarding/clinic?plan=free"
      : "/signup?next=/pricing%3Fonboarding%3D1";

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-10 pb-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-highest text-[11px] tracking-[0.18em] uppercase text-on-surface-variant mb-6">
            <Sparkles className="w-3 h-3 text-primary" />
            Pricing
          </span>
          <h1 className="font-headline text-4xl sm:text-5xl font-semibold tracking-tight text-on-surface">
            {isOnboarding
              ? "Pick a plan to finish setting up your clinic."
              : "Honest pricing. Built for clinics."}
          </h1>
          <p className="mt-4 text-on-surface-variant text-base sm:text-lg">
            Every clinic starts on a 30-day free trial. Go Premium anytime —
            no seat counting, no surprise charges.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free Trial */}
          <div className="relative rounded-[2rem] bg-surface-container-lowest ring-1 ring-outline-variant/40 p-7 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Star className="w-4 h-4 text-primary" />
              </span>
              <div>
                <h2 className="font-headline text-xl font-semibold text-on-surface">
                  Free trial
                </h2>
                <p className="text-xs text-on-surface-variant">
                  For clinics getting started.
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-headline text-5xl font-semibold text-on-surface">
                €0
              </span>
              <span className="text-on-surface-variant text-sm">
                /for 30 days
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mb-6">
              Or up to 50 appointments this month — whichever comes first.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Full access to clinic dashboard",
                "Unlimited doctors & staff invites",
                "50 appointments per calendar month",
                "Public clinic page + search listing",
                "30-day trial window",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-on-surface-variant">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={freeHref}
              className="mt-auto w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-surface-container-highest text-on-surface text-sm font-semibold hover:bg-surface-bright transition"
            >
              {isOnboarding
                ? "Continue with free trial"
                : "Start free trial"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-[2rem] bg-gradient-to-br from-surface-container-high to-surface-container ring-2 ring-primary shadow-emerald p-7 sm:p-8 flex flex-col">
            <div className="absolute -top-3 left-7 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-on-primary text-[11px] font-semibold uppercase tracking-[0.14em]">
              <Crown className="w-3 h-3" />
              Recommended
            </div>

            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-primary" />
              </span>
              <div>
                <h2 className="font-headline text-xl font-semibold text-on-surface">
                  Premium
                </h2>
                <p className="text-xs text-on-surface-variant">
                  For clinics that are ready to grow.
                </p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-headline text-5xl font-semibold text-on-surface">
                €12
              </span>
              <span className="text-on-surface-variant text-sm">/month</span>
            </div>
            <p className="text-xs text-on-surface-variant mb-6">
              Or <span className="font-semibold text-on-surface">€100/year</span>
              {" "}— save €44.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Everything in Free Trial",
                "Unlimited monthly appointments",
                "Priority placement in search (coming soon)",
                "Premium badge on your public clinic page",
                "Priority email support",
                "Cancel anytime",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-on-surface-variant">{f}</span>
                </li>
              ))}
            </ul>

            <PremiumEnquiryButton
              ownerName={ownerName}
              ownerEmail={ownerEmail}
              label={isOnboarding ? "Go Premium" : "Upgrade to Premium"}
            />
            <p className="text-[11px] text-on-surface-variant mt-3 text-center">
              We&apos;ll reply within one business day with payment instructions.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="font-headline text-2xl font-semibold text-on-surface text-center mb-6">
            Common questions
          </h3>
          <div className="space-y-3">
            {[
              {
                q: "What happens when my trial ends?",
                a: "Your public listing stays up, but the clinic stops accepting new bookings until you upgrade. Your historical data is never deleted.",
              },
              {
                q: "What counts as a booking?",
                a: "Any appointment created in the current calendar month — pending, confirmed, or done. Cancelled bookings still count until we can verify them.",
              },
              {
                q: "How do I pay for Premium?",
                a: "Today we invoice by email for the first month, then set up a recurring plan. No card required to start the trial.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/30 p-5 open:shadow-sm"
              >
                <summary className="cursor-pointer text-sm font-semibold text-on-surface flex items-center justify-between">
                  {item.q}
                  <ArrowRight className="w-4 h-4 text-on-surface-variant group-open:rotate-90 transition" />
                </summary>
                <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/30 p-5 flex items-start gap-3">
            <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-on-surface-variant">
              Questions we haven&apos;t answered?{" "}
              <a
                href="mailto:hello@meddiscover.app"
                className="text-primary font-semibold hover:underline"
              >
                hello@meddiscover.app
              </a>
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
