"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, Stethoscope, User, ClipboardList, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

type Role = "doctor" | "patient" | "receptionist";

const ROLE_REDIRECT: Record<Role, string> = {
  doctor: "/doctor-dashboard",
  patient: "/patient-dashboard",
  receptionist: "/receptionist-dashboard",
};

export default function ChooseRolePage() {
  const { user, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/login");
  }, [isLoaded, isSignedIn, router]);

  // If already has profile, redirect
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          router.replace(ROLE_REDIRECT[data.role as Role] || "/patient-dashboard");
        }
      });
  }, [user, router]);

  async function selectRole(role: Role) {
    if (!user) return;
    setLoading(role);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        role,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || role,
        phone: null,
      });
      if (error) throw error;
      router.push(ROLE_REDIRECT[role]);
    } catch (err) {
      console.error("[Clinica] Error saving role:", err);
      setLoading(null);
    }
  }

  if (!isLoaded || !isSignedIn) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => selectRole("doctor")} disabled={!!loading}
            className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-primary p-8 text-center transition-all hover:shadow-xl hover:shadow-primary/10 active:scale-95 disabled:opacity-50 cursor-pointer">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              {loading === "doctor" ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Stethoscope className="w-8 h-8 text-primary" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Doctor</h3>
            <p className="text-sm text-gray-500">Manage patients & view appointments</p>
          </button>
          <button onClick={() => selectRole("patient")} disabled={!!loading}
            className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-green-500 p-8 text-center transition-all hover:shadow-xl hover:shadow-green-500/10 active:scale-95 disabled:opacity-50 cursor-pointer">
            <div className="w-16 h-16 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-500/10 transition-colors">
              {loading === "patient" ? <Loader2 className="w-8 h-8 animate-spin text-green-500" /> : <User className="w-8 h-8 text-green-600" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Patient</h3>
            <p className="text-sm text-gray-500">Book visits & manage health</p>
          </button>
          <button onClick={() => selectRole("receptionist")} disabled={!!loading}
            className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-orange-500 p-8 text-center transition-all hover:shadow-xl hover:shadow-orange-500/10 active:scale-95 disabled:opacity-50 cursor-pointer">
            <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
              {loading === "receptionist" ? <Loader2 className="w-8 h-8 animate-spin text-orange-500" /> : <ClipboardList className="w-8 h-8 text-orange-600" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Receptionist</h3>
            <p className="text-sm text-gray-500">Manage bookings & queue</p>
          </button>
        </div>
      </div>
    </div>
  );
}
