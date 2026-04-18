import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import QueuePageClient from "@/components/queue/QueuePageClient";

export default async function QueuePage() {
  const { doctor: doctorData } = await requireDoctor();
  const supabase = await createClient();

  // Queue doesn't have doctor_id — it's a shared clinic queue
  const { data: queueEntries } = await supabase
    .from("queue")
    .select("*")
    .order("queue_number", { ascending: true });

  // Patients list for adding to queue
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
