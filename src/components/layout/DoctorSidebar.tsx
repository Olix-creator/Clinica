"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  SquarePlus,
  Clock,
  Settings,
  Briefcase,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { useI18n } from "@/lib/i18n/context";

interface DoctorSidebarProps {
  doctorName: string;
  specialty: string;
  avatarUrl?: string | null;
}

export default function DoctorSidebar({ doctorName, specialty }: DoctorSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();
  const nav = t("nav");

  const navItems = [
    { href: "/doctor/dashboard", label: nav.dashboard, icon: LayoutDashboard },
    { href: "/doctor/appointments", label: nav.appointments, icon: CalendarDays },
    { href: "/doctor/patients", label: nav.patients, icon: Users },
    { href: "/doctor/queue", label: nav.queue, icon: SquarePlus },
    { href: "/doctor/history", label: nav.history, icon: Clock },
  ];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6">
        <Link href="/doctor/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary leading-none">Clinica</h1>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              {nav.medicalPortal}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-full" />
              )}
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 mb-4">
        <Link
          href="/doctor/settings"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === "/doctor/settings"
              ? "text-primary bg-primary/5"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Settings className="w-5 h-5 text-gray-400" />
          {nav.settings}
        </Link>
      </div>

      {/* Doctor Profile */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
            {doctorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{doctorName}</p>
            <p className="text-xs text-gray-500 truncate">{specialty}</p>
          </div>
          <SignOutButton redirectUrl="/sign-in">
            <button type="button" className="text-gray-400 hover:text-gray-600" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="w-64 h-full bg-white flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col h-screen fixed left-0 top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
