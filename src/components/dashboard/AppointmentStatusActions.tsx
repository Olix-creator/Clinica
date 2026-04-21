"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Check, Clock } from "lucide-react";
import type { AppointmentStatus } from "@/lib/data/appointments";
import { changeStatus } from "@/app/(dashboard)/doctor/actions";

export function AppointmentStatusActions({
  id,
  revalidate,
}: {
  id: string;
  revalidate?: string;
}) {
  const [pending, startTransition] = useTransition();

  function act(status: AppointmentStatus) {
    startTransition(async () => {
      const res = await changeStatus(id, status, revalidate);
      if (!res.ok) toast.error(res.error);
      else toast.success(status === "done" ? "Marked done" : "Status updated");
    });
  }

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="w-4 h-4 animate-spin text-on-surface-variant" />}
      <button
        type="button"
        disabled={pending}
        onClick={() => act("pending")}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-medium transition disabled:opacity-50"
      >
        <Clock className="w-3.5 h-3.5" />
        Waiting
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => act("done")}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed text-xs font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
      >
        <Check className="w-3.5 h-3.5" />
        Done
      </button>
    </div>
  );
}
