import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  Users,
  Bell,
  Search,
  LayoutGrid,
  X,
  Check,
  Stethoscope,
  Activity,
  Building2,
  Mail,
} from "lucide-react";

/**
 * Public landing page — recreated pixel-for-pixel from the Clinica
 * design handoff (clinica/project/pages/landing.jsx).
 *
 * Sections (top → bottom):
 *   1. TopNav
 *   2. Hero with floating dashboard + booking card
 *   3. Trust strip (city pill list)
 *   4. Problem / Solution (before / with-Clinica)
 *   5. For-who feature cards (patients vs clinics)
 *   6. How-it-works (4 steps)
 *   7. Pricing peek (2 cards)
 *   8. Final blue CTA
 *   9. Footer
 *
 * The page uses the global utility classes added to globals.css
 * (`btn`, `card`, `chip`, `t-h1`/`h2`/`h3`/`h4`, `t-eyebrow`, etc.)
 * so the markup mirrors the handoff JSX with minimal translation.
 */

const CITIES = ["Algiers", "Oran", "Constantine", "Annaba", "Blida"];

export default function LandingPage() {
  return (
    <div>
      <TopNav />
      <Hero />
      <TrustStrip />
      <ProblemSolution />
      <ForWho />
      <HowItWorks />
      <PricingPeek />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}

function ClinicaMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: "var(--primary)" }}
      aria-hidden
    >
      <path d="M12 2a7 7 0 0 0-7 7v6.2a4.8 4.8 0 1 0 2.4 0V9a4.6 4.6 0 1 1 9.2 0v.2a3.2 3.2 0 1 0 1.6 0V9a7 7 0 0 0-6.2-7Z" />
      <circle cx="6.2" cy="18.8" r="2" />
      <circle cx="18.2" cy="10.8" r="1.6" />
    </svg>
  );
}

