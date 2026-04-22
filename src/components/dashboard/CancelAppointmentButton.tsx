"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Cancel button with a small confirm step. Delegates the actual DB write to
 * whichever server action the caller passes in (doctor vs receptionist —
 * they revalidate different paths).
 */
export default function CancelAppointmentButton({
  id,
  action,
  variant = "ghost",
  label = "Cancel",
}: {
  id: string;
  action: (formData: FormData) => Promise<ActionResult>;
  variant?: "ghost" | "danger";
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function doCancel() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await action(fd);
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      toast.success("Appointment cancelled");
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={doCancel}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/15 text-error text-xs font-semibold hover:bg-error/25 transition disabled:opacity-50"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="px-3 py-2 rounded-xl bg-surface-container-highest text-on-surface text-xs font-medium hover:bg-surface-bright transition disabled:opacity-50"
        >
          Keep
        </button>
      </div>
    );
  }

  const base =
    variant === "danger"
      ? "bg-error/15 text-error hover:bg-error/25"
      : "bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-error";

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition border border-outline-variant/15 ${base}`}
    >
      <XCircle className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
