import { requireReceptionist } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import NotificationsClient from "@/components/notifications/NotificationsClient";

export default async function ReceptionNotificationsPage() {
  const { user: userData } = await requireReceptionist();
  const supabase = await createClient();

  // Get today's appointments for reminders
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  const [appointmentsRes, patientsRes, doctorsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(*, users(*)), doctors(*, users(*))")
      .gte("scheduled_at", todayStart)
      .order("scheduled_at", { ascending: true })
      .limit(30),
    supabase
      .from("patients")
      .select("*, users(*)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("doctors")
      .select("*, users(*)")
      .eq("is_available", true),
  ]);

  return (
    <NotificationsClient
      appointments={appointmentsRes.data || []}
      patients={patientsRes.data || []}
      doctors={doctorsRes.data || []}
      userName={userData.full_name}
      userRole="receptionist"
    />
  );
}
