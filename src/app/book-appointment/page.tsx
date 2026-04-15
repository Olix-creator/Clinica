"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  Loader2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Stethoscope,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import Link from "next/link";

type ConsultationType = {
  id: string;
  name: string;
  duration: number;
};

type Booking = {
  id: string;
  patient_id: string;
  consultation_type_id: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
  consultation_types?: ConsultationType;
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function BookAppointmentPage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const l = t("booking");

  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState<"book" | "my">("book");

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  // Load consultation types + user bookings
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function load() {
      const [typesRes, bookingsRes] = await Promise.all([
        supabase.from("consultation_types").select("*").order("name"),
        supabase
          .from("bookings")
          .select("*, consultation_types(*)")
          .eq("patient_id", user!.id)
          .order("date", { ascending: true }),
      ]);

      if (typesRes.error) {
        console.error("[Clinica] Failed to load consultation types:", typesRes.error);
      }
      if (bookingsRes.error) {
        console.error("[Clinica] Failed to load bookings:", bookingsRes.error);
      }

      setConsultationTypes(typesRes.data || []);
      setBookings(bookingsRes.data || []);
      setLoading(false);
    }

    void load();
  }, [user]);

  // Fetch booked slots when date changes
  const fetchBookedSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("time")
      .eq("date", date)
      .eq("status", "booked");

    if (error) {
      console.error("[Clinica] Failed to fetch booked slots:", error);
    }
    setBookedSlots((data || []).map((d) => d.time));
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      void fetchBookedSlots(selectedDate);
      setSelectedTime("");
    }
  }, [selectedDate, fetchBookedSlots]);

  // Book appointment
  async function handleBook() {
    if (!user || !selectedType || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setErrorMsg("");

    const supabase = createClient();

    // Get user profile for name/phone
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", user.id)
      .single();

    const patientName = profile?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Patient";

    const { error } = await supabase.from("bookings").insert({
      patient_id: user.id,
      patient_name: patientName,
      patient_phone: profile?.phone || "",
      consultation_type_id: selectedType,
      date: selectedDate,
      time: selectedTime,
      status: "booked",
      booked_by: user.id,
    });

    if (error) {
      console.error("[Clinica] Booking insert failed:", error);
      if (error.code === "23505") {
        setErrorMsg(l.slotTaken);
      } else {
        setErrorMsg(`${l.error} (${error.message})`);
      }
      setSubmitting(false);
      return;
    }

    // Refresh bookings
    const { data: refreshed } = await supabase
      .from("bookings")
      .select("*, consultation_types(*)")
      .eq("patient_id", user.id)
      .order("date", { ascending: true });

    setBookings(refreshed || []);
    setSuccessMsg(l.success);
    setSelectedTime("");
    setSelectedDate("");
    setSelectedType("");
    setSubmitting(false);

    setTimeout(() => setSuccessMsg(""), 4000);
  }

  // Cancel booking
  async function handleCancel(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      console.error("[Clinica] Cancel failed:", error);
      return;
    }
    setBookings((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)),
    );
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  }

  function selectDay(day: number) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
  }

  function isDatePast(day: number) {
    const d = new Date(calYear, calMonth, day);
    const t2 = new Date();
    t2.setHours(0, 0, 0, 0);
    return d < t2;
  }

  function isWeekend(day: number) {
    const d = new Date(calYear, calMonth, day).getDay();
    return d === 0 || d === 6;
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const selectedTypeObj = consultationTypes.find((ct) => ct.id === selectedType);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const upcomingBookings = bookings.filter((a) => a.date >= todayStr && a.status === "booked");
  const pastBookings = bookings.filter((a) => a.date < todayStr || a.status !== "booked");

  return (
    <div className="min-h-screen bg-gray-bg-light">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Clinica</h1>
              <p className="text-xs text-gray-400">{l.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/patient-dashboard"
              className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{l.backToDashboard}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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
        <div className="flex gap-2 mb-8">
          <button
            type="button"
            onClick={() => setTab("book")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              tab === "book"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            {l.title}
          </button>
          <button
            type="button"
            onClick={() => setTab("my")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              tab === "my"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            {l.yourAppointments}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tab === "book" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{l.title}</h2>
              <p className="text-gray-500 mt-1">{l.subtitle}</p>
            </div>

            {/* Step 1: Type */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                {l.selectType}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {consultationTypes.map((ct) => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setSelectedType(ct.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selectedType === ct.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedType === ct.id ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                      }`}>
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

            {/* Step 2: Calendar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                {l.selectDate}
              </h3>
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm font-bold text-gray-900">{MONTH_NAMES[calMonth]} {calYear}</span>
                <button type="button" onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isPast = isDatePast(day);
                  const isWknd = isWeekend(day);
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === todayStr;
                  const disabled = isPast || isWknd;
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDay(day)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        isSelected ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : isToday ? "bg-primary/10 text-primary font-bold"
                          : disabled ? "text-gray-200 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Time Slots */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                {l.selectTime}
              </h3>
              {!selectedDate ? (
                <p className="text-sm text-gray-400 text-center py-8">{l.pickDate}</p>
              ) : slotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {ALL_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 px-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          isSelected ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : isBooked ? "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                            : "bg-gray-50 text-gray-700 hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 mx-auto mb-1" />
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm */}
            {selectedType && selectedDate && selectedTime && (
              <div className="bg-white rounded-2xl border-2 border-primary/20 p-6 shadow-sm animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Appointment Summary</p>
                    <p className="text-lg font-bold text-gray-900">{selectedTypeObj?.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedDate} &middot; {selectedTime} &middot; {selectedTypeObj?.duration} {l.minutes}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBook}
                    disabled={submitting}
                    className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />{l.booking}</>
                    ) : (
                      <><CheckCircle2 className="w-5 h-5" />{l.confirm}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MY APPOINTMENTS TAB */
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{l.yourAppointments}</h2>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{l.upcoming}</h3>
              {upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                  <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">{l.noAppointments}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{b.consultation_types?.name}</p>
                          <p className="text-xs text-gray-400">{b.date} &middot; {b.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">{l.booked}</span>
                        <button type="button" onClick={() => handleCancel(b.id)} className="text-xs text-red-400 hover:text-red-600 font-medium cursor-pointer">{l.cancel}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{l.past}</h3>
              {pastBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                  <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">{l.noAppointments}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between opacity-70">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{b.consultation_types?.name}</p>
                          <p className="text-xs text-gray-400">{b.date} &middot; {b.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        b.status === "cancelled" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"
                      }`}>
                        {b.status === "cancelled" ? l.cancelledStatus : l.completed}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
