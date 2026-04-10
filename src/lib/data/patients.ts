import { createClient } from "@/lib/supabase/server";

export async function getPatients(doctorId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patients")
    .select("*, users(*)")
    .or(`assigned_doctor_id.eq.${doctorId}`)
    .order("created_at", { referencedTable: "users", ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getPatientById(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patients")
    .select("*, users(*)")
    .eq("id", patientId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getPatientVisits(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visits")
    .select("*, doctors:doctor_id(*, users(*))")
    .eq("patient_id", patientId)
    .order("started_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getPatientPrescriptions(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prescriptions")
    .select("*, doctors:doctor_id(*, users(*))")
    .eq("patient_id", patientId)
    .eq("is_active", true)
    .order("prescribed_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getPatientFiles(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("patient_id", patientId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getPatientVitals(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visits")
    .select("vitals, started_at")
    .eq("patient_id", patientId)
    .not("vitals", "is", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return { error: error.message };
  }

  return { data: data ?? null };
}
