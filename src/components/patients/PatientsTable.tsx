"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Filter, Search } from "lucide-react";
import type { PatientSummary } from "@/lib/data/patient-stats-utils";
import { isInactive } from "@/lib/data/patient-stats-utils";

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initialsOf(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.split("@")[0] || "U";
  return src
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_PALETTE = [
  { bg: "#DBEAFE", fg: "#1D4ED8" },
  { bg: "#DCFCE7", fg: "#15803D" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#FCE7F3", fg: "#BE185D" },
  { bg: "#E0E7FF", fg: "#4338CA" },
  { bg: "#CFFAFE", fg: "#0E7490" },
  { bg: "#FFE4E6", fg: "#BE123C" },
  { bg: "#F3E8FF", fg: "#7E22CE" },
];

function pickAvatar(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function tagFor(p: PatientSummary): { label: string; cls: string } {
  if (p.upcoming_count > 0) return { label: "Upcoming", cls: "primary" };
  if (isInactive(p.last_visit)) return { label: "Inactive", cls: "warn" };
  if ((p.total_visits ?? 0) <= 1) return { label: "New", cls: "primary" };
  if ((p.total_visits ?? 0) >= 3) return { label: "Recurring", cls: "success" };
  return { label: "Follow-up", cls: "" };
}

/**
 * PatientsTable — mirrors the design's data table layout exactly.
 *
 * Columns: Patient (avatar + name) · Age/Gender · Phone · Last visit ·
 * Visits · Tag · chevron. Filter chips switch the visible scope, the
 * search box narrows by name / email / phone.
 */
export function PatientsTable({ patients }: { patients: PatientSummary[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((p) => {
      const hay = [p.full_name, p.email, p.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [patients, query]);

  return (
    <div className="card" style={{ padding: 0 }}>
      {/* Filter row */}
      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--outline-variant)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, maxWidth: 340, minWidth: 240 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              color: "var(--text-subtle)",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            placeholder="Search by name, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              padding: "8px 12px 8px 32px",
              width: "100%",
              borderRadius: 8,
              border: "1px solid var(--outline-variant)",
              background: "var(--surface-bright)",
              fontSize: 13,
              color: "var(--on-surface)",
              outline: "none",
            }}
          />
        </div>
        <button type="button" className="btn secondary sm" disabled>
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "var(--bg)",
                borderBottom: "1px solid var(--outline-variant)",
              }}
            >
              {["Patient", "Phone", "Last visit", "Visits", "Tag", ""].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 18px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-subtle)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const name = p.full_name ?? p.email ?? "Unknown";
              const av = pickAvatar(name);
              const tag = tagFor(p);
              return (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: "1px solid var(--outline-variant)",
                  }}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <Link
                      href={`/patients/${p.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <span
                        className="avatar"
                        style={{
                          width: 32,
                          height: 32,
                          background: av.bg,
                          color: av.fg,
                          fontSize: 12,
                        }}
                      >
                        {initialsOf(p.full_name, p.email)}
                      </span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {name}
                        </div>
                        {p.email ? (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-subtle)",
                            }}
                          >
                            {p.email}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 13,
                      color: "var(--text-muted)",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {p.phone ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 13,
                      color: "var(--text-muted)",
                    }}
                  >
                    {shortDate(p.last_visit)}
                  </td>
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {p.total_visits}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span className={`chip ${tag.cls}`}>{tag.label}</span>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <Link
                      href={`/patients/${p.id}`}
                      aria-label={`Open ${name}`}
                      style={{ display: "inline-flex" }}
                    >
                      <ChevronRight
                        size={15}
                        style={{ color: "var(--text-faint)" }}
                      />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "var(--text-subtle)",
              fontSize: 14,
            }}
          >
            {query ? "No patients match that search." : "No patients yet."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
