"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, UserCircle2, X } from "lucide-react";
import { searchPatientsAction } from "@/app/(dashboard)/receptionist/actions";
import type { PatientSearchHit } from "@/lib/data/appointments";

/**
 * Live patient combobox — types into an <input>, debounces 200ms, asks the
 * server for matches by name / email / phone. Selecting a hit promotes it to
 * a "pill" so the parent form can submit `patientId` directly (no email
 * round-trip on the server).
 */
export default function PatientSearchCombobox({
  name = "patientId",
  disabled,
  onSelect,
  selected,
}: {
  name?: string;
  disabled?: boolean;
  onSelect?: (hit: PatientSearchHit | null) => void;
  selected?: PatientSearchHit | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pending, startTransition] = useTransition();
  const hit = selected ?? null;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close the dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  function scheduleSearch(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const hits = await searchPatientsAction(q);
        setResults(hits);
        setActiveIdx(0);
      });
    }, 200);
  }

  function handleChange(v: string) {
    setQuery(v);
    setOpen(true);
    if (v.trim().length < 2) {
      setResults([]);
      return;
    }
    scheduleSearch(v);
  }

  function choose(h: PatientSearchHit) {
    onSelect?.(h);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function clear() {
    onSelect?.(null);
    setQuery("");
    setResults([]);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Hidden field so the form submits `patientId` */}
      <input type="hidden" name={name} value={hit?.id ?? ""} />

      {hit ? (
        <div className="flex items-center gap-2 bg-surface-container-highest rounded-xl px-3 py-3 border border-outline-variant/15">
          <UserCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">
              {hit.full_name ?? hit.email ?? "Patient"}
            </p>
            <p className="text-[11px] text-on-surface-variant truncate">
              {hit.phone ?? hit.email ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition"
            aria-label="Clear patient"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setOpen(query.trim().length >= 2)}
            onKeyDown={handleKey}
            disabled={disabled}
            placeholder="Search name, email, phone…"
            className="w-full rounded-xl bg-surface-container-highest border-0 pl-10 pr-9 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary transition disabled:opacity-60"
            autoComplete="off"
          />
          {pending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant animate-spin" />
          )}
        </div>
      )}

      {open && !hit && query.trim().length >= 2 && (
        <div className="absolute z-30 left-0 right-0 mt-2 rounded-xl bg-surface-container-high border border-outline-variant/20 shadow-[0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden">
          {results.length === 0 && !pending ? (
            <div className="px-4 py-3 text-sm text-on-surface-variant">
              No patients match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => choose(r)}
                    className={[
                      "w-full text-left px-4 py-3 flex items-center gap-3 transition",
                      i === activeIdx
                        ? "bg-surface-container-highest"
                        : "hover:bg-surface-container-highest/60",
                    ].join(" ")}
                  >
                    <UserCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {r.full_name ?? r.email ?? "Patient"}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {[r.phone, r.email].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
