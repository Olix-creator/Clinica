"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Stethoscope,
  ClipboardList,
  ArrowLeft,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "patient" | "doctor" | "receptionist";

const ROLES: { value: Role; label: string; icon: typeof User; description: string }[] = [
  { value: "patient", label: "Patient", icon: User, description: "Book visits" },
  { value: "doctor", label: "Doctor", icon: Stethoscope, description: "See today's schedule" },
  { value: "receptionist", label: "Reception", icon: ClipboardList, description: "Run the clinic" },
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailConfirmSent, setEmailConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

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
      console.error("[lumina] signup error:", signUpError.message);
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setEmailConfirmSent(true);
      setLoading(false);
    }
  }

  if (emailConfirmSent) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary-container/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-headline text-3xl font-semibold tracking-tight mb-3">Check your inbox.</h2>
        <p className="text-on-surface-variant mb-8">
          We&apos;ve sent a confirmation link to <span className="text-on-surface">{email}</span>. Confirm it to finish
          setting up your account.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 transition"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Create account</p>
        <h2 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">Join Lumina.</h2>
        <p className="text-on-surface-variant mt-3">Ten seconds to a calmer clinic.</p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-error-container/30 text-error border border-error/30 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            disabled={loading}
            className="w-full pl-12 pr-5 py-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/70 border border-outline-variant shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] transition disabled:opacity-60"
          />
        </div>

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
          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (optional)"
            disabled={loading}
            autoComplete="tel"
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
            placeholder="Password (min 6 chars)"
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

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3 ml-1">I am a</p>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(({ value, label, icon: Icon, description }) => {
              const selected = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  disabled={loading}
                  className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl transition active:scale-[0.98] disabled:opacity-60 ${
                    selected
                      ? "bg-primary/15 ring-2 ring-primary text-on-surface"
                      : "bg-surface-container-highest ring-1 ring-transparent hover:ring-outline-variant text-on-surface-variant"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${selected ? "text-primary" : ""}`} />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-[10px] text-on-surface-variant">{description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-8">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
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
