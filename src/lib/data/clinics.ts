import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type ClinicSearchResult = Clinic & { distance_km?: number | null };

/**
 * Doctor row shape we hand to public pages. Intentionally narrow —
 * only the two fields we actually render, so a schema change elsewhere
 * doesn't ripple into the discovery UI.
 */
export type PublicDoctor = {
  id: string;
  name: string | null;
  specialty: string | null;
};

/**
 * Pull every clinic, newest first. Used by the authenticated /booking
 * flow's clinic picker.
 */
export async function listClinics(): Promise<Clinic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[clinica] listClinics:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Directory search for the public /search page.
 *
 *   city       → substring, case-insensitive (ILIKE "%city%")
 *   specialty  → substring, case-insensitive (ILIKE "%specialty%") — the
 *                dropdown hands us a known value today, but partial match
 *                keeps us forgiving if a clinic stores e.g. "Cardiology —
 *                adults" while the dropdown shows "Cardiology".
 *   query      → free-text search across name / description / specialty
 *
 * All three are optional. Missing filter = don't narrow.
 * Relies on the public RLS policy added in migration 0011 so this call
 * works for anonymous visitors as well as signed-in users.
 */
export async function searchClinics({
  query,
  city,
  specialty,
  limit = 48,
}: {
  query?: string;
  city?: string;
  specialty?: string;
  limit?: number;
} = {}): Promise<ClinicSearchResult[]> {
  const startedAt = Date.now();
  const supabase = await createClient();
  let q = supabase
    .from("clinics")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  const city_ = city?.trim();
  if (city_) q = q.ilike("city", `%${escapeLike(city_)}%`);

  const specialty_ = specialty?.trim();
  if (specialty_) q = q.ilike("specialty", `%${escapeLike(specialty_)}%`);

  const query_ = query?.trim();
  if (query_) {
    const like = `%${escapeLike(query_)}%`;
    q = q.or(
      [
        `name.ilike.${like}`,
        `description.ilike.${like}`,
        `specialty.ilike.${like}`,
      ].join(","),
    );
  }

  const { data, error } = await q;
  if (error) {
    console.error("[clinica] searchClinics:", error.message);
    return [];
  }
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs > 500) {
    console.warn("[clinica] searchClinics slow query:", { elapsedMs, city, specialty });
  }
  return data ?? [];
}

export async function searchClinicsNearby({
  latitude,
  longitude,
  radiusKm = 10,
  query,
  city,
  specialty,
  limit = 48,
}: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  query?: string;
  city?: string;
  specialty?: string;
  limit?: number;
}): Promise<ClinicSearchResult[]> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
  const startedAt = Date.now();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_clinics_nearby", {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radiusKm,
    p_city: city?.trim() || null,
    p_specialty: specialty?.trim() || null,
    p_query: query?.trim() || null,
    p_limit: limit,
  });
  if (error) {
    console.error("[clinica] searchClinicsNearby:", error.message);
    return [];
  }
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs > 500) {
    console.warn("[clinica] searchClinicsNearby slow query:", {
      elapsedMs,
      radiusKm,
      city,
      specialty,
    });
  }
  return ((data ?? []) as ClinicSearchResult[]).map((row) => ({
    ...row,
    distance_km: row.distance_km ?? null,
  }));
}

/**
 * Single clinic by id, or null if the row doesn't exist or RLS filters it.
 */
