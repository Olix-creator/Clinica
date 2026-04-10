"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getVisits(
  doctorId: string,
  filters?: { patientId?: string; dateRange?: string }
) {
  const supabase = await createClient();

  let query = supabase
    .from("visits")
    .select("*, patients(*, users(*))")
    .eq("doctor_id", doctorId)
    .order("started_at", { ascending: false });

  if (filters?.patientId) {
    query = query.eq("patient_id", filters.patientId);
  }

  if (filters?.dateRange) {
    const [startDate, endDate] = filters.dateRange.split(",");
    if (startDate) {
      query = query.gte("started_at", `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      const endNext = new Date(
        new Date(endDate).getTime() + 86400000
      ).toISOString();
      query = query.lt("started_at", endNext);
    }
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function createVisit(data: {
  appointment_id?: string;
  doctor_id: string;
  patient_id: string;
  diagnosis?: string;
  notes?: string;
  vitals?: Record<string, unknown>;
  status?: string;
}) {
  const supabase = await createClient();

  const { data: visit, error } = await supabase
    .from("visits")
    .insert({
      ...data,
      status: data.status ?? "in-progress",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/visits");
  revalidatePath(`/patients/${data.patient_id}`);

  return { success: true, data: visit };
}

export async function updateVisit(
  id: string,
  data: {
    diagnosis?: string;
    notes?: string;
    vitals?: Record<string, unknown>;
    status?: string;
    completed_at?: string;
  }
) {
  const supabase = await createClient();

  // If status is being set to completed, auto-set completed_at
  const updateData =
    data.status === "completed" && !data.completed_at
      ? { ...data, completed_at: new Date().toISOString() }
      : data;

  const { error } = await supabase
    .from("visits")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/visits");

  return { success: true };
}
