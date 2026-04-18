import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check profiles table for role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/choose-role");

  // Route to role-appropriate dashboard
  if (profile.role === "doctor") redirect("/doctor/dashboard");
  if (profile.role === "receptionist") redirect("/receptionist-dashboard");
  // Patient default
  redirect("/patient-dashboard");

  return <>{children}</>;
}
