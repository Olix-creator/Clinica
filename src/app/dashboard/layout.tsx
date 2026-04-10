import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Check if user has a profile
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile) {
    redirect("/choose-role");
  }

  // Redirect to role-specific dashboard
  if (profile.role === "doctor") {
    redirect("/doctor-dashboard");
  } else {
    redirect("/patient-dashboard");
  }

  return <>{children}</>;
}
