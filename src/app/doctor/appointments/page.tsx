import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import AppointmentsClient from "@/components/appointments/AppointmentsClient";

export default async function AppointmentsPage() {
  const { doctor: doctorData } = await requireDoctor();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, patients(*, users(*))")
    .eq("doctor_id", doctorData.id)
    .order("scheduled_at", { ascending: false });

  const { data: patients } = await supabase
    .from("patients")
    .select("*, users(*)")
    .limit(100);

  return (
    <AppointmentsClient
      appointments={appointments || []}
      patients={patients || []}
      doctorId={doctorData.id}
    />
  );
}
