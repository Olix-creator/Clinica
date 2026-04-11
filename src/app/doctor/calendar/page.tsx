import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import CalendarClient from "@/components/calendar/CalendarClient";

export default async function DoctorCalendarPage() {
  const { doctor: doctorData } = await requireDoctor();
  const supabase = await createClient();

  // Get appointments for the current month (and a bit before/after for smooth scrolling)
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - 1);
  
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2);
  endDate.setDate(0);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, patients(*, users(*))")
    .eq("doctor_id", doctorData.id)
    .gte("scheduled_at", startDate.toISOString())
    .lte("scheduled_at", endDate.toISOString())
    .order("scheduled_at", { ascending: true });

  return (
    <CalendarClient
      appointments={appointments || []}
      userRole="doctor"
    />
  );
}
