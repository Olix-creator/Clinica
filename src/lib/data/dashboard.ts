import { createClient } from "@/lib/supabase/server";

export async function getDoctorProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("doctors")
    .select("*, users(*)")
    .eq("user_id", userId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getTodayStats(doctorId: string) {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowStart = new Date(
    new Date(today).getTime() + 86400000
  ).toISOString();

  const [totalPatients, completedVisits, pendingAppointments] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .gte("scheduled_at", todayStart)
        .lt("scheduled_at", tomorrowStart),
      supabase
        .from("visits")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .eq("status", "completed")
        .gte("started_at", todayStart)
        .lt("started_at", tomorrowStart),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .eq("status", "pending")
        .gte("scheduled_at", todayStart)
        .lt("scheduled_at", tomorrowStart),
    ]);

  return {
    data: {
      totalPatients: totalPatients.count ?? 0,
      completedVisits: completedVisits.count ?? 0,
      pendingAppointments: pendingAppointments.count ?? 0,
    },
  };
}

export async function getTodayAppointments(doctorId: string) {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowStart = new Date(
    new Date(today).getTime() + 86400000
  ).toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select("*, patients(*, users(*))")
    .eq("doctor_id", doctorId)
    .gte("scheduled_at", todayStart)
    .lt("scheduled_at", tomorrowStart)
    .order("scheduled_at", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getCurrentQueue(doctorId: string) {
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
    .neq("status", "completed")
    .gte("arrival_time", todayStart)
    .lt("arrival_time", tomorrowStart)
    .order("position", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}
