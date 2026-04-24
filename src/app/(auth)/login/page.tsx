"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Resolve a post-login destination from the `?next=` query param.
 *
 * Guardrails:
 *   - must be a relative path starting with `/`
 *   - must NOT start with `//` or `/\` (those would become scheme-relative URLs)
 *   - falls back to `/dashboard` on anything sketchy
 *
 * Anything goes to the dashboard unless we can prove the target is safe and
 * local, which kills the classic open-redirect footgun.
 */
function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/dashboard";
  return raw;
}

const GOOGLE_CLIENT_ID = "35747672771-j771sf9s3j1l1ocb7ae7jmo8028710rt.apps.googleusercontent.com";
const EDGE_FN_URL = "https://mixppfepddefteaelthu.supabase.co/functions/v1/google-auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      console.error("[lumina] login error:", signInError.message);
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: EDGE_FN_URL,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Sign in</p>
        <h2 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">Welcome back.</h2>
        <p className="text-on-surface-variant mt-3">
          Sign in to your Lumina Clinical workspace.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-error-container/30 text-error border border-error/30 text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-surface-container-highest hover:bg-surface-bright active:scale-[0.98] transition font-medium disabled:opacity-50 mb-6"
      >
        {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-outline-variant/40" />
        <span className="text-xs tracking-[0.2em] text-on-surface-variant uppercase">Or</span>
        <div className="flex-1 h-px bg-outline-variant/40" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com"
            disabled={loading}
            className="w-full pl-12 pr-5 py-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/70 border border-outline-variant shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] transition disabled:opacity-60"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={loading}
            className="w-full pl-12 pr-12 py-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/70 border border-outline-variant shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] transition disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-8">
        New to Lumina?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
