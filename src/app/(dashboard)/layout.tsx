import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import NotificationBell from "@/components/layout/NotificationBell";
import { clinicMemberService } from "@/lib/services/clinicMemberService";
import { subscriptionService } from "@/lib/services/subscriptionService";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();

  // Staff (doctor / receptionist) get a "home clinic" chip in the sidebar.
  let homeClinic: { name: string; plan: string; role: string } | null = null;
  if (profile.role !== "patient") {
    const clinics = await clinicMemberService.listClinicsForUser();
    if (clinics.length > 0) {
      const first = clinics[0];
      const sub = await subscriptionService.get(first.id);
      homeClinic = {
        name: first.name,
        plan: subscriptionService.label(sub?.plan ?? "free"),
        role: first.role,
      };
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar
        role={profile.role}
        fullName={profile.full_name}
        email={profile.email}
        homeClinic={homeClinic}
      />

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
