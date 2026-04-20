import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { AppointmentWithRelations } from "@/lib/data/appointments";

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AppointmentsTable({
  appointments,
}: {
  appointments: AppointmentWithRelations[];
}) {
  if (appointments.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500 text-sm">
        No appointments match this filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <Th>Date</Th>
            <Th>Clinic</Th>
            <Th>Doctor</Th>
            <Th>Patient</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {appointments.map((a) => (
            <tr key={a.id}>
              <Td>{fmt(a.appointment_date)}</Td>
              <Td>{a.clinic?.name ?? "—"}</Td>
              <Td>
                {a.doctor?.profile?.full_name ?? a.doctor?.profile?.email ?? "—"}
                {a.doctor?.specialty ? (
                  <span className="text-gray-400"> · {a.doctor.specialty}</span>
                ) : null}
              </Td>
              <Td>{a.patient?.full_name ?? a.patient?.email ?? "—"}</Td>
              <Td>
                <StatusBadge status={a.status} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-700">{children}</td>;
}
