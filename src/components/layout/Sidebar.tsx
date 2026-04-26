"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  Home,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";
import SignOutButton from "./SignOutButton";

type Role = "patient" | "doctor" | "receptionist";

type NavEntry = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: number;
};

/**
 * Sidebar — Clinica handoff design (`DashboardShell`).
 *
 * 240px-wide rail with:
 *   1. Logo + plan chip
 *   2. Clinic switcher card (`homeClinic`)
 *   3. Nav buttons with optional badge
 *   4. Free-trial usage card
 *   5. User row + sign out
 *
 * Per-role nav items are tuned to the routes that actually exist in
 * the app today. We don't surface routes that aren't implemented.
 */
export default function Sidebar({
  role,
  fullName,
  email,
  homeClinic,
  trial,
}: {
  role: Role;
  fullName: string | null;
  email: string | null;
  homeClinic?: { name: string; plan: string; role: string } | null;
  trial?: { used: number; limit: number; planLabel: string } | null;
}) {
  const pathname = usePathname();

  const NAV: Record<Role, NavEntry[]> = {
    patient: [
      { href: "/patient", label: "Overview", icon: Home },
      // Booking starts at /search — patients pick a clinic, then book
      // inline on /clinic/[id]. No standalone booking page.
      { href: "/search", label: "Book visit", icon: Plus },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
    doctor: [
      { href: "/doctor", label: "Today", icon: Home },
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
    receptionist: [
      { href: "/receptionist", label: "Schedule", icon: Calendar },
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  };
  const items = NAV[role] ?? [];

  const initials = (fullName ?? email ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const planLabel = trial?.planLabel ?? homeClinic?.plan ?? "FREE";

  return (
    <aside
      className="hidden lg:flex"
      style={{
        position: "fixed",
        inset: "0 auto 0 0",
        width: 240,
        zIndex: 40,
        background: "var(--surface-bright)",
        borderRight: "1px solid var(--outline-variant)",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* Logo + plan chip */}
      <Link
        href="/dashboard"
        style={{
          padding: "18px 18px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          color: "var(--on-surface)",
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
        <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>
          Clinica
        </span>
        <span
          className="chip primary"
          style={{ marginLeft: "auto", fontSize: 10, padding: "2px 7px" }}
        >
          {planLabel.toUpperCase()}
        </span>
      </Link>

      {/* Clinic switcher */}
      {homeClinic ? (
        <div style={{ padding: "4px 12px 12px" }}>
          <button
            type="button"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              background: "var(--bg-muted)",
              border: "1px solid var(--outline-variant)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "var(--primary)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Building2 size={15} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {homeClinic.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>
                {homeClinic.role === "owner"
                  ? "Owner"
                  : homeClinic.role === "doctor"
                    ? "Doctor"
                    : "Reception"}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: "var(--text-subtle)" }} />
          </button>
        </div>
      ) : null}

      {/* Nav */}
      <nav
        style={{
          padding: "4px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Ic = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "9px 12px",
                borderRadius: 10,
                background: active ? "var(--primary-tint)" : "transparent",
                color: active ? "var(--primary-600)" : "var(--text-muted)",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                textDecoration: "none",
                transition: "background .1s ease, color .1s ease",
              }}
            >
              <Ic size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: active
                      ? "var(--primary)"
                      : "var(--outline-variant)",
                    color: active ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer: usage card + user row */}
      <div style={{ marginTop: "auto", padding: 12 }}>
        {trial ? <UsageCard trial={trial} /> : null}
        <hr className="sep" style={{ margin: "12px 0" }} />
        <div
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
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
              background: "#dbeafe",
              color: "#1d4ed8",
              fontSize: 11,
            }}
          >
            {initials}
          </span>
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--on-surface)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {fullName ?? email ?? "User"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-subtle)",
                textTransform: "capitalize",
              }}
            >
              {role}
            </div>
          </div>
          <SignOutButton variant="sidebar-icon" />
        </div>
      </div>
    </aside>
  );
}

function UsageCard({
  trial,
}: {
  trial: { used: number; limit: number; planLabel: string };
}) {
  const pct = Math.min(100, Math.round((trial.used / trial.limit) * 100));
  const left = Math.max(0, trial.limit - trial.used);
  return (
    <div
      style={{
        padding: 14,
        background: "var(--surface)",
        border: "1px solid var(--outline-variant)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600 }}>{trial.planLabel}</span>
        <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>
          {trial.used} / {trial.limit}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--outline-variant)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--primary)",
            borderRadius: 999,
          }}
        />
      </div>
      <div className="t-small" style={{ marginTop: 8, lineHeight: 1.4 }}>
        {left} appointments left this month.
      </div>
      <Link
        href="/pricing"
        className="btn primary sm"
        style={{ width: "100%", marginTop: 10 }}
      >
        <Sparkles size={13} /> Go Premium
      </Link>
    </div>
  );
}
