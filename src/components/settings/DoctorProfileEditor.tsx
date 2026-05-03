"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Stethoscope } from "lucide-react";
import { updateDoctorProfileAction } from "@/app/(dashboard)/settings/actions";

const SPECIALTIES = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Dentistry",
  "Ophthalmology",
  "Gynecology",
  "Orthopedics",
  "Psychiatry",
  "ENT",
];

export type EditableDoctor = {
  id: string;
  name: string | null;
  specialty: string | null;
  diploma: string | null;
  since_year: number | null;
  description: string | null;
};

const INPUT =
  "w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60";

/**
 * Self-service doctor profile editor used by the doctor on /settings.
 *
 * Submits to `updateDoctorProfileAction` which:
 *   - updates `profiles.full_name` (so the doctor's name updates
 *     everywhere — booking, dashboards, /clinic/[id])
 *   - updates the matching `doctors` row's specialty / diploma /
 *     since_year / description
 *
 * Validation matches the onboarding rules — required fields except
 * description.
 */
export function DoctorProfileEditor({
  doctor,
  initialFullName,
}: {
  doctor: EditableDoctor;
  initialFullName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateDoctorProfileAction(fd);
      if (res.ok) {
        toast.success("Information updated successfully");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="rounded-2xl bg-surface-container-highest overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-bright/60 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {doctor.name ?? initialFullName ?? "Your doctor profile"}
            </p>
            <p className="text-xs text-on-surface-variant truncate">
              {doctor.specialty ?? "Set your specialty"}
              {doctor.since_year ? ` · since ${doctor.since_year}` : ""}
            </p>
          </div>
        </div>
        <span className="text-xs text-on-surface-variant">
          {open ? "Hide" : "Edit"}
        </span>
      </button>

      {open ? (
        <div className="px-4 pb-4 pt-1 border-t border-outline-variant/30 space-y-3">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Full name
              </label>
              <input
                name="fullName"
                defaultValue={doctor.name ?? initialFullName ?? ""}
                className={INPUT}
                disabled={pending}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                  Specialty
                </label>
                <select
                  name="specialty"
                  defaultValue={doctor.specialty ?? "General Practice"}
                  className={INPUT}
                  disabled={pending}
                  required
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                  Practicing since
                </label>
                <input
                  name="sinceYear"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear()}
                  defaultValue={doctor.since_year ?? ""}
                  className={INPUT}
                  disabled={pending}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Diploma / qualification
              </label>
              <input
                name="diploma"
                defaultValue={doctor.diploma ?? ""}
                className={INPUT}
                disabled={pending}
                placeholder="MD — Université d'Alger · Board-certified Cardiology"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant font-semibold">
                Description (optional)
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={doctor.description ?? ""}
                className={`${INPUT} leading-relaxed`}
                disabled={pending}
                placeholder="Special interests, languages spoken, anything patients should know."
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed text-sm font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-70"
            >
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save changes
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
