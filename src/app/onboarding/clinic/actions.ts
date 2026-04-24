"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClinic } from "@/lib/data/clinics";

export type ClinicSetupResult =
  | { ok: true; clinicId: string }
  | { ok: false; error: string };

/**
 * Server action backing the `/onboarding/clinic` setup form.
 *
 * Unlike `createClinic()` in the data layer (which keeps phone/address
 * optional so legacy quick-add call sites still work), this action
 * ENFORCES the verification requirements the spec calls for:
 *   - name    required
 *   - phone   required (manual-approval gate uses it for callback)
 *   - address required (manual-approval gate uses it for proof)
 *
 * The resulting clinic row is created with `status = 'pending'`
 * (DB default from migration 0013), so it stays hidden from the
 * public search until an admin flips it to 'approved'. We still
 * redirect the owner into their dashboard — they can continue
 * setting up their team while approval is in flight.
 */
export async function createClinicOnboardingAction(
  formData: FormData,
): Promise<ClinicSetupResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const plan = String(formData.get("plan") ?? "free").trim();

  if (!name) return { ok: false, error: "Clinic name is required" };
  if (!phone) return { ok: false, error: "Phone is required for verification" };
  if (!address) return { ok: false, error: "Address is required for verification" };

  const { data, error } = await createClinic({
    name,
    phone,
    address,
    specialty: specialty || undefined,
    city: city || undefined,
    description: description || undefined,
  });
  if (error || !data) {
    return { ok: false, error: error ?? "Could not create clinic" };
  }

  // Premium requests are handled via email (see PremiumEnquiryButton).
  // The DB default sets plan_type='free' + trial_end_date=now+30d, so
  // the clinic already has a working trial regardless of which button
  // the user clicked on /pricing.
  void plan;

  revalidatePath("/doctor");
  revalidatePath("/receptionist");
  revalidatePath("/settings");
  return { ok: true, clinicId: data.id };
}

/**
 * Little helper so the page can force the user through /login first
 * if they landed on /onboarding/clinic without a session.
 */
export async function requireUserForOnboarding(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login?redirect=/pricing%3Fonboarding%3D1");
  }
}
