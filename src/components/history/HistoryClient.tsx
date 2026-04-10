"use client";

import { useState } from "react";
import { format, differenceInMinutes } from "date-fns";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Visit {
  id: string;
  diagnosis: string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  created_at: string;
  patients?: {
    id: string;
    users?: {
      full_name: string;
    };
  };
}

export default function HistoryClient({ visits }: { visits: Visit[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = visits.filter((v) => {
    if (search && !v.patients?.users?.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (startDate && v.created_at < new Date(startDate).toISOString()) return false;
    if (endDate && v.created_at > new Date(endDate + "T23:59:59").toISOString()) return false;
    return true;
  });

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const statusColors: Record<string, string> = {
    completed: "bg-green-50 text-green-700",
    "in-progress": "bg-blue-50 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Start date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="End date"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Patient</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Diagnosis</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Duration</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((visit) => {
                const name = visit.patients?.users?.full_name || "Unknown";
                const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                const duration =
                  visit.started_at && visit.completed_at
                    ? `${differenceInMinutes(new Date(visit.completed_at), new Date(visit.started_at))} min`
                    : "—";

                return (
                  <tr key={visit.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(visit.created_at), "MMM dd, yyyy")}
                      <br />
                      <span className="text-xs text-gray-400">{format(new Date(visit.created_at), "hh:mm a")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">{initials}</div>
                        <span className="text-sm font-medium text-gray-900">{name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{visit.diagnosis || "—"}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-600">{duration}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${statusColors[visit.status] || "bg-gray-100 text-gray-600"}`}>
                        {visit.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No visits found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
