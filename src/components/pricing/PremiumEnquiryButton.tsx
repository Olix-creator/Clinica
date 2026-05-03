"use client";

import { Crown } from "lucide-react";

const PREMIUM_EMAIL = "moumen0829@gmail.com";

/**
 * "Go Premium" button. Opens the default mail client with a prefilled
 * subject + body so the operator just reviews and sends.
 *
 * We interpolate the owner's name and email when they're signed in so
 * the inbound email is easy to route. When anonymous, we let the user
 * fill in their own details — still a valid mailto, just less prefilled.
 */
export function PremiumEnquiryButton({
  ownerName,
  ownerEmail,
  ownerPhone,
  clinicName,
  label = "Go Premium",
}: {
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  clinicName?: string | null;
  label?: string;
}) {
  function buildHref() {
    const subject = "Clinic Request - Support / Subscription";

    const lines = [
      "Hi Clinica team,",
      "",
      `I'd like to upgrade ${clinicName ? `"${clinicName}"` : "my clinic"} to Premium.`,
      "",
      `  Clinic name : ${clinicName ?? ""}`,
      `  User name   : ${ownerName ?? ""}`,
      `  Phone       : ${ownerPhone ?? ""}`,
      `  Email       : ${ownerEmail ?? ""}`,
      "",
      "Preferred billing cadence (monthly / yearly):",
      "",
      "Message:",
      "",
      "",
      "Thanks!",
    ];

    const body = lines.join("\n");
    return `mailto:${PREMIUM_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <a
      href={buildHref()}
      className="btn primary"
      style={{ width: "100%", padding: "12px 16px" }}
    >
      <Crown size={16} />
      {label}
    </a>
  );
}
