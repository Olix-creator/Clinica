"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export function StatusFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("status") ?? "";

  function pick(v: string) {
    const qs = new URLSearchParams(params.toString());
    if (v) qs.set("status", v);
    else qs.delete("status");
    router.push(`/receptionist${qs.toString() ? `?${qs.toString()}` : ""}`);
  }

  return (
    <div className="hide-scrollbar overflow-x-auto flex items-center gap-1 p-1 rounded-xl bg-surface-container-highest">
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value || "all"}
            onClick={() => pick(o.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              active
                ? "bg-primary text-on-primary-fixed shadow-emerald"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
