"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Stethoscope,
  ClipboardList,
  BellRing,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  Check,
  Star,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck2,
    title: "Effortless scheduling",
    body: "Patients book in three taps. Receptionists see a live canvas of every clinic, every room, every minute.",
  },
  {
    icon: Stethoscope,
    title: "Clinician focus",
    body: "Today's schedule, priority review queue, and one-tap status changes — your shift, distilled.",
  },
  {
    icon: BellRing,
    title: "Realtime notifications",
    body: "Appointment confirmations, cancellations and reminders stream instantly — no refresh required.",
  },
  {
    icon: ClipboardList,
    title: "Unified medical record",
    body: "Vitals, visits and notes live in one place. Patients see what clinicians see — safely, via RLS.",
  },
  {
    icon: ShieldCheck,
    title: "Security you can audit",
    body: "Postgres Row Level Security on every table. Your data, your policy, zero shortcuts.",
  },
  {
    icon: Sparkles,
    title: "Design that calms",
    body: "A clinical sanctuary. Dark, tonal, generous radii — built to lower the cognitive load of a busy shift.",
  },
];

const steps = [
  {
    n: "01",
    title: "Create your clinic",
    body: "Sign up, pick your role, and spin up a clinic in under a minute.",
  },
  {
    n: "02",
    title: "Invite your team",
    body: "Add doctors and receptionists. Roles and permissions are enforced at the database.",
  },
  {
    n: "03",
    title: "Start healing",
    body: "Patients book, clinicians treat, receptionists orchestrate — Lumina keeps everyone in sync.",
  },
];

const testimonials = [
  {
    name: "Dr. Noor Al-Amin",
    role: "Cardiologist, Cedar Clinic",
    body: "Lumina replaced three spreadsheets and a whiteboard. My pre-shift anxiety is gone.",
  },
  {
    name: "Sara Bennani",
    role: "Receptionist, Atlas Medical",
    body: "The schedule canvas is a revelation. I see every room, every provider, at a glance.",
  },
  {
    name: "Youssef Karimi",
    role: "Patient",
    body: "Booked a follow-up in 20 seconds. The reminders mean I never miss a visit anymore.",
  },
];

