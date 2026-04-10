"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Pill,
  Calendar,
  User,
  AlertTriangle,
  Info,
  Megaphone,
  Download,
  X,
  SquarePlus,
} from "lucide-react";
import { createPrescription } from "@/lib/data/prescriptions";
import { toast } from "sonner";

interface Prescription {
  id: string;
  medication_name: string;
  description: string | null;
  dosage_morning: string | null;
  dosage_afternoon: string | null;
  dosage_night: string | null;
  duration: string | null;
  instructions: string | null;
}

interface Patient {
  id: string;
  allergies: string[] | null;
  users?: {
    full_name: string;
  };
}

export default function PrescriptionsClient({
  patient,
  prescriptions,
  doctorId,
  doctorName,
}: {
  patient: Patient;
  prescriptions: Prescription[];
  doctorId: string;
  doctorName: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const patientName = patient.users?.full_name || "Unknown";

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPrescription({
        patient_id: patient.id,
        doctor_id: doctorId,
        medication_name: fd.get("medication_name") as string,
        description: fd.get("description") as string || null,
        dosage_morning: fd.get("dosage_morning") as string || null,
        dosage_afternoon: fd.get("dosage_afternoon") as string || null,
        dosage_night: fd.get("dosage_night") as string || null,
        duration: fd.get("duration") as string || null,
        instructions: fd.get("instructions") as string || null,
      });
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Prescription created");
        setShowModal(false);
      }
    });
  }

  const verificationId = `#CLIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Prescriptions</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <User className="w-4 h-4" />
            Current Patient: <span className="font-semibold text-gray-700">{patientName}</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          New Prescription
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Patient Care Schedule */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <SquarePlus className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Patient Care Schedule</h3>
            <p className="text-sm opacity-90 mb-4">
              Patient has {prescriptions.length} active medications.
              Next dose is scheduled for 8:00 PM tonight.
            </p>
            {patient.allergies && patient.allergies.length > 0 && (
              <span className="inline-block text-xs font-bold px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-100 uppercase">
                Allergies: {patient.allergies.join(", ")}
              </span>
            )}
          </div>

          {/* Daily Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-gray-900">Daily Progress</h3>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Compliance Rate</span>
              <span className="text-sm font-bold text-primary">92%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "92%" }} />
            </div>
          </div>
        </div>

        {/* Right Column - Prescription Cards */}
        <div className="lg:col-span-2 space-y-6">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Medication Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Pill className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{rx.medication_name}</h4>
                    <p className="text-sm text-gray-500">{rx.description || "Medication"}</p>
                  </div>
                </div>
                {rx.duration && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-full px-3 py-1">
                    <Calendar className="w-4 h-4" />
                    {rx.duration}
                  </span>
                )}
              </div>

              {/* Dosage Slots */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="border-l-3 border-red-400 bg-gray-50 rounded-r-lg p-4">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Morning</p>
                  <p className="text-sm font-bold text-gray-900">{rx.dosage_morning || "None"}</p>
                  <p className="text-xs text-gray-400">Before Breakfast</p>
                </div>
                <div className="border-l-3 border-red-400 bg-gray-50 rounded-r-lg p-4">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Afternoon</p>
                  <p className="text-sm font-bold text-gray-900">{rx.dosage_afternoon || "None"}</p>
                  <p className="text-xs text-gray-400">After Lunch</p>
                </div>
                <div className="border-l-3 border-red-400 bg-gray-50 rounded-r-lg p-4">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Night</p>
                  <p className="text-sm font-bold text-gray-900">{rx.dosage_night || "None"}</p>
                  <p className="text-xs text-gray-400">After Dinner</p>
                </div>
              </div>

              {/* Instructions */}
              {rx.instructions && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                  <Megaphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Instruction: </span>
                    {rx.instructions}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Add Supplementary */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-primary/30 hover:text-primary transition-all"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Add Supplementary Medication</span>
            <span className="text-xs">Vitamins or as-needed pain relief</span>
          </button>
        </div>
      </div>

      {/* Footer - Digital Signature */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">
            {doctorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Digitally Signed by {doctorName}</p>
            <p className="text-xs text-gray-500">Verification ID: {verificationId}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Send to Pharmacy
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Prescription</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                <input name="medication_name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Lisinopril 10mg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input name="description" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. High Blood Pressure Management" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Morning</label>
                  <input name="dosage_morning" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="1 Tablet" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Afternoon</label>
                  <input name="dosage_afternoon" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="None" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Night</label>
                  <input name="dosage_night" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="1 Tablet" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input name="duration" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 30 Days" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea name="instructions" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Take with food. Avoid grapefruit." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">Create Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
