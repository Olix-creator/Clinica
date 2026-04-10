"use client";

import { useState } from "react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes: string | null;
  doctors?: {
    users?: {
      full_name: string;
    };
    specialty: string | null;
  };
}

export default function PatientAppointmentsClient({ appointments }: { appointments: Appointment[] }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const now = new Date().toISOString();
  const filtered = appointments.filter((apt) =>
    tab === "upcoming" ? apt.scheduled_at >= now : apt.scheduled_at < now
  );

  const statusColors: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    completed: "bg-green-50 text-green-700",
    pending: "bg-orange-50 text-orange-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium border-b-2 transition-all capitalize ${
              tab === t ? "text-primary border-primary" : "text-gray-500 border-transparent"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filtered.map((apt) => (
          <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-16 bg-blue-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-primary uppercase">
                {format(new Date(apt.scheduled_at), "MMM")}
              </span>
              <span className="text-lg font-bold text-gray-900">
                {format(new Date(apt.scheduled_at), "dd")}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {format(new Date(apt.scheduled_at), "hh:mm a")} — {apt.type?.replace("-", " ")}
              </p>
              <p className="text-xs text-gray-500">
                Dr. {apt.doctors?.users?.full_name || "Unknown"} {apt.doctors?.specialty ? `• ${apt.doctors.specialty}` : ""}
              </p>
              <p className="text-xs text-gray-400 mt-1">{apt.duration_minutes} min • {apt.notes || "No notes"}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase self-start ${statusColors[apt.status] || statusColors.pending}`}>
              {apt.status}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">
            {tab === "upcoming" ? "No upcoming appointments" : "No past appointments"}
          </div>
        )}
      </div>
    </div>
  );
}
