"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  Users,
  Building2,
  LifeBuoy,
  Sparkles,
  ClipboardList,
  Stethoscope,
  User,
  BarChart3,
} from "lucide-react";
import SignOutButton from "./SignOutButton";

type Role = "patient" | "doctor" | "receptionist";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<Role, NavItem[]> = {
  patient: [
    { href: "/patient", label: "Overview", icon: LayoutDashboard },
    { href: "/booking", label: "Book visit", icon: CalendarPlus },
  ],
  doctor: [
    { href: "/doctor", label: "Today", icon: Stethoscope },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ],
  receptionist: [
    { href: "/receptionist", label: "Schedule", icon: ClipboardList },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/booking", label: "New booking", icon: CalendarPlus },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  patient: "Patient",
  doctor: "Clinician",
  receptionist: "Reception",
};

const ROLE_ICON: Record<Role, typeof User> = {
  patient: User,
  doctor: Stethoscope,
  receptionist: ClipboardList,
};

export default function Sidebar({
  role,
  fullName,
  email,
  homeClinic,
}: {
  role: Role;
  fullName: string | null;
  email: string | null;
  homeClinic?: { name: string; plan: string; role: string } | null;
}) {
  const pathname = usePathname();
  const items = NAV[role] ?? [];
  const RoleIcon = ROLE_ICON[role];
  const primaryCta: NavItem | null = role === "patient"
    ? { href: "/booking", label: "Book an appointment", icon: CalendarPlus }
    : role === "receptionist"
    ? { href: "/booking", label: "New appointment", icon: CalendarPlus }
    : null;

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 z-40 flex-col bg-surface-container-low rounded-r-[3rem] py-8">
      <Link href="/dashboard" className="flex items-center gap-3 px-8 mb-10">
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-emerald">
          <Sparkles className="w-5 h-5 text-on-primary-fixed" />
        </span>
        <div>
          <p className="text-base font-semibold tracking-tight">Lumina</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Clinical</p>
        </div>
      </Link>

      <div className="px-6 mb-6 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-highest">
          <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <RoleIcon className="w-5 h-5 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fullName ?? email ?? "User"}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        {homeClinic && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container">
            <span className="w-10 h-10 rounded-xl bg-tertiary/15 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-tertiary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{homeClinic.name}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                {homeClinic.role === "owner" ? "Owner" : homeClinic.role === "doctor" ? "Doctor" : "Reception"}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
              {homeClinic.plan}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 space-y-3 mt-6">
        {primaryCta && (
          <Link
            href={primaryCta.href}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition text-sm"
          >
            <primaryCta.icon className="w-4 h-4" />
            {primaryCta.label}
          </Link>
        )}
        <div className="pt-3 border-t border-outline-variant/30 space-y-1">
          <a
            href="mailto:support@lumina.clinic"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition"
          >
            <LifeBuoy className="w-4 h-4" />
            Support
          </a>
          <SignOutButton variant="sidebar" />
        </div>
      </div>
    </aside>
  );
}
