import { Mail } from "lucide-react";

/**
 * Public footer — Clinica handoff design.
 *
 * Compact 5-column grid (brand + 4 link groups) on the landing page;
 * narrower discovery pages just inherit the same column structure
 * because the footer caps at 1200px and the columns wrap.
 */
export function PublicFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--outline-variant)",
        padding: "48px 32px 32px",
        background: "var(--surface)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
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
            </div>
            <p className="t-small" style={{ maxWidth: 280, lineHeight: 1.6 }}>
              The modern clinic management platform for patients and doctors.
            </p>
          </div>
          {[
            { t: "Product", l: ["Patient app", "Clinic dashboard", "Pricing", "Changelog"] },
            { t: "Company", l: ["About", "Careers", "Press", "Contact"] },
            { t: "Resources", l: ["Help center", "Guides", "Status", "Security"] },
            { t: "Legal", l: ["Terms", "Privacy", "Cookies", "GDPR"] },
          ].map((s) => (
            <div key={s.t}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                {s.t}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {s.l.map((link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      color: "var(--text-subtle)",
                      fontSize: 13,
                      textDecoration: "none",
                    }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid var(--outline-variant)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div className="t-small">
            © {new Date().getFullYear()} Clinica. All rights reserved.
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              color: "var(--text-subtle)",
              fontSize: 13,
            }}
          >
            <Mail size={14} /> hello@clinica.health
          </div>
        </div>
      </div>
    </footer>
  );
}
