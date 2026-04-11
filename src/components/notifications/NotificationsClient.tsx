"use client";

import { useState } from "react";
import { format, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
import {
  Bell,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Filter,
  Search,
  Trash2,
  Check,
  Stethoscope,
} from "lucide-react";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  patients?: {
    id: string;
    users?: {
      full_name: string;
      phone?: string;
    };
  };
  doctors?: {
    id: string;
    users?: {
      full_name: string;
    };
  };
}

interface Patient {
  id: string;
  users?: {
    full_name: string;
    phone?: string;
  };
}

interface Doctor {
  id: string;
  users?: {
    full_name: string;
  };
}

interface NotificationsClientProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors?: Doctor[];
  doctorId?: string;
  userName: string;
  userRole: "doctor" | "receptionist";
}

type NotificationType = "reminder" | "alert" | "info" | "success";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  link?: string;
  patient?: string;
  doctor?: string;
}

export default function NotificationsClient({
  appointments,
  patients,
  doctors = [],
  userName,
  userRole,
}: NotificationsClientProps) {
  const [filter, setFilter] = useState<"all" | "unread" | "reminders">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Generate notifications from appointments
  const notifications: Notification[] = [
    // Today's appointment reminders
    ...appointments
      .filter((apt) => isToday(new Date(apt.scheduled_at)) && apt.status === "pending")
      .map((apt) => ({
        id: `apt-today-${apt.id}`,
        type: "reminder" as NotificationType,
        title: "Upcoming Appointment",
        message: `${apt.patients?.users?.full_name || "Patient"} - ${format(new Date(apt.scheduled_at), "h:mm a")}`,
        time: new Date(apt.scheduled_at),
        read: readNotifications.has(`apt-today-${apt.id}`),
        patient: apt.patients?.users?.full_name,
        doctor: apt.doctors?.users?.full_name,
      })),
    // Tomorrow's appointments
    ...appointments
      .filter((apt) => isTomorrow(new Date(apt.scheduled_at)) && apt.status === "pending")
      .map((apt) => ({
        id: `apt-tomorrow-${apt.id}`,
        type: "info" as NotificationType,
        title: "Tomorrow&apos;s Appointment",
        message: `${apt.patients?.users?.full_name || "Patient"} scheduled for ${format(new Date(apt.scheduled_at), "h:mm a")}`,
        time: new Date(apt.scheduled_at),
        read: readNotifications.has(`apt-tomorrow-${apt.id}`),
        patient: apt.patients?.users?.full_name,
        doctor: apt.doctors?.users?.full_name,
      })),
    // Cancelled appointments alerts
    ...appointments
      .filter((apt) => apt.status === "cancelled" && isToday(new Date(apt.scheduled_at)))
      .map((apt) => ({
        id: `apt-cancelled-${apt.id}`,
        type: "alert" as NotificationType,
        title: "Appointment Cancelled",
        message: `${apt.patients?.users?.full_name || "Patient"} cancelled their ${format(new Date(apt.scheduled_at), "h:mm a")} appointment`,
        time: new Date(),
        read: readNotifications.has(`apt-cancelled-${apt.id}`),
        patient: apt.patients?.users?.full_name,
        doctor: apt.doctors?.users?.full_name,
      })),
    // Completed appointments
    ...appointments
      .filter((apt) => apt.status === "completed" && isToday(new Date(apt.scheduled_at)))
      .slice(0, 3)
      .map((apt) => ({
        id: `apt-completed-${apt.id}`,
        type: "success" as NotificationType,
        title: "Appointment Completed",
        message: `Session with ${apt.patients?.users?.full_name || "Patient"} completed`,
        time: new Date(apt.scheduled_at),
        read: readNotifications.has(`apt-completed-${apt.id}`),
        patient: apt.patients?.users?.full_name,
        doctor: apt.doctors?.users?.full_name,
      })),
  ];

  // Sort by time (most recent first)
  notifications.sort((a, b) => b.time.getTime() - a.time.getTime());

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (filter === "reminders" && n.type !== "reminder") return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.patient?.toLowerCase().includes(query) ||
        n.doctor?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setReadNotifications((prev) => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    setReadNotifications(new Set(notifications.map((n) => n.id)));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "reminder":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBg = (type: NotificationType, read: boolean) => {
    if (read) return "bg-gray-50";
    switch (type) {
      case "reminder":
        return "bg-blue-50";
      case "alert":
        return "bg-red-50";
      case "success":
        return "bg-green-50";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
          </h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {(["all", "unread", "reminders"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {f}
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-xl border border-gray-100 p-4 transition-all ${getNotificationBg(notification.type, notification.read)}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className={`font-medium ${notification.read ? "text-gray-600" : "text-gray-900"}`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm mt-0.5 ${notification.read ? "text-gray-400" : "text-gray-600"}`}>
                      {notification.message}
                    </p>
                    {userRole === "receptionist" && notification.doctor && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        Dr. {notification.doctor}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(notification.time, { addSuffix: true })}
                  </span>
                </div>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="flex-shrink-0 p-1 hover:bg-white rounded-lg transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4 text-gray-400 hover:text-primary" />
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
            <p className="text-sm text-gray-500">
              {filter === "unread" 
                ? "You have no unread notifications"
                : filter === "reminders"
                ? "No appointment reminders"
                : "Notifications will appear here"}
            </p>
          </div>
        )}
      </div>

      {/* Quick Compose (Simple messaging interface) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Quick Message
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="">Select recipient...</option>
              {userRole === "receptionist" &&
                doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.users?.full_name}
                  </option>
                ))}
              {patients.slice(0, 20).map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.users?.full_name} (Patient)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={3}
              placeholder="Type your message..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
