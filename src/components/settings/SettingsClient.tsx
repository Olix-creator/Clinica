"use client";

import { useState, useTransition } from "react";
import {
  User,
  Building,
  Lock,
  Clock,
  Calendar,
  Shield,
  Bell,
  Globe,
  ChevronRight,
  Save,
} from "lucide-react";
import { updateProfile, changePassword } from "@/lib/data/settings";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";

interface SettingsClientProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  doctor?: {
    specialty: string | null;
    clinic_name: string | null;
    working_days: string[] | null;
    working_hours: string | null;
    is_available: boolean;
  };
  userRole?: "doctor" | "receptionist";
}

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SettingsClient({ user, doctor, userRole = "doctor" }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"profile" | "clinic" | "schedule" | "security" | "notifications">("profile");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [workingDays, setWorkingDays] = useState<string[]>(doctor?.working_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [isAvailable, setIsAvailable] = useState(doctor?.is_available ?? true);
  const { t } = useI18n();
  const settings = t("settings");

  function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("working_days", JSON.stringify(workingDays));
    fd.append("is_available", String(isAvailable));
    startTransition(async () => {
      const result = await updateProfile(fd);
      if (result?.error) toast.error(result.error);
      else toast.success(settings.saved);
    });
  }

  function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    startTransition(async () => {
      const result = await changePassword(newPassword);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(settings.passwordChanged);
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  const toggleWorkingDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const tabs = [
    { id: "profile", label: settings.profile, icon: User },
    ...(userRole === "doctor" ? [
      { id: "clinic", label: settings.clinic, icon: Building },
      { id: "schedule", label: "Schedule", icon: Calendar },
    ] : []),
    { id: "security", label: settings.account, icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{settings.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/5 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{tab.label}</span>
                <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === tab.id ? "rotate-90" : ""}`} />
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          {userRole === "doctor" && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full capitalize">{user.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Availability</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{settings.profile}</h2>
                  <p className="text-sm text-gray-500">Manage your personal information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{settings.fullName}</label>
                  <input
                    name="full_name"
                    defaultValue={user.full_name}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{settings.email}</label>
                  <input
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{settings.phone}</label>
                  <input
                    name="phone"
                    defaultValue={user.phone || ""}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                {userRole === "doctor" && doctor && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{settings.specialty}</label>
                    <input
                      name="specialty"
                      defaultValue={doctor.specialty || ""}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="e.g. Cardiologist, General Physician"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {settings.saveChanges}
                </button>
              </div>
            </form>
          )}

          {/* Clinic Tab (Doctor only) */}
          {activeTab === "clinic" && userRole === "doctor" && doctor && (
            <form onSubmit={handleProfileSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{settings.clinic}</h2>
                  <p className="text-sm text-gray-500">Manage your clinic details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{settings.clinicName}</label>
                  <input
                    name="clinic_name"
                    defaultValue={doctor.clinic_name || ""}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="e.g. Clinica Medical Center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Availability Status</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setIsAvailable(true)}
                      className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                        isAvailable ? "border-green-500 bg-green-50" : "border-gray-200"
                      }`}
                    >
                      <span className={`font-medium ${isAvailable ? "text-green-700" : "text-gray-600"}`}>Available</span>
                      <p className="text-xs text-gray-500 mt-1">Accept new appointments</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAvailable(false)}
                      className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                        !isAvailable ? "border-red-500 bg-red-50" : "border-gray-200"
                      }`}
                    >
                      <span className={`font-medium ${!isAvailable ? "text-red-700" : "text-gray-600"}`}>Unavailable</span>
                      <p className="text-xs text-gray-500 mt-1">Temporarily unavailable</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {settings.saveChanges}
                </button>
              </div>
            </form>
          )}

          {/* Schedule Tab (Doctor only) */}
          {activeTab === "schedule" && userRole === "doctor" && (
            <form onSubmit={handleProfileSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Working Schedule</h2>
                  <p className="text-sm text-gray-500">Set your working days and hours</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          workingDays.includes(day)
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      name="working_hours_start"
                      type="time"
                      defaultValue="08:00"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      name="working_hours_end"
                      type="time"
                      defaultValue="18:00"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break Time</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      name="break_start"
                      type="time"
                      defaultValue="12:00"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <input
                      name="break_end"
                      type="time"
                      defaultValue="14:00"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {settings.saveChanges}
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordChange} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{settings.changePassword}</h2>
                  <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{settings.newPassword}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{settings.confirmPassword}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending || !newPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  {settings.changePassword}
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-500">Control how you receive notifications</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { id: "email_appointments", label: "Appointment Reminders", desc: "Receive email notifications for upcoming appointments" },
                  { id: "email_cancellations", label: "Cancellation Alerts", desc: "Get notified when appointments are cancelled" },
                  { id: "sms_reminders", label: "SMS Reminders", desc: "Receive SMS notifications (requires phone number)" },
                  { id: "queue_updates", label: "Queue Updates", desc: "Real-time updates when patients join the queue" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
