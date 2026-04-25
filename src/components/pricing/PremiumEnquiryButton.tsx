"use client";

import { Crown } from "lucide-react";

const PREMIUM_EMAIL = "hello@meddiscover.app";

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
  clinicName,
  label = "Go Premium",
}: {
  ownerName?: string | null;
  ownerEmail?: string | null;
  clinicName?: string | null;
  label?: string;
}) {
  function buildHref() {
    const subject = clinicName
      ? `Premium upgrade request — ${clinicName}`
      : "Premium upgrade request";

    const lines = [
      "Hi MedDiscover team,",
      "",
      `I'd like to upgrade ${clinicName ? `"${clinicName}"` : "my clinic"} to Premium.`,
      "",
      "Contact details:",
      ownerName ? `  Name:  ${ownerName}` : "  Name:  ",
      ownerEmail ? `  Email: ${ownerEmail}` : "  Email: ",
      clinicName ? `  Clinic: ${clinicName}` : "",
      "",
      "Preferred billing cadence (monthly / yearly):",
      "",
      "Thanks!",
    ].filter(Boolean);

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
