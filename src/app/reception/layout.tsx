import { requireReceptionist } from "@/lib/auth/sync-user";
import ReceptionistSidebar from "@/components/layout/ReceptionistSidebar";
import TopBar from "@/components/layout/TopBar";

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: userData } = await requireReceptionist();

  return (
    <div className="min-h-screen bg-gray-bg-light">
      <ReceptionistSidebar
        userName={userData.full_name}
        avatarUrl={userData.avatar_url}
      />
      <div className="lg:ml-64">
        <TopBar
          userName={userData.full_name}
          userRole="Receptionist"
          avatarUrl={userData.avatar_url}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
