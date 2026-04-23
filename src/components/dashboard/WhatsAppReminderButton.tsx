"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {
  patientName: string | null | undefined;
  patientPhone: string | null | undefined;
  timeSlot: string | null | undefined;
  appointmentDate: string; // ISO
  /** Default country code used when the phone is saved in local form. */
  defaultCountryCode?: string;
  variant?: "full" | "icon";
};

/**
 * Normalize a free-form phone number into the `wa.me/<digits>` format.
 *
 * Rules (tuned for Algerian clinics — the primary launch market):
 *   1.  Strip everything except digits.
 *   2.  If the number already starts with a country code (e.g. "+213…"
 *       → starts with "213" after stripping, or a leading "00213" → "213"
 *       after stripping the trunk "00"), keep it as-is.
 *   3.  If it looks like a local number (starts with "0" or with a
 *       national prefix like "5", "6", "7"), drop any leading "0" and
 *       prepend the default country code (defaults to "213" / Algeria).
 *   4.  Reject anything shorter than 7 digits or longer than 20.
 */
function normalizePhone(raw: string, countryCode: string = "213"): string | null {
  if (!raw) return null;

  // Strip leading "00" international trunk prefix if present.
  let digits = raw.trim().replace(/^00/, "").replace(/\D/g, "");

  if (digits.length === 0) return null;

  if (digits.startsWith(countryCode)) {
    // Already includes the country code.
  } else {
    // Drop a single leading "0" (local-format).
    digits = digits.replace(/^0+/, "");
    digits = `${countryCode}${digits}`;
  }

  if (digits.length < 7 || digits.length > 20) return null;
  return digits;
}

/**
 * Green "Send WhatsApp Reminder" button — doctor / receptionist only.
 * Clicking opens https://wa.me/<digits>?text=<encoded> in a new tab with
 * a friendly pre-filled reminder message.
 */
export default function WhatsAppReminderButton({
  patientName,
  patientPhone,
  timeSlot,
  appointmentDate,
  defaultCountryCode = "213",
  variant = "full",
}: Props) {
  const normalized = patientPhone
    ? normalizePhone(patientPhone, defaultCountryCode)
    : null;
  const disabled = !normalized;

  function handleClick() {
    if (!normalized) {
      toast.error("No valid phone number on file for this patient.");
      return;
    }
    const name = (patientName ?? "").trim() || "there";

    // Resolve the time token shown in the message.
    const time =
      timeSlot ??
      new Date(appointmentDate).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

    const message = `Hello ${name}, your appointment is tomorrow at ${time}. Please be on time.`;

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
        title={disabled ? "No valid phone on file" : "Send WhatsApp reminder"}
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
      title={disabled ? "No valid phone on file" : "Send WhatsApp reminder"}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,211,102,0.25)]"
    >
      <MessageCircle className="w-4 h-4" />
      WhatsApp
    </button>
  );
}
