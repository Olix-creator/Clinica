"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function DateFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? "");

  function apply() {
    const qs = new URLSearchParams(params.toString());
    if (date) qs.set("date", date);
    else qs.delete("date");
    router.push(`/receptionist${qs.toString() ? `?${qs.toString()}` : ""}`);
  }

  function clear() {
    setDate("");
    router.push("/receptionist");
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <Button variant="outline" size="sm" onClick={apply}>
        Filter
      </Button>
      {params.get("date") && (
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear
        </Button>
      )}
    </div>
  );
}
