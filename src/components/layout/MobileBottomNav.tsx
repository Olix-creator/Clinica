"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarPlus,
  User,
  BarChart3,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

type Role = "patient" | "doctor" | "receptionist";
type Item = { href: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<Role, Item[]> = {
  patient: [
    { href: "/patient", label: "Home", icon: LayoutDashboard },
    { href: "/patient#upcoming", label: "Visits", icon: CalendarCheck },
    { href: "/booking", label: "Book", icon: CalendarPlus },
    { href: "/profile", label: "Profile", icon: User },
  ],
  doctor: [
    { href: "/doctor", label: "Today", icon: Stethoscope },
    { href: "/analytics", label: "Insights", icon: BarChart3 },
    { href: "/booking", label: "Book", icon: CalendarPlus },
    { href: "/profile", label: "Profile", icon: User },
  ],
  receptionist: [
    { href: "/receptionist", label: "Schedule", icon: ClipboardList },
    { href: "/analytics", label: "Insights", icon: BarChart3 },
    { href: "/booking", label: "Book", icon: CalendarPlus },
    { href: "/profile", label: "Profile", icon: User },
  ],
};

export default function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV[role] ?? NAV.patient;

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-low/95 backdrop-blur-xl border-t border-outline-variant/30 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const cleanHref = item.href.split("#")[0];
          const active =
            pathname === cleanHref || pathname.startsWith(cleanHref + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition ${
                  active
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
                    active ? "bg-primary/15" : "bg-transparent"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
