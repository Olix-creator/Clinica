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
}: {
  profileId: string;
  clinicId: string;
  specialty?: string;
}): Promise<{ data: Doctor | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctors")
    .insert({ profile_id: profileId, clinic_id: clinicId, specialty: specialty ?? null })
    .select("*")
    .single();
  if (error) {
    console.error("[clinica] addDoctorToClinic:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}
