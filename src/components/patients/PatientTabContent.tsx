"use client";

import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight, FileText, ImageIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface PatientTabContentProps {
  activeTab: string;
  visits: Record<string, unknown>[];
  prescriptions: Record<string, unknown>[];
  files: Record<string, unknown>[];
  patientId: string;
}

export default function PatientTabContent({
  visits,
  prescriptions,
  files,
  patientId,
}: PatientTabContentProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "visits";

  if (tab === "visits") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Encounters</h3>
          <Link href={`/doctor/history?patient=${patientId}`} className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary-dark">
            View Full History <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-4">
          {visits.slice(0, 5).map((visit) => {
            const doctorUser = (visit.doctors as Record<string, unknown>)?.users as Record<string, unknown> | undefined;
            const visitDate = new Date(visit.created_at as string);
            return (
              <div key={visit.id as string} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-all">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-14 h-16 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-100">
                    <span className="text-[10px] font-bold text-primary uppercase">{format(visitDate, "MMM")}</span>
                    <span className="text-lg font-bold text-gray-900">{format(visitDate, "dd")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {(visit.diagnosis as string) || "Routine Visit"}
                      </h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 uppercase">
                        {(visit.status as string) || "completed"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {(visit.notes as string) || "No notes recorded"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Dr. {(doctorUser?.full_name as string) || "Unknown"}</span>
                      <span>{format(visitDate, "hh:mm a")}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {visits.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">No visits recorded yet</div>
          )}
        </div>
      </div>
    );
  }

  if (tab === "prescriptions") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Prescriptions</h3>
          <Link
            href={`/doctor/patients/${patientId}/prescriptions`}
            className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary-dark"
          >
            Manage Prescriptions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx.id as string} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">{rx.medication_name as string}</h4>
                <span className="text-xs text-gray-500">{rx.duration as string}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-semibold text-red-600 uppercase">Morning</p>
                  <p className="text-sm font-bold text-gray-900">{(rx.dosage_morning as string) || "None"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-semibold text-red-600 uppercase">Afternoon</p>
                  <p className="text-sm font-bold text-gray-900">{(rx.dosage_afternoon as string) || "None"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-semibold text-red-600 uppercase">Night</p>
                  <p className="text-sm font-bold text-gray-900">{(rx.dosage_night as string) || "None"}</p>
                </div>
              </div>
              {(rx.instructions as string) ? (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{String(rx.instructions)}</p>
                </div>
              ) : null}
            </div>
          ))}
          {prescriptions.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">No active prescriptions</div>
          )}
        </div>
      </div>
    );
  }

  // Files tab
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Files</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {files.map((file) => (
          <div key={file.id as string} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center gap-2">
            {(file.file_type as string)?.includes("pdf") ? (
              <FileText className="w-12 h-12 text-red-400" />
            ) : (
              <ImageIcon className="w-12 h-12 text-blue-400" />
            )}
            <span className="text-xs text-gray-600 truncate w-full text-center">
              {file.file_name as string}
            </span>
            <span className="text-[10px] text-gray-400">
              {format(new Date(file.uploaded_at as string), "MMM dd, yyyy")}
            </span>
          </div>
        ))}
        {files.length === 0 && (
          <div className="col-span-full text-center py-8 text-sm text-gray-400">No files uploaded yet</div>
        )}
      </div>
    </div>
  );
}
