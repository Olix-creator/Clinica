"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Briefcase,
  Users,
  CalendarDays,
  LayoutDashboard,
  MousePointer2,
  FileX,
  CalendarX,
  BellOff,
  CheckCircle2,
  Star,
  Phone,
  MessageCircle,
  Shield,
  Zap,
  Check,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { AuthButton, AuthButtonMobile } from "@/components/auth/AuthButton";

/* ── animation variants ── */
import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ── tiny components ── */
function NavBar() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const l = t("landing");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary-dark transition-colors">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Clinica</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            [l.features, "#features"],
            [l.pricing, "#pricing"],
            [l.contact, "#contact"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <AuthButton />
          <Link
            href="/signup"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95"
          >
            {l.startFree}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 overflow-hidden"
          >
            {[
              [l.features, "#features"],
              [l.pricing, "#pricing"],
              [l.contact, "#contact"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium text-gray-600 hover:text-primary"
              >
                {label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              <AuthButtonMobile label={l.signIn} />
              <Link href="/signup" className="py-2.5 text-center text-sm font-semibold bg-primary text-white rounded-xl">
                {l.startFree}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function DashboardMockup() {
  return (
    <motion.div
      className="relative w-full max-w-lg mx-auto"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 translate-y-4 translate-x-2 bg-primary/10 rounded-2xl blur-xl" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="ml-3 flex-1 h-5 bg-gray-200 rounded-md" />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-28 bg-gray-900 rounded font-bold" />
              <div className="h-2.5 w-36 bg-gray-200 rounded mt-1" />
            </div>
            <div className="h-8 w-24 bg-primary rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { color: "bg-blue-50", bar: "bg-primary", val: "12" },
              { color: "bg-green-50", bar: "bg-green-500", val: "08" },
              { color: "bg-orange-50", bar: "bg-orange-400", val: "04" },
            ].map((s, i) => (
              <div key={i} className={`${s.color} rounded-xl p-3`}>
                <div className={`h-6 w-8 ${s.bar} rounded text-white text-xs font-bold flex items-center justify-center`}>
                  {s.val}
                </div>
                <div className="h-2 w-12 bg-gray-200 rounded mt-2" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 bg-gray-300 rounded" />
            {[
              { color: "bg-primary", label: "bg-blue-100 text-primary", status: "In Progress" },
              { color: "bg-gray-200", label: "bg-orange-50 text-orange-700", status: "Waiting" },
              { color: "bg-gray-200", label: "bg-orange-50 text-orange-700", status: "Waiting" },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className={`w-7 h-7 rounded-full ${row.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {i + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 w-20 bg-gray-300 rounded" />
                  <div className="h-2 w-14 bg-gray-200 rounded" />
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.label}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── SECTIONS ── */

function HeroSection() {
  const { t } = useI18n();
  const l = t("landing");

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 bg-linear-to-b from-blue-50/60 via-white to-white overflow-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full"
          >
            <Zap className="w-3.5 h-3.5" />
            {l.heroTag}
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-gray-900 leading-tight"
          >
            {l.heroTitle1}<br />
            <span className="text-primary">{l.heroTitle2}</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-500 leading-relaxed">
            {l.heroDesc}
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
            >
              {l.heroCta}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#contact"
              className="flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-all hover:shadow-md active:scale-95"
            >
              {l.requestDemo}
            </a>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 pt-2">
            {[
              [l.statFree, l.statFreeLabel],
              [l.statSetup, l.statSetupLabel],
              [l.statRealtime, l.statRealtimeLabel],
            ].map(([val, label]) => (
              <div key={label}>
                <p className="text-lg font-bold text-gray-900">{val}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideRight}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}

function ProblemSolutionSection() {
  const { t } = useI18n();
  const l = t("landing");

  const problems = [
    { icon: FileX, title: l.problem1Title, desc: l.problem1Desc },
    { icon: CalendarX, title: l.problem2Title, desc: l.problem2Desc },
    { icon: BellOff, title: l.problem3Title, desc: l.problem3Desc },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{l.problemTitle}</h2>
          <p className="text-gray-500">{l.problemSubtitle}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          {problems.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              custom={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-red-100"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="relative bg-linear-to-r from-primary to-blue-700 rounded-2xl p-8 text-white overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={scaleIn}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{l.solutionTitle}</h3>
              <p className="text-blue-100 text-lg">{l.solutionDesc}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { t } = useI18n();
  const l = t("landing");

  const features = [
    { icon: Users, title: l.feature1Title, desc: l.feature1Desc, color: "bg-blue-50 text-primary" },
    { icon: CalendarDays, title: l.feature2Title, desc: l.feature2Desc, color: "bg-green-50 text-green-600" },
    { icon: LayoutDashboard, title: l.feature3Title, desc: l.feature3Desc, color: "bg-purple-50 text-purple-600" },
    { icon: MousePointer2, title: l.feature4Title, desc: l.feature4Desc, color: "bg-orange-50 text-orange-500" },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
            {l.featuresTag}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{l.featuresTitle}</h2>
          <p className="text-gray-500 max-w-lg mx-auto">{l.featuresSubtitle}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
              className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-default transition-colors hover:border-primary/20"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { t } = useI18n();
  const l = t("landing");

  const freePlan = [l.freePlan1, l.freePlan2, l.freePlan3, l.freePlan4];
  const proPlan = [l.proPlan1, l.proPlan2, l.proPlan3, l.proPlan4, l.proPlan5, l.proPlan6];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
            {l.pricingTag}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{l.pricingTitle}</h2>
          <p className="text-gray-500">{l.pricingSubtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={slideLeft}
          >
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{l.free}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">0</span>
                <span className="text-lg text-gray-400">DA</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{l.foreverFree}</p>
            </div>
            <ul className="space-y-3 mb-8">
              {freePlan.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center py-3 px-4 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all"
            >
              {l.getStartedFree}
            </Link>
          </motion.div>

          <motion.div
            className="relative bg-primary rounded-2xl p-8 shadow-xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={slideRight}
          >
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {l.mostPopular}
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-200 uppercase tracking-wider mb-1">{l.pro}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">10,000</span>
                <span className="text-lg text-blue-200">DA/mo</span>
              </div>
              <p className="text-sm text-blue-200 mt-1">{l.proSubtitle}</p>
            </div>
            <ul className="space-y-3 mb-8">
              {proPlan.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                  <Check className="w-4 h-4 text-white shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className="block text-center py-3 px-4 bg-white text-primary font-semibold rounded-xl hover:bg-blue-50 transition-all"
            >
              {l.requestProAccess}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const { t } = useI18n();
  const l = t("landing");

  const testimonials = [
    { name: l.testimonial1Name, role: l.testimonial1Role, quote: l.testimonial1Quote },
    { name: l.testimonial2Name, role: l.testimonial2Role, quote: l.testimonial2Quote },
    { name: l.testimonial3Name, role: l.testimonial3Role, quote: l.testimonial3Quote },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="flex flex-wrap justify-center gap-6 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeIn}
        >
          {[
            { icon: Shield, label: l.trustSecure },
            { icon: Zap, label: l.trustRealtime },
            { icon: CheckCircle2, label: l.trustNoSetup },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Icon className="w-4 h-4 text-primary" />
              {label}
            </div>
          ))}
        </motion.div>

        <motion.div
          className="text-center mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{l.trustTitle}</h2>
          <p className="text-gray-500">{l.trustSubtitle}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {testimonials.map(({ name, role, quote }, i) => (
            <motion.div
              key={name}
              variants={fadeUp}
              custom={i}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            >
              <div className="flex gap-1 mb-4">
                {Array(5).fill(0).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">&ldquo;{quote}&rdquo;</p>
              <div>
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-400">{role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", clinic: "", phone: "" });
  const [sent, setSent] = useState(false);
  const { t } = useI18n();
  const l = t("landing");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="text-center mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{l.contactTitle}</h2>
          <p className="text-gray-500">{l.contactSubtitle}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial="hidden"
              animate="visible"
              variants={scaleIn}
              className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{l.messageReceived}</h3>
              <p className="text-sm text-gray-500">{l.messageReceivedDesc}</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: l.contactName, key: "name", placeholder: l.contactNamePlaceholder, type: "text" },
                  { label: l.contactClinic, key: "clinic", placeholder: l.contactClinicPlaceholder, type: "text" },
                  { label: l.contactPhone, key: "phone", placeholder: l.contactPhonePlaceholder, type: "tel" },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <input
                      type={type}
                      required
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                >
                  {l.sendMessage}
                </button>
              </form>

              <div className="flex items-center gap-2 mt-6 pt-6 border-t border-gray-100">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{l.orCallUs} </span>
                <a href="tel:+213555000000" className="text-sm font-medium text-primary hover:underline">
                  +213 555 000 000
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  const l = t("landing");

  return (
    <footer className="bg-gray-900 text-gray-400 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">Clinica</span>
        </div>
        <p className="text-sm">{l.footerRights}</p>
        <div className="flex gap-4 text-sm">
          <AuthButton className="hover:text-white transition-colors cursor-pointer" />
          <a href="#contact" className="hover:text-white transition-colors">{l.contact}</a>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/213555000000"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center"
      title="Chat on WhatsApp"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
    >
      <MessageCircle className="w-7 h-7" />
    </motion.a>
  );
}

/* ── PAGE ── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <HeroSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <PricingSection />
      <TrustSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
