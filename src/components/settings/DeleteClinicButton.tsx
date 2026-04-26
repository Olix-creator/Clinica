"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { deleteClinicAction } from "@/app/(dashboard)/settings/actions";

/**
 * Creator-only clinic delete button + confirmation modal.
 *
 * The parent ONLY renders this when `auth.uid() === clinic.created_by`
 * — this component does no permission check itself, it trusts the
 * server-side policy. The RLS policy `clinics_delete_own` (migration
 * 0015) is the actual security boundary; the server action will reject
 * any non-creator regardless of what the client sent.
 *
 * Modal pattern is bare HTML <dialog>-style with a backdrop + escape
 * close — no shadcn / Radix dependency to keep the bundle lean.
 */
export function DeleteClinicButton({
  clinicId,
  clinicName,
}: {
  clinicId: string;
  clinicName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  // Force the user to type the clinic name back as a "are you sure"
  // friction step — same pattern GitHub / Vercel use for repo / project
  // deletion.
  const canSubmit =
    confirmText.trim().toLowerCase() === clinicName.trim().toLowerCase();

  function close() {
    if (pending) return;
    setOpen(false);
    setConfirmText("");
  }

  function submit() {
    if (!canSubmit) return;
    const fd = new FormData();
    fd.set("clinicId", clinicId);
    startTransition(async () => {
      const res = await deleteClinicAction(fd);
      // Server action redirects on success; if we get here, it failed.
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Deleted "${clinicName}"`);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn ghost"
        style={{
          color: "var(--danger)",
          padding: "10px 14px",
        }}
      >
        <Trash2 size={14} />
        Delete clinic
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Delete ${clinicName}`}
          onClick={close}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              background: "var(--surface-bright)",
              borderRadius: 16,
              boxShadow: "var(--elev-3)",
              padding: 24,
              border: "1px solid var(--outline-variant)",
              animation: "anim-slideUp .2s ease both",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--danger-50)",
                    color: "var(--danger)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={20} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Are you sure you want to delete this clinic?
                  </h3>
                  <p
                    className="t-small"
                    style={{ marginTop: 6, lineHeight: 1.55 }}
                  >
                    This will permanently delete{" "}
                    <strong style={{ color: "var(--on-surface)" }}>
                      {clinicName}
                    </strong>
                    , along with its doctors and team members. Existing
                    appointments must be cancelled first or this will fail.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                aria-label="Close"
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <label className="field-label">
              Type <strong style={{ color: "var(--on-surface)" }}>{clinicName}</strong> to confirm
            </label>
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={pending}
              placeholder={clinicName}
              className="input"
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="btn secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || pending}
                className="btn"
                style={{
                  background: canSubmit
                    ? "var(--danger)"
                    : "var(--bg-muted)",
                  color: canSubmit ? "#fff" : "var(--text-faint)",
                  cursor: canSubmit && !pending ? "pointer" : "not-allowed",
                  border: 0,
                }}
              >
                {pending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {pending ? "Deleting…" : "Delete clinic"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
