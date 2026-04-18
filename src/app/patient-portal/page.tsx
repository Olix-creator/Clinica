"use client";

import Link from "next/link";
import {
  Bell, CalendarDays, CalendarPlus, ChevronRight,
  Clock, Stethoscope, Activity, ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

/* ── Mock Data ─────────────────────────────────────────── */
const PATIENT = { name: "Ahmed Benali", initials: "AB", clinic: "Clinica Central" };

const QUEUE = { position: 5, total: 12, estimatedMinutes: 25, status: "active" as const };

const NEXT_APPOINTMENT = {
  date: "Saturday, Apr 20",
  time: "10:30 AM",
  doctor: "Dr. Kaci Rahmani",
  type: "General Consultation",
  status: "confirmed" as const,
};

const RECENT_APPOINTMENTS = [
  { id: "1", date: "Apr 20", time: "10:30 AM", type: "General Consultation", status: "confirmed" as const },
  { id: "2", date: "Apr 15", time: "2:00 PM",  type: "Follow-up Visit",      status: "completed" as const },
  { id: "3", date: "Apr 8",  time: "9:00 AM",  type: "Lab Results Review",   status: "completed" as const },
];

const STATUS_MAP = {
  confirmed: { label: "Confirmed",  variant: "success" as const },
  pending:   { label: "Pending",    variant: "warning" as const },
  completed: { label: "Completed",  variant: "neutral" as const },
  cancelled: { label: "Cancelled",  variant: "danger"  as const },
};

/* ── Skeleton ──────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

/* ── Queue Progress Dots ───────────────────────────────── */
function QueueDots({ position, total }: { position: number; total: number }) {
  const visible = Math.min(total, 9);
  return (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      {Array.from({ length: visible }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i < position
              ? "w-2 h-2 bg-white/40"
              : i === position - 1
              ? "w-3 h-3 bg-white shadow-lg shadow-white/30"
              : "w-2 h-2 bg-white/20"
          }`}
        />
      ))}
      {total > 9 && <span className="text-white/60 text-xs ml-1">+{total - 9}</span>}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function PatientPortalHome() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <header className="bg-white px-5 pt-12 pb-5 sticky top-0 z-30 border-b border-gray-100/80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">{PATIENT.clinic}</p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{greeting}, {PATIENT.name.split(" ")[0]} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors">
              <Bell className="w-4.5 h-4.5 text-gray-600" strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-blue-700 flex items-center justify-center shadow-md shadow-primary/30">
              <span className="text-xs font-bold text-white">{PATIENT.initials}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-4">

        {/* ── Queue Card (Hero) ── */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-500/30 animate-fade-in-up">
          {/* Decorative blobs */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-8 -left-4 w-28 h-28 bg-indigo-400/20 rounded-full blur-lg" />

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Your Queue Status</p>
                <p className="text-white text-sm font-medium mt-0.5">{PATIENT.clinic}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-xs font-semibold">LIVE</span>
              </div>
            </div>

            {/* Big Number */}
            <div className="text-center mb-5">
              <div className="text-[72px] font-black text-white leading-none tracking-tight drop-shadow-lg">
                #{QUEUE.position}
              </div>
              <p className="text-white/90 font-semibold mt-1">
                You are <span className="text-white font-bold">{QUEUE.position}{getOrdinal(QUEUE.position)}</span> in line
              </p>
              <p className="text-white/60 text-sm mt-0.5 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Estimated wait: ~{QUEUE.estimatedMinutes} min
              </p>
            </div>

            {/* Progress dots */}
            <QueueDots position={QUEUE.position} total={QUEUE.total} />

            <div className="mt-4 flex items-center justify-between text-white/60 text-xs">
              <span>Position {QUEUE.position} of {QUEUE.total}</span>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Real-time updates</span>
            </div>
          </div>
        </div>

        {/* ── Next Appointment ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up delay-100">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Next Appointment</span>
            </div>
            <Badge variant={STATUS_MAP[NEXT_APPOINTMENT.status].variant}>
              {STATUS_MAP[NEXT_APPOINTMENT.status].label}
            </Badge>
          </div>
          <div className="px-5 py-4">
            <p className="text-base font-bold text-gray-900">{NEXT_APPOINTMENT.type}</p>
            <p className="text-sm text-gray-500 mt-0.5">{NEXT_APPOINTMENT.doctor}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                {NEXT_APPOINTMENT.date}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {NEXT_APPOINTMENT.time}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up delay-200">
          <Link
            href="/patient-portal/appointments/book"
            className="flex flex-col items-center justify-center gap-2 py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl shadow-lg shadow-primary/25 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">Book Appointment</span>
          </Link>
          <Link
            href="/patient-portal/appointments"
            className="flex flex-col items-center justify-center gap-2 py-5 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-bold">My Appointments</span>
          </Link>
        </div>

        {/* ── Recent Appointments ── */}
        <div className="animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Recent Appointments</h2>
            <Link href="/patient-portal/appointments" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:gap-1.5 transition-all">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {RECENT_APPOINTMENTS.length === 0 ? (
            <EmptyAppointments />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {RECENT_APPOINTMENTS.map((apt) => (
                <div key={apt.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{apt.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{apt.date} · {apt.time}</p>
                  </div>
                  <Badge variant={STATUS_MAP[apt.status].variant}>{STATUS_MAP[apt.status].label}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Loading Skeleton (example, hidden by default) ── */}
        {/* Uncomment to preview skeleton state:
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
        */}

      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────── */
function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function EmptyAppointments() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <CalendarDays className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-500">No appointments yet</p>
      <p className="text-xs text-gray-400 mt-1">Book your first appointment below</p>
      <Link
        href="/patient-portal/appointments/book"
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
      >
        <CalendarPlus className="w-4 h-4" /> Book Now
      </Link>
    </div>
  );
}
