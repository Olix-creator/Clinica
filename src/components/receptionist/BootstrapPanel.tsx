"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Building2, UserPlus, ChevronDown } from "lucide-react";
import { addClinicAction, attachDoctorAction } from "@/app/(dashboard)/receptionist/actions";

type Clinic = { id: string; name: string };

const INPUT =
  "w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary transition disabled:opacity-60";

const BTN =
  "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-medium text-sm shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed";

export function BootstrapPanel({ clinics }: { clinics: Clinic[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(
    action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
    successMsg: string
  ) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      startTransition(async () => {
        const res = await action(fd);
        if (res.ok) {
          toast.success(successMsg);
          form.reset();
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    };
  }

  return (
    <div className="rounded-2xl bg-surface-container-low overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-surface-container transition"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold">Clinic & staff management</p>
            <p className="text-xs text-on-surface-variant">
              {clinics.length} clinic{clinics.length === 1 ? "" : "s"} set up
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-on-surface-variant transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-outline-variant/30 pt-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3 ml-1">
              Add a clinic
            </p>
            <form
              onSubmit={submit(addClinicAction, "Clinic created")}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                name="name"
                placeholder="New clinic name"
                className={INPUT}
                disabled={pending}
                required
              />
              <button type="submit" disabled={pending} className={BTN}>
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                Create clinic
              </button>
            </form>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3 ml-1">
              Attach a doctor
            </p>
            <form
              onSubmit={submit(attachDoctorAction, "Doctor attached to clinic")}
              className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <select
                name="clinicId"
                className={INPUT}
                disabled={pending || clinics.length === 0}
                required
              >
                <option value="">Select clinic…</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                name="doctorEmail"
                type="email"
                placeholder="doctor@example.com"
                className={INPUT}
                disabled={pending}
                required
              />
              <input
                name="specialty"
                placeholder="Specialty (optional)"
                className={INPUT}
                disabled={pending}
              />
              <button type="submit" disabled={pending} className={BTN}>
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Attach
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
