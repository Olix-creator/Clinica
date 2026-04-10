import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import PatientListClient from "@/components/patients/PatientListClient";

export default async function PatientsPage() {
  await requireDoctor();
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*, users(*)")
    .order("user_id", { ascending: true })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <Link
          href="#"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </Link>
      </div>

      <PatientListClient patients={patients || []} />
    </div>
  );
}
