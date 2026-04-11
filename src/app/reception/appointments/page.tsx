import { requireReceptionist } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import ReceptionAppointmentsClient from "@/components/reception/ReceptionAppointmentsClient";

export default async function ReceptionAppointmentsPage() {
  await requireReceptionist();
  const supabase = await createClient();

  const [appointmentsRes, patientsRes, doctorsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(*, users(*)), doctors(*, users(*))")
      .order("scheduled_at", { ascending: false })
      .limit(100),
    supabase
      .from("patients")
      .select("*, users(*)")
      .limit(200),
    supabase
      .from("doctors")
      .select("*, users(*)")
      .eq("is_available", true),
  ]);

  return (
    <ReceptionAppointmentsClient
      appointments={appointmentsRes.data || []}
      patients={patientsRes.data || []}
      doctors={doctorsRes.data || []}
    />
  );
}