const plans = [
  {
    name: "Solo",
    price: "Free",
    tagline: "For independent clinicians starting out.",
    features: ["1 clinic", "Up to 2 providers", "Unlimited patients", "Email reminders"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Clinic",
    price: "$49",
    suffix: "/mo",
    tagline: "For growing practices that need more horsepower.",
    features: [
      "Up to 5 clinics",
      "Unlimited providers",
      "Realtime notifications",
      "Role-based dashboards",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Network",
    price: "Custom",
    tagline: "For hospital groups and multi-region networks.",
    features: [
      "Unlimited clinics",
      "SSO / SAML",
      "Advanced audit logs",
      "Dedicated success manager",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body">
      {/* Nav */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "backdrop-blur-xl bg-surface-container-low/70 border-b border-outline-variant/40" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-emerald">
              <Sparkles className="w-5 h-5 text-on-primary-fixed" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Lumina Clinical</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-on-surface-variant">
            <a href="#features" className="hover:text-on-surface transition">Features</a>
            <a href="#how" className="hover:text-on-surface transition">How it works</a>
            <a href="#pricing" className="hover:text-on-surface transition">Pricing</a>
            <a href="#testimonials" className="hover:text-on-surface transition">Testimonials</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-on-surface-variant hover:text-on-surface transition px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed shadow-emerald hover:brightness-110 active:scale-[0.98] transition"
            >
              Get started
            </Link>
          </div>

          <button
            className="md:hidden w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center"
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menu && (
          <div className="md:hidden border-t border-outline-variant/40 bg-surface-container-low/95 backdrop-blur-xl">
            <div className="px-6 py-6 flex flex-col gap-4 text-sm">
              <a href="#features" onClick={() => setMenu(false)}>Features</a>
              <a href="#how" onClick={() => setMenu(false)}>How it works</a>
              <a href="#pricing" onClick={() => setMenu(false)}>Pricing</a>
              <a href="#testimonials" onClick={() => setMenu(false)}>Testimonials</a>
              <div className="pt-4 border-t border-outline-variant/40 flex flex-col gap-3">
                <Link href="/login" className="px-4 py-3 rounded-xl bg-surface-container-highest text-center">Sign in</Link>
                <Link
                  href="/signup"
                  className="px-4 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed text-center font-medium"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full bg-primary-container/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest text-xs tracking-[0.18em] uppercase text-on-surface-variant mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            The clinical sanctuary
          </span>
          <h1 className="font-headline text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] mb-8 max-w-4xl mx-auto">
            The calm at the center of a
            <span className="block bg-gradient-to-r from-primary-fixed via-primary to-primary-container bg-clip-text text-transparent">
              busy clinic.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10">
            Lumina Clinical unifies scheduling, records and realtime notifications in a single, deeply considered
            workspace — so your team can focus on healing, not on software.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition"
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-surface-container-highest text-on-surface font-medium hover:bg-surface-bright transition"
            >
              I already have an account
            </Link>
          </div>

          <div className="mt-20 mx-auto max-w-5xl">
            <div className="relative rounded-[2rem] bg-surface-container-low ring-1 ring-outline-variant/50 overflow-hidden shadow-deep p-6">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-4 bg-surface-container-highest rounded-2xl p-6 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3">Next appointment</p>
                  <p className="font-semibold text-lg">Dr. Alma Reyes</p>
                  <p className="text-sm text-on-surface-variant">Cardiology · Today 14:30</p>
                  <div className="mt-5 inline-flex px-3 py-1 rounded-full bg-secondary-container/40 text-secondary text-xs font-medium">
                    Confirmed
                  </div>
                </div>
                <div className="col-span-12 md:col-span-4 bg-surface-container rounded-2xl p-6 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3">Live queue</p>
                  <p className="font-semibold text-4xl">7</p>
                  <p className="text-sm text-on-surface-variant">patients checked in</p>
                  <div className="mt-4 h-2 bg-surface-bright rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-primary-fixed to-primary rounded-full" />
                  </div>
                </div>
                <div className="col-span-12 md:col-span-4 bg-surface-container-high rounded-2xl p-6 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3">Notifications</p>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-primary" />
                    <p className="text-sm">New booking from Youssef K.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-tertiary" />
                    <p className="text-sm">Dr. Reyes updated a note.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">Features</p>
            <h2 className="font-headline text-4xl sm:text-5xl font-semibold tracking-tight">
              Every workflow, quietly mastered.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-surface-container-low p-7 ring-1 ring-outline-variant/40 hover:ring-primary/40 hover:bg-surface-container transition"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center mb-5 group-hover:bg-primary/15 transition">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">How it works</p>
            <h2 className="font-headline text-4xl sm:text-5xl font-semibold tracking-tight">
              Up and running in an afternoon.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl bg-surface-container p-8 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 text-[7rem] leading-none font-bold text-surface-bright/40 select-none">
                  {s.n}
                </div>
                <div className="relative">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Step {s.n}</p>
                  <h3 className="font-semibold text-xl mb-3">{s.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">Loved by teams</p>
            <h2 className="font-headline text-4xl sm:text-5xl font-semibold tracking-tight">
              Words from the floor.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-surface-container-low p-7 ring-1 ring-outline-variant/40">
                <div className="flex gap-1 mb-5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-on-surface mb-6 leading-relaxed">&ldquo;{t.body}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">Pricing</p>
            <h2 className="font-headline text-4xl sm:text-5xl font-semibold tracking-tight">
              Honest plans. No seat games.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-[2rem] p-8 ${
                  p.featured
                    ? "bg-gradient-to-br from-surface-container-high to-surface-container ring-2 ring-primary shadow-emerald"
                    : "bg-surface-container ring-1 ring-outline-variant/40"
                }`}
              >
                {p.featured && (
                  <div className="inline-flex px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium mb-4">
                    Most popular
                  </div>
                )}
                <h3 className="font-semibold text-xl mb-1">{p.name}</h3>
                <p className="text-sm text-on-surface-variant mb-6">{p.tagline}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-headline text-5xl font-semibold">{p.price}</span>
                  {p.suffix && <span className="text-on-surface-variant">{p.suffix}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-on-surface-variant">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center px-5 py-3.5 rounded-xl font-medium transition ${
                    p.featured
                      ? "bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed shadow-emerald hover:brightness-110"
                      : "bg-surface-container-highest text-on-surface hover:bg-surface-bright"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-[2rem] bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-12 sm:p-16 text-center ring-1 ring-outline-variant/40 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
            </div>
            <h2 className="font-headline text-4xl sm:text-5xl font-semibold tracking-tight mb-5">
              Let the software fade.
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto mb-8">
              Ten minutes from now your clinic could be running on Lumina. Start free — no card, no friction.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition"
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-on-primary-fixed" />
            </span>
            <span>&copy; {new Date().getFullYear()} Lumina Clinical</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-on-surface">Sign in</Link>
            <Link href="/signup" className="hover:text-on-surface">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
