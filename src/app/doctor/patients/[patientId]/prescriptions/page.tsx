import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PrescriptionsClient from "@/components/prescriptions/PrescriptionsClient";

export default async function PrescriptionsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { user: userData, doctor: doctorData } = await requireDoctor();
  const supabase = await createClient();

  const [patientRes, prescriptionsRes] = await Promise.all([
    supabase.from("patients").select("*, users(*)").eq("id", patientId).single(),
    supabase
      .from("prescriptions")
      .select("*, doctors(*, users(*))")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("prescribed_at", { ascending: false }),
  ]);

  const patient = patientRes.data;
  const prescriptions = prescriptionsRes.data || [];

  if (!patient) redirect("/doctor/patients");

  return (
    <PrescriptionsClient
      patient={patient}
      prescriptions={prescriptions}
      doctorId={doctorData.id}
      doctorName={userData?.full_name || "Doctor"}
    />
  );
}
