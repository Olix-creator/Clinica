"use client";

import { useState, useTransition } from "react";
import { format, addDays, setHours, setMinutes, isBefore, startOfDay } from "date-fns";
import {
  X,
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createAppointment } from "@/lib/data/appointments";
import { toast } from "sonner";

interface Doctor {
  id: string;
  specialty?: string;
  users?: {
    full_name: string;
  };
}

interface Patient {
  id: string;
  users?: {
    full_name: string;
  };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  patients: Patient[];
  preSelectedPatient?: string;
  preSelectedDoctor?: string;
  userRole: "doctor" | "receptionist" | "patient";
}

type Step = 1 | 2 | 3 | 4;

const appointmentTypes = [
  { id: "consultation", label: "General Consultation", duration: 30, description: "Regular check-up or health consultation" },
  { id: "follow-up", label: "Follow-up Visit", duration: 15, description: "Review previous treatment or results" },
  { id: "initial-exam", label: "Initial Examination", duration: 45, description: "First-time comprehensive examination" },
  { id: "lab-results", label: "Lab Results Review", duration: 20, description: "Discuss laboratory test results" },
  { id: "emergency", label: "Urgent Care", duration: 30, description: "Urgent medical attention required" },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00", "17:30",
];

export default function BookingModal({
  isOpen,
  onClose,
  doctors,
  patients,
  preSelectedPatient,
  preSelectedDoctor,
  userRole,
}: BookingModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Form state
  const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctor || "");
  const [selectedPatient, setSelectedPatient] = useState(preSelectedPatient || "");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  const selectedTypeData = appointmentTypes.find((t) => t.id === selectedType);

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedType !== "";
      case 2:
        return (userRole === "doctor" || selectedDoctor !== "") && (userRole === "patient" || selectedPatient !== "");
      case 3:
        return selectedDate !== null && selectedTime !== "";
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !selectedType) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

    startTransition(async () => {
      try {
        const result = await createAppointment({
          doctor_id: selectedDoctor || preSelectedDoctor!,
          patient_id: selectedPatient || preSelectedPatient!,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: selectedTypeData?.duration || 30,
          type: selectedType,
          notes: notes || undefined,
        });

        if (result?.error) {
          setBookingError(result.error);
        } else {
          setBookingSuccess(true);
          toast.success("Appointment booked successfully!");
        }
      } catch (err) {
        setBookingError("Failed to book appointment. Please try again.");
      }
    });
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedDoctor(preSelectedDoctor || "");
    setSelectedPatient(preSelectedPatient || "");
    setSelectedType("");
    setSelectedDate(null);
    setSelectedTime("");
    setNotes("");
    setBookingSuccess(false);
    setBookingError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Success state
  if (bookingSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={resetAndClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
          <p className="text-gray-500 mb-2">Your appointment has been successfully scheduled.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{selectedTypeData?.label}</span>
              <br />
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              <br />
              at {selectedTime}
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (bookingError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={resetAndClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Failed</h2>
          <p className="text-gray-500 mb-6">{bookingError}</p>
          <div className="flex gap-3">
            <button
              onClick={resetAndClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setBookingError(null)}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={resetAndClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Book Appointment</h2>
              <p className="text-sm text-gray-500">Step {step} of 4</p>
            </div>
          </div>
          <button onClick={resetAndClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What type of appointment?</h3>
              <div className="grid gap-3">
                {appointmentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedType === type.id ? "border-primary bg-primary" : "border-gray-300"
                    }`}>
                      {selectedType === type.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {type.duration} min
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Doctor & Patient */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Who is this appointment for?</h3>
              
              {/* Doctor Selection (not shown for doctor role) */}
              {userRole !== "doctor" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    Select Doctor
                  </label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {doctors.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          selectedDoctor === doc.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                          {doc.users?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "DR"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Dr. {doc.users?.full_name}</p>
                          <p className="text-sm text-gray-500">{doc.specialty || "General Physician"}</p>
                        </div>
                        {selectedDoctor === doc.id && (
                          <Check className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Patient Selection (not shown for patient role) */}
              {userRole !== "patient" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Select Patient
                  </label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.users?.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose date and time</h3>
              
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  Select Date
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-20 p-3 rounded-xl border-2 text-center transition-all ${
                        selectedDate && format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-xs text-gray-500">{format(date, "EEE")}</p>
                      <p className="text-lg font-bold text-gray-900">{format(date, "d")}</p>
                      <p className="text-xs text-gray-500">{format(date, "MMM")}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Select Time
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedTime === time
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm your appointment</h3>
              
              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="text-sm text-gray-500">Appointment Type</span>
                  <span className="font-medium text-gray-900">{selectedTypeData?.label}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="font-medium text-gray-900">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="text-sm text-gray-500">Time</span>
                  <span className="font-medium text-gray-900">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="font-medium text-gray-900">{selectedTypeData?.duration} minutes</span>
                </div>
                {userRole !== "doctor" && selectedDoctor && (
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <span className="text-sm text-gray-500">Doctor</span>
                    <span className="font-medium text-gray-900">
                      Dr. {doctors.find((d) => d.id === selectedDoctor)?.users?.full_name}
                    </span>
                  </div>
                )}
                {userRole !== "patient" && selectedPatient && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Patient</span>
                    <span className="font-medium text-gray-900">
                      {patients.find((p) => p.id === selectedPatient)?.users?.full_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special requests or information..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              step === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                canProceed()
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
