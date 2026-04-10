import { requireDoctor } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  CalendarClock,
  Download,
  Plus,
  ArrowRight,
  UserPlus,
  Stethoscope,
  Pill,
  HelpCircle,
  Eye,
  FileText,
  CalendarDays,
} from "lucide-react";

export default async function DoctorDashboard() {
  const { user: userData, doctor: doctorData } = await requireDoctor();
  const supabase = await createClient();

  // Get today's date range
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const tomorrowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  // Fetch stats and data in parallel
  const [appointmentsRes, queueRes, visitsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(*, users(*))")
      .eq("doctor_id", doctorData.id)
      .gte("scheduled_at", todayStart)
      .lt("scheduled_at", tomorrowStart)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("queue")
      .select("*, patients(*, users(*))")
      .eq("doctor_id", doctorData.id)
      .neq("status", "completed")
      .order("position", { ascending: true }),
    supabase
      .from("visits")
      .select("*")
      .eq("doctor_id", doctorData.id)
      .gte("created_at", todayStart)
      .lt("created_at", tomorrowStart)
      .eq("status", "completed"),
  ]);

  const appointments = appointmentsRes.data || [];
  const queueEntries = queueRes.data || [];
  const completedVisits = visitsRes.data || [];

  const totalPatients = appointments.length;
  const completedCount = completedVisits.length;
  const pendingCount = appointments.filter((a: { status: string }) => a.status === "pending").length;

  const currentPatient = queueEntries.find((q: { status: string }) => q.status === "in-consultation");
  const nextPatient = queueEntries.find((q: { status: string }) => q.status === "waiting");

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-green-50", text: "text-green-700" },
    completed: { bg: "bg-green-50", text: "text-green-700" },
    pending: { bg: "bg-orange-50", text: "text-orange-700" },
    cancelled: { bg: "bg-red-50", text: "text-red-700" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="border-l-4 border-primary pl-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userData?.full_name?.split(" ")[0] === "Dr." ? userData.full_name : `Dr. ${userData?.full_name?.split(" ").pop()}`}
          </h1>
          <p className="text-gray-500">
            You have{" "}
            <Link href="/doctor/appointments" className="text-primary font-semibold">
              {totalPatients} patients
            </Link>{" "}
            scheduled for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4" />
            Reports
          </button>
          <Link
            href="/doctor/appointments"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              +12% vs last week
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-4">Total Patients Today</p>
          <p className="text-3xl font-bold text-gray-900">{String(totalPatients).padStart(2, "0")}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex gap-0.5">
              {[3, 5, 4, 6, 5].map((h, i) => (
                <div key={i} className="w-2 rounded-full bg-primary" style={{ height: `${h * 4}px` }} />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Completed Visits</p>
          <p className="text-3xl font-bold text-gray-900">{String(completedCount).padStart(2, "0")}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Pending Appointments</p>
          <p className="text-3xl font-bold text-gray-900">{String(pendingCount).padStart(2, "0")}</p>
        </div>
      </div>

      {/* Queue + Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Queue + Quick Actions */}
        <div className="space-y-6">
          {/* Queue Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Queue Status</h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            </div>

            {currentPatient ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold">
                  {currentPatient.position}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Current Patient</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {currentPatient.patients?.users?.full_name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">{currentPatient.room || "Consultation Room"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">No patient in consultation</p>
            )}

            {nextPatient && (
              <div className="flex items-center gap-3 mb-4 pl-2 border-l-2 border-gray-200">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                  {nextPatient.position}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium text-gray-400 uppercase">Next in Line</p>
                  <p className="text-sm font-medium text-gray-700">
                    {nextPatient.patients?.users?.full_name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400">Waiting Area A</p>
                </div>
                <span className="text-xs font-medium text-primary">In 12m</span>
              </div>
            )}

            <Link
              href="/doctor/queue"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all mt-2"
            >
              View Full Queue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: UserPlus, label: "Add Patient", href: "/doctor/patients" },
                { icon: Stethoscope, label: "Start Consult", href: "/doctor/queue" },
                { icon: Pill, label: "New E-Rx", href: "/doctor/patients" },
                { icon: HelpCircle, label: "Request Support", href: "#" },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all"
                >
                  <action.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Appointments</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">
                    Patient Name
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">
                    Time
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3 hidden md:table-cell">
                    Type
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">
                    Status
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).map((apt: Record<string, unknown>) => {
                  const patient = apt.patients as Record<string, unknown> | undefined;
                  const patientUser = patient?.users as Record<string, unknown> | undefined;
                  const patientName = (patientUser?.full_name as string) || "Unknown";
                  const initials = patientName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2);
                  const status = (apt.status as string) || "pending";
                  const colors = statusColors[status] || statusColors.pending;

                  return (
                    <tr key={apt.id as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{patientName}</p>
                            <p className="text-xs text-gray-400">
                              ID: #{(apt.id as string)?.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-sm text-gray-900">
                          {format(new Date(apt.scheduled_at as string), "hh:mm a")}
                        </p>
                      </td>
                      <td className="py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-600 capitalize">{(apt.type as string)?.replace("-", " ")}</p>
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text} uppercase`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link href={`/doctor/patients/${patient?.id}`} className="text-gray-400 hover:text-primary">
                          {status === "active" ? (
                            <Eye className="w-4 h-4" />
                          ) : status === "completed" ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <CalendarDays className="w-4 h-4" />
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                      No appointments scheduled for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {appointments.length > 0 && (
            <div className="mt-4 text-center">
              <Link href="/doctor/appointments" className="text-sm text-primary font-medium hover:text-primary-dark">
                View All {totalPatients} Appointments
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Link
        href="/doctor/appointments"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
