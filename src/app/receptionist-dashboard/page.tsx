"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  LogOut,
  Loader2,
  ClipboardList,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Stethoscope,
  User,
  Phone,
  Users,
  Play,
  SkipForward,
  CheckSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

type ConsultationType = { id: string; name: string; duration: number };

type Booking = {
  id: string;
  patient_id: string;
  patient_name: string | null;
  patient_phone: string | null;
  consultation_type_id: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
  consultation_types?: ConsultationType;
};

type QueueItem = {
  id: string;
  name: string;
  phone: string;
  queue_number: number;
  status: string;
  position: number;
  created_at: string;
  served_at: string | null;
};

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h < 17; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const ALL_SLOTS = generateTimeSlots();

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number) { return new Date(y, m, 1).getDay(); }

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function ReceptionistDashboardPage() {
  const { user, isSignedIn, isLoaded, signOut } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const l = t("booking");

  const [receptionistName, setReceptionistName] = useState("");
  const [tab, setTab] = useState<"bookings" | "add" | "queue">("bookings");

  // Bookings state
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Add booking state
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Calendar
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  // Queue state
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [currentServing, setCurrentServing] = useState<QueueItem | null>(null);

  // Auth + role check
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
        if (data.role !== "receptionist") {
          router.replace(data.role === "doctor" ? "/doctor-dashboard" : "/patient-dashboard");
          return;
        }
        setReceptionistName(data.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Receptionist");
      });
  }, [user, router]);

  // Load all bookings + consultation types
  const loadBookings = useCallback(async () => {
    const supabase = createClient();
    const [bRes, tRes] = await Promise.all([
      supabase.from("bookings").select("*, consultation_types(*)").order("date", { ascending: false }),
      supabase.from("consultation_types").select("*").order("name"),
    ]);
    if (bRes.error) console.error("[Clinica] Load bookings:", bRes.error);
    if (tRes.error) console.error("[Clinica] Load types:", tRes.error);
    setAllBookings(bRes.data || []);
    setConsultationTypes(tRes.data || []);
    setLoadingBookings(false);
  }, []);

  useEffect(() => { if (user) void loadBookings(); }, [user, loadBookings]);

  // Load queue
  const loadQueue = useCallback(async () => {
    const supabase = createClient();
    const todayDate = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("queue")
      .select("*")
      .gte("created_at", `${todayDate}T00:00:00`)
      .order("queue_number", { ascending: true });
    if (error) console.error("[Clinica] Load queue:", error);
    const items = (data || []) as QueueItem[];
    setQueueItems(items);
    setCurrentServing(items.find((i) => i.status === "in_progress") || null);
    setLoadingQueue(false);
  }, []);

  useEffect(() => { if (user) void loadQueue(); }, [user, loadQueue]);

  // Realtime queue subscription
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel("queue-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue" }, () => {
        void loadQueue();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadQueue]);

  // Fetch booked slots for selected date
  const fetchBookedSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("bookings").select("time").eq("date", date).eq("status", "booked");
    setBookedSlots((data || []).map((d) => d.time));
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedDate) { void fetchBookedSlots(selectedDate); setSelectedTime(""); }
  }, [selectedDate, fetchBookedSlots]);

  // Manual booking (receptionist books for a walk-in patient)
  async function handleManualBook() {
    if (!user || !patientName.trim() || !selectedType || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.from("bookings").insert({
      patient_id: "walk-in",
      patient_name: patientName.trim(),
      patient_phone: patientPhone.trim() || null,
      consultation_type_id: selectedType,
      date: selectedDate,
      time: selectedTime,
      status: "booked",
      booked_by: user.id,
    });

    if (error) {
      console.error("[Clinica] Manual booking failed:", error);
      if (error.code === "23505") setErrorMsg(l.slotTaken);
      else setErrorMsg(`${l.error} (${error.message})`);
      setSubmitting(false);
      return;
    }

    setSuccessMsg(l.success);
    setPatientName("");
    setPatientPhone("");
    setSelectedType("");
    setSelectedDate("");
    setSelectedTime("");
    setSubmitting(false);
    void loadBookings();
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  // Cancel booking
  async function cancelBooking(id: string) {
    const supabase = createClient();
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b));
  }

  // Queue: call next patient
  async function callNextPatient() {
    const supabase = createClient();
    // Mark current as done
    if (currentServing) {
      await supabase.from("queue").update({ status: "done" }).eq("id", currentServing.id);
    }
    // Find next waiting
    const waiting = queueItems.filter((i) => i.status === "waiting");
    if (waiting.length > 0) {
      const next = waiting[0];
      await supabase.from("queue").update({ status: "in_progress", served_at: new Date().toISOString() }).eq("id", next.id);
    }
    void loadQueue();
  }

  // Queue: complete current
  async function completeCurrentPatient() {
    if (!currentServing) return;
    const supabase = createClient();
    await supabase.from("queue").update({ status: "done" }).eq("id", currentServing.id);
    void loadQueue();
  }

  // Calendar helpers
  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }
  function selectDay(day: number) {
    setSelectedDate(`${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  function isDatePast(day: number) { const d = new Date(calYear, calMonth, day); const t2 = new Date(); t2.setHours(0,0,0,0); return d < t2; }
  function isWeekend(day: number) { const d = new Date(calYear, calMonth, day).getDay(); return d === 0 || d === 6; }

  if (!isLoaded || !isSignedIn) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const todaysBookings = allBookings.filter((b) => b.date === todayStr && b.status === "booked");
  const waitingCount = queueItems.filter((i) => i.status === "waiting").length;
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const selectedTypeObj = consultationTypes.find((ct) => ct.id === selectedType);

  return (
    <div className="min-h-screen bg-gray-bg-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Clinica</h1>
              <p className="text-xs text-gray-400">Receptionist Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-orange-600" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{receptionistName}</span>
              <button type="button" onClick={signOut} className="ml-1 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Sign out">
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
              <span className="text-sm font-medium text-gray-500">Today&apos;s Bookings</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{todaysBookings.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-orange-600" /></div>
              <span className="text-sm font-medium text-gray-500">Waiting in Queue</span>
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

        {/* Banners */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm font-medium text-green-700">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-sm font-medium text-red-700">{errorMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["bookings", "add", "queue"] as const).map((t2) => (
            <button
              key={t2}
              type="button"
              onClick={() => setTab(t2)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === t2 ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary"
              }`}
            >
              {t2 === "bookings" && <><Calendar className="w-4 h-4 inline mr-2" />All Bookings</>}
              {t2 === "add" && <><Stethoscope className="w-4 h-4 inline mr-2" />Add Booking</>}
              {t2 === "queue" && <><Users className="w-4 h-4 inline mr-2" />Queue Control</>}
            </button>
          ))}
        </div>

        {/* ========== ALL BOOKINGS TAB ========== */}
        {tab === "bookings" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">All Appointments</h2>
            </div>
            {loadingBookings ? (
              <div className="p-12 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : allBookings.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{l.noAppointments}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {allBookings.map((b) => (
                  <div key={b.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        b.status === "booked" ? "bg-primary/10" : b.status === "cancelled" ? "bg-red-50" : "bg-gray-100"
                      }`}>
                        <Stethoscope className={`w-5 h-5 ${
                          b.status === "booked" ? "text-primary" : b.status === "cancelled" ? "text-red-400" : "text-gray-400"
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{b.patient_name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">
                          {b.consultation_types?.name} &middot; {b.date} &middot; {b.time}
                          {b.patient_phone && <> &middot; {b.patient_phone}</>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        b.status === "booked" ? "bg-green-50 text-green-600"
                          : b.status === "cancelled" ? "bg-red-50 text-red-500"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {b.status}
                      </span>
                      {b.status === "booked" && (
                        <button type="button" onClick={() => cancelBooking(b.id)} className="text-xs text-red-400 hover:text-red-600 font-medium cursor-pointer">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== ADD BOOKING TAB ========== */}
        {tab === "add" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Manual Booking</h2>
              <p className="text-gray-500 mt-1">Book for a walk-in patient (no account needed)</p>
            </div>

            {/* Patient Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Patient Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Ahmed Benali"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="0555 123 456"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Type */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                {l.selectType}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {consultationTypes.map((ct) => (
                  <button key={ct.id} type="button" onClick={() => setSelectedType(ct.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selectedType === ct.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedType === ct.id ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{ct.name}</p>
                        <p className="text-xs text-gray-400">{ct.duration} {l.minutes}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                {l.selectDate}
              </h3>
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <span className="text-sm font-bold text-gray-900">{MONTH_NAMES[calMonth]} {calYear}</span>
                <button type="button" onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map((d) => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const isPast = isDatePast(day);
                  const isWknd = isWeekend(day);
                  const isSelected = selectedDate === dateStr;
                  const isToday2 = dateStr === todayStr;
                  const disabled = isPast || isWknd;
                  return (
                    <button key={day} type="button" disabled={disabled} onClick={() => selectDay(day)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        isSelected ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : isToday2 ? "bg-primary/10 text-primary font-bold"
                          : disabled ? "text-gray-200 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                {l.selectTime}
              </h3>
              {!selectedDate ? (
                <p className="text-sm text-gray-400 text-center py-8">{l.pickDate}</p>
              ) : slotsLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {ALL_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedTime === slot;
                    return (
                      <button key={slot} type="button" disabled={isBooked} onClick={() => setSelectedTime(slot)}
                        className={`py-3 px-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          isSelected ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : isBooked ? "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                            : "bg-gray-50 text-gray-700 hover:bg-primary/10 hover:text-primary"
                        }`}>
                        <Clock className="w-3.5 h-3.5 mx-auto mb-1" />{slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm */}
            {patientName.trim() && selectedType && selectedDate && selectedTime && (
              <div className="bg-white rounded-2xl border-2 border-primary/20 p-6 shadow-sm animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Booking Summary</p>
                    <p className="text-lg font-bold text-gray-900">{patientName} — {selectedTypeObj?.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedDate} &middot; {selectedTime} &middot; {selectedTypeObj?.duration} {l.minutes}
                      {patientPhone && <> &middot; {patientPhone}</>}
                    </p>
                  </div>
                  <button type="button" onClick={handleManualBook} disabled={submitting}
                    className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />{l.booking}</> : <><CheckCircle2 className="w-5 h-5" />{l.confirm}</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== QUEUE CONTROL TAB ========== */}
        {tab === "queue" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Queue Control</h2>
              <div className="flex gap-3">
                {currentServing && (
                  <button type="button" onClick={completeCurrentPatient}
                    className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />Complete
                  </button>
                )}
                <button type="button" onClick={callNextPatient}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/30 cursor-pointer flex items-center gap-2">
                  <SkipForward className="w-4 h-4" />Next Patient
                </button>
              </div>
            </div>

            {/* Currently Serving */}
            {currentServing && (
              <div className="bg-linear-to-r from-primary to-blue-500 rounded-2xl p-6 text-white shadow-xl">
                <p className="text-sm font-medium text-white/70 mb-2">Now Serving</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl font-extrabold">#{currentServing.queue_number}</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{currentServing.name}</p>
                    <p className="text-white/70 text-sm">{currentServing.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Queue List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Waiting List</h3>
              </div>
              {loadingQueue ? (
                <div className="p-12 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : queueItems.filter((i) => i.status === "waiting").length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No patients waiting</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {queueItems.filter((i) => i.status === "waiting").map((item, idx) => (
                    <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-sm font-bold text-orange-600">
                        #{item.queue_number}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.phone} &middot; Position {idx + 1}</p>
                      </div>
                      <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full">Waiting</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Today */}
            {queueItems.filter((i) => i.status === "done").length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-6 py-5 border-b border-gray-50">
                  <h3 className="text-lg font-bold text-gray-900">Completed Today</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {queueItems.filter((i) => i.status === "done").map((item) => (
                    <div key={item.id} className="px-6 py-4 flex items-center gap-4 opacity-60">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-sm font-bold text-green-600">
                        #{item.queue_number}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.phone}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
