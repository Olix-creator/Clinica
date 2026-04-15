import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Clinica] Auth callback error:", error.message);
      return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
    }

    console.log("[Clinica] Auth callback success, redirecting to:", redirectTo);
    return NextResponse.redirect(new URL(redirectTo, url.origin));
  }

  console.warn("[Clinica] Auth callback called without code param");
  return NextResponse.redirect(new URL("/login?error=no_code", url.origin));
}
