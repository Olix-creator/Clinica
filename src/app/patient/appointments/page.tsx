import { requirePatient } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import PatientAppointmentsClient from "@/components/patient/PatientAppointmentsClient";

export default async function PatientAppointmentsPage() {
  const { patient: patientData } = await requirePatient();
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, doctors(*, users(*))")
    .eq("patient_id", patientData.id)
    .order("scheduled_at", { ascending: false });

  return <PatientAppointmentsClient appointments={appointments || []} />;
}
