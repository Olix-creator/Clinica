"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const specialty = formData.get("specialty") as string;
  const clinicName = formData.get("clinic_name") as string;

  // Update users table
  const { error: userError } = await supabase
    .from("users")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (userError) return { error: userError.message };

  // Update doctors table
  const { error: doctorError } = await supabase
    .from("doctors")
    .update({ specialty, clinic_name: clinicName })
    .eq("user_id", user.id);

  if (doctorError) return { error: doctorError.message };

  revalidatePath("/doctor/settings");
  revalidatePath("/doctor");
  return { success: true };
}

export async function changePassword(_newPassword: string) {
  // Password changes handled via Supabase Auth
  return { error: "Password changes are managed through your account settings." };
}
