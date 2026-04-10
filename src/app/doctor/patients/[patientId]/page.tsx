import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import { differenceInYears } from "date-fns";
import Link from "next/link";
import {
  Phone,
  Hash,
  Cake,
  Droplets,
  AlertTriangle,
  Shield,
  Heart,
  Thermometer,
  Activity,
  FileText,
  ImageIcon,
  Upload,
  Pill,
  Edit,
  Stethoscope,
} from "lucide-react";
import PatientTabs from "@/components/patients/PatientTabs";
import PatientTabContent from "@/components/patients/PatientTabContent";

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { patientId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab || "visits";

  await requireDoctor();
  const supabase = await createClient();

  // Fetch all patient data in parallel
  const [patientRes, visitsRes, prescriptionsRes, filesRes] = await Promise.all([
    supabase.from("patients").select("*, users(*)").eq("id", patientId).single(),
    supabase
      .from("visits")
      .select("*, doctors(*, users(*))")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select("*, doctors(*, users(*))")
      .eq("patient_id", patientId)
      .eq("is_active", true),
    supabase
      .from("files")
      .select("*")
      .eq("patient_id", patientId)
      .order("uploaded_at", { ascending: false })
      .limit(4),
  ]);

  const patient = patientRes.data;
  const visits = visitsRes.data || [];
  const prescriptions = prescriptionsRes.data || [];
  const files = filesRes.data || [];

  if (!patient) {
    const { redirect } = await import("next/navigation");
    redirect("/doctor/patients");
  }

  const patientUser = patient.users as Record<string, unknown> | undefined;
  const name = (patientUser?.full_name as string) || "Unknown";
  const age = patient.date_of_birth
    ? differenceInYears(new Date(), new Date(patient.date_of_birth))
    : null;
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  // Get latest vitals from most recent visit
  const latestVitals = visits.find((v: Record<string, unknown>) => v.vitals)?.vitals as Record<string, unknown> | null;

  const bloodTypeDisplay = patient.blood_type || "—";
  const isPositive = bloodTypeDisplay.includes("+");

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center text-2xl font-bold text-gray-500">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-primary uppercase">
                  Active Patient
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {age && (
                  <span className="flex items-center gap-1">
                    <Cake className="w-4 h-4" /> {age} Years Old
                  </span>
                )}
                {(patientUser?.phone as string) ? (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {String(patientUser?.phone)}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Hash className="w-4 h-4" /> ID: #MED-{patientId.slice(0, 5).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
            <Link
              href={`/doctor/patients/${patientId}/prescriptions`}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all"
            >
              <Stethoscope className="w-4 h-4" />
              New Consultation
            </Link>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Blood Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Blood Type</span>
            <Droplets className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{bloodTypeDisplay}</p>
          <p className="text-sm text-gray-500">{isPositive ? "Positive" : "Negative"}</p>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Allergies</span>
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {patient.allergies?.map((allergy: string, i: number) => (
              <span
                key={allergy}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  i === 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {allergy}
              </span>
            )) || <span className="text-sm text-gray-400">None reported</span>}
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Chronic Conditions</span>
            <Shield className="w-5 h-5 text-gray-300" />
          </div>
          <div className="flex flex-wrap gap-2">
            {patient.chronic_conditions?.map((condition: string) => (
              <span key={condition} className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                <span className="w-2 h-2 bg-orange-400 rounded-full" />
                {condition}
              </span>
            )) || <span className="text-sm text-gray-400">None reported</span>}
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <PatientTabs>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <PatientTabContent
              activeTab={activeTab}
              visits={visits}
              prescriptions={prescriptions}
              files={files}
              patientId={patientId}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Current Vitals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Vitals</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-gray-600">Heart Rate</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">
                      {(latestVitals?.heart_rate as number) || 72}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">BPM</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Thermometer className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-600">Temp</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">
                      {(latestVitals?.temperature as number) || 98.6}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">°F</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">BP</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">
                      {(latestVitals?.blood_pressure as string) || "120/80"}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">mmHg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Files */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Files</h3>
              <div className="grid grid-cols-2 gap-3">
                {files.slice(0, 3).map((file: Record<string, unknown>) => (
                  <div key={file.id as string} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {(file.file_type as string)?.includes("pdf") ? (
                      <FileText className="w-8 h-8 text-red-400" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-blue-400" />
                    )}
                    <span className="text-xs text-gray-600 truncate w-full text-center">
                      {(file.file_name as string)?.slice(0, 15)}...
                    </span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:border-primary/30">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-xs text-gray-500">Upload New</span>
                </div>
              </div>
            </div>

            {/* Active Medications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Active Medications</h3>
              <div className="space-y-3">
                {prescriptions.slice(0, 5).map((rx: Record<string, unknown>) => (
                  <div key={rx.id as string} className="flex items-center gap-3">
                    <Pill className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rx.medication_name as string}</p>
                      <p className="text-xs text-gray-500">
                        {[rx.dosage_morning && "Morning", rx.dosage_afternoon && "Afternoon", rx.dosage_night && "Night"]
                          .filter(Boolean)
                          .join(", ") || "As needed"}
                      </p>
                    </div>
                  </div>
                ))}
                {prescriptions.length === 0 && (
                  <p className="text-sm text-gray-400">No active medications</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </PatientTabs>
    </div>
  );
}
