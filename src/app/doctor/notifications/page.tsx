import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import NotificationsClient from "@/components/notifications/NotificationsClient";

export default async function DoctorNotificationsPage() {
  const { doctor: doctorData, user: userData } = await requireDoctor();
  const supabase = await createClient();

  // Get today's appointments for reminders
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const tomorrowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const [appointmentsRes, patientsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(*, users(*))")
      .eq("doctor_id", doctorData.id)
      .gte("scheduled_at", todayStart)
      .order("scheduled_at", { ascending: true })
      .limit(20),
    supabase
      .from("patients")
      .select("*, users(*)")
      .eq("assigned_doctor_id", doctorData.id)
      .limit(50),
  ]);

  return (
    <NotificationsClient
      appointments={appointmentsRes.data || []}
      patients={patientsRes.data || []}
      doctorId={doctorData.id}
      userName={userData.full_name}
      userRole="doctor"
    />
  );
}
