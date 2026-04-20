import { requireRole } from "@/lib/auth";
import { listClinics } from "@/lib/data/clinics";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { BookingForm } from "@/components/booking/BookingForm";
import { bookAppointment } from "./actions";

export default async function BookingPage() {
  await requireRole("patient");
  const clinics = await listClinics();

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-gray-900">Book an appointment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pick a clinic, choose a doctor, and select a time.
          </p>
        </CardHeader>
        <CardContent>
          <BookingForm clinics={clinics} action={bookAppointment} />
        </CardContent>
      </Card>
    </div>
  );
}
