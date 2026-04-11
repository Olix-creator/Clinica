import { requireReceptionist } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import CalendarClient from "@/components/calendar/CalendarClient";

export default async function ReceptionCalendarPage() {
  await requireReceptionist();
  const supabase = await createClient();

  // Get appointments for the current month (and a bit before/after for smooth scrolling)
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - 1);
  
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2);
  endDate.setDate(0);

  const [appointmentsRes, doctorsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(*, users(*)), doctors(*, users(*))")
      .gte("scheduled_at", startDate.toISOString())
      .lte("scheduled_at", endDate.toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("doctors")
      .select("*, users(*)")
      .eq("is_available", true),
  ]);

  return (
    <CalendarClient
      appointments={appointmentsRes.data || []}
      doctors={doctorsRes.data || []}
      userRole="receptionist"
    />
  );
}
