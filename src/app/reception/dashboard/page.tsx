import { requireReceptionist } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import {
  Users,
  CalendarDays,
  UserPlus,
  Clock,
  ArrowRight,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default async function ReceptionDashboard() {
  const { user: userData } = await requireReceptionist();
  const supabase = await createClient();

  // Get today's date range
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const tomorrowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  // Fetch stats and data
  const [appointmentsRes, patientsRes, queueRes, doctorsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(*, users(*)), doctors(*, users(*))")
      .gte("scheduled_at", todayStart)
      .lt("scheduled_at", tomorrowStart)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("patients")
      .select("*, users(*)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("queue")
      .select("*, patients(*, users(*)), doctors(*, users(*))")
      .neq("status", "completed")
      .order("position", { ascending: true }),
    supabase
      .from("doctors")
      .select("*, users(*)")
      .eq("is_available", true),
  ]);

  const appointments = appointmentsRes.data || [];
  const recentPatients = patientsRes.data || [];
  const queueEntries = queueRes.data || [];
  const availableDoctors = doctorsRes.data || [];

  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter((a: { status: string }) => a.status === "pending").length;
  const completedAppointments = appointments.filter((a: { status: string }) => a.status === "completed").length;
  const waitingInQueue = queueEntries.filter((q: { status: string }) => q.status === "waiting").length;

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
        <div className="border-l-4 border-teal-500 pl-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {userData?.full_name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500">
            You have <span className="text-teal-600 font-semibold">{totalAppointments} appointments</span> scheduled for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reception/register"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Register Patient
          </Link>
          <Link
            href="/reception/appointments"
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Today&apos;s Appointments</p>
          <p className="text-3xl font-bold text-gray-900">{String(totalAppointments).padStart(2, "0")}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Pending</p>
          <p className="text-3xl font-bold text-gray-900">{String(pendingAppointments).padStart(2, "0")}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Completed</p>
          <p className="text-3xl font-bold text-gray-900">{String(completedAppointments).padStart(2, "0")}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Waiting in Queue</p>
          <p className="text-3xl font-bold text-gray-900">{String(waitingInQueue).padStart(2, "0")}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: UserPlus, label: "Register Patient", href: "/reception/register", color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
          { icon: CalendarDays, label: "Book Appointment", href: "/reception/appointments", color: "bg-green-50 text-green-600 hover:bg-green-100" },
          { icon: Calendar, label: "View Calendar", href: "/reception/calendar", color: "bg-purple-50 text-purple-600 hover:bg-purple-100" },
          { icon: Users, label: "View Patients", href: "/reception/patients", color: "bg-orange-50 text-orange-600 hover:bg-orange-100" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 transition-all ${action.color}`}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Appointments</h2>
            <Link href="/reception/appointments" className="text-sm text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">Patient</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">Time</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3 hidden md:table-cell">Doctor</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 6).map((apt: Record<string, unknown>) => {
                  const patient = apt.patients as Record<string, unknown> | undefined;
                  const patientUser = patient?.users as Record<string, unknown> | undefined;
                  const doctor = apt.doctors as Record<string, unknown> | undefined;
                  const doctorUser = doctor?.users as Record<string, unknown> | undefined;
                  const patientName = (patientUser?.full_name as string) || "Unknown";
                  const doctorName = (doctorUser?.full_name as string) || "Unknown";
                  const initials = patientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
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
                            <p className="text-xs text-gray-400 capitalize">{(apt.type as string)?.replace("-", " ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-sm text-gray-900">{format(new Date(apt.scheduled_at as string), "hh:mm a")}</p>
                      </td>
                      <td className="py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-600">Dr. {doctorName.split(" ").pop()}</p>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text} uppercase`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-400">
                      No appointments scheduled for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Available Doctors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Doctors</h2>
            <div className="space-y-3">
              {availableDoctors.slice(0, 4).map((doc: Record<string, unknown>) => {
                const docUser = doc.users as Record<string, unknown> | undefined;
                const docName = (docUser?.full_name as string) || "Unknown";
                const specialty = (doc.specialty as string) || "General";
                const initials = docName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

                return (
                  <div key={doc.id as string} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Dr. {docName}</p>
                      <p className="text-xs text-gray-500">{specialty}</p>
                    </div>
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                );
              })}
              {availableDoctors.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No doctors available</p>
              )}
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
              <Link href="/reception/patients" className="text-sm text-teal-600 font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentPatients.slice(0, 4).map((patient: Record<string, unknown>) => {
                const patientUser = patient.users as Record<string, unknown> | undefined;
                const patientName = (patientUser?.full_name as string) || "Unknown";
                const initials = patientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

                return (
                  <div key={patient.id as string} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{patientName}</p>
                      <p className="text-xs text-gray-400">
                        ID: #{(patient.id as string)?.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {recentPatients.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No patients registered yet</p>
              )}
            </div>
          </div>

          {/* Alerts */}
          {pendingAppointments > 3 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">High Pending Queue</p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    {pendingAppointments} appointments are still pending confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
