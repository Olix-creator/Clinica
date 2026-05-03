"use client";

import { LifeBuoy } from "lucide-react";

const SUPPORT_EMAIL = "moumen0829@gmail.com";

/**
 * "Contact Support" mailto button — single source of truth for the
 * support email target. Pre-fills subject + body with whatever
 * identifying context the parent has on hand so the inbound email
 * can be routed without a back-and-forth.
 *
 * Used on the dashboard topbar, the pricing page, and inside settings.
 * The Premium upgrade flow uses `PremiumEnquiryButton` which talks to
 * the same address but with a different subject + body.
 */
export function ContactSupportButton({
  clinicName,
  userName,
  phone,
  email,
  variant = "secondary",
  label = "Contact Support",
  fullWidth = false,
}: {
  clinicName?: string | null;
  userName?: string | null;
  phone?: string | null;
  email?: string | null;
  variant?: "primary" | "secondary" | "ghost";
  label?: string;
  fullWidth?: boolean;
}) {
  function buildHref() {
    const subject = "Clinic Request - Support / Subscription";
    const lines = [
      "Hi Clinica team,",
      "",
      "I'd like help with my account / subscription. Here are my details:",
      "",
      `  Clinic name : ${clinicName ?? ""}`,
      `  User name   : ${userName ?? ""}`,
      `  Phone       : ${phone ?? ""}`,
      `  Email       : ${email ?? ""}`,
      "",
      "Message:",
      "",
      "",
      "Thanks!",
    ];
    const body = lines.join("\n");
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <a
      href={buildHref()}
      className={`btn ${variant}`}
      style={fullWidth ? { width: "100%" } : undefined}
    >
      <LifeBuoy size={15} />
      {label}
    </a>
  );
}
