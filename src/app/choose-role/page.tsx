"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, Stethoscope, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ChooseRolePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Check if user already has a profile
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
          router.replace(data.role === "doctor" ? "/doctor-dashboard" : "/patient-dashboard");
        }
      });
  }, [user, router]);

  async function selectRole(role: "doctor" | "patient") {
    if (!user) return;
    setLoading(role);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        role,
        name: role === "doctor"
          ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Doctor"
          : null,
        phone: null,
      });

      if (error) throw error;

      if (role === "doctor") {
        router.push("/doctor-dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      console.error("Error saving role:", err);
      setLoading(null);
    }
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Clinica</h1>
          <p className="text-gray-500 mt-1">Choose your role to get started</p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Doctor */}
          <button
            onClick={() => selectRole("doctor")}
            disabled={!!loading}
            className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-primary p-8 text-center transition-all hover:shadow-xl hover:shadow-primary/10 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              {loading === "doctor" ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : (
                <Stethoscope className="w-8 h-8 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">I am a Doctor</h3>
            <p className="text-sm text-gray-500">Manage patients and appointments</p>
          </button>

          {/* Patient */}
          <button
            onClick={() => selectRole("patient")}
            disabled={!!loading}
            className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-green-500 p-8 text-center transition-all hover:shadow-xl hover:shadow-green-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <div className="w-16 h-16 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-500/10 transition-colors">
              {loading === "patient" ? (
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              ) : (
                <User className="w-8 h-8 text-green-600" />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">I am a Patient</h3>
            <p className="text-sm text-gray-500">Book visits and manage health</p>
          </button>
        </div>
      </div>
    </div>
  );
}
