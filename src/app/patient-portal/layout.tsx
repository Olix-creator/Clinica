import BottomNav from "@/components/patient-portal/BottomNav";

export const metadata = { title: "Patient Portal — Clinica" };

export default function PatientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* App shell — max-width gives a mobile-app feel on desktop */}
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative shadow-xl shadow-gray-200/60">
        <main className="pb-20">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
