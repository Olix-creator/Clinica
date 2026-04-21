"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({
  variant = "ghost",
}: {
  variant?: "ghost" | "sidebar";
}) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const cls =
    variant === "sidebar"
      ? "w-full inline-flex items-center gap-3 text-sm font-medium text-on-surface-variant hover:text-on-surface px-4 py-3 rounded-xl hover:bg-surface-container-highest transition disabled:opacity-50"
      : "inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-xl hover:bg-surface-container-highest transition disabled:opacity-50";

  return (
    <button onClick={handleSignOut} disabled={loading} className={cls}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      Sign out
    </button>
  );
}
