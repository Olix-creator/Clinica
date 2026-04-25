import { Bell, Search } from "lucide-react";

/**
 * Dashboard top bar — Clinica handoff design.
 *
 * Sticky, glass-blurred, holds the current page title + subtitle on
 * the left, search box + notification bell + actions slot on the right.
 * Pages render their own action button(s) by passing them into `actions`.
 */
export function DashTopbar({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(8px)",
        background: "rgba(247, 248, 250, 0.85)",
        borderBottom: "1px solid var(--outline-variant)",
        padding: "18px 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <div className="t-small" style={{ marginTop: 2 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <div
        className="hidden xl:block"
        style={{ position: "relative", flexShrink: 0 }}
      >
        <Search
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: 10,
            color: "var(--text-subtle)",
            pointerEvents: "none",
          }}
        />
        <input
          placeholder="Search…"
          style={{
            padding: "8px 12px 8px 36px",
            width: 260,
            borderRadius: 9,
            border: "1px solid var(--border-strong)",
            background: "var(--surface-bright)",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>
      <button
        type="button"
        className="btn ghost"
        style={{ position: "relative", padding: 10 }}
        aria-label="Notifications"
      >
        <Bell size={17} />
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "var(--primary)",
          }}
        />
      </button>
      {actions}
    </div>
  );
}
