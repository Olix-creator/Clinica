import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import NotificationBell from "@/components/layout/NotificationBell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar role={profile.role} fullName={profile.full_name} email={profile.email} />

      {/* Mobile topbar (branding) — only shown on small screens */}
      <div className="lg:hidden sticky top-0 z-40 bg-surface-container-low/90 backdrop-blur-xl border-b border-outline-variant/30">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-emerald">
              <Sparkles className="w-4 h-4 text-on-primary-fixed" />
            </span>
            <span className="text-base font-semibold">Lumina</span>
          </Link>
          <NotificationBell role={profile.role} />
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Desktop topbar */}
        <div className="hidden lg:block">
          <Topbar fullName={profile.full_name} email={profile.email} role={profile.role} />
        </div>

        <main className="px-4 sm:px-6 lg:px-10 py-8 pb-24">{children}</main>
      </div>
    </div>
  );
}
