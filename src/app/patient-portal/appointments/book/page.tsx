"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, Stethoscope, CalendarDays, Clock,
  CheckCircle2, ChevronLeft, ChevronRight,
} from "lucide-react";

const CONSULTATION_TYPES = [
  { id: "1", name: "General Consultation", duration: 30, icon: "🩺" },
  { id: "2", name: "Follow-up Visit",       duration: 20, icon: "🔄" },
  { id: "3", name: "Lab Results Review",    duration: 20, icon: "🧪" },
  { id: "4", name: "Cardiology Check",      duration: 45, icon: "❤️" },
  { id: "5", name: "Annual Checkup",        duration: 60, icon: "📋" },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

const TAKEN_SLOTS = ["10:00", "11:00", "14:30"];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["S","M","T","W","T","F","S"];

export default function BookAppointmentPage() {
  const today = new Date();
  const [step, setStep]               = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [calYear, setCalYear]           = useState(today.getFullYear());
  const [calMonth, setCalMonth]         = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [booked, setBooked]             = useState(false);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();

  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }
  function nextMonth() { if (calMonth === 11){ setCalMonth(0);  setCalYear(y => y+1); } else setCalMonth(m => m+1); }
  function selectDay(day: number) {
    const d = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setSelectedDate(d); setSelectedTime("");
  }
  function isPast(day: number) {
    return new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  function isWeekend(day: number) { const d = new Date(calYear, calMonth, day).getDay(); return d === 0 || d === 6; }

  const selectedTypeObj = CONSULTATION_TYPES.find(t => t.id === selectedType);
  const canProceed = step === 1 ? !!selectedType : step === 2 ? !!selectedDate : !!selectedTime;

  if (booked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-scale-in">
        <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-green-100">
          <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
        <p className="text-gray-500 text-sm mb-1">{selectedTypeObj?.name}</p>
        <p className="text-primary font-semibold text-sm">{selectedDate} · {selectedTime}</p>
        <div className="mt-8 w-full space-y-3">
          <Link href="/patient-portal/appointments" className="block w-full py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-colors text-center">
            View My Appointments
          </Link>
          <Link href="/patient-portal" className="block w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors text-center">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/patient-portal/appointments" className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Book Appointment</h1>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s ? "bg-green-500 text-white" : step === s ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 rounded-full transition-all ${step > s ? "bg-green-400" : "bg-gray-100"}`} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-gray-400 font-medium">
            Step {step} of 3: {step===1 ? "Type" : step===2 ? "Date" : "Time"}
          </span>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Step 1 — Type */}
        {step === 1 && (
          <div className="animate-fade-in-up space-y-3">
            <p className="text-sm font-semibold text-gray-700 mb-4">Choose consultation type</p>
            {CONSULTATION_TYPES.map(ct => (
              <button key={ct.id} onClick={() => setSelectedType(ct.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedType === ct.id ? "border-primary bg-primary/5 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"
                }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                  selectedType === ct.id ? "bg-primary/10" : "bg-gray-50"
                }`}>{ct.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{ct.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{ct.duration} min</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedType === ct.id ? "border-primary bg-primary" : "border-gray-200"
                }`}>
                  {selectedType === ct.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Date */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <p className="text-sm font-semibold text-gray-700 mb-4">Select a date</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                <span className="text-sm font-bold text-gray-900">{MONTH_NAMES[calMonth]} {calYear}</span>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map((d,i) => <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_,i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_,i) => {
                  const day = i + 1;
                  const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const past = isPast(day);
                  const wknd = isWeekend(day);
                  const sel = selectedDate === dateStr;
                  const tod = dateStr === todayStr;
                  const dis = past || wknd;
                  return (
                    <button key={day} disabled={dis} onClick={() => selectDay(day)}
                      className={`aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                        sel  ? "bg-primary text-white shadow-md shadow-primary/30"
                        : tod ? "bg-primary/10 text-primary font-bold"
                        : dis ? "text-gray-200 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Time */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <p className="text-sm font-semibold text-gray-700 mb-1">Pick a time slot</p>
            <p className="text-xs text-gray-400 mb-4">{selectedDate}</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map(slot => {
                const taken = TAKEN_SLOTS.includes(slot);
                const sel   = selectedTime === slot;
                return (
                  <button key={slot} disabled={taken} onClick={() => setSelectedTime(slot)}
                    className={`py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      sel   ? "bg-primary text-white shadow-md shadow-primary/20"
                      : taken ? "bg-gray-50 text-gray-300 line-through cursor-not-allowed"
                      : "bg-white border border-gray-100 text-gray-700 hover:border-primary/40 hover:bg-primary/5"
                    }`}>
                    <Clock className="w-3.5 h-3.5" />{slot}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Confirmation summary */}
        {step === 3 && selectedTime && (
          <div className="mt-5 bg-primary/5 border border-primary/20 rounded-2xl p-4 animate-scale-in">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Booking Summary</p>
            <p className="text-sm font-bold text-gray-900">{selectedTypeObj?.name}</p>
            <p className="text-xs text-gray-500 mt-1">{selectedDate} · {selectedTime} · {selectedTypeObj?.duration} min</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6 pb-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s-1)}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors text-sm">
              Back
            </button>
          )}
          <button
            disabled={!canProceed}
            onClick={() => step < 3 ? setStep(s => s+1) : setBooked(true)}
            className="flex-1 py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/25 text-sm"
          >
            {step === 3 ? "Confirm Booking" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
