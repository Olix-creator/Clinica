"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPatientTasks(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("patient_id", patientId)
    .order("due_date", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getDoctorTasks(doctorId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*, patients(*, users(*))")
    .eq("assigned_by", doctorId)
    .order("due_date", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function createTask(data: {
  patient_id: string;
  assigned_by: string;
  title: string;
  description?: string;
  due_date?: string;
  type?: string;
}) {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      ...data,
      is_completed: false,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath(`/patients/${data.patient_id}`);

  return { success: true, data: task };
}

export async function toggleTaskComplete(taskId: string) {
  const supabase = await createClient();

  // Fetch current state
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("is_completed")
    .eq("id", taskId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ is_completed: !task.is_completed })
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tasks");

  return { success: true };
}
