"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  Stethoscope,
  Users,
  LogOut,
  Loader2,
  User,
  Phone,
  Calendar,
  Clock,
  Play,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

type Booking = {
  id: string;
  patient_name: string | null;
  patient_phone: string | null;
  date: string;
  time: string;
  status: string;
  consultation_types?: { name: string; duration: number };
};

type QueueItem = {
  id: string;
  name: string;
  phone: string;
  queue_number: number;
  status: string;
};

export default function DoctorDashboardPage() {
  const { user, isSignedIn, isLoaded, signOut } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const l = t("doctorDashboard");
  const [doctorName, setDoctorName] = useState("");
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentServing, setCurrentServing] = useState<QueueItem | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/login");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    supabase
      .from("profiles")
      .select("role, name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) { router.replace("/choose-role"); return; }
        if (data.role !== "doctor") {
          router.replace(data.role === "receptionist" ? "/receptionist-dashboard" : "/patient-dashboard");
          return;
        }
        setDoctorName(data.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Doctor");
      });
  }, [user, router]);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const todayDate = new Date().toISOString().split("T")[0];

    const [bookingsRes, queueRes] = await Promise.all([
      supabase.from("bookings").select("*, consultation_types(*)").eq("date", todayDate).eq("status", "booked").order("time"),
      supabase.from("queue").select("*").gte("created_at", `${todayDate}T00:00:00`).order("queue_number"),
    ]);

    if (bookingsRes.error) console.error("[Clinica] Doctor bookings:", bookingsRes.error);
    if (queueRes.error) console.error("[Clinica] Doctor queue:", queueRes.error);

    setTodaysBookings(bookingsRes.data || []);
    const items = (queueRes.data || []) as QueueItem[];
    setQueueItems(items);
    setCurrentServing(items.find((i) => i.status === "in_progress") || null);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) void loadData(); }, [user, loadData]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel("doctor-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue" }, () => { void loadData(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => { void loadData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

  if (!isLoaded || !isSignedIn) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const initials = doctorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const waitingCount = queueItems.filter((i) => i.status === "waiting").length;

  return (
    <div className="min-h-screen bg-gray-bg-light">
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
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">{initials}</div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{doctorName}</p>
                <p className="text-xs text-gray-400">{l.role}</p>
              </div>
              <button type="button" onClick={signOut} className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
              <span className="text-sm font-medium text-gray-500">Today&apos;s Appointments</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{todaysBookings.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-orange-600" /></div>
              <span className="text-sm font-medium text-gray-500">In Queue</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{waitingCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><Play className="w-5 h-5 text-green-600" /></div>
              <span className="text-sm font-medium text-gray-500">Now Serving</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {currentServing ? `#${currentServing.queue_number} — ${currentServing.name}` : "—"}
            </p>
          </div>
        </div>

        {/* Current Queue */}
        {queueItems.filter((i) => i.status === "waiting").length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Waiting Queue
              </h2>
              <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="divide-y divide-gray-50">
              {queueItems.filter((i) => i.status === "waiting").map((item, idx) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-sm font-bold text-orange-600">#{item.queue_number}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{item.phone}</p>
                  </div>
                  <span className="text-xs text-gray-400">Position {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Today&apos;s Appointments
            </h2>
          </div>
          {loading ? (
            <div className="p-12 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : todaysBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No appointments for today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todaysBookings.map((b) => (
                <div key={b.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.patient_name || "Unknown"}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <Clock className="w-3 h-3" />{b.time}
                      <span>&middot;</span>
                      {b.consultation_types?.name}
                      {b.patient_phone && <><span>&middot;</span><Phone className="w-3 h-3" />{b.patient_phone}</>}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">Booked</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
