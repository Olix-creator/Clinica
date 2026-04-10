"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Stethoscope,
  Users,
  LogOut,
  Loader2,
  User,
  Phone,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

type Patient = {
  id: string;
  name: string | null;
  phone: string | null;
  created_at: string;
};

export default function DoctorDashboardPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { t } = useI18n();
  const l = t("doctorDashboard");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Check this user is actually a doctor
    supabase
      .from("profiles")
      .select("role, name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          router.replace("/choose-role");
          return;
        }
        if (data.role !== "doctor") {
          router.replace("/patient-dashboard");
          return;
        }
        setDoctorName(
          data.name ||
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            "Doctor"
        );
      });

    // Fetch all patients
    supabase
      .from("profiles")
      .select("id, name, phone, created_at")
      .eq("role", "patient")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPatients(data || []);
        setLoading(false);
      });
  }, [user, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = doctorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-bg-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Clinica</h1>
              <p className="text-xs text-gray-400">{l.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{doctorName}</p>
                <p className="text-xs text-gray-400">{l.role}</p>
              </div>
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-500">
                {l.totalPatients}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">
                {l.todayNew}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {
                patients.filter(
                  (p) =>
                    new Date(p.created_at).toDateString() ===
                    new Date().toDateString()
                ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">
                {l.yourRole}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900">{l.role}</p>
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {l.patientList}
            </h2>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">
                {l.noPatients}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {l.noPatientsDesc}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="w-11 h-11 bg-green-50 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {patient.name || "Unnamed Patient"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {patient.phone && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(patient.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
