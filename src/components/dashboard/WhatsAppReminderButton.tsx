"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {
  patientName: string | null | undefined;
  patientPhone: string | null | undefined;
  timeSlot: string | null | undefined;
  appointmentDate: string; // ISO
  variant?: "full" | "icon";
};

function normalizePhone(raw: string): string | null {
  // wa.me expects digits-only, no "+", no spaces, dashes or parens.
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 20) return null;
  return digits;
}

function formatWhen(appointmentDate: string, timeSlot: string | null | undefined): string {
  const d = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOf = new Date(d);
  dayOf.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dayOf.getTime() - today.getTime()) / 86400000);
  let whenPhrase = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  if (diffDays === 0) whenPhrase = "today";
  else if (diffDays === 1) whenPhrase = "tomorrow";

  const time =
    timeSlot ??
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${whenPhrase} at ${time}`;
}

/**
 * Green "Send WhatsApp Reminder" button — doctor / receptionist only.
 * Clicking opens https://wa.me/<digits>?text=<encoded> in a new tab with
 * a friendly pre-filled reminder.
 */
export default function WhatsAppReminderButton({
  patientName,
  patientPhone,
  timeSlot,
  appointmentDate,
  variant = "full",
}: Props) {
  const normalized = patientPhone ? normalizePhone(patientPhone) : null;
  const disabled = !normalized;

  function handleClick() {
    if (!normalized) {
      toast.error("No phone number on file for this patient.");
      return;
    }
    const name = (patientName ?? "").trim() || "there";
    const when = formatWhen(appointmentDate, timeSlot);
    const message = `Hello ${name}, this is a reminder that your appointment is scheduled for ${when}. Please be on time.`;
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp opened");
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={disabled ? "No phone on file" : "Send WhatsApp reminder"}
        aria-label="Send WhatsApp reminder"
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={disabled ? "No phone on file" : "Send WhatsApp reminder"}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,211,102,0.25)]"
    >
      <MessageCircle className="w-4 h-4" />
      WhatsApp
    </button>
  );
}
