import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import HistoryClient from "@/components/history/HistoryClient";

export default async function HistoryPage() {
  const { doctor: doctorData } = await requireDoctor();
  const supabase = await createClient();

  const { data: visits } = await supabase
    .from("visits")
    .select("*, patients(*, users(*)), doctors(*, users(*))")
    .eq("doctor_id", doctorData.id)
    .order("created_at", { ascending: false });

  return <HistoryClient visits={visits || []} />;
}
