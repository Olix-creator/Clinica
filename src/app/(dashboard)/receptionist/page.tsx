import { requireRole } from "@/lib/auth";
import { listClinics } from "@/lib/data/clinics";
import { getAppointmentsByRole } from "@/lib/data/appointments";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { AppointmentsTable } from "@/components/receptionist/AppointmentsTable";
import { DateFilter } from "@/components/receptionist/DateFilter";
import { AddAppointmentModal } from "@/components/receptionist/AddAppointmentModal";
import { BootstrapPanel } from "@/components/receptionist/BootstrapPanel";

export default async function ReceptionistPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireRole("receptionist");
  const sp = await searchParams;
  const dateISO = sp.date || undefined;

  const [clinics, { data: appointments }] = await Promise.all([
    listClinics(),
    getAppointmentsByRole({ dateISO }),
  ]);

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {profile.full_name ?? "Receptionist"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage clinics, doctors, and appointments.</p>
      </div>

      <BootstrapPanel clinics={clinics} />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Appointments</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {dateISO ? `Filtered by ${dateISO}` : "All upcoming and past appointments"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateFilter />
            <AddAppointmentModal clinics={clinics} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AppointmentsTable appointments={appointments} />
        </CardContent>
      </Card>
    </div>
  );
}
