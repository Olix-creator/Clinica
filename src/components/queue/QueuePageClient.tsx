"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import {
  Users,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  MoreVertical,
  Timer,
  User,
} from "lucide-react";
import QueueTimer from "./QueueTimer";

interface QueueEntry {
  id: string;
  doctor_id: string;
  patient_id: string;
  position: number;
  room: string | null;
  status: string;
  arrival_time: string;
  consultation_start: string | null;
  visit_type: string | null;
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

interface QueuePageClientProps {
  doctorId: string;
  initialQueue: QueueEntry[];
  patients: Patient[];
}

export default function QueuePageClient({
  doctorId,
  initialQueue,
  patients,
}: QueuePageClientProps) {
  const [queue, setQueue] = useState<QueueEntry[]>(initialQueue);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [visitType, setVisitType] = useState("New Consultation");
  const [loading, setLoading] = useState(false);

  const currentPatient = queue.find((q) => q.status === "in-consultation");
  const nextPatient = queue.find((q) => q.status === "waiting");
  const waitingQueue = queue.filter((q) => q.status === "waiting");
  const completedToday = queue.filter((q) => q.status === "completed");
  const avgWaitTime = waitingQueue.length > 0 ? Math.round(waitingQueue.length * 8) : 0;
  const efficiency = queue.length > 0
    ? Math.round((completedToday.length / Math.max(queue.length, 1)) * 100)
    : 0;

  const fetchQueue = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("queue")
      .select("*, patients(*, users(*))")
      .eq("doctor_id", doctorId)
      .order("position", { ascending: true });
    if (data) setQueue(data);
  }, [doctorId]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue",
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, fetchQueue]);

  async function handleCallNext() {
    setLoading(true);
    const supabase = createClient();

    if (currentPatient) {
      await supabase
        .from("queue")
        .update({ status: "completed" })
        .eq("id", currentPatient.id);
    }

    if (nextPatient) {
      await supabase
        .from("queue")
        .update({
          status: "in-consultation",
          consultation_start: new Date().toISOString(),
          room: "Room 4B",
        })
        .eq("id", nextPatient.id);
    }

    await fetchQueue();
    setLoading(false);
  }

  async function handleCompleteVisit() {
    if (!currentPatient) return;
    setLoading(true);
    const supabase = createClient();

    await supabase
      .from("queue")
      .update({ status: "completed" })
      .eq("id", currentPatient.id);

    if (nextPatient) {
      await supabase
        .from("queue")
        .update({
          status: "in-consultation",
          consultation_start: new Date().toISOString(),
          room: "Room 4B",
        })
        .eq("id", nextPatient.id);
    }

    await fetchQueue();
    setLoading(false);
  }

  async function handleAddToQueue() {
    if (!selectedPatient) return;
    setLoading(true);
    const supabase = createClient();

    const maxPos = Math.max(0, ...queue.map((q) => q.position));

    await supabase.from("queue").insert({
      doctor_id: doctorId,
      patient_id: selectedPatient,
      position: maxPos + 1,
      status: "waiting",
      visit_type: visitType,
      arrival_time: new Date().toISOString(),
    });

    setShowAddModal(false);
    setSelectedPatient("");
    await fetchQueue();
    setLoading(false);
  }

  async function handleRemove(queueId: string) {
    const supabase = createClient();
    await supabase.from("queue").delete().eq("id", queueId);
    await fetchQueue();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-time Patient Queue</h1>
          <p className="text-gray-500">Manage the daily flow with precision and clinical efficiency.</p>
        </div>
        <button
          onClick={handleCallNext}
          disabled={loading || !nextPatient}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
        >
          <Users className="w-5 h-5" />
          Call Next Patient
        </button>
      </div>

      {/* Current + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currently in Consultation */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white min-h-[280px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                  Currently in Consultation
                </span>
              </div>

              {currentPatient ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {currentPatient.patients?.users?.full_name || "Unknown"}
                      </h3>
                      <p className="text-sm opacity-80">
                        ID: #{currentPatient.patient_id.slice(0, 8)} {currentPatient.room && `• ${currentPatient.room}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-xs opacity-70">Time Started</p>
                      <p className="text-lg font-bold">
                        {currentPatient.consultation_start
                          ? format(new Date(currentPatient.consultation_start), "hh:mm a")
                          : "--:--"}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-xs opacity-70">Duration</p>
                      <QueueTimer startTime={currentPatient.consultation_start} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 opacity-70">
                  <User className="w-12 h-12 mb-3" />
                  <p className="text-sm">No patient in consultation</p>
                </div>
              )}
            </div>

            {currentPatient && (
              <button
                onClick={handleCompleteVisit}
                disabled={loading}
                className="w-full py-2.5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all disabled:opacity-50"
              >
                Complete Visit
              </button>
            )}
          </div>
        </div>

        {/* Stats + Next Up */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase">Wait Time</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {avgWaitTime} <span className="text-sm font-normal text-gray-400">min</span>
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase">In Queue</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {waitingQueue.length} <span className="text-sm font-normal text-gray-400">pts</span>
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase">Efficiency</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {efficiency || 94} <span className="text-sm font-normal text-gray-400">%</span>
              </p>
            </div>
          </div>

          {/* Next Up */}
          {nextPatient && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-primary">
                    NEXT UP
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {nextPatient.patients?.users?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {nextPatient.visit_type || "Check-up"} • General
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    Arrived: {format(new Date(nextPatient.arrival_time), "hh:mm a")}
                  </span>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Queue Details Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Queue Details</h2>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <Timer className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-4">
                  Position
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">
                  Patient Name
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3 hidden md:table-cell">
                  Arrival Time
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3 hidden md:table-cell">
                  Estimated Wait
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">
                  Status
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {waitingQueue.map((entry, idx) => (
                <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 pr-4">
                    <span className="text-lg font-bold text-gray-300">
                      {String(entry.position).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {entry.patients?.users?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400">{entry.visit_type || "Consultation"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 hidden md:table-cell">
                    <p className="text-sm text-gray-600">
                      {format(new Date(entry.arrival_time), "hh:mm a")}
                    </p>
                  </td>
                  <td className="py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-sm text-gray-600">{(idx + 1) * 15} min</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                      Waiting
                    </span>
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {waitingQueue.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                    No patients waiting in queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <p>Displaying {waitingQueue.length} patients in today&apos;s active queue</p>
        </div>
      </div>

      {/* Add to Queue FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add to Queue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Patient to Queue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.users?.full_name || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>New Consultation</option>
                  <option>Follow-up Visit</option>
                  <option>Lab Results Review</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToQueue}
                  disabled={loading || !selectedPatient}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
                >
                  Add to Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
