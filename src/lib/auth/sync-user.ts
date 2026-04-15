import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Ensures the authenticated Supabase user has a row in the `users` table.
 * Creates one with default role = "patient" if missing.
 */
export async function getOrCreateSupabaseUser() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  // Check if user already exists in the users table
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (existingUser) {
    return { user: existingUser, authUser };
  }

  // First user = admin, everyone else = patient
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  const role: string = (count ?? 0) === 0 ? "admin" : "patient";

  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.email?.split("@")[0] ||
    "User";

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      id: authUser.id,
      email: authUser.email || "",
      role,
      full_name: fullName,
      phone: authUser.phone || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[Clinica] Error creating user:", error);
    // Race condition — try fetching again
    if (error.code === "23505") {
      const { data: retryUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (retryUser) return { user: retryUser, authUser };
    }
    throw new Error(`Database error: ${error.message}`);
  }

  // Create role-specific profile
  if (role === "admin" || role === "doctor") {
    await supabase.from("doctors").insert({ user_id: newUser.id });
  } else {
    await supabase.from("patients").insert({ user_id: newUser.id });
  }

  return { user: newUser, authUser };
}

/**
 * Requires the current user to be a doctor or admin.
 * Redirects patients to their dashboard.
 */
export async function requireDoctor() {
  const { user } = await getOrCreateSupabaseUser();

  if (user.role !== "doctor" && user.role !== "admin") {
    redirect("/patient/dashboard");
  }

  const supabase = await createClient();
  const { data: doctorData } = await supabase
    .from("doctors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!doctorData) {
    const { data: created } = await supabase
      .from("doctors")
      .insert({ user_id: user.id })
      .select()
      .single();
    return { user, doctor: created! };
  }

  return { user, doctor: doctorData };
}

/**
 * Requires the current user to be a patient.
 * Redirects doctors to the dashboard.
 */
export async function requirePatient() {
  const { user } = await getOrCreateSupabaseUser();

  if (user.role !== "patient") redirect("/dashboard");

  const supabase = await createClient();
  const { data: patientData } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!patientData) {
    // Auto-create patient record if missing
    const { data: created } = await supabase
      .from("patients")
      .insert({ user_id: user.id })
      .select()
      .single();
    return { user, patient: created! };
  }

  return { user, patient: patientData };
}
