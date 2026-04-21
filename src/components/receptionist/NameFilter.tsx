"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Live-search input that filters the appointments list by patient or doctor
 * name. Debounces URL updates so navigation doesn't thrash as the user types.
 */
export function NameFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const initialRef = useRef(initial);

  // Sync external URL changes (back/forward nav) back into the input.
  useEffect(() => {
    const qp = params.get("q") ?? "";
    if (qp !== initialRef.current) {
      initialRef.current = qp;
      setValue(qp);
    }
  }, [params]);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(params.toString());
      if (value.trim()) qs.set("q", value.trim());
      else qs.delete("q");
      const next = `/receptionist${qs.toString() ? `?${qs.toString()}` : ""}`;
      router.replace(next);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search patient or doctor…"
        className="w-full rounded-xl bg-surface-container-highest border-0 pl-10 pr-9 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary transition"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
