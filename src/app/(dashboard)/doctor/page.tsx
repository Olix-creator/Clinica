import { requireRole } from "@/lib/auth";
import { getDoctorByProfile } from "@/lib/data/doctors";
import { getAppointmentsByRole } from "@/lib/data/appointments";
import { Card, CardContent } from "@/components/ui/Card";
import { AppointmentCard } from "@/components/dashboard/AppointmentCard";
import { AppointmentStatusActions } from "@/components/dashboard/AppointmentStatusActions";

export default async function DoctorPage() {
  const profile = await requireRole("doctor");
  const doctor = await getDoctorByProfile(profile.id);

  if (!doctor) {
    return (
      <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {profile.full_name ?? "Doctor"}
        </h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-600">You're not attached to a clinic yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Ask a receptionist to add you to their clinic.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: appointments } = await getAppointmentsByRole({ todayOnly: true });

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {profile.full_name ?? "Doctor"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Today's appointments.</p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-600">No appointments scheduled for today.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              perspective="doctor"
              actions={<AppointmentStatusActions id={a.id} revalidate="/doctor" />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
