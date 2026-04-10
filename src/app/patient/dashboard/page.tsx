import { requirePatient } from "@/lib/auth/sync-user";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import {
  CalendarDays,
  Pill,
  CheckSquare,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";

export default async function PatientDashboard() {
  const { user: userData, patient: patientData } = await requirePatient();
  const supabase = await createClient();

  const [appointmentsRes, prescriptionsRes, tasksRes, queueRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, doctors(*, users(*))")
      .eq("patient_id", patientData.id)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at")
      .limit(5),
    supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientData.id)
      .eq("is_active", true),
    supabase
      .from("tasks")
      .select("*")
      .eq("patient_id", patientData.id)
      .eq("is_completed", false)
      .order("due_date")
      .limit(5),
    supabase
      .from("queue")
      .select("*")
      .eq("patient_id", patientData.id)
      .neq("status", "completed")
      .single(),
  ]);

  const appointments = appointmentsRes.data || [];
  const prescriptions = prescriptionsRes.data || [];
  const tasks = tasksRes.data || [];
  const queueEntry = queueRes.data;

  const nextAppointment = appointments[0];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="border-l-4 border-primary pl-4">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {userData?.full_name}</h1>
        <p className="text-gray-500">Here&apos;s your health summary for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-gray-500">Next Appointment</p>
          {nextAppointment ? (
            <p className="text-lg font-bold text-gray-900">
              {format(new Date(nextAppointment.scheduled_at), "MMM dd, hh:mm a")}
            </p>
          ) : (
            <p className="text-lg font-bold text-gray-400">None scheduled</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
            <Pill className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-500">Active Medications</p>
          <p className="text-3xl font-bold text-gray-900">{prescriptions.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
            <CheckSquare className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500">Pending Tasks</p>
          <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
        </div>
      </div>

      {/* Queue Position */}
      {queueEntry && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">Queue Position</p>
              <p className="text-3xl font-bold">
                You are number <span className="text-amber-300">#{queueEntry.position}</span> in the queue
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link href="/patient/appointments" className="text-sm text-primary font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {appointments.map((apt: Record<string, unknown>) => {
              const doctor = apt.doctors as Record<string, unknown> | undefined;
              const doctorUser = doctor?.users as Record<string, unknown> | undefined;
              return (
                <div key={apt.id as string} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-primary uppercase">
                      {format(new Date(apt.scheduled_at as string), "MMM")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {format(new Date(apt.scheduled_at as string), "dd")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(apt.scheduled_at as string), "hh:mm a")} — {(apt.type as string)?.replace("-", " ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Dr. {(doctorUser?.full_name as string) || "Unknown"}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                    apt.status === "pending" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                  }`}>
                    {apt.status as string}
                  </span>
                </div>
              );
            })}
            {appointments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming appointments</p>
            )}
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Tasks</h2>
            <Link href="/patient/tasks" className="text-sm text-primary font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.map((task: Record<string, unknown>) => {
              const typeColors: Record<string, string> = {
                medication: "bg-blue-50 text-blue-700",
                lab: "bg-purple-50 text-purple-700",
                appointment: "bg-green-50 text-green-700",
                general: "bg-gray-100 text-gray-600",
              };
              return (
                <div key={task.id as string} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 mt-0.5 border-2 border-gray-300 rounded flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.title as string}</p>
                    {(task.description as string) ? (
                      <p className="text-xs text-gray-500 mt-0.5">{String(task.description)}</p>
                    ) : null}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[(task.type as string) || "general"]}`}>
                        {(task.type as string)?.toUpperCase()}
                      </span>
                      {(task.due_date as string) ? (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(task.due_date as string), "MMM dd")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No pending tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
