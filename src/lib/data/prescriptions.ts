"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPrescriptions(patientId: string) {
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

export async function createPrescription(data: {
  visit_id?: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  description?: string | null;
  dosage_morning?: string | null;
  dosage_afternoon?: string | null;
  dosage_night?: string | null;
  duration?: string | null;
  instructions?: string | null;
}) {
  const supabase = await createClient();

  const { data: prescription, error } = await supabase
    .from("prescriptions")
    .insert({
      ...data,
      is_active: true,
      prescribed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/prescriptions");
  revalidatePath(`/patients/${data.patient_id}`);

  return { success: true, data: prescription };
}

export async function updatePrescription(
  id: string,
  data: {
    medication_name?: string;
    description?: string;
    dosage_morning?: number;
    dosage_afternoon?: number;
    dosage_night?: number;
    duration?: string;
    instructions?: string;
    is_active?: boolean;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("prescriptions")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/prescriptions");

  return { success: true };
}

export async function deletePrescription(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("prescriptions")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/prescriptions");

  return { success: true };
}
