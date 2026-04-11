import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getOrCreateSupabaseUser() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();

  // Check if user already exists in Supabase
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (existingUser) {
    return { user: existingUser, clerkUser: user };
  }

  // Determine role: first user ever = admin, everyone else = doctor
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  const role = (count ?? 0) === 0 ? "admin" : "doctor";

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "User";

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      role,
      full_name: fullName,
      phone: user.phoneNumbers?.[0]?.phoneNumber || null,
      avatar_url: user.imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Error creating Supabase user:",
      error.message,
      "| code:", error.code,
      "| details:", error.details,
      "| hint:", error.hint
    );
    // If it's a unique constraint error, try fetching again (race condition)
    if (error.code === "23505") {
      const { data: retryUser } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", user.id)
        .single();
      if (retryUser) return { user: retryUser, clerkUser: user };
    }
    throw new Error(`Database error: ${error.message || JSON.stringify(error)}`);
  }

  // Create the role-specific profile
  if (role === "doctor" || role === "admin") {
    await supabase.from("doctors").insert({
      user_id: newUser.id,
      specialty: null,
      clinic_name: null,
    });
  } else {
    await supabase.from("patients").insert({
      user_id: newUser.id,
    });
  }

  return { user: newUser, clerkUser: user };
}

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
    // Auto-create doctor profile if missing
    const { data: created } = await supabase
      .from("doctors")
      .insert({ user_id: user.id })
      .select()
      .single();
    return { user, doctor: created! };
  }

  return { user, doctor: doctorData };
}

export async function requirePatient() {
  const { user } = await getOrCreateSupabaseUser();

  if (user.role !== "patient") redirect("/dashboard");

  const supabase = await createClient();
  const { data: patientData } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!patientData) redirect("/sign-in");

  return { user, patient: patientData };
}

export async function requireReceptionist() {
  const { user } = await getOrCreateSupabaseUser();

  if (user.role !== "receptionist" && user.role !== "admin") {
    redirect("/dashboard");
  }

  return { user };
}
