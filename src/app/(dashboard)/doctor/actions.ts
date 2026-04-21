"use server";

import { revalidatePath } from "next/cache";
import { updateAppointmentStatus, type AppointmentStatus } from "@/lib/data/appointments";
import { createClinic } from "@/lib/data/clinics";
import {
  inviteClinicMember,
  removeClinicMember,
  type ClinicMemberRole,
} from "@/lib/data/clinicMembers";

type Result = { ok: true } | { ok: false; error: string };

const ALLOWED: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];

export async function changeStatus(
  id: string,
  status: AppointmentStatus,
  revalidate: string = "/doctor",
): Promise<Result> {
  if (!id) return { ok: false, error: "Missing appointment id" };
  if (!ALLOWED.includes(status)) return { ok: false, error: "Invalid status" };
  const { error } = await updateAppointmentStatus(id, status);
  if (error) return { ok: false, error };
  revalidatePath(revalidate);
  return { ok: true };
}

export async function createClinicAction(formData: FormData): Promise<Result> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Clinic name is required" };
  const { error } = await createClinic({ name });
  if (error) return { ok: false, error };
  revalidatePath("/doctor");
  return { ok: true };
}

export async function inviteMemberAction(formData: FormData): Promise<Result> {
  const clinicId = String(formData.get("clinicId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Exclude<ClinicMemberRole, "owner">;

  if (!clinicId) return { ok: false, error: "Please pick a clinic" };
  if (role !== "doctor" && role !== "receptionist") {
    return { ok: false, error: "Choose a role" };
  }

  const { error } = await inviteClinicMember({ clinicId, email, role });
  if (error) return { ok: false, error };
  revalidatePath("/doctor");
  return { ok: true };
}

export async function removeMemberAction(formData: FormData): Promise<Result> {
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return { ok: false, error: "Missing member id" };
  const { error } = await removeClinicMember(memberId);
  if (error) return { ok: false, error };
  revalidatePath("/doctor");
  return { ok: true };
}
