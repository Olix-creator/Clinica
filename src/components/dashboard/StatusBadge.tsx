import { Badge } from "@/components/ui/Badge";
import type { AppointmentStatus } from "@/lib/data/appointments";

const MAP: Record<AppointmentStatus, { variant: "warning" | "info" | "success" | "neutral"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  confirmed: { variant: "info", label: "Confirmed" },
  done: { variant: "success", label: "Done" },
  cancelled: { variant: "neutral", label: "Cancelled" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const m = MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
