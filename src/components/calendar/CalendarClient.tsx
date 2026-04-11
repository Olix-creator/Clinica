"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
} from "lucide-react";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes: string | null;
  patients?: {
    id: string;
    users?: {
      full_name: string;
    };
  };
  doctors?: {
    id: string;
    specialty?: string;
    users?: {
      full_name: string;
    };
  };
}

interface Doctor {
  id: string;
  specialty?: string;
  users?: {
    full_name: string;
  };
}

interface CalendarClientProps {
  appointments: Appointment[];
  doctors?: Doctor[];
  userRole: "doctor" | "receptionist";
}

type ViewMode = "month" | "week" | "day";

export default function CalendarClient({
  appointments,
  doctors = [],
  userRole,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [doctorFilter, setDoctorFilter] = useState("all");

  const filteredAppointments = useMemo(() => {
    if (doctorFilter === "all") return appointments;
    return appointments.filter((apt) => apt.doctors?.id === doctorFilter);
  }, [appointments, doctorFilter]);

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    return filteredAppointments.filter((apt) =>
      isSameDay(new Date(apt.scheduled_at), date)
    );
  };

  // Generate calendar days for month view
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Generate days for week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Hours for day/week view
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const statusColors: Record<string, string> = {
    pending: "bg-orange-100 border-orange-300 text-orange-800",
    active: "bg-green-100 border-green-300 text-green-800",
    completed: "bg-blue-100 border-blue-300 text-blue-800",
    cancelled: "bg-red-100 border-red-300 text-red-800",
  };

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + (direction === "prev" ? -1 : 1))));
    }
  };

  const selectedDayAppointments = selectedDate ? getAppointmentsForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          Calendar
        </h1>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(["month", "week", "day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  viewMode === mode ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Doctor Filter (for receptionist) */}
          {userRole === "receptionist" && doctors.length > 0 && (
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.users?.full_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === "day"
                ? format(currentDate, "EEEE, MMMM d, yyyy")
                : viewMode === "week"
                ? `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`
                : format(currentDate, "MMMM yyyy")}
            </h2>
          </div>
          <button
            onClick={() => navigate("next")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Month View */}
          {viewMode === "month" && (
            <>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              {/* Days Grid */}
              <div className="grid grid-cols-7">
                {monthDays.map((day, i) => {
                  const dayAppointments = getAppointmentsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[100px] p-2 border-b border-r border-gray-100 text-left transition-colors ${
                        isCurrentMonth ? "bg-white" : "bg-gray-50"
                      } ${isSelected ? "ring-2 ring-primary ring-inset" : ""} hover:bg-gray-50`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                          isToday(day)
                            ? "bg-primary text-white font-bold"
                            : isCurrentMonth
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayAppointments.slice(0, 3).map((apt) => (
                          <div
                            key={apt.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${statusColors[apt.status] || statusColors.pending}`}
                          >
                            {format(new Date(apt.scheduled_at), "HH:mm")} - {apt.patients?.users?.full_name?.split(" ")[0] || "Patient"}
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-[10px] text-gray-500 px-1">
                            +{dayAppointments.length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Week View */}
          {viewMode === "week" && (
            <>
              {/* Headers */}
              <div className="grid grid-cols-8 border-b border-gray-100">
                <div className="py-3 px-2 text-center text-xs font-semibold text-gray-400">Time</div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`py-3 text-center ${isToday(day) ? "bg-primary/5" : ""}`}
                  >
                    <p className="text-xs text-gray-500">{format(day, "EEE")}</p>
                    <p className={`text-lg font-bold ${isToday(day) ? "text-primary" : "text-gray-900"}`}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>
              {/* Time Grid */}
              <div className="max-h-[600px] overflow-y-auto">
                {hours.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-b border-gray-50">
                    <div className="py-4 px-2 text-xs text-gray-400 text-right pr-4">
                      {format(new Date().setHours(hour, 0), "h a")}
                    </div>
                    {weekDays.map((day) => {
                      const dayHourAppointments = filteredAppointments.filter((apt) => {
                        const aptDate = new Date(apt.scheduled_at);
                        return isSameDay(aptDate, day) && aptDate.getHours() === hour;
                      });
                      return (
                        <div
                          key={day.toISOString()}
                          className={`py-2 px-1 border-l border-gray-100 min-h-[60px] ${isToday(day) ? "bg-primary/5" : ""}`}
                        >
                          {dayHourAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className={`text-[10px] px-2 py-1 rounded border mb-1 ${statusColors[apt.status] || statusColors.pending}`}
                            >
                              <p className="font-medium truncate">{apt.patients?.users?.full_name || "Patient"}</p>
                              <p className="text-gray-600">{apt.duration_minutes}m</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Day View */}
          {viewMode === "day" && (
            <div className="max-h-[600px] overflow-y-auto">
              {hours.map((hour) => {
                const hourAppointments = filteredAppointments.filter((apt) => {
                  const aptDate = new Date(apt.scheduled_at);
                  return isSameDay(aptDate, currentDate) && aptDate.getHours() === hour;
                });
                return (
                  <div key={hour} className="flex border-b border-gray-100">
                    <div className="w-20 py-6 px-4 text-sm text-gray-400 text-right border-r border-gray-100 flex-shrink-0">
                      {format(new Date().setHours(hour, 0), "h:mm a")}
                    </div>
                    <div className="flex-1 py-2 px-4 min-h-[80px]">
                      {hourAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className={`px-4 py-3 rounded-lg border mb-2 ${statusColors[apt.status] || statusColors.pending}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{apt.patients?.users?.full_name || "Patient"}</p>
                            <span className="text-xs uppercase font-semibold">{apt.status}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(apt.scheduled_at), "h:mm a")} ({apt.duration_minutes}m)
                            </span>
                            {apt.type && (
                              <span className="capitalize">{apt.type.replace("-", " ")}</span>
                            )}
                          </div>
                          {userRole === "receptionist" && apt.doctors?.users?.full_name && (
                            <p className="text-xs mt-1 flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" />
                              Dr. {apt.doctors.users.full_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Day Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a day"}
          </h3>
          {selectedDate ? (
            selectedDayAppointments.length > 0 ? (
              <div className="space-y-3">
                {selectedDayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${apt.status === "active" || apt.status === "completed" ? "bg-green-500" : apt.status === "cancelled" ? "bg-red-500" : "bg-orange-500"}`} />
                      <span className="text-xs font-semibold uppercase text-gray-500">{apt.status}</span>
                    </div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {apt.patients?.users?.full_name || "Patient"}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {format(new Date(apt.scheduled_at), "h:mm a")} - {apt.duration_minutes} min
                    </p>
                    {userRole === "receptionist" && apt.doctors?.users?.full_name && (
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Stethoscope className="w-4 h-4 text-gray-400" />
                        Dr. {apt.doctors.users.full_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2 capitalize">
                      {apt.type?.replace("-", " ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No appointments</p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click on a day to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
