"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Gets the authenticated Supabase user + their profile row.
 * Redirects to /login if not authenticated, /choose-role if no profile.
 */
export async function getAuthUserWithProfile() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, phone")
    .eq("id", authUser.id)
    .single();

  if (!profile) redirect("/choose-role");

  const displayName =
    profile.name ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split("@")[0] ||
    "User";

  return {
    authUser,
    profile,
    // Synthetic user object compatible with old DoctorLayout/PatientLayout
    user: {
      id: authUser.id,
      clerk_id: null,
      email: authUser.email || "",
      role: profile.role as "doctor" | "patient" | "admin",
      full_name: displayName,
      phone: profile.phone || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      created_at: authUser.created_at || new Date().toISOString(),
    },
  };
}

/**
 * Requires the current user to be a doctor (or receptionist acting as doctor).
 * Redirects if wrong role.
 */
export async function requireDoctor() {
  const { authUser, profile, user } = await getAuthUserWithProfile();

  if (profile.role !== "doctor") {
    if (profile.role === "receptionist") redirect("/receptionist-dashboard");
    redirect("/patient-dashboard");
  }

  const supabase = await createClient();

  // Get or auto-create doctors record keyed by authUser.id
  let { data: doctorData } = await supabase
    .from("doctors")
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (!doctorData) {
    const { data: created } = await supabase
      .from("doctors")
      .insert({ user_id: authUser.id })
      .select()
      .single();
    doctorData = created;
  }

  return { user, doctor: doctorData! };
}

/**
 * Requires the current user to be a patient.
 * Redirects doctors to their dashboard.
 */
export async function requirePatient() {
  const { authUser, profile, user } = await getAuthUserWithProfile();

  if (profile.role !== "patient") {
    if (profile.role === "doctor") redirect("/doctor-dashboard");
    redirect("/receptionist-dashboard");
  }

  const supabase = await createClient();

  // Get or auto-create patients record
  let { data: patientData } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (!patientData) {
    const { data: created } = await supabase
      .from("patients")
      .insert({ user_id: authUser.id })
      .select()
      .single();
    patientData = created;
  }

  return { user, patient: patientData! };
}

/**
 * Legacy: kept for auth/actions.ts compatibility.
 * Returns the auth user and a profile-based user object.
 */
export async function getOrCreateSupabaseUser() {
  const { authUser, user } = await getAuthUserWithProfile();
  return { user, authUser };
}
