"use client";

import { Phone } from "lucide-react";
import { toast } from "sonner";

/**
 * Small "Call patient" button. Clicking triggers a `tel:` link so the OS
 * hands off to the native dialer (iOS/Android) or a configured desktop
 * SIP/VoIP client. Disabled with a tooltip when no phone is on file.
 */
export default function CallButton({
  phone,
  variant = "icon",
}: {
  phone: string | null | undefined;
  variant?: "icon" | "full";
}) {
  const normalized = phone?.trim() ?? "";
  const disabled = !normalized;

  function handleClick() {
    if (!normalized) {
      toast.error("No phone number on file for this patient.");
      return;
    }
    // Keep "+" but strip everything else that would confuse the dialer.
    const telDigits = normalized.replace(/[^\d+]/g, "");
    window.location.href = `tel:${telDigits}`;
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={disabled ? "No phone on file" : `Call ${normalized}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/15"
      >
        <Phone className="w-4 h-4 text-primary" />
        Call
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={disabled ? "No phone on file" : `Call ${normalized}`}
      aria-label="Call patient"
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface-variant hover:text-primary hover:bg-surface-bright transition disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/15"
    >
      <Phone className="w-4 h-4" />
    </button>
  );
}
