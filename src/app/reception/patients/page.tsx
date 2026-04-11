import { requireReceptionist } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import ReceptionPatientListClient from "@/components/reception/ReceptionPatientListClient";

export default async function ReceptionPatientsPage() {
  await requireReceptionist();
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*, users(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <Link
          href="/reception/register"
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Register Patient
        </Link>
      </div>

      <ReceptionPatientListClient patients={patients || []} />
    </div>
  );
}
