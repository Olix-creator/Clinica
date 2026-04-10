import { requirePatient } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Pill } from "lucide-react";

export default async function PatientHistoryPage() {
  const { patient: patientData } = await requirePatient();
  const supabase = await createClient();

  const { data: visits } = await supabase
    .from("visits")
    .select("*, doctors(*, users(*))")
    .eq("patient_id", patientData.id)
    .order("created_at", { ascending: false });

  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", patientData.id)
    .order("prescribed_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>

      <div className="space-y-4">
        {(visits || []).map((visit: Record<string, unknown>) => {
          const doctorInfo = visit.doctors as Record<string, unknown> | undefined;
          const doctorUser = doctorInfo?.users as Record<string, unknown> | undefined;
          const visitDate = new Date(visit.created_at as string);
          const visitPrescriptions = (prescriptions || []).filter(
            (rx: Record<string, unknown>) => rx.visit_id === visit.id
          );

          return (
            <div key={visit.id as string} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex gap-4">
                <div className="w-14 h-16 bg-blue-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary uppercase">{format(visitDate, "MMM")}</span>
                  <span className="text-lg font-bold text-gray-900">{format(visitDate, "dd")}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {(visit.diagnosis as string) || "General Visit"}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 uppercase">
                      {(visit.status as string) || "completed"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{(visit.notes as string) || "No notes"}</p>
                  <p className="text-xs text-gray-400">
                    Dr. {(doctorUser?.full_name as string) || "Unknown"} • {format(visitDate, "hh:mm a")}
                  </p>

                  {visitPrescriptions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Prescriptions</p>
                      <div className="space-y-2">
                        {visitPrescriptions.map((rx: Record<string, unknown>) => (
                          <div key={rx.id as string} className="flex items-center gap-2 text-sm">
                            <Pill className="w-4 h-4 text-primary" />
                            <span className="font-medium text-gray-700">{rx.medication_name as string}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">{rx.duration as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {(!visits || visits.length === 0) && (
          <div className="text-center py-12 text-sm text-gray-400">No visit history found</div>
        )}
      </div>
    </div>
  );
}
