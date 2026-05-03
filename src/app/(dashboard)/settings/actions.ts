"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteClinic, updateClinicProfile } from "@/lib/data/clinics";
import { getDoctorByProfile, updateDoctorProfile } from "@/lib/data/doctors";
import { geocodeClinicAddress } from "@/lib/maps/geocoding";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Owner-only clinic profile edit. Wraps `updateClinicProfile` which
 * relies on the `clinics_update_own` RLS policy (migration 0013) so
 * a mismatched user can't patch someone else's clinic even if they
 * guess the id.
 */
export async function updateClinicProfileAction(
  formData: FormData,
): Promise<Result> {
  const clinicId = String(formData.get("clinicId") ?? "");
  const name = String(formData.get("name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const address = String(formData.get("address") ?? "");
  const city = String(formData.get("city") ?? "");
  const specialty = String(formData.get("specialty") ?? "");
  const description = String(formData.get("description") ?? "");
  const sinceYearRaw = String(formData.get("sinceYear") ?? "").trim();
  const trustReason = String(formData.get("trustReason") ?? "");
  const sinceYear = sinceYearRaw ? Number(sinceYearRaw) : undefined;
  const latitudeRaw = String(formData.get("latitude") ?? "");
  const longitudeRaw = String(formData.get("longitude") ?? "");
  const latitude = latitudeRaw.trim() ? Number(latitudeRaw) : undefined;
  const longitude = longitudeRaw.trim() ? Number(longitudeRaw) : undefined;
  const geocoded = address.trim()
    ? await geocodeClinicAddress(address, city)
    : null;

  if (!clinicId) return { ok: false, error: "Missing clinic id" };
  if (latitude !== undefined && Number.isFinite(latitude) && (latitude < -90 || latitude > 90)) {
    return { ok: false, error: "Latitude must be between -90 and 90" };
  }
  if (longitude !== undefined && Number.isFinite(longitude) && (longitude < -180 || longitude > 180)) {
    return { ok: false, error: "Longitude must be between -180 and 180" };
  }

  const { error } = await updateClinicProfile(clinicId, {
    name,
    phone,
    address,
    city,
    specialty,
    description,
    sinceYear: Number.isFinite(sinceYear) ? sinceYear : undefined,
    trustReason,
    latitude:
      Number.isFinite(latitude) ? latitude : (geocoded?.latitude ?? undefined),
    longitude:
      Number.isFinite(longitude) ? longitude : (geocoded?.longitude ?? undefined),
    location_source: Number.isFinite(latitude) && Number.isFinite(longitude)
      ? "manual_coords"
      : geocoded?.locationSource,
    location_accuracy_m:
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? 5
        : (geocoded?.locationAccuracyM ?? undefined),
    last_geocoded_at:
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? new Date().toISOString()
        : geocoded?.lastGeocodedAt,
  });
  if (error) return { ok: false, error };

  revalidatePath("/settings");
  revalidatePath(`/clinic/${clinicId}`);
  revalidatePath("/doctor");
  revalidatePath("/receptionist");
  return { ok: true };
}

/**
 * Permanently delete a clinic. Backed by `deleteClinic` in
 * `src/lib/data/clinics.ts` which checks `created_by === auth.uid()`
 * before issuing the SQL DELETE — and is double-protected by the
 * `clinics_delete_own` RLS policy added in migration 0015.
 *
 * On success we bust caches and redirect the owner away from any URL
 * that might reference the deleted row (the clinic detail page would
 * 404, the dashboard would still show stale state without revalidate).
 */
export async function deleteClinicAction(formData: FormData): Promise<Result> {
  const clinicId = String(formData.get("clinicId") ?? "");
  if (!clinicId) return { ok: false, error: "Missing clinic id" };

  const res = await deleteClinic(clinicId);
  if (!res.ok) return res;

  revalidatePath("/settings");
  revalidatePath("/doctor");
  revalidatePath("/receptionist");
  revalidatePath("/search");
  // Make /clinic/[id] return 404 for visitors who had it bookmarked.
  revalidatePath(`/clinic/${clinicId}`);
  redirect("/settings");
}

/**
 * Doctor self-service profile update — runs from /settings.
 *
 * The current user's `doctors` row is resolved by `profile_id` so a
 * doctor can never edit another doctor's row. The /onboarding/doctor
 * action is the same code path but enforces required fields strictly;
 * here we only re-validate what was actually submitted, so a doctor
 * can leave description blank without erroring.
 */
export async function updateDoctorProfileAction(
  formData: FormData,
): Promise<Result> {
  const fullName = String(formData.get("fullName") ?? "");
  const specialty = String(formData.get("specialty") ?? "");
  const diploma = String(formData.get("diploma") ?? "");
  const sinceYearRaw = String(formData.get("sinceYear") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const sinceYear = sinceYearRaw ? Number(sinceYearRaw) : undefined;

  if (sinceYear !== undefined) {
    if (
      !Number.isFinite(sinceYear) ||
      sinceYear < 1900 ||
      sinceYear > 2100
    ) {
      return { ok: false, error: "Please enter a valid year" };
    }
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Not authenticated" };

  const trimmedName = fullName.trim();
  if (trimmedName) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ full_name: trimmedName })
      .eq("id", userData.user.id);
    if (profileErr) {
      console.error("[clinica] doctor settings name update:", profileErr.message);
      return { ok: false, error: profileErr.message };
    }
  }

  const doctor = await getDoctorByProfile(userData.user.id);
  if (!doctor) {
    // No doctors row yet — nothing to update besides the name we
    // already saved on the profile. Still return ok so the toast fires.
    revalidatePath("/settings");
    revalidatePath("/doctor");
    return { ok: true };
  }

  const { error } = await updateDoctorProfile({
    doctorId: doctor.id,
    name: trimmedName || undefined,
    specialty: specialty || undefined,
    diploma: diploma || undefined,
    sinceYear,
    description,
  });
  if (error) return { ok: false, error };

  revalidatePath("/settings");
  revalidatePath("/doctor");
  if (doctor.clinic_id) {
    revalidatePath(`/clinic/${doctor.clinic_id}`);
  }
  return { ok: true };
}