function TopNav() {
  return (
    <div
      className="glass"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <div
        className="resp-page-pad"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
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
          <ClinicaMark />
          <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em" }}>
            Clinica
          </span>
        </Link>
        <nav style={{ display: "flex", gap: 26, flex: 1 }} className="hidden md:flex">
          <Link
            href="/search"
            style={{ color: "var(--text-muted)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}
          >
            Patients
          </Link>
          <Link
            href="/search"
            style={{ color: "var(--text-muted)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}
          >
            Clinics
          </Link>
          <Link
            href="/pricing"
            style={{ color: "var(--text-muted)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}
          >
            Pricing
          </Link>
        </nav>
        <div style={{ flex: 1 }} className="md:hidden" />
        <Link href="/login" className="btn ghost hidden md:inline-flex">
          Sign in
        </Link>
        <Link href="/search" className="btn secondary hidden md:inline-flex">
          Find a clinic
        </Link>
        <Link href="/pricing?onboarding=1" className="btn primary">
          <span className="hidden md:inline">Create clinic</span>
          <span className="md:hidden">Sign up</span> <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      className="resp-page-pad resp-page-pad-y-sm"
      style={{ padding: "80px 32px 40px", maxWidth: 1200, margin: "0 auto" }}
    >
      <div
        className="resp-stack-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 11px 5px 6px",
              background: "var(--primary-50)",
              border: "1px solid var(--primary-100)",
              borderRadius: 999,
              color: "var(--primary-600)",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 22,
            }}
          >
            <span
              style={{
                background: "var(--primary)",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              New
            </span>
            Availability sync across doctors is live
          </div>
          <h1
            className="t-h1 resp-h1"
            style={{ margin: 0, fontSize: 56, lineHeight: 1.05 }}
          >
            Manage your clinic smarter.
            <br />
            <span style={{ color: "var(--text-muted)" }}>Book appointments easily.</span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--text-muted)",
              marginTop: 22,
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            A modern platform for patients and clinics. Search nearby care, book in seconds,
            and let your team run the day from a single dashboard.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            {/* Booking always starts with picking a clinic — single
                unified flow, no standalone booking page. */}
            <Link href="/search" className="btn primary lg">
              Book appointment <ArrowRight size={16} />
            </Link>
            <Link href="/search" className="btn secondary lg">
              Find a clinic
            </Link>
            <Link href="/pricing?onboarding=1" className="btn ghost lg">
              I run a clinic
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: 28,
              marginTop: 40,
              color: "var(--text-subtle)",
              fontSize: 13,
              flexWrap: "wrap",
            }}
          >
            {[
              ["4.9", "Avg. clinic rating"],
              ["98%", "Visit attendance"],
              ["< 30s", "To book"],
            ].map(([n, l]) => (
              <div key={l}>
                <div
                  style={{
                    color: "var(--on-surface)",
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {n}
                </div>
                <div>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="resp-hide-mobile">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div style={{ position: "relative", aspectRatio: "1 / 1.02" }}>
      <div
        style={{
          position: "absolute",
          inset: "-40px -20px -20px -20px",
          background:
            "radial-gradient(circle at 70% 30%, var(--primary-tint), transparent 60%)",
          borderRadius: 40,
          zIndex: 0,
        }}
      />
      {/* Dashboard snippet */}
      <div
        className="card anim-slide"
        style={{
          position: "absolute",
          top: 12,
          right: 0,
          width: "88%",
          padding: 20,
          borderRadius: 18,
          boxShadow: "var(--elev-3)",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>Today · Fri, Apr 24</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
              11 appointments
            </div>
          </div>
          <Calendar size={18} style={{ color: "var(--primary)" }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginBottom: 18,
          }}
        >
          {[
            { n: "3", l: "Done" },
            { n: "1", l: "In progress" },
            { n: "7", l: "Pending" },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: "var(--bg)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 600 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>{s.l}</div>
            </div>
          ))}
        </div>
        {[
          { t: "10:15", n: "Sofiane Merabet", r: "BP review", s: "in-progress" as const },
          { t: "10:45", n: "Imane Djebbar", r: "Rash consult", s: "pending" as const },
          { t: "11:15", n: "Leila Zerouki", r: "First visit", s: "pending" as const },
        ].map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderTop: i ? "1px solid var(--outline-variant)" : "none",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontFamily: "ui-monospace, monospace",
                color: "var(--text-subtle)",
                width: 40,
              }}
            >
              {a.t}
            </div>
            <span
              className="avatar"
              style={{
                width: 28,
                height: 28,
                background: "#dbeafe",
                color: "#1d4ed8",
                fontSize: 11,
              }}
            >
              {a.n
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.n}</div>
              <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>{a.r}</div>
            </div>
            <StatusChip status={a.s} />
          </div>
        ))}
      </div>

      {/* Booking card */}
      <div
        className="card anim-slide"
        style={{
          position: "absolute",
          bottom: 12,
          left: 0,
          width: "66%",
          padding: 18,
          borderRadius: 16,
          boxShadow: "var(--elev-3)",
          zIndex: 2,
          animationDelay: ".12s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--primary-50)",
              color: "var(--primary-600)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Stethoscope size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Dr. Yasmine Nouri</div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>
              Pediatrics · Sunshine Pediatrics
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", marginBottom: 8 }}>
          Monday, Apr 27 · Available
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {["09:00", "09:30", "10:00", "10:30"].map((t, i) => (
            <div
              key={t}
              style={{
                padding: "7px 0",
                textAlign: "center",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                background: i === 2 ? "var(--primary)" : "var(--bg)",
                color: i === 2 ? "#fff" : "var(--on-surface)",
                border:
                  i === 2
                    ? "1px solid var(--primary)"
                    : "1px solid var(--outline-variant)",
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn primary"
          style={{ width: "100%", marginTop: 12, padding: "10px 12px" }}
        >
          Book appointment
        </button>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: "done" | "in-progress" | "pending" | "cancelled" }) {
  const map = {
    done: { label: "Done", cls: "success" },
    "in-progress": { label: "In progress", cls: "primary" },
    pending: { label: "Pending", cls: "warn" },
    cancelled: { label: "Cancelled", cls: "danger" },
  } as const;
  const s = map[status];
  return <span className={`chip dot ${s.cls}`}>{s.label}</span>;
}

function TrustStrip() {
  return (
    <div
      style={{
        borderTop: "1px solid var(--outline-variant)",
        borderBottom: "1px solid var(--outline-variant)",
        background: "var(--surface-bright)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          gap: 40,
          color: "var(--text-subtle)",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span>Trusted by clinics across</span>
        {CITIES.map((c, i) => (
          <span
            key={c}
            style={{
              fontWeight: 500,
              color: "var(--text-muted)",
              letterSpacing: "-0.01em",
            }}
          >
            {c}
            {i < CITIES.length - 1 && (
              <span style={{ marginLeft: 40, opacity: 0.3 }}>·</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProblemSolution() {
  return (
    <section className="resp-page-pad resp-page-pad-y-sm" style={{ padding: "100px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div className="t-eyebrow">The problem</div>
        <h2
          className="t-h2"
          style={{ marginTop: 10, maxWidth: 680, marginLeft: "auto", marginRight: "auto" }}
        >
          Scheduling shouldn&apos;t be the hardest part of care.
        </h2>
      </div>
      <div className="resp-stack-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="card" style={{ padding: 36, background: "var(--bg-muted)" }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              fontWeight: 600,
              color: "var(--danger)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Before
          </div>
          <h3 className="t-h3">Paper agendas. Missed calls. No-shows.</h3>
          <div
            style={{
              marginTop: 22,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {[
              "Double-booked slots and handwritten corrections",
              "Patients waiting on hold to reach reception",
              "No way to see which appointments are free next week",
              "Repeat visitors treated like first-time callers",
            ].map((l) => (
              <div
                key={l}
                style={{ display: "flex", gap: 10, color: "var(--text-muted)", fontSize: 14 }}
              >
                <X
                  size={16}
                  style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }}
                />
                {l}
              </div>
            ))}
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: 36,
            borderColor: "var(--primary-100)",
            background: "var(--primary-50)",
          }}
        >
          <div className="t-eyebrow" style={{ marginBottom: 12 }}>
            With Clinica
          </div>
          <h3 className="t-h3">One dashboard. One booking link. Zero chaos.</h3>
          <div
            style={{
              marginTop: 22,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {[
              "Doctors' availability syncs in real time",
              "Patients self-book — receptionists stay focused",
              "See the full day, week, or month at a glance",
              "Patient history, phone, and last visit — always one click away",
            ].map((l) => (
              <div
                key={l}
                style={{ display: "flex", gap: 10, color: "var(--on-surface)", fontSize: 14 }}
              >
                <Check
                  size={16}
                  strokeWidth={2}
                  style={{
                    color: "var(--primary-600)",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ForWho() {
  return (
    <section
      style={{ padding: "40px 32px 100px", maxWidth: 1200, margin: "0 auto" }}
    >
      <div className="resp-stack-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <FeatureCard
          badge="For patients"
          title="Find care in under 30 seconds."
          lead="Search by city and specialty, view clinics with real info, and book your slot — no phone calls needed."
          features={[
            { Ic: Search, t: "Search by city & specialty" },
            { Ic: Calendar, t: "See real-time availability" },
            { Ic: Bell, t: "Appointment reminders" },
          ]}
          cta="Try the patient experience"
          href="/search"
          previewLabel="patient search preview"
        />
        <FeatureCard
          badge="For clinics"
          title="Run your practice like a product."
          lead="Everything your front desk and doctors need — in one place. No installation, works on any device."
          features={[
            { Ic: LayoutGrid, t: "Daily dashboard & stats" },
            { Ic: Users, t: "Patient records & history" },
            { Ic: Clock, t: "Custom availability per doctor" },
          ]}
          cta="See the clinic dashboard"
          href="/dashboard"
          previewLabel="dashboard preview"
        />
      </div>
    </section>
  );
}

function FeatureCard({
  badge,
  title,
  lead,
  features,
  cta,
  href,
  previewLabel,
}: {
  badge: string;
  title: string;
  lead: string;
  features: { Ic: React.ComponentType<{ size?: number }>; t: string }[];
  cta: string;
  href: string;
  previewLabel: string;
}) {
  return (
    <div
      className="card"
      style={{ padding: 40, display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="chip primary">{badge}</span>
      </div>
      <h3 className="t-h2" style={{ fontSize: 28, margin: 0 }}>
        {title}
      </h3>
      <p className="t-body" style={{ margin: 0, maxWidth: 460 }}>
        {lead}
      </p>
      <div className="ph-stripe" style={{ height: 180 }}>
        <span style={{ opacity: 0.7 }}>{previewLabel}</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 4,
        }}
      >
        {features.map(({ Ic, t }) => (
          <div
            key={t}
            style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--primary-50)",
                color: "var(--primary-600)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Ic size={15} />
            </div>
            {t}
          </div>
        ))}
      </div>
      <Link
        href={href}
        className="btn secondary"
        style={{ alignSelf: "flex-start", marginTop: 4 }}
      >
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function HowItWorks() {
  const steps: { n: number; t: string; d: string; Ic: React.ComponentType<{ size?: number }> }[] = [
    { n: 1, t: "Create clinic", d: "Name, specialty, city, address, phone. Takes 2 minutes.", Ic: Building2 },
    { n: 2, t: "Set availability", d: "Each doctor defines their hours. Blocks and holidays supported.", Ic: Clock },
    { n: 3, t: "Patients book", d: "Share a link or appear in patient search. Bookings land on your dashboard.", Ic: Calendar },
    { n: 4, t: "Manage the day", d: "Mark done, reschedule, cancel. Patient history stays organized.", Ic: Activity },
  ];

  return (
    <section
      style={{
        padding: "100px 32px",
        background: "var(--surface-bright)",
        borderTop: "1px solid var(--outline-variant)",
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            marginBottom: 48,
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="t-eyebrow">How it works</div>
            <h2 className="t-h2" style={{ marginTop: 10, maxWidth: 640 }}>
              Four steps from signup to a running clinic.
            </h2>
          </div>
          <Link href="/pricing?onboarding=1" className="btn ghost">
            Start onboarding <ArrowRight size={14} />
          </Link>
        </div>
        <div
          className="resp-stack-2"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
        >
          {steps.map((step) => (
            <div
              key={step.n}
              className="card"
              style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--primary-50)",
                    color: "var(--primary-600)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <step.Ic size={17} />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-faint)",
                    fontWeight: 500,
                  }}
                >
                  0{step.n}
                </div>
              </div>
              <h4 className="t-h4" style={{ margin: 0 }}>
                {step.t}
              </h4>
              <p className="t-body" style={{ margin: 0, fontSize: 13 }}>
                {step.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPeek() {
  return (
    <section className="resp-page-pad resp-page-pad-y-sm" style={{ padding: "100px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div className="t-eyebrow">Pricing</div>
        <h2 className="t-h2" style={{ marginTop: 10 }}>
          Free to start. Fair when you grow.
        </h2>
        <p
          className="t-body"
          style={{ marginTop: 12, maxWidth: 520, margin: "12px auto 0" }}
        >
          Try the full product for 30 days or 50 appointments — whichever comes first.
        </p>
      </div>
      <div
        className="resp-stack-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          maxWidth: 840,
          margin: "0 auto",
        }}
      >
        <PricingPeekCard
          tier="Free trial"
          price="€0"
          note="30 days or 50 appointments"
          features={[
            "All features included",
            "Up to 3 doctors",
            "Patient booking link",
            "Email support",
          ]}
          cta="Start free trial"
          href="/pricing?onboarding=1"
        />
        <PricingPeekCard
          tier="Premium"
          highlighted
          price="€12"
          suffix="/mo"
          note="or €100/year · ~3000 DA / 25000 DA"
          features={[
            "Unlimited appointments",
            "Unlimited doctors",
            "Priority in patient search",
            "SMS reminders",
            "Dedicated support",
          ]}
          cta="Go premium"
          href="/pricing"
        />
      </div>
    </section>
  );
}

function PricingPeekCard({
  tier,
  price,
  suffix,
  note,
  features,
  cta,
  href,
  highlighted,
}: {
  tier: string;
  price: string;
  suffix?: string;
  note: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 36,
        border: highlighted ? "1.5px solid var(--primary)" : "1px solid var(--outline-variant)",
        boxShadow: highlighted ? "0 8px 32px -12px var(--primary-tint)" : "var(--elev-1)",
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
            letterSpacing: "0.04em",
          }}
        >
          POPULAR
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
        {tier}
      </div>
      <div
        style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 4 }}
      >
        <span style={{ fontSize: 52, fontWeight: 600 }}>{price}</span>
        {suffix && <span style={{ color: "var(--text-subtle)" }}>{suffix}</span>}
      </div>
      <div className="t-small" style={{ marginTop: 4 }}>
        {note}
      </div>
      <hr className="sep" style={{ margin: "22px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map((f) => (
          <div key={f} style={{ display: "flex", gap: 10, fontSize: 14 }}>
            <Check
              size={16}
              strokeWidth={2}
              style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }}
            />
            {f}
          </div>
        ))}
      </div>
      <Link
        href={href}
        className={`btn ${highlighted ? "primary" : "secondary"}`}
        style={{ width: "100%", marginTop: 24, padding: "12px 16px" }}
      >
        {cta}
      </Link>
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="resp-page-pad resp-page-pad-y-sm" style={{ padding: "80px 32px" }}>
      <div
        className="card resp-row-wrap"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "56px 48px",
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--on-primary-fixed) 100%)",
          color: "#fff",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
          boxShadow: "0 20px 60px -20px var(--primary-tint)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            className="t-h2"
            style={{ color: "#fff", margin: 0, fontSize: 34 }}
          >
            Start running your clinic smarter today.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              marginTop: 12,
              fontSize: 16,
              maxWidth: 520,
            }}
          >
            Free for 30 days. No credit card. Set up your first booking link in 5 minutes.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            href="/pricing?onboarding=1"
            style={{
              background: "#fff",
              color: "var(--primary-600)",
              padding: "14px 22px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            Create clinic <ArrowRight size={16} />
          </Link>
          <Link
            href="/search"
            style={{
              color: "#fff",
              textAlign: "center",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              opacity: 0.9,
            }}
          >
            or find a clinic →
          </Link>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--outline-variant)",
        padding: "48px 32px 32px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="resp-stack-2"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 40,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <ClinicaMark />
              <span style={{ fontWeight: 600, fontSize: 17 }}>Clinica</span>
            </div>
            <p className="t-small" style={{ maxWidth: 280, lineHeight: 1.6 }}>
              The modern clinic management platform for patients and doctors.
            </p>
          </div>
          {[
            { t: "Product", l: ["Patient app", "Clinic dashboard", "Pricing", "Changelog"] },
            { t: "Company", l: ["About", "Careers", "Press", "Contact"] },
            { t: "Resources", l: ["Help center", "Guides", "Status", "Security"] },
            { t: "Legal", l: ["Terms", "Privacy", "Cookies", "GDPR"] },
          ].map((s) => (
            <div key={s.t}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                {s.t}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {s.l.map((link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      color: "var(--text-subtle)",
                      fontSize: 13,
                      textDecoration: "none",
                    }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid var(--outline-variant)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div className="t-small">© 2026 Clinica. All rights reserved.</div>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              color: "var(--text-subtle)",
              fontSize: 13,
            }}
          >
            <Mail size={14} /> moumen0829@gmail.com
          </div>
        </div>
      </div>
    </footer>
  );
}
