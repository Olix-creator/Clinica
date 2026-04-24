import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listClinics } from "@/lib/data/clinics";
import { BookingForm } from "@/components/booking/BookingForm";
import { bookAppointment, loadBookedSlots, findNextAvailable } from "./actions";

/**
 * Booking page. Accepts optional `?clinicId=…&doctorId=…` search params so
 * the public /clinic/[id] page can deep-link a visitor straight to step 2
 * or step 3 of the wizard instead of making them pick the clinic again.
 */
export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ clinicId?: string; doctorId?: string }>;
}) {
  const profile = await requireRole("patient");
  const clinics = await listClinics();
  const { clinicId, doctorId } = await searchParams;

  // Validate the pre-selection against the clinic list — if the caller passes
  // a bogus id we ignore it rather than rendering a stuck wizard.
  const safeClinicId = clinicId && clinics.some((c) => c.id === clinicId) ? clinicId : "";
  const safeDoctorId = safeClinicId && doctorId ? doctorId : "";

  // Pre-fill the booking phone with whatever we already have on file.
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", profile.id)
    .maybeSingle();
  const initialPhone = row?.phone ?? "";

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <Link
        href={safeClinicId ? `/clinic/${safeClinicId}` : "/patient"}
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
        <BookingForm
          clinics={clinics}
          action={bookAppointment}
          loadSlots={loadBookedSlots}
          findSuggestion={findNextAvailable}
          initialPhone={initialPhone}
          initialClinicId={safeClinicId}
          initialDoctorId={safeDoctorId}
        />
      </div>
    </div>
  );
}
