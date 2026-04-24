"use server";

import { revalidatePath } from "next/cache";
import { updateClinicProfile } from "@/lib/data/clinics";

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

  if (!clinicId) return { ok: false, error: "Missing clinic id" };

  const { error } = await updateClinicProfile(clinicId, {
    name,
    phone,
    address,
    city,
    specialty,
    description,
  });
  if (error) return { ok: false, error };

  revalidatePath("/settings");
  revalidatePath(`/clinic/${clinicId}`);
  revalidatePath("/doctor");
  revalidatePath("/receptionist");
  return { ok: true };
}
