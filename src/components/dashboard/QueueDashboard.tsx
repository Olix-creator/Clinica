"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Clock,
  CheckCircle2,
  PhoneCall,
  Trash2,
  PlayCircle,
  RefreshCw,
  Stethoscope,
  Loader2,
} from "lucide-react";

interface QueueEntry {
  id: string;
  name: string;
  phone: string;
  queue_number: number;
  status: "waiting" | "in_progress" | "done";
  created_at: string;
}

const STATUS_CONFIG = {
  waiting: {
    label: "Waiting",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-100",
    dot: "bg-orange-400",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-primary",
    border: "border-blue-100",
    dot: "bg-primary",
  },
  done: {
    label: "Done",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-100",
    dot: "bg-green-500",
  },
};

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900">{String(value).padStart(2, "0")}</p>
    </div>
  );
}

export default function QueueDashboard({ initial }: { initial: QueueEntry[] }) {
  const [queue, setQueue] = useState<QueueEntry[]>(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "waiting" | "in_progress" | "done">("all");
  const [realtime, setRealtime] = useState(true);

  const supabase = createClient();

  const fetchQueue = useCallback(async () => {
    const { data } = await supabase
      .from("queue")
      .select("*")
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("queue_number", { ascending: true });
    if (data) setQueue(data);
  }, [supabase]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        () => {
          fetchQueue();
        }
      )
      .subscribe((status) => {
        setRealtime(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchQueue]);

  async function updateStatus(id: string, status: QueueEntry["status"]) {
    setLoading(id);
    await supabase.from("queue").update({ status }).eq("id", id);
    await fetchQueue();
    setLoading(null);
  }

  async function removeEntry(id: string) {
    setLoading(id + "-del");
    await supabase.from("queue").delete().eq("id", id);
    await fetchQueue();
    setLoading(null);
  }

  const stats = {
    total: queue.length,
    waiting: queue.filter((q) => q.status === "waiting").length,
    inProgress: queue.filter((q) => q.status === "in_progress").length,
    done: queue.filter((q) => q.status === "done").length,
  };

  const filtered = filter === "all" ? queue : queue.filter((q) => q.status === filter);
  const currentPatient = queue.find((q) => q.status === "in_progress");
  const nextWaiting = queue.find((q) => q.status === "waiting");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queue Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Today&apos;s patients — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${realtime ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            <span className={`w-2 h-2 rounded-full ${realtime ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            {realtime ? "Live" : "Reconnecting…"}
          </div>
          <button
            onClick={fetchQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-primary border border-gray-200 rounded-xl hover:border-primary/40 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Today"  value={stats.total}      color="bg-blue-50 text-primary" />
        <StatCard icon={Clock}         label="Waiting"      value={stats.waiting}    color="bg-orange-50 text-orange-500" />
        <StatCard icon={Stethoscope}   label="In Progress"  value={stats.inProgress} color="bg-purple-50 text-purple-600" />
        <StatCard icon={CheckCircle2}  label="Completed"    value={stats.done}       color="bg-green-50 text-green-600" />
      </div>

      {/* Currently in consultation */}
      {currentPatient && (
        <div className="bg-gradient-to-r from-primary to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Now in Consultation</p>
                <p className="text-xl font-bold">{currentPatient.name}</p>
                <p className="text-sm text-blue-100 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  {currentPatient.phone}
                  <span className="mx-1 opacity-50">·</span>
                  Queue #{currentPatient.queue_number}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateStatus(currentPatient.id, "done")}
              disabled={loading === currentPatient.id}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-all"
            >
              {loading === currentPatient.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark Done
            </button>
          </div>
        </div>
      )}

      {/* Next patient CTA */}
      {!currentPatient && nextWaiting && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-700">Next Patient Ready</p>
            <p className="text-base font-bold text-gray-900">{nextWaiting.name} — #{nextWaiting.queue_number}</p>
          </div>
          <button
            onClick={() => updateStatus(nextWaiting.id, "in_progress")}
            disabled={loading === nextWaiting.id}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
          >
            {loading === nextWaiting.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Call In
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(["all", "waiting", "in_progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f === "all" ? `All (${stats.total})` :
             f === "waiting" ? `Waiting (${stats.waiting})` :
             f === "in_progress" ? `In Progress (${stats.inProgress})` :
             `Done (${stats.done})`}
          </button>
        ))}
      </div>

      {/* Queue table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {filter === "all" ? "No patients in queue today" : `No ${filter.replace("_", " ")} patients`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["#", "Patient", "Phone", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((entry) => {
                  const cfg = STATUS_CONFIG[entry.status];
                  const isLoading = loading === entry.id || loading === entry.id + "-del";
                  const time = new Date(entry.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-gray-50/50 transition-colors ${entry.status === "in_progress" ? "bg-blue-50/30" : ""}`}
                    >
                      {/* Number */}
                      <td className="px-5 py-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          entry.status === "in_progress" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          {entry.queue_number}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4">
                        <a
                          href={`tel:${entry.phone}`}
                          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          {entry.phone}
                        </a>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-4 text-sm text-gray-400">{time}</td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {entry.status === "waiting" && (
                            <button
                              onClick={() => updateStatus(entry.id, "in_progress")}
                              disabled={isLoading || !!currentPatient}
                              title="Call in"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                            >
                              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                              Call
                            </button>
                          )}
                          {entry.status === "in_progress" && (
                            <button
                              onClick={() => updateStatus(entry.id, "done")}
                              disabled={isLoading}
                              title="Mark done"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-500 hover:text-white text-green-700 rounded-lg text-xs font-semibold transition-all"
                            >
                              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Done
                            </button>
                          )}
                          <button
                            onClick={() => removeEntry(entry.id)}
                            disabled={isLoading}
                            title="Remove"
                            className="p-1.5 text-gray-300 hover:text-danger hover:bg-danger-light rounded-lg transition-all"
                          >
                            {loading === entry.id + "-del" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
