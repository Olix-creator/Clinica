import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://clinica-bice.vercel.app";
const EDGE_FN_URL =
  Deno.env.get("EDGE_FN_URL") ??
  "https://mixppfepddefteaelthu.supabase.co/functions/v1/google-auth";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${APP_URL}/login?error=${encodeURIComponent(error)}`, 302);
  }

  if (!code) {
    return Response.redirect(`${APP_URL}/login?error=no_code`, 302);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: EDGE_FN_URL,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("[google-auth] Token exchange failed:", JSON.stringify(tokens));
      return Response.redirect(`${APP_URL}/login?error=google_token_failed`, 302);
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      return Response.redirect(`${APP_URL}/login?error=no_email`, 302);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: createErr } = await supabase.auth.admin.createUser({
      email: googleUser.email,
      email_confirm: true,
      user_metadata: {
        full_name: googleUser.name ?? googleUser.email.split("@")[0],
        avatar_url: googleUser.picture ?? null,
        provider: "google",
      },
    });
    if (createErr && !createErr.message.toLowerCase().includes("already")) {
      console.error("[google-auth] createUser error:", createErr.message);
    }

    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: googleUser.email,
      options: { redirectTo: `${APP_URL}/auth/callback` },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("[google-auth] generateLink error:", linkErr?.message);
      return Response.redirect(`${APP_URL}/login?error=session_failed`, 302);
    }

    return Response.redirect(linkData.properties.action_link, 302);
  } catch (err) {
    console.error("[google-auth] Unexpected error:", err);
    return Response.redirect(`${APP_URL}/login?error=internal_error`, 302);
  }
});
