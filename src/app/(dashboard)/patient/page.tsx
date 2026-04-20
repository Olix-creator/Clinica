import { CalendarPlus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAppointmentsByRole } from "@/lib/data/appointments";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AppointmentCard } from "@/components/dashboard/AppointmentCard";

export default async function PatientPage() {
  const profile = await requireRole("patient");
  const { data: appointments } = await getAppointmentsByRole();

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome, {profile.full_name ?? "there"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your upcoming and past appointments.</p>
        </div>
        <Button href="/booking">
          <CalendarPlus className="w-4 h-4 mr-2" />
          Book appointment
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-600">You have no appointments yet.</p>
            <p className="text-sm text-gray-400 mt-1">Book your first visit to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <AppointmentCard key={a.id} appointment={a} perspective="patient" />
          ))}
        </div>
      )}
    </div>
  );
}
