import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { PremiumEnquiryButton } from "@/components/pricing/PremiumEnquiryButton";
import { ContactSupportButton } from "@/components/support/ContactSupportButton";

export const metadata = {
  title: "Pricing — Clinica",
  description:
    "Free for 30 days or 50 appointments. Premium €12/month — unlimited everything.",
};

export const dynamic = "force-dynamic";

const FAQ: [string, string][] = [
  [
    "What happens when my free trial ends?",
    "You'll see a gentle banner in the dashboard once you pass 40 appointments. Existing bookings stay — new ones pause until you upgrade.",
  ],
  [
    "Can I cancel Premium at any time?",
    "Yes. Your plan stays active until the end of the billing period. No long-term contracts.",
  ],
  [
    "Is there a mobile app?",
    "Clinica works on any device via the web. A native app is on the 2026 roadmap.",
  ],
  [
    "Do you support Arabic and French?",
    "Yes — the patient and clinic interfaces both support Arabic (RTL), French, and English.",
  ],
];

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
  let ownerPhone: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .maybeSingle();
    ownerName = profile?.full_name ?? null;
    ownerEmail = profile?.email ?? user.email ?? null;
    ownerPhone = profile?.phone ?? null;
  }

  const freeHref = user
    ? "/onboarding/clinic?plan=free"
    : "/signup?next=/pricing%3Fonboarding%3D1";

  return (
    <div>
      <PublicHeader />

      {/* Hero */}
      <section
        className="resp-page-pad resp-page-pad-y-sm"
        style={{
          padding: "80px 32px 60px",
          maxWidth: 1100,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div className="t-eyebrow">Pricing</div>
        <h1 className="t-h1 resp-h1" style={{ fontSize: 48, marginTop: 12 }}>
          {isOnboarding
            ? "Pick a plan to finish setting up your clinic."
            : "Simple pricing for every clinic."}
        </h1>
        <p
          className="t-body"
          style={{ maxWidth: 580, margin: "16px auto 0", fontSize: 16 }}
        >
          Free to try. Fair when you grow. One plan, everything included.
        </p>
      </section>

      {/* Cards */}
      <section
        className="resp-page-pad"
        style={{ padding: "0 32px 60px", maxWidth: 900, margin: "0 auto" }}
      >
        <div
          className="resp-stack-2"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        >
          {/* Free trial */}
          <PricingCardFull
            tier="Free trial"
            price="€0"
            sub="for 30 days"
            note="or 50 appointments — whichever comes first"
            features={[
              "All Premium features",
              "Up to 3 doctors",
              "Patient booking link",
              "Unlimited patients",
              "Email support",
            ]}
            ctaSlot={
              <Link
                href={freeHref}
                className="btn secondary"
                style={{ width: "100%", padding: "12px 16px" }}
              >
                {isOnboarding ? "Continue with free trial" : "Start free trial"}
              </Link>
            }
          />

          {/* Premium */}
          <PricingCardFull
            tier="Premium"
            price="€12"
            sub="/ month"
            altPrice="€100/year · ~3000 DA / 25000 DA"
            features={[
              "Unlimited appointments",
              "Unlimited doctors",
              "Priority in patient search",
              "SMS reminders",
              "Patient history exports",
              "Dedicated support",
              "Clinic verification badge",
            ]}
            highlighted
            ctaSlot={
              <PremiumEnquiryButton
                ownerName={ownerName}
                ownerEmail={ownerEmail}
                ownerPhone={ownerPhone}
                label={isOnboarding ? "Go Premium" : "Go premium"}
              />
            }
          />
        </div>
      </section>

      {/* Need help / Contact support */}
      <section
        className="resp-page-pad"
        style={{
          padding: "0 32px 32px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          className="card"
          style={{
            padding: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Have a question?</div>
            <p className="t-small" style={{ marginTop: 4, lineHeight: 1.5 }}>
              We answer support emails within one business day.
            </p>
          </div>
          <ContactSupportButton
            userName={ownerName}
            email={ownerEmail}
            phone={ownerPhone}
            variant="secondary"
          />
        </div>
      </section>

      {/* FAQ */}
      <section
        className="resp-page-pad"
        style={{ padding: "40px 32px 100px", maxWidth: 900, margin: "0 auto" }}
      >
        <h2 className="t-h3" style={{ textAlign: "center", marginBottom: 32 }}>
          Frequently asked
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQ.map(([q, a]) => (
            <PricingFAQ key={q} q={q} a={a} />
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function PricingCardFull({
  tier,
  price,
  sub,
  note,
  altPrice,
  features,
  ctaSlot,
  highlighted,
}: {
  tier: string;
  price: string;
  sub: string;
  note?: string;
  altPrice?: string;
  features: string[];
  ctaSlot: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 36,
        textAlign: "left",
        border: highlighted
          ? "1.5px solid var(--primary)"
          : "1px solid var(--outline-variant)",
        boxShadow: highlighted
          ? "0 8px 32px -12px var(--primary-tint)"
          : "var(--elev-1)",
        position: "relative",
      }}
    >
      {highlighted && (
        <div
          style={{
            position: "absolute",
            top: -11,
            left: 24,
            background: "var(--primary)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          POPULAR
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
        {tier}
      </div>
      <div
        style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 6 }}
      >
        <span
          style={{
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {price}
        </span>
        <span style={{ color: "var(--text-subtle)", fontSize: 16 }}>{sub}</span>
      </div>
      {note && (
        <div className="t-small" style={{ marginTop: 4 }}>
          {note}
        </div>
      )}
      {altPrice && (
        <div className="t-small" style={{ marginTop: 4 }}>
          {altPrice}
        </div>
      )}
      <hr className="sep" style={{ margin: "24px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map((f) => (
          <div
            key={f}
            style={{ display: "flex", gap: 10, fontSize: 14 }}
          >
            <Check
              size={16}
              strokeWidth={2}
              style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }}
            />
            {f}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>{ctaSlot}</div>
    </div>
  );
}
