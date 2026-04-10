import { requirePatient } from "@/lib/auth/sync-user";
import PatientSidebar from "@/components/layout/PatientSidebar";
import TopBar from "@/components/layout/TopBar";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: userData } = await requirePatient();

  return (
    <div className="min-h-screen bg-gray-bg-light">
      <PatientSidebar
        patientName={userData.full_name}
        avatarUrl={userData.avatar_url}
      />
      <div className="lg:ml-64">
        <TopBar userName={userData.full_name} avatarUrl={userData.avatar_url} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
