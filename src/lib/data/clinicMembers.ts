import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ClinicMemberRole = Database["public"]["Enums"]["clinic_member_role"];
export type ClinicMember = Database["public"]["Tables"]["clinic_members"]["Row"];

export type ClinicMemberWithProfile = ClinicMember & {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    role: Database["public"]["Enums"]["app_role"];
  } | null;
};

export async function listClinicMembers(clinicId: string): Promise<ClinicMemberWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_members")
    .select(
      "*, profile:profiles!clinic_members_user_id_fkey(id, full_name, email, phone, role)",
    )
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[clinica] listClinicMembers:", error.message);
    return [];
  }
  return (data ?? []) as ClinicMemberWithProfile[];
}

export async function listClinicsForUser(): Promise<
  Array<{ id: string; name: string; role: ClinicMemberRole }>
> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("clinic_members")
    .select("role, clinic:clinics(id, name)")
    .eq("user_id", userData.user.id);
  if (error) {
    console.error("[clinica] listClinicsForUser:", error.message);
    return [];
  }
  // Supabase may type the nested relation as an array; normalize to the
  // single-row shape we actually get back for a to-one join.
  const rows = ((data ?? []) as unknown) as Array<{
    role: ClinicMemberRole;
    clinic: { id: string; name: string } | { id: string; name: string }[] | null;
  }>;

  // Dedup by clinic_id keeping highest-privilege role.
  const seen = new Map<string, { id: string; name: string; role: ClinicMemberRole }>();
  const weight: Record<ClinicMemberRole, number> = { owner: 3, doctor: 2, receptionist: 1 };
  for (const r of rows) {
    const clinic = Array.isArray(r.clinic) ? r.clinic[0] : r.clinic;
    if (!clinic) continue;
    const existing = seen.get(clinic.id);
    if (!existing || weight[r.role] > weight[existing.role]) {
      seen.set(clinic.id, { id: clinic.id, name: clinic.name, role: r.role });
    }
  }
  return Array.from(seen.values());
}

export async function listOwnedClinics(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("clinics")
    .select("id, name")
    .eq("created_by", userData.user.id)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[clinica] listOwnedClinics:", error.message);
    return [];
  }
  return data ?? [];
}

export async function findProfileByEmail(email: string): Promise<{
  id: string;
  full_name: string | null;
  email: string | null;
  role: Database["public"]["Enums"]["app_role"];
} | null> {
  const supabase = await createClient();
  const clean = email.trim();
  if (!clean) return null;
  const { data, error } = await supabase.rpc("find_profile_by_email", { lookup_email: clean });
  if (error) {
    console.error("[clinica] findProfileByEmail:", error.message);
    return null;
  }
  const rows = (data ?? []) as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    role: Database["public"]["Enums"]["app_role"];
  }>;
  return rows[0] ?? null;
}

export async function inviteClinicMember({
  clinicId,
  email,
  role,
}: {
  clinicId: string;
  email: string;
  role: Exclude<ClinicMemberRole, "owner">;
}): Promise<{ error: string | null }> {
  if (!clinicId) return { error: "Missing clinic" };
  if (!email.trim()) return { error: "Please enter an email address" };

  const target = await findProfileByEmail(email);
  if (!target) {
    return {
      error:
        "No user found with that email. Ask them to sign up first, then invite again.",
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not authenticated" };

  const { error } = await supabase.from("clinic_members").insert({
    clinic_id: clinicId,
    user_id: target.id,
    role,
    invited_by: userData.user.id,
  });
  if (error) {
    // unique_violation → already a member
    if (error.code === "23505") {
      return { error: "That user already holds this role in the clinic." };
    }
    console.error("[clinica] inviteClinicMember:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function removeClinicMember(memberId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("clinic_members").delete().eq("id", memberId);
  if (error) {
    console.error("[clinica] removeClinicMember:", error.message);
    return { error: error.message };
  }
  return { error: null };
}
