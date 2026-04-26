import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProfile, getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listClinics } from "@/lib/data/clinics";
import { BookingForm } from "@/components/booking/BookingForm";
import {
  bookAppointment,
  loadBookedSlots,
  findNextAvailable,
} from "./actions";

/**
 * Booking page — single source of truth for the patient booking flow.
 *
 * Every booking entry point (landing page, /search → /clinic/[id],
 * /patient dashboard) routes here so the UI is identical across surfaces.
 *
 * Optional `?clinicId=…&doctorId=…` deep-links jump the wizard
 * straight to the appropriate step instead of forcing the user to
 * re-pick a clinic they already chose.
 *
 * Auth flow is bespoke (not `requireRole`) so we preserve intent
 * across login: anonymous click → `/login?redirect=/booking?…`,
 * auth pages bounce back here on success.
 */
export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ clinicId?: string; doctorId?: string }>;
}) {
  const sp = await searchParams;
  const passthrough = new URLSearchParams();
  if (sp.clinicId) passthrough.set("clinicId", sp.clinicId);
  if (sp.doctorId) passthrough.set("doctorId", sp.doctorId);
  const target = passthrough.toString()
    ? `/booking?${passthrough.toString()}`
    : "/booking";

  const { user } = await getSession();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(target)}`);
  }
  const profile = await getProfile(user.id);
  if (!profile) {
    redirect(`/onboarding?redirect=${encodeURIComponent(target)}`);
  }
  if (profile.role !== "patient") redirect("/dashboard");

  const clinics = await listClinics();
  const { clinicId, doctorId } = sp;

  const safeClinicId =
    clinicId && clinics.some((c) => c.id === clinicId) ? clinicId : "";
  const safeDoctorId = safeClinicId && doctorId ? doctorId : "";

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", profile.id)
    .maybeSingle();
  const initialPhone = row?.phone ?? "";

  const backHref = safeClinicId ? `/clinic/${safeClinicId}` : "/patient";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 48px" }}>
      <Link
        href={backHref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-muted)",
          textDecoration: "none",
          fontSize: 13,
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      <div style={{ marginBottom: 28 }}>
        <p className="t-eyebrow">New booking</p>
        <h1 className="t-h2" style={{ marginTop: 8 }}>
          Book an appointment.
        </h1>
        <p className="t-body" style={{ marginTop: 8 }}>
          Four quiet steps — pick a clinic, choose a doctor, set a time.
        </p>
      </div>

      <div className="card" style={{ padding: "24px 24px 28px" }}>
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
