import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

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
} = {}): Promise<Clinic[]> {
  const supabase = await createClient();
  let q = supabase
    .from("clinics")
    .select("*")
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
  return data ?? [];
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

export async function createClinic({
  name,
  specialty,
  city,
  address,
  description,
}: {
  name: string;
  specialty?: string;
  city?: string;
  address?: string;
  description?: string;
}): Promise<{ data: Clinic | null; error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: "Clinic name is required" };

  const { data, error } = await supabase
    .from("clinics")
    .insert({
      name: trimmed,
      created_by: userData.user.id,
      specialty: specialty?.trim() || null,
      city: city?.trim() || null,
      address: address?.trim() || null,
      description: description?.trim() || null,
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
 * Escape ILIKE wildcards in user input so a search for "100%" stays literal.
 */
function escapeLike(raw: string): string {
  return raw.replace(/[%_\\]/g, (m) => `\\${m}`);
}
