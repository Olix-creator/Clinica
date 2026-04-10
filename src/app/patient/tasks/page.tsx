import { requirePatient } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import TaskListClient from "@/components/patient/TaskListClient";

export default async function PatientTasksPage() {
  const { patient: patientData } = await requirePatient();
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("patient_id", patientData.id)
    .order("created_at", { ascending: false });

  return <TaskListClient tasks={tasks || []} />;
}
