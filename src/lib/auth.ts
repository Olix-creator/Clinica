import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "patient" | "doctor" | "receptionist";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  created_at: string;
};

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user };
}

export async function requireUser() {
  const { user } = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[clinica] getProfile error:", error.message);
    return null;
  }
  return data as Profile | null;
}

export async function requireProfile(): Promise<{ user: { id: string; email: string | null }; profile: Profile }> {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/onboarding");
  return { user: { id: user.id, email: user.email ?? null }, profile };
}

export async function requireRole(role: AppRole): Promise<Profile> {
  const { profile } = await requireProfile();
  if (profile.role !== role) redirect("/dashboard");
  return profile;
}
