"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Phone,
  Mail,
  Clock,
  Repeat,
  AlertCircle,
  History,
  Calendar,
} from "lucide-react";
import type { PatientSummary } from "@/lib/data/patient-stats-utils";
import { isInactive } from "@/lib/data/patient-stats-utils";
import PatientHistoryModal from "@/components/doctor/PatientHistoryModal";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(label: string): string {
  return label
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Filter = "all" | "upcoming" | "inactive";

/**
 * Client-side search + filter for the patient roster.
 *
 * We do everything locally because the payload (the caller's roster) is
 * bounded and already fetched server-side. Heavier searches would move
 * to a server action later.
 */
export function PatientsList({ patients }: { patients: PatientSummary[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (filter === "upcoming" && p.upcoming_count === 0) return false;
      if (filter === "inactive" && !isInactive(p.last_visit)) return false;
      if (!needle) return true;
      const hay = [p.full_name, p.email, p.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [patients, query, filter]);

  const counts = useMemo(() => {
    let upcoming = 0;
    let inactive = 0;
    for (const p of patients) {
      if (p.upcoming_count > 0) upcoming++;
      if (isInactive(p.last_visit)) inactive++;
    }
    return { all: patients.length, upcoming, inactive };
  }, [patients]);

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="rounded-2xl bg-surface-container-low p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-highest border-0 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary transition"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <FilterPill
            label={`All · ${counts.all}`}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterPill
            label={`Upcoming · ${counts.upcoming}`}
            active={filter === "upcoming"}
            onClick={() => setFilter("upcoming")}
          />
          <FilterPill
            label={`Inactive > 6m · ${counts.inactive}`}
            active={filter === "inactive"}
            onClick={() => setFilter("inactive")}
            warning
          />
        </div>
      </div>

      {/* Card grid — cards always, no tables (mobile-first). */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-low p-10 text-center text-on-surface-variant">
          No patients match your search.
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <PatientCard key={p.id} patient={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  warning = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  warning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition",
        active
          ? warning
            ? "bg-tertiary-container text-on-tertiary-container ring-1 ring-tertiary/50"
            : "bg-primary text-on-primary-fixed shadow-emerald"
          : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function PatientCard({ patient }: { patient: PatientSummary }) {
  const name = patient.full_name ?? patient.email ?? "Patient";
  const inactive = isInactive(patient.last_visit);
  const hasVisits = patient.total_visits > 0;

  return (
    <li
      className={[
        "rounded-2xl p-4 bg-surface-container-low ring-1 transition",
        inactive
          ? "ring-tertiary/30 bg-tertiary-container/15"
          : "ring-outline-variant/15 hover:ring-outline-variant/30",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-on-surface-variant">
            {initials(name)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <PatientHistoryModal
            patientId={patient.id}
            patientName={name}
            trigger={
              <h3
                className="text-sm sm:text-base font-semibold truncate hover:text-primary hover:underline underline-offset-2 decoration-primary/50 transition-colors"
                title="View patient history"
              >
                {name}
              </h3>
            }
          />
          {patient.phone && (
            <p className="text-xs text-on-surface-variant inline-flex items-center gap-1 mt-0.5 truncate">
              <Phone className="w-3 h-3 flex-shrink-0" />
              {patient.phone}
            </p>
          )}
          {patient.email && !patient.phone && (
            <p className="text-xs text-on-surface-variant inline-flex items-center gap-1 mt-0.5 truncate">
              <Mail className="w-3 h-3 flex-shrink-0" />
              {patient.email}
            </p>
          )}
        </div>
        {patient.upcoming_count > 0 && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 ring-1 ring-primary/20 rounded-full px-2 py-0.5">
            <Calendar className="w-3 h-3" />
            {patient.upcoming_count}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-outline-variant/15 flex items-center flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-medium">
        {hasVisits ? (
          <>
            <span
              className={[
                "inline-flex items-center gap-1",
                inactive ? "text-on-tertiary-container" : "text-on-surface-variant",
              ].join(" ")}
            >
              {inactive ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              Last visit{" "}
              {patient.last_visit ? shortDate(patient.last_visit) : "—"}
            </span>
            <span className="inline-flex items-center gap-1 text-on-surface-variant">
              <Repeat className="w-3 h-3" />
              {patient.total_visits}{" "}
              {patient.total_visits === 1 ? "visit" : "visits"}
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-primary">
            <History className="w-3 h-3" />
            First visit upcoming
          </span>
        )}
      </div>
    </li>
  );
}
