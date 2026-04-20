import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    console.warn("[clinica] auth callback called without code param");
    return NextResponse.redirect(new URL("/login?error=no_code", url.origin));
  }

  const supabase = await createClient();
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !sessionData?.user) {
    console.error("[clinica] auth callback exchange error:", error?.message);
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", sessionData.user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
