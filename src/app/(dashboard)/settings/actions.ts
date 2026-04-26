"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteClinic, updateClinicProfile } from "@/lib/data/clinics";
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
