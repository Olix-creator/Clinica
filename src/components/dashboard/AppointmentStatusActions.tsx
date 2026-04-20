"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
      else toast.success(status === "done" ? "Marked done" : "Updated");
    });
  }

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => act("pending")}
      >
        Waiting
      </Button>
      <Button size="sm" disabled={pending} onClick={() => act("done")}>
        Mark done
      </Button>
    </div>
  );
}
