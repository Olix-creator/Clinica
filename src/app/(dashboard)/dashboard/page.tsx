import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROLE_REDIRECT = {
  patient: "/patient",
  doctor: "/doctor",
  receptionist: "/receptionist",
} as const;

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  redirect(ROLE_REDIRECT[profile.role]);
}
