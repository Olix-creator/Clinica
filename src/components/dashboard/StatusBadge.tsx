import { Badge } from "@/components/ui/Badge";
import type { AppointmentStatus } from "@/lib/data/appointments";

const MAP: Record<
  AppointmentStatus,
  { variant: "warning" | "info" | "success" | "danger"; label: string }
> = {
  pending: { variant: "warning", label: "Pending" },    // yellow
  confirmed: { variant: "info", label: "Confirmed" },   // blue
  done: { variant: "success", label: "Done" },          // green
  cancelled: { variant: "danger", label: "Cancelled" }, // red
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const m = MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
