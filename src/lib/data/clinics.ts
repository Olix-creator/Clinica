import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

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

export async function createClinic({ name }: { name: string }): Promise<{ data: Clinic | null; error: string | null }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: "Clinic name is required" };

  const { data, error } = await supabase
    .from("clinics")
    .insert({ name: trimmed, created_by: userData.user.id })
    .select("*")
    .single();

  if (error) {
    console.error("[clinica] createClinic:", error.message);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}
