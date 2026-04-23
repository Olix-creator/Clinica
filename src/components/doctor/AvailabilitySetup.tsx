"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  Loader2,
  Save,
  CalendarX,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  saveWeeklyAvailabilityAction,
  addBreakAction,
  deleteBreakAction,
} from "@/app/(dashboard)/doctor/availability/actions";
import type {
  AvailabilityBlock,
  AvailabilityRow,
  DayOfWeek,
  DoctorBreak,
} from "@/lib/data/availability";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DAYS: { value: DayOfWeek; short: string; long: string }[] = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 0, short: "Sun", long: "Sunday" },
];

// Hours the doctor can pick from. Kept in 30-min increments to match
// TIME_SLOTS so the suggestion never surprises the patient.
const HOURS: string[] = (() => {
  const out: string[] = [];
  for (let h = 7; h <= 20; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

type DayConfig = {
  enabled: boolean;
  start: string;
  end: string;
};

const DEFAULT_DAY: DayConfig = { enabled: false, start: "09:00", end: "17:00" };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AvailabilitySetup({
  doctorId,
  initialAvailability,
  initialBreaks,
  compact = false,
}: {
  doctorId: string;
  initialAvailability: AvailabilityRow[];
  initialBreaks: DoctorBreak[];
  /** Render a slimmer variant — used when embedded inside another card. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Seed from existing rows → fall back to "Mon–Fri 9–5" for first-time setup.
  const [days, setDays] = useState<Record<DayOfWeek, DayConfig>>(() => {
    const seed: Record<DayOfWeek, DayConfig> = {
      0: { ...DEFAULT_DAY },
      1: { ...DEFAULT_DAY, enabled: true },
      2: { ...DEFAULT_DAY, enabled: true },
      3: { ...DEFAULT_DAY, enabled: true },
      4: { ...DEFAULT_DAY, enabled: true },
      5: { ...DEFAULT_DAY, enabled: true },
      6: { ...DEFAULT_DAY },
    };
    if (initialAvailability.length > 0) {
      // Reset everything to off, then apply persisted rows.
      for (const d of [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]) seed[d] = { ...DEFAULT_DAY };
      for (const row of initialAvailability) {
        seed[row.day_of_week as DayOfWeek] = {
          enabled: true,
          start: row.start_time.slice(0, 5),
          end: row.end_time.slice(0, 5),
        };
      }
    }
    return seed;
  });

  const [breaks, setBreaks] = useState<DoctorBreak[]>(initialBreaks);
  const [breakForm, setBreakForm] = useState({
    breakDate: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  function setDay(d: DayOfWeek, patch: Partial<DayConfig>) {
    setDays((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  }

  const blocks = useMemo<AvailabilityBlock[]>(() => {
    const out: AvailabilityBlock[] = [];
    for (const d of [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]) {
      const cfg = days[d];
      if (cfg.enabled && cfg.start && cfg.end && cfg.start < cfg.end) {
        out.push({ day_of_week: d, start_time: cfg.start, end_time: cfg.end });
      }
    }
    return out;
  }, [days]);

  const hasInvalid = useMemo(() => {
    for (const d of [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]) {
      const cfg = days[d];
      if (cfg.enabled && cfg.start >= cfg.end) return true;
    }
    return false;
  }, [days]);

  function save() {
    if (hasInvalid) {
      toast.error("End time must be after start time on every active day.");
      return;
    }
    const fd = new FormData();
    fd.set("doctorId", doctorId);
    fd.set("blocks", JSON.stringify(blocks));
    startTransition(async () => {
      const res = await saveWeeklyAvailabilityAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Availability saved");
      router.refresh();
    });
  }

  function submitBreak(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!breakForm.breakDate) {
      toast.error("Pick a date for the break");
      return;
    }
    const fd = new FormData();
    fd.set("doctorId", doctorId);
    fd.set("breakDate", breakForm.breakDate);
    if (breakForm.startTime) fd.set("startTime", breakForm.startTime);
    if (breakForm.endTime) fd.set("endTime", breakForm.endTime);
    if (breakForm.reason) fd.set("reason", breakForm.reason);
    startTransition(async () => {
      const res = await addBreakAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Break added");
      setBreakForm({ breakDate: "", startTime: "", endTime: "", reason: "" });
      router.refresh();
    });
  }

  function removeBreak(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    // Optimistic removal.
    setBreaks((prev) => prev.filter((b) => b.id !== id));
    startTransition(async () => {
      const res = await deleteBreakAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        router.refresh(); // revert
        return;
      }
      toast.success("Break removed");
      router.refresh();
    });
  }

  return (
    <section
      className={[
        "rounded-[2rem] bg-surface-container-lowest border border-outline-variant overflow-hidden",
        compact ? "" : "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)]",
      ].join(" ")}
    >
      <header className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant">
        <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </span>
        <div>
          <h3 className="font-semibold text-[15px]">Your working hours</h3>
          <p className="text-xs text-on-surface-variant">
            Patients can only book during these windows. Leave a day off to block bookings.
          </p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Weekly grid */}
        <div className="space-y-2">
          {DAYS.map(({ value, short, long }) => {
            const cfg = days[value];
            const invalid = cfg.enabled && cfg.start >= cfg.end;
            return (
              <div
                key={value}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant"
              >
                <label className="inline-flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    checked={cfg.enabled}
                    onChange={(e) => setDay(value, { enabled: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium">
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{long}</span>
                  </span>
                </label>

                {cfg.enabled ? (
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <TimeSelect
                        value={cfg.start}
                        onChange={(v) => setDay(value, { start: v })}
                      />
                      <span className="text-xs text-on-surface-variant">to</span>
                      <TimeSelect value={cfg.end} onChange={(v) => setDay(value, { end: v })} />
                    </div>
                    {invalid && (
                      <span className="text-xs text-error inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        End must be after start
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-on-surface-variant">Closed</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-on-surface-variant">
            {blocks.length === 0
              ? "⚠️ You have no working hours set — patients cannot book you."
              : `${blocks.length} working day${blocks.length === 1 ? "" : "s"} configured`}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={pending || hasInvalid}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow-[0_4px_12px_rgba(37,99,235,0.22)] hover:bg-primary-container hover:shadow-[0_8px_20px_rgba(37,99,235,0.30)] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save availability
          </button>
        </div>

        {/* Breaks */}
        <div className="pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-lg bg-tertiary-container flex items-center justify-center">
              <CalendarX className="w-4 h-4 text-on-tertiary-container" />
            </span>
            <div>
              <h4 className="font-semibold text-sm">Time off &amp; breaks</h4>
              <p className="text-xs text-on-surface-variant">
                Block specific dates (vacation, lunch extension, emergencies).
              </p>
            </div>
          </div>

          <form
            onSubmit={submitBreak}
            className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 mb-4"
          >
            <input
              type="date"
              value={breakForm.breakDate}
              onChange={(e) =>
                setBreakForm((s) => ({ ...s, breakDate: e.target.value }))
              }
              className="rounded-xl bg-surface-container-lowest border border-outline-variant px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary [color-scheme:light]"
              required
            />
            <input
              type="time"
              value={breakForm.startTime}
              onChange={(e) =>
                setBreakForm((s) => ({ ...s, startTime: e.target.value }))
              }
              placeholder="Start (optional)"
              className="rounded-xl bg-surface-container-lowest border border-outline-variant px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary [color-scheme:light]"
            />
            <input
              type="time"
              value={breakForm.endTime}
              onChange={(e) =>
                setBreakForm((s) => ({ ...s, endTime: e.target.value }))
              }
              placeholder="End (optional)"
              className="rounded-xl bg-surface-container-lowest border border-outline-variant px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary [color-scheme:light]"
            />
            <input
              type="text"
              value={breakForm.reason}
              onChange={(e) =>
                setBreakForm((s) => ({ ...s, reason: e.target.value }))
              }
              placeholder="Reason (optional)"
              className="rounded-xl bg-surface-container-lowest border border-outline-variant px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              disabled={pending || !breakForm.breakDate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-medium text-sm ring-1 ring-inset ring-outline-variant hover:bg-surface-container transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>

          {breaks.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-4">
              No upcoming breaks scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {breaks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant"
                >
                  <span className="w-8 h-8 rounded-lg bg-tertiary-container/60 flex items-center justify-center flex-shrink-0">
                    <CalendarX className="w-3.5 h-3.5 text-on-tertiary-container" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {new Date(b.break_date + "T00:00:00").toLocaleDateString(
                        undefined,
                        { weekday: "long", month: "long", day: "numeric" },
                      )}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {b.start_time && b.end_time
                        ? `${b.start_time} – ${b.end_time}`
                        : "Full day"}
                      {b.reason ? ` · ${b.reason}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBreak(b.id)}
                    disabled={pending}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition disabled:opacity-40"
                    title="Remove break"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg bg-surface-container-lowest border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary [color-scheme:light]"
    >
      {HOURS.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  );
}