export async function getClinicById(id: string): Promise<Clinic | null> {
  if (!id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (error) {
    console.error("[clinica] getClinicById:", error.message);
    return null;
  }
  return data;
}

/**
 * Doctors for a clinic, flattened + denormalised to the minimal shape the
 * public clinic page needs: { id, name, specialty }.
 *
 * We prefer `doctors.name` when set (manually edited by the receptionist),
 * falling back to the linked profile's `full_name`. Specialty comes from
 * the `doctors` row only — it's the clinical role at that clinic.
 */
export async function listPublicDoctorsByClinic(
  clinicId: string,
): Promise<PublicDoctor[]> {
  if (!clinicId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctors")
    .select(
      "id, name, specialty, profile:profiles!doctors_profile_id_fkey(full_name)",
    )
    .eq("clinic_id", clinicId);
  if (error) {
    console.error("[clinica] listPublicDoctorsByClinic:", error.message);
    return [];
  }
  type Row = {
    id: string;
    name: string | null;
    specialty: string | null;
    profile: { full_name: string | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    name: r.name ?? r.profile?.full_name ?? null,
    specialty: r.specialty,
  }));
}

/**
 * Distinct specialty strings seen across the clinic directory. Feeds the
 * specialty <select> on /search. We cap the list to keep the dropdown
 * usable; if a clinic has a one-off specialty string it will still show up
 * as a tag on its own card even if it's truncated out of the dropdown.
 */
export async function listClinicSpecialties(limit = 40): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select("specialty")
    .not("specialty", "is", null)
    .order("specialty", { ascending: true })
    .limit(500);
  if (error) {
    console.error("[clinica] listClinicSpecialties:", error.message);
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of data ?? []) {
    const s = (row.specialty ?? "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Create a clinic. Thin insert helper — it does NOT enforce the verification
 * requirements (phone + address) so that legacy call sites
 * (receptionist quick-add, doctor "create a clinic" panel) keep working.
 * The dedicated onboarding flow at `/onboarding/clinic` layers its own
 * validation on top so new sign-ups always provide phone + address for
 * the manual-approval gate.
 *
 * The row lands with `status = 'pending'` (DB default from migration
 * 0013), plan_type = 'free', and trial_end_date = now + 30 days.
 */
export async function createClinic({
  name,
  phone,
  address,
  specialty,
  city,
  description,
  latitude,
  longitude,
  locationSource,
  locationAccuracyM,
  lastGeocodedAt,
}: {
  name: string;
  phone?: string;
  address?: string;
  specialty?: string;
  city?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: "map_pin" | "address_geocode" | "manual_coords";
  locationAccuracyM?: number;
  lastGeocodedAt?: string;
}): Promise<{ data: Clinic | null; error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  const name_ = name.trim();
  if (!name_) return { data: null, error: "Clinic name is required" };

  const { data, error } = await supabase
    .from("clinics")
    .insert({
      name: name_,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      created_by: userData.user.id,
      specialty: specialty?.trim() || null,
      city: city?.trim() || null,
      description: description?.trim() || null,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      location_source: locationSource ?? null,
      location_accuracy_m: Number.isFinite(locationAccuracyM)
        ? locationAccuracyM
        : null,
      last_geocoded_at: lastGeocodedAt ?? null,
      // status / plan_type / trial_end_date / monthly_appointments_count
      // come from DB defaults so we always get a consistent clock start.
    })
    .select("*")
    .single();

  if (error) {
    console.error("[clinica] createClinic:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Update the clinic-profile fields the owner can edit from the settings
 * page. Row-level security enforces `auth.uid() = created_by`, so a
 * mismatched user can't update someone else's clinic. `status` and
 * `plan_type` are intentionally NOT accepted here — only the admin can
 * flip those values.
 */
export async function updateClinicProfile(
  clinicId: string,
  patch: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    specialty?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    location_source?: "map_pin" | "address_geocode" | "manual_coords";
    location_accuracy_m?: number;
    last_geocoded_at?: string;
  },
): Promise<{ data: Clinic | null; error: string | null }> {
  if (!clinicId) return { data: null, error: "Missing clinic id" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  // Drop empty strings — "" from an untouched form field should not
  // overwrite an existing value with null.
  const norm = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);

  const update = {
    name: norm(patch.name),
    phone: norm(patch.phone),
    address: norm(patch.address),
    city: norm(patch.city),
    specialty: norm(patch.specialty),
    description: norm(patch.description),
    latitude: Number.isFinite(patch.latitude) ? patch.latitude : undefined,
    longitude: Number.isFinite(patch.longitude) ? patch.longitude : undefined,
    location_source: patch.location_source,
    location_accuracy_m: Number.isFinite(patch.location_accuracy_m)
      ? patch.location_accuracy_m
      : undefined,
    last_geocoded_at: patch.last_geocoded_at,
  };

  for (const key of Object.keys(update) as Array<keyof typeof update>) {
    if (update[key] === undefined) {
      delete (update as Record<string, unknown>)[key];
    }
  }

  const { data, error } = await supabase
    .from("clinics")
    .update(update)
    .eq("id", clinicId)
    .select("*")
    .single();

  if (error) {
    console.error("[clinica] updateClinicProfile:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

/**
 * Hard-delete the clinic. Migration 0015 added an RLS DELETE policy
 * scoped to `auth.uid() = created_by`, so this call is rejected by
 * Postgres unless the caller actually created the clinic. We do a
 * pre-flight check too so we can return a friendly error instead of a
 * raw RLS rejection if a non-owner somehow gets a button.
 *
 * Cascading rules from prior migrations:
 *   - doctors / clinic_members → ON DELETE CASCADE  (auto-removed)
 *   - appointments              → ON DELETE RESTRICT  (blocks the call;
 *                                  caller must cancel them first)
 *
 * If the RESTRICT triggers we surface a clear "you have appointments
 * still attached" message rather than the cryptic 23503 fk error.
 */
export async function deleteClinic(
  clinicId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!clinicId) return { ok: false, error: "Missing clinic id" };
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Not authenticated" };

  // Pre-flight: load the clinic's created_by so we can short-circuit
  // and return a friendly error if the caller isn't the creator.
  const { data: row, error: lookupErr } = await supabase
    .from("clinics")
    .select("id, created_by")
    .eq("id", clinicId)
    .maybeSingle();
  if (lookupErr) {
    console.error("[clinica] deleteClinic lookup:", lookupErr.message);
    return { ok: false, error: lookupErr.message };
  }
  if (!row) return { ok: false, error: "Clinic not found" };
  if (row.created_by !== userData.user.id) {
    return { ok: false, error: "Only the clinic creator can delete it." };
  }

  const { error } = await supabase
    .from("clinics")
    .delete()
    .eq("id", clinicId);
  if (error) {
    console.error("[clinica] deleteClinic:", error.message, error.code);
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "This clinic still has appointments attached. Cancel them first, then try again.",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Pricing / trial gate. Calls the `clinic_can_accept_booking` RPC added
 * in migration 0013. The RPC encapsulates:
 *   - status must be 'approved'
 *   - premium → always ok
 *   - free → trial_end_date must be in the future AND < 50 appointments this month
 * Returns a plain shape the UI can render directly.
 */
export type ClinicBookingCheck = {
  ok: boolean;
  reason: string | null;
  planType: "free" | "premium";
  trialDaysLeft: number;
  countThisMonth: number;
  trialEndDate: string | null;
};

export async function canClinicAcceptBooking(
  clinicId: string,
): Promise<ClinicBookingCheck> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("clinic_can_accept_booking", { p_clinic_id: clinicId })
    .single();
  if (error || !data) {
    console.error("[clinica] canClinicAcceptBooking:", error?.message);
    // Fail closed: if the RPC is unreachable we block the booking.
    return {
      ok: false,
      reason: error?.message ?? "Could not verify clinic plan status",
      planType: "free",
      trialDaysLeft: 0,
      countThisMonth: 0,
      trialEndDate: null,
    };
  }
  const row = data as {
    ok: boolean;
    reason: string | null;
    plan_type: "free" | "premium";
    trial_days_left: number;
    count_this_month: number;
    trial_end_date: string | null;
  };
  return {
    ok: row.ok,
    reason: row.reason,
    planType: row.plan_type ?? "free",
    trialDaysLeft: row.trial_days_left ?? 0,
    countThisMonth: row.count_this_month ?? 0,
    trialEndDate: row.trial_end_date,
  };
}

/**
 * Escape ILIKE wildcards in user input so a search for "100%" stays literal.
 */
function escapeLike(raw: string): string {
  return raw.replace(/[%_\\]/g, (m) => `\\${m}`);
}
