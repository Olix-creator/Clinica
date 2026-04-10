"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();

  if (!user) return { error: "User not found" };

  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const specialty = formData.get("specialty") as string;
  const clinicName = formData.get("clinic_name") as string;

  const { error: userError } = await supabase
    .from("users")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (userError) return { error: userError.message };

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
  // Password management is now handled by Clerk
  // Users should change their password through Clerk's user profile
  return { error: "Password changes are managed through your account settings. Click on your profile to change your password." };
}
