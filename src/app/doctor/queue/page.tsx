import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import QueuePageClient from "@/components/queue/QueuePageClient";

export default async function QueuePage() {
  const { doctor: doctorData } = await requireDoctor();
  const supabase = await createClient();

  const { data: queueEntries } = await supabase
    .from("queue")
    .select("*, patients(*, users(*))")
    .eq("doctor_id", doctorData.id)
    .order("position", { ascending: true });

  const { data: patients } = await supabase
    .from("patients")
    .select("*, users(*)")
    .limit(50);

  return (
    <QueuePageClient
      doctorId={doctorData.id}
      initialQueue={queueEntries || []}
      patients={patients || []}
    />
  );
}
