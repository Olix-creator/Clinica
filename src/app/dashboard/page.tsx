import { createClient } from "@/lib/supabase/server";
import QueueDashboard from "@/components/dashboard/QueueDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch today's queue
  const { data: queue } = await supabase
    .from("queue")
    .select("*")
    .gte(
      "created_at",
      new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    )
    .order("queue_number", { ascending: true });

  return <QueueDashboard initial={queue || []} />;
}
