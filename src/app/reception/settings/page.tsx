import { requireReceptionist } from "@/lib/auth/sync-user";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function ReceptionSettingsPage() {
  const { user: userData } = await requireReceptionist();

  return (
    <SettingsClient
      user={userData}
      userRole="receptionist"
    />
  );
}
