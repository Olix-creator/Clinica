"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, CalendarDays, X, List, Grid3X3, Search, Filter } from "lucide-react";
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
  doctors?: {
    id: string;
    specialty?: string;
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

interface Doctor {
  id: string;
  specialty?: string;
  users?: {
    full_name: string;
  };
}

export default function ReceptionAppointmentsClient({
  appointments,
  patients,
  doctors,
}: {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = appointments.filter((apt) => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    if (dateFilter) {
      const aptDate = format(new Date(apt.scheduled_at), "yyyy-MM-dd");
      if (aptDate !== dateFilter) return false;
    }
    if (doctorFilter !== "all" && apt.doctors?.id !== doctorFilter) return false;
    if (searchQuery) {
      const patientName = apt.patients?.users?.full_name?.toLowerCase() || "";
      const doctorName = apt.doctors?.users?.full_name?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      if (!patientName.includes(query) && !doctorName.includes(query)) return false;
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
        doctor_id: formData.get("doctor_id") as string,
        patient_id: formData.get("patient_id") as string,
        scheduled_at: new Date(`${date}T${time}`).toISOString(),
        duration_minutes: parseInt(formData.get("duration") as string) || 30,
        type: formData.get("type") as string,
        notes: (formData.get("notes") as string) || undefined,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Appointment created successfully");
        setShowModal(false);
      }
    });
  }

  async function handleStatusChange(id: string, newStatus: string) {
    startTransition(async () => {
      const result = await updateAppointmentStatus(id, newStatus);
      if (result?.error) toast.error(result.error);
      else toast.success("Status updated successfully");
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-all ${viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-md transition-all ${viewMode === "calendar" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient or doctor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          
          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />

          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.users?.full_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {(dateFilter || statusFilter !== "all" || doctorFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setDateFilter("");
                setStatusFilter("all");
                setDoctorFilter("all");
                setSearchQuery("");
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Patient</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Doctor</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Time</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((apt) => {
                  const patientName = apt.patients?.users?.full_name || "Unknown";
                  const doctorName = apt.doctors?.users?.full_name || "Unknown";
                  const patientInitials = patientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                  return (
                    <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                            {patientInitials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{patientName}</p>
                            <p className="text-xs text-gray-400">ID: #{apt.patients?.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">Dr. {doctorName}</p>
                        <p className="text-xs text-gray-400">{apt.doctors?.specialty || "General"}</p>
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
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                      No appointments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((apt) => {
              const patientName = apt.patients?.users?.full_name || "Unknown";
              const doctorName = apt.doctors?.users?.full_name || "Unknown";
              return (
                <div key={apt.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${statusColors[apt.status] || statusColors.pending}`}>
                      {apt.status}
                    </span>
                    <span className="text-xs text-gray-400">{apt.duration_minutes} min</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{patientName}</h3>
                  <p className="text-sm text-gray-500 mb-3">with Dr. {doctorName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    <span>{format(new Date(apt.scheduled_at), "MMM dd, yyyy - hh:mm a")}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 capitalize">{apt.type?.replace("-", " ")}</p>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No appointments found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-600" />
                New Appointment
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Patient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select name="patient_id" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.users?.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select name="doctor_id" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                  <option value="">Select doctor...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>Dr. {d.users?.full_name} - {d.specialty || "General"}</option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input name="date" type="date" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input name="time" type="time" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                </div>
              </div>

              {/* Type & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select name="type" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                    <option value="consultation">Consultation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="initial-exam">Initial Exam</option>
                    <option value="lab-results">Lab Results</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select name="duration" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Optional notes..." />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                  {isPending ? "Creating..." : "Create Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
