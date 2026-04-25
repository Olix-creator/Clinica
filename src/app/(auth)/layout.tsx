import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { getSession } from "@/lib/auth";

/**
 * Auth shell — Clinica handoff design.
 *
 * Two-column split: form on the left (centered, 400px max),
 * gradient visual on the right with a clinic preview card and
 * a doctor testimonial. Each child page renders just the form
 * column contents — title, subtitle, body, and footer link.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSession();
  if (user) redirect("/dashboard");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {/* Left: form column */}
      <div
        style={{
          padding: "40px 64px",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
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

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 400 }}>{children}</div>
        </div>

        <div className="t-small">
          © {new Date().getFullYear()} Clinica ·{" "}
          <a href="#" style={{ color: "var(--text-subtle)" }}>
            Terms
          </a>{" "}
          ·{" "}
          <a href="#" style={{ color: "var(--text-subtle)" }}>
            Privacy
          </a>
        </div>
      </div>

      {/* Right: visual */}
      <div
        className="hidden lg:flex"
        style={{
          background:
            "linear-gradient(140deg, var(--primary-50) 0%, #fff 50%, var(--bg-muted) 100%)",
          borderLeft: "1px solid var(--outline-variant)",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 40%, var(--primary-tint), transparent 50%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 440 }}>
          <div
            className="card"
            style={{ padding: 24, boxShadow: "var(--elev-3)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--primary-50)",
                  color: "var(--primary-600)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Next appointment
                </div>
                <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>
                  Tomorrow · 10:00 AM
                </div>
              </div>
            </div>
            <div className="ph-stripe" style={{ height: 140 }}>
              <span style={{ opacity: 0.7 }}>clinic photo</span>
            </div>
            <div style={{ marginTop: 14, fontSize: 14, fontWeight: 600 }}>
              Clinique El Djazair
            </div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>
              Dr. Amira Belkacem · General Practice
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              maxWidth: 380,
            }}
          >
            &ldquo;We replaced our paper agenda and phone chaos in a single
            weekend. Bookings went up 40% in a month.&rdquo;
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                className="avatar"
                style={{
                  width: 28,
                  height: 28,
                  background: "#dcfce7",
                  color: "#15803d",
                  fontSize: 11,
                }}
              >
                NS
              </span>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--on-surface)",
                  }}
                >
                  Dr. Nadia Saadi
                </div>
                <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>
                  Sunshine Pediatrics · Algiers
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
