"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Accordion FAQ row, mirroring the handoff design's collapsing card.
 */
export function PricingFAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: "0 20px" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "18px 0",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 500,
          color: "var(--on-surface)",
          textAlign: "left",
        }}
      >
        {q}
        <ChevronDown
          size={18}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform .15s",
            color: "var(--text-subtle)",
          }}
        />
      </button>
      {open && (
        <div
          className="anim-fade"
          style={{
            paddingBottom: 18,
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}
