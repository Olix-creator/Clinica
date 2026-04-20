"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, Stethoscope, User, ClipboardList, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

type Role = "doctor" | "patient" | "receptionist";

export default function OnboardingPage() {
  const { user, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<Role | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/login");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) router.replace("/dashboard");
      });
  }, [user, router]);

  async function selectRole(role: Role) {
    if (!user) return;
    setLoading(role);
    setError("");
    const supabase = createClient();
    const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? null;
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email ?? null, full_name: fullName, role });
    if (insertError) {
      console.error("[clinica] onboarding insert error:", insertError.message);
      setError("Could not save your role. Please try again.");
      setLoading(null);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-gray-50 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Clinica</h1>
          <p className="text-gray-500 mt-1">Choose your role to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              { role: "doctor" as const, Icon: Stethoscope, title: "Doctor", desc: "Manage patients & appointments", accent: "text-primary bg-blue-50" },
              { role: "patient" as const, Icon: User, title: "Patient", desc: "Book visits & manage health", accent: "text-green-600 bg-green-50" },
              { role: "receptionist" as const, Icon: ClipboardList, title: "Receptionist", desc: "Manage bookings & queue", accent: "text-orange-600 bg-orange-50" },
            ] as const
          ).map(({ role, Icon, title, desc, accent }) => (
            <button
              key={role}
              onClick={() => selectRole(role)}
              disabled={!!loading}
              className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-primary p-8 text-center transition-all hover:shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${accent}`}>
                {loading === role ? <Loader2 className="w-8 h-8 animate-spin" /> : <Icon className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
