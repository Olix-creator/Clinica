import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Public header — Clinica handoff design.
 *
 * Sticky, glass background, brand on the left, nav links + auth CTAs
 * on the right. Mirrors `pages/landing.jsx → TopNav` from the handoff
 * but adapts the buttons to a real auth state.
 */
export async function PublicHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isSignedIn = Boolean(data.user);

  return (
    <div
      className="glass"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--on-surface)",
            textDecoration: "none",
          }}
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: "var(--primary)" }}
            aria-hidden
          >
            <path d="M12 2a7 7 0 0 0-7 7v6.2a4.8 4.8 0 1 0 2.4 0V9a4.6 4.6 0 1 1 9.2 0v.2a3.2 3.2 0 1 0 1.6 0V9a7 7 0 0 0-6.2-7Z" />
            <circle cx="6.2" cy="18.8" r="2" />
            <circle cx="18.2" cy="10.8" r="1.6" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em" }}>
            Clinica
          </span>
        </Link>

        <nav
          style={{ display: "flex", gap: 26, flex: 1 }}
          className="hidden md:flex"
        >
          <Link
            href="/search"
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Find a clinic
          </Link>
          <Link
            href="/pricing"
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Pricing
          </Link>
        </nav>

        {isSignedIn ? (
          <Link href="/dashboard" className="btn primary">
            Dashboard <ArrowRight size={15} />
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn ghost">
              Sign in
            </Link>
            <Link href="/search" className="btn secondary">
              Find a clinic
            </Link>
            <Link href="/pricing?onboarding=1" className="btn primary">
              Create clinic <ArrowRight size={15} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
