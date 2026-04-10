"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAppointments(
  doctorId: string,
  filters?: { status?: string; date?: string }
) {
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("*, patients(*, users(*))")
    .eq("doctor_id", doctorId)
    .order("scheduled_at", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.date) {
    const dateStart = `${filters.date}T00:00:00.000Z`;
    const dateEnd = new Date(
      new Date(filters.date).getTime() + 86400000
    ).toISOString();
    query = query.gte("scheduled_at", dateStart).lt("scheduled_at", dateEnd);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function createAppointment(data: {
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status?: string;
  notes?: string;
}) {
  const supabase = await createClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      ...data,
      status: data.status ?? "pending",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/appointments");

  return { success: true, data: appointment };
}

export async function updateAppointmentStatus(id: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/appointments");

  return { success: true };
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/appointments");

  return { success: true };
}
