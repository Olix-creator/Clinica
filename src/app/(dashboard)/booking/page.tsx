import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listClinics } from "@/lib/data/clinics";
import { BookingForm } from "@/components/booking/BookingForm";
import { bookAppointment } from "./actions";

export default async function BookingPage() {
  await requireRole("patient");
  const clinics = await listClinics();

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <Link
        href="/patient"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">New booking</p>
        <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">Book an appointment.</h1>
        <p className="text-on-surface-variant mt-2">
          Four quiet steps — pick a clinic, choose a doctor, set a time.
        </p>
      </div>

      <div className="rounded-[2rem] bg-surface-container-lowest p-6 sm:p-8 ring-1 ring-outline-variant/30">
        <BookingForm clinics={clinics} action={bookAppointment} />
      </div>
    </div>
  );
}
