"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, Stethoscope, User, ClipboardList, Loader2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

type Role = "doctor" | "patient" | "receptionist";

const ROLES: { role: Role; Icon: typeof User; title: string; desc: string }[] = [
  { role: "patient", Icon: User, title: "Patient", desc: "Book visits, track records, stay in the loop." },
  { role: "doctor", Icon: Stethoscope, title: "Doctor", desc: "See today's schedule and priority reviews." },
  { role: "receptionist", Icon: ClipboardList, title: "Receptionist", desc: "Run the clinic — the quiet way." },
];

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
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? null;
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email ?? null, full_name: fullName, role });
    if (insertError) {
      console.error("[lumina] onboarding insert error:", insertError.message);
      setError("Could not save your role. Please try again.");
      setLoading(null);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-10">
          <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-emerald mb-5">
            <Sparkles className="w-5 h-5 text-on-primary-fixed" />
          </span>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">One more step</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Who&apos;s using Lumina today?
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-md">
            Pick the role that fits. You can always change it later.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-error-container/30 border border-error/30 text-sm text-error text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {ROLES.map(({ role, Icon, title, desc }) => {
            const isLoading = loading === role;
            return (
              <button
                key={role}
                onClick={() => selectRole(role)}
                disabled={!!loading}
                className="group w-full flex items-center gap-5 p-6 rounded-2xl bg-surface-container-low hover:bg-surface-container-highest transition disabled:opacity-50 active:scale-[0.99] text-left"
              >
                <span className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Icon className="w-6 h-6 text-primary" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-base">{title}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
