"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getQueueEntries(doctorId: string) {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowStart = new Date(
    new Date(today).getTime() + 86400000
  ).toISOString();

  const { data, error } = await supabase
    .from("queue")
    .select("*, patients(*, users(*))")
    .eq("doctor_id", doctorId)
    .gte("arrival_time", todayStart)
    .lt("arrival_time", tomorrowStart)
    .order("position", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function addToQueue(
  doctorId: string,
  patientId: string,
  visitType: string
) {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowStart = new Date(
    new Date(today).getTime() + 86400000
  ).toISOString();

  // Get the current max position for today's queue
  const { data: lastEntry } = await supabase
    .from("queue")
    .select("position")
    .eq("doctor_id", doctorId)
    .gte("arrival_time", todayStart)
    .lt("arrival_time", tomorrowStart)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (lastEntry?.position ?? 0) + 1;

  const { data, error } = await supabase
    .from("queue")
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      position: nextPosition,
      status: "waiting",
      visit_type: visitType,
      arrival_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/queue");

  return { success: true, data };
}

export async function callNextPatient(doctorId: string) {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowStart = new Date(
    new Date(today).getTime() + 86400000
  ).toISOString();

  // Complete the current in-consultation patient
  const { error: completeError } = await supabase
    .from("queue")
    .update({ status: "completed" })
    .eq("doctor_id", doctorId)
    .eq("status", "in-consultation")
    .gte("arrival_time", todayStart)
    .lt("arrival_time", tomorrowStart);

  if (completeError) {
    return { error: completeError.message };
  }

  // Get the next waiting patient (lowest position)
  const { data: nextPatient, error: fetchError } = await supabase
    .from("queue")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("status", "waiting")
    .gte("arrival_time", todayStart)
    .lt("arrival_time", tomorrowStart)
    .order("position", { ascending: true })
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return { error: fetchError.message };
  }

  if (!nextPatient) {
    revalidatePath("/dashboard");
    revalidatePath("/queue");
    return { success: true, data: null };
  }

  // Set the next patient to in-consultation
  const { error: updateError } = await supabase
    .from("queue")
    .update({
      status: "in-consultation",
      consultation_start: new Date().toISOString(),
    })
    .eq("id", nextPatient.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/queue");

  return { success: true, data: nextPatient };
}

export async function completeVisit(queueId: string, doctorId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("queue")
    .update({ status: "completed" })
    .eq("id", queueId)
    .eq("doctor_id", doctorId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/queue");

  return { success: true };
}

export async function removeFromQueue(queueId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("queue").delete().eq("id", queueId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/queue");

  return { success: true };
}
