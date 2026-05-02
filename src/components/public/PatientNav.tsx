import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function initialsOf(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.split("@")[0] || "U";
  return src
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Patient-facing top nav — mirrors `PatientNav` from
 * `.design-handoff/pages/patient.jsx` exactly.
 *
 * Slim, sticky, blurred background. Used on /search, /clinic/[id],
 * and /booking when the visitor is browsing as a patient.
 */
export async function PatientNav() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.full_name ?? user.email ?? null;
  }
  const initials = user ? initialsOf(displayName, user.email ?? null) : null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(247, 248, 250, 0.8)",
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <div
        className="resp-page-pad"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          gap: 16,
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
          <span style={{ fontWeight: 600, fontSize: 17 }}>Clinica</span>
        </Link>

        <nav style={{ display: "flex", gap: 26, flex: 1 }}>
          <Link
            href="/search"
            style={{
              color: "var(--on-surface)",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Find clinics
          </Link>
          <Link
            href="/patient"
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            My visits
          </Link>
        </nav>

        {user ? (
          <Link
            href="/patient"
            aria-label="My account"
            style={{ display: "inline-flex", textDecoration: "none" }}
          >
            <span
              className="avatar"
              style={{
                width: 32,
                height: 32,
                background: "var(--primary-50)",
                color: "var(--primary-600)",
                fontSize: 12,
              }}
            >
              {initials}
            </span>
          </Link>
        ) : (
          <Link href="/login" className="btn ghost sm">
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
