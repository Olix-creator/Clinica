"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDoctorByProfile, updateDoctorProfile } from "@/lib/data/doctors";

export type DoctorProfileResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Server action backing /onboarding/doctor.
 *
 * Required fields per spec:
 *   - full name      (saved on profiles.full_name + doctors.name)
 *   - specialty
 *   - diploma / qualification
 *   - since_year
 *   - description    (optional)
 *
 * Doctors without a `doctors` row at all (signed up but never attached
 * to a clinic) get a friendly redirect — they can't fill the
 * profile-completion form because there's nothing to fill yet.
 */
export async function completeDoctorProfileAction(
  formData: FormData,
): Promise<DoctorProfileResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const diploma = String(formData.get("diploma") ?? "").trim();
  const sinceYearRaw = String(formData.get("sinceYear") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sinceYear = sinceYearRaw ? Number(sinceYearRaw) : NaN;

  if (!fullName) return { ok: false, error: "Full name is required" };
  if (!specialty) return { ok: false, error: "Specialty is required" };
  if (!diploma) return { ok: false, error: "Diploma / qualification is required" };
  if (!Number.isFinite(sinceYear) || sinceYear < 1900 || sinceYear > 2100) {
    return { ok: false, error: "Please enter a valid year" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Not authenticated" };

  // Persist the full name on the profile so it shows up everywhere
  // (booking, dashboards, /clinic/[id]) — even when the doctors row's
  // own `name` falls back to the profile.
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userData.user.id);
  if (profileErr) {
    console.error("[clinica] doctor profile name update:", profileErr.message);
    return { ok: false, error: profileErr.message };
  }

  const doctor = await getDoctorByProfile(userData.user.id);
  if (!doctor) {
    // No clinic → no doctors row to populate. Send them to the
    // dashboard where the empty-state explains how to get attached.
    return { ok: false, error: "You're not attached to a clinic yet. Ask a receptionist to add you." };
  }

  const { error } = await updateDoctorProfile({
    doctorId: doctor.id,
    name: fullName,
    specialty,
    diploma,
    sinceYear,
    description: description || undefined,
  });
  if (error) return { ok: false, error };

  revalidatePath("/doctor");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  if (doctor.clinic_id) {
    revalidatePath(`/clinic/${doctor.clinic_id}`);
  }
  return { ok: true };
}

/**
 * Doctors-only gate. Anonymous → /login; non-doctors → /dashboard.
 */
export async function requireDoctorForOnboarding(): Promise<void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?redirect=/onboarding/doctor");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profile?.role !== "doctor") {
    redirect("/dashboard");
  }
}
