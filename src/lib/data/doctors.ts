import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Doctor = Database["public"]["Tables"]["doctors"]["Row"];
export type DoctorWithProfile = Doctor & {
  profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
  clinic: Pick<Database["public"]["Tables"]["clinics"]["Row"], "id" | "name"> | null;
};

export async function listDoctorsByClinic(clinicId: string): Promise<DoctorWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctors")
    .select("*, profile:profiles!doctors_profile_id_fkey(id, full_name, email), clinic:clinics(id, name)")
    .eq("clinic_id", clinicId);
  if (error) {
    console.error("[clinica] listDoctorsByClinic:", error.message);
    return [];
  }
  return (data ?? []) as DoctorWithProfile[];
}

export async function listAllDoctors(): Promise<DoctorWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctors")
    .select("*, profile:profiles!doctors_profile_id_fkey(id, full_name, email), clinic:clinics(id, name)");
  if (error) {
    console.error("[clinica] listAllDoctors:", error.message);
    return [];
  }
  return (data ?? []) as DoctorWithProfile[];
}

export async function getDoctorByProfile(profileId: string): Promise<Doctor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) {
    console.error("[clinica] getDoctorByProfile:", error.message);
    return null;
  }
  return data;
}

export async function addDoctorToClinic({
  profileId,
  clinicId,
  specialty,
  name,
}: {
  profileId: string;
  clinicId: string;
  specialty?: string;
  name?: string;
}): Promise<{ data: Doctor | null; error: string | null }> {
  const supabase = await createClient();

  // If no explicit name was provided, fall back to the linked profile's name.
  let resolvedName: string | null = name?.trim() || null;
  if (!resolvedName) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", profileId)
      .maybeSingle();
    resolvedName = prof?.full_name ?? prof?.email ?? "Doctor";
  }

  const { data, error } = await supabase
    .from("doctors")
    .insert({
      profile_id: profileId,
      clinic_id: clinicId,
      specialty: specialty?.trim() || null,
      name: resolvedName,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[clinica] addDoctorToClinic:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function updateDoctorProfile({
  doctorId,
  name,
  specialty,
}: {
  doctorId: string;
  name?: string;
  specialty?: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const patch: { name?: string | null; specialty?: string | null } = {};
  if (name !== undefined) patch.name = name.trim() || null;
  if (specialty !== undefined) patch.specialty = specialty.trim() || null;
  const { error } = await supabase.from("doctors").update(patch).eq("id", doctorId);
  if (error) {
    console.error("[clinica] updateDoctorProfile:", error.message);
    return { error: error.message };
  }
  return { error: null };
}
