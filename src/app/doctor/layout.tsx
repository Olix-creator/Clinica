import { requireDoctor } from "@/lib/auth/sync-user";
import DoctorSidebar from "@/components/layout/DoctorSidebar";
import TopBar from "@/components/layout/TopBar";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: userData, doctor: doctorData } = await requireDoctor();

  return (
    <div className="min-h-screen bg-gray-bg-light">
      <DoctorSidebar
        doctorName={userData.full_name}
        specialty={doctorData?.specialty || "General Physician"}
        avatarUrl={userData.avatar_url}
      />
      <div className="lg:ml-64">
        <TopBar
          userName={userData.full_name}
          userRole={doctorData?.specialty || undefined}
          avatarUrl={userData.avatar_url}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
