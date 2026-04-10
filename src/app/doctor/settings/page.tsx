import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const { user: userData, doctor: doctorData } = await requireDoctor();

  return (
    <SettingsClient
      user={userData}
      doctor={doctorData}
    />
  );
}
