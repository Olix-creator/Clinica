"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Calendar, X } from "lucide-react";

export function DateFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? "");

  function apply(next: string) {
    const qs = new URLSearchParams(params.toString());
    if (next) qs.set("date", next);
    else qs.delete("date");
    router.push(`/receptionist${qs.toString() ? `?${qs.toString()}` : ""}`);
  }

  function clear() {
    setDate("");
    apply("");
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-highest">
      <Calendar className="w-4 h-4 text-on-surface-variant" />
      <input
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          apply(e.target.value);
        }}
        className="bg-transparent border-0 text-sm text-on-surface focus:outline-none [color-scheme:light]"
      />
      {params.get("date") && (
        <button
          onClick={clear}
          className="text-on-surface-variant hover:text-on-surface transition"
          aria-label="Clear filter"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
