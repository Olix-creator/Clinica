"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, CalendarDays, X } from "lucide-react";
import { createAppointment, updateAppointmentStatus } from "@/lib/data/appointments";
import { toast } from "sonner";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes: string | null;
  patients?: {
    id: string;
    users?: {
      full_name: string;
    };
  };
}

interface Patient {
  id: string;
  users?: {
    full_name: string;
  };
}

export default function AppointmentsClient({
  appointments,
  patients,
  doctorId,
}: {
  appointments: Appointment[];
  patients: Patient[];
  doctorId: string;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = appointments.filter((apt) => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    if (dateFilter) {
      const aptDate = format(new Date(apt.scheduled_at), "yyyy-MM-dd");
      if (aptDate !== dateFilter) return false;
    }
    return true;
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    completed: "bg-green-50 text-green-700",
    pending: "bg-orange-50 text-orange-700",
    cancelled: "bg-red-50 text-red-700",
  };

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;

    startTransition(async () => {
      const result = await createAppointment({
        doctor_id: doctorId,
        patient_id: formData.get("patient_id") as string,
        scheduled_at: new Date(`${date}T${time}`).toISOString(),
        duration_minutes: parseInt(formData.get("duration") as string) || 30,
        type: formData.get("type") as string,
        notes: (formData.get("notes") as string) || undefined,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Appointment created");
        setShowModal(false);
      }
    });
  }

  async function handleStatusChange(id: string, newStatus: string) {
    startTransition(async () => {
      const result = await updateAppointmentStatus(id, newStatus);
      if (result?.error) toast.error(result.error);
      else toast.success("Status updated");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(dateFilter || statusFilter !== "all") && (
          <button
            onClick={() => { setDateFilter(""); setStatusFilter("all"); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Patient</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Time</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Type</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => {
                const name = apt.patients?.users?.full_name || "Unknown";
                const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                return (
                  <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">{initials}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-gray-400">ID: #{apt.patients?.id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{format(new Date(apt.scheduled_at), "MMM dd, yyyy")}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{format(new Date(apt.scheduled_at), "hh:mm a")}</td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-600 capitalize">{apt.type?.replace("-", " ")}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${statusColors[apt.status] || statusColors.pending}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={apt.status}
                        onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                        disabled={isPending}
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">No appointments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                New Appointment
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select name="patient_id" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.users?.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input name="date" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input name="time" type="time" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select name="type" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="consultation">Consultation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="initial-exam">Initial Exam</option>
                    <option value="lab-results">Lab Results</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select name="duration" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="15">15 min</option>
                    <option value="30" selected>30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">Create Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
