"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Stethoscope,
  ClipboardList,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "patient" | "doctor" | "receptionist";

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "patient", label: "Patient", description: "Book visits" },
  { value: "doctor", label: "Doctor", description: "See your schedule" },
  { value: "receptionist", label: "Reception", description: "Run the clinic" },
];

const ROLE_ICON: Record<Role, typeof User> = {
  patient: User,
  doctor: Stethoscope,
  receptionist: ClipboardList,
};

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A8.99 8.99 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1-.28-1.72c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.98 8.98 0 0 0 9 0 8.99 8.99 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/dashboard";
  return raw;
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(
    searchParams.get("redirect") ?? searchParams.get("next"),
  );
  const loginHref =
    next && next !== "/dashboard"
      ? `/login?redirect=${encodeURIComponent(next)}`
      : "/login";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailConfirmSent, setEmailConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const digits = trimmedPhone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 20) {
        setError("Please enter a valid phone number.");
        setLoading(false);
        return;
      }
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, phone: trimmedPhone || null },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      console.error("[clinica] signup error:", signUpError.message);
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setEmailConfirmSent(true);
      setLoading(false);
    }
  }

  if (emailConfirmSent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--success-50)",
            color: "var(--success)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 24px",
          }}
        >
          <CheckCircle2 size={32} />
        </div>
        <h1 className="t-h2" style={{ marginBottom: 8 }}>
          Check your inbox.
        </h1>
        <p className="t-body" style={{ marginBottom: 24 }}>
          We&apos;ve sent a confirmation link to{" "}
          <span style={{ color: "var(--on-surface)", fontWeight: 500 }}>{email}</span>
          . Confirm it to finish setting up your account.
        </p>
        <Link
          href={loginHref}
          className="btn primary"
          style={{ padding: "12px 18px" }}
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="t-h2" style={{ marginBottom: 8 }}>
        Create your account
      </h1>
      <p className="t-body" style={{ marginBottom: 32 }}>
        Start in under a minute. No credit card required.
      </p>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #fecaca",
            background: "var(--danger-50)",
            color: "var(--danger)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <button
        type="button"
        className="btn secondary"
        style={{ width: "100%", padding: 11, gap: 10 }}
        disabled={loading}
        onClick={() => {
          // Match the login page Google flow.
          const params = new URLSearchParams({
            client_id:
              "35747672771-j771sf9s3j1l1ocb7ae7jmo8028710rt.apps.googleusercontent.com",
            redirect_uri:
              "https://mixppfepddefteaelthu.supabase.co/functions/v1/google-auth",
            response_type: "code",
            scope: "openid email profile",
            access_type: "online",
            prompt: "select_account",
          });
          window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        }}
      >
        <GoogleIcon />
        Sign up with Google
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "20px 0",
          color: "var(--text-faint)",
          fontSize: 12,
        }}
      >
        <hr className="sep" style={{ flex: 1 }} /> OR{" "}
        <hr className="sep" style={{ flex: 1 }} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="field-label">First name</label>
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Amira"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="field-label">Last name</label>
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Belkacem"
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label className="field-label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="field-label">Phone (optional)</label>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+213 …"
            disabled={loading}
          />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={6}
            disabled={loading}
          />
        </div>

        <div>
          <label className="field-label">I am a</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {ROLES.map((opt) => {
              const selected = role === opt.value;
              const Ic = ROLE_ICON[opt.value];
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  disabled={loading}
                  style={{
                    padding: "14px 8px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: "var(--surface-bright)",
                    border: selected
                      ? "1.5px solid var(--primary)"
                      : "1px solid var(--outline-variant)",
                    boxShadow: selected
                      ? "0 0 0 3px var(--primary-tint)"
                      : "none",
                    color: selected ? "var(--primary-600)" : "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "all .12s ease",
                  }}
                >
                  <Ic size={18} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-subtle)",
                    }}
                  >
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label
          style={{
            display: "flex",
            gap: 8,
            fontSize: 12,
            color: "var(--text-muted)",
            alignItems: "flex-start",
            marginTop: 4,
          }}
        >
          <input type="checkbox" defaultChecked style={{ marginTop: 2 }} />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        <button
          className="btn primary"
          type="submit"
          style={{ padding: 12, marginTop: 4 }}
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="t-small" style={{ marginTop: 22, textAlign: "center" }}>
        Already have an account?{" "}
        <Link
          href={loginHref}
          style={{ color: "var(--primary-600)", fontWeight: 500 }}
        >
          Sign in
        </Link>
      </div>
    </>
  );
}
