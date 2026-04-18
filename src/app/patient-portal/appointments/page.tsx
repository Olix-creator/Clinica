"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays, Clock, ChevronLeft, CalendarPlus,
  Stethoscope, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

/* ── Mock Data ─────────────────────────────────────────── */
const ALL_APPOINTMENTS = [
  {
    id: "1", date: "Apr 20, 2026", rawDate: "2026-04-20", time: "10:30 AM",
    doctor: "Dr. Kaci Rahmani", type: "General Consultation",
    clinic: "Clinica Central", status: "confirmed" as const,
  },
  {
    id: "2", date: "Apr 15, 2026", rawDate: "2026-04-15", time: "2:00 PM",
    doctor: "Dr. Nadia Meziane", type: "Follow-up Visit",
    clinic: "Clinica Central", status: "completed" as const,
  },
  {
    id: "3", date: "Apr 8, 2026", rawDate: "2026-04-08", time: "9:00 AM",
    doctor: "Dr. Kaci Rahmani", type: "Lab Results Review",
    clinic: "Clinica Central", status: "completed" as const,
  },
  {
    id: "4", date: "Mar 28, 2026", rawDate: "2026-03-28", time: "11:00 AM",
    doctor: "Dr. Samir Belaid", type: "Cardiology Check",
    clinic: "MedPlus Clinic", status: "cancelled" as const,
  },
  {
    id: "5", date: "Apr 25, 2026", rawDate: "2026-04-25", time: "3:30 PM",
    doctor: "Dr. Nadia Meziane", type: "Annual Checkup",
    clinic: "Clinica Central", status: "pending" as const,
  },
];

const STATUS_MAP = {
  confirmed: { label: "Confirmed",  variant: "success" as const, icon: CheckCircle2, color: "text-green-500" },
  pending:   { label: "Pending",    variant: "warning" as const, icon: AlertCircle,  color: "text-orange-500" },
  completed: { label: "Completed",  variant: "neutral" as const, icon: CheckCircle2, color: "text-gray-400" },
  cancelled: { label: "Cancelled",  variant: "danger"  as const, icon: XCircle,      color: "text-red-400" },
};

const TABS = ["All", "Upcoming", "Past"] as const;
type Tab = typeof TABS[number];

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const today = "2026-04-18";
  const filtered = ALL_APPOINTMENTS.filter((a) => {
    if (activeTab === "Upcoming") return a.rawDate >= today && a.status !== "cancelled";
    if (activeTab === "Past") return a.rawDate < today || a.status === "completed" || a.status === "cancelled";
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">My Appointments</h1>
          <Link
            href="/patient-portal/appointments/book"
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark active:scale-95 transition-all shadow-sm shadow-primary/30"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Book New
          </Link>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          filtered.map((apt) => {
            const s = STATUS_MAP[apt.status];
            const StatusIcon = s.icon;
            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Color accent based on status */}
                <div className={`h-1 w-full ${
                  apt.status === "confirmed" ? "bg-linear-to-r from-green-400 to-emerald-500"
                  : apt.status === "pending"  ? "bg-linear-to-r from-orange-300 to-amber-400"
                  : apt.status === "cancelled"? "bg-linear-to-r from-red-300 to-rose-400"
                  : "bg-linear-to-r from-gray-200 to-gray-300"
                }`} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                        <Stethoscope className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{apt.type}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{apt.doctor}</p>
                        <p className="text-xs text-gray-400">{apt.clinic}</p>
                      </div>
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <CalendarDays className="w-3.5 h-3.5 text-primary" />
                      {apt.date}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {apt.time}
                    </div>
                  </div>

                  {apt.status === "confirmed" && (
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 py-2 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                        Cancel
                      </button>
                      <button className="flex-1 py-2 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors">
                        Reschedule
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <CalendarDays className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-700">
        {tab === "Upcoming" ? "No upcoming appointments" : "No past appointments"}
      </p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">
        {tab === "Upcoming"
          ? "Book an appointment to see it here"
          : "Your completed and cancelled appointments will appear here"}
      </p>
      <Link
        href="/patient-portal/appointments/book"
        className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
      >
        <CalendarPlus className="w-4 h-4" /> Book Appointment
      </Link>
    </div>
  );
}
