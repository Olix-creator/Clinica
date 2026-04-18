"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Building2, UserCircle2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/patient-portal",             icon: Home,          label: "Home" },
  { href: "/patient-portal/appointments",icon: CalendarDays,  label: "Appointments" },
  { href: "/patient-portal/clinics",     icon: Building2,     label: "Clinics" },
  { href: "/patient-portal/profile",     icon: UserCircle2,   label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}>
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-primary" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
