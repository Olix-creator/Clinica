"use client";

import { User } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Topbar({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string | null;
  role: "patient" | "doctor" | "receptionist";
}) {
  const initials = (fullName ?? email ?? "U").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="flex items-center justify-end gap-3 px-6 sm:px-10 h-16">
        <NotificationBell role={role} />
        <div className="flex items-center gap-3 pl-3 border-l border-outline-variant/30">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium leading-tight">{fullName ?? "Welcome"}</span>
            <span className="text-xs text-on-surface-variant leading-tight">{email}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary-fixed font-semibold shadow-emerald">
            {initials || <User className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </header>
  );
}
