"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Crown,
  Loader2,
  Mail,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  inviteMemberAction,
  removeMemberAction,
} from "@/app/(dashboard)/doctor/actions";
import type { ClinicMemberWithProfile } from "@/lib/data/clinicMembers";
import type { PlanTier } from "@/lib/services/subscriptionService";

type OwnedClinic = {
  id: string;
  name: string;
  plan: PlanTier | null;
  seats: number;
  members: ClinicMemberWithProfile[];
};

const INPUT =
  "w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary transition disabled:opacity-60";

const BTN =
  "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-medium text-sm shadow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed";

const PLAN_COPY: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

function roleBadge(role: ClinicMemberWithProfile["role"]) {
  const map = {
    owner: { label: "Owner", icon: Crown, className: "bg-primary/15 text-primary" },
    doctor: { label: "Doctor", icon: Stethoscope, className: "bg-tertiary/15 text-tertiary" },
    receptionist: {
      label: "Reception",
      icon: Users,
      className: "bg-surface-bright text-on-surface",
    },
  } as const;
  const { label, icon: Icon, className } = map[role];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-[0.14em] ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export function ClinicManagementPanel({ clinics }: { clinics: OwnedClinic[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [activeClinicId, setActiveClinicId] = useState<string>(clinics[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const active = clinics.find((c) => c.id === activeClinicId) ?? clinics[0] ?? null;

  function runAction(
    action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
    successMsg: string,
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

  function removeMember(memberId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("memberId", memberId);
      const res = await removeMemberAction(fd);
      if (res.ok) {
        toast.success("Member removed");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const seatsUsed = active?.members.length ?? 0;
  const seatLimit = active?.seats ?? 0;
  const seatsRemaining = Math.max(seatLimit - seatsUsed, 0);

  return (
    <section className="rounded-[2rem] bg-surface-container-low overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-surface-container transition"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary" />
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold">Your clinics</p>
            <p className="text-xs text-on-surface-variant">
              {clinics.length === 0
                ? "Create a clinic to start inviting staff."
                : `${clinics.length} clinic${clinics.length === 1 ? "" : "s"} · you're the owner.`}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-on-surface-variant transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-outline-variant/30 pt-6 space-y-6">
          {/* Create clinic — routed through /pricing so the owner picks a plan
              and provides the verification fields (phone + address). */}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3 ml-1">
              Create a new clinic
            </p>
            <Link
              href="/pricing?onboarding=1"
              className={BTN + " w-full sm:w-auto"}
            >
              <ArrowRight className="w-4 h-4" />
              Start clinic onboarding
            </Link>
            <p className="text-xs text-on-surface-variant mt-2 ml-1">
              You&rsquo;ll pick a plan, then tell us a few verification details
              — phone and address. Free trial, no card.
            </p>
          </div>

          {clinics.length > 0 && active && (
            <>
              {/* Clinic picker tabs */}
              {clinics.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {clinics.map((c) => {
                    const isActive = c.id === active.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveClinicId(c.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active clinic summary */}
              <div className="rounded-2xl bg-surface-container-highest p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{active.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                      {active.plan ? PLAN_COPY[active.plan] : "Free"} plan
                    </p>
                  </div>
                </div>
                <div className="ml-auto text-xs text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{seatsUsed}</span> of{" "}
                  <span className="font-semibold text-on-surface">{seatLimit}</span> seats used
                  {seatsRemaining === 0 && (
                    <span className="ml-2 text-tertiary">· at limit</span>
                  )}
                </div>
              </div>

              {/* Invite member */}
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3 ml-1">
                  Invite a team member
                </p>
                <form
                  onSubmit={runAction(inviteMemberAction, "Member added")}
                  className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
                >
                  <input type="hidden" name="clinicId" value={active.id} />
                  <div className="relative">
                    <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      name="email"
                      type="email"
                      placeholder="teammate@example.com"
                      className={`${INPUT} pl-10`}
                      disabled={pending || seatsRemaining === 0}
                      required
                    />
                  </div>
                  <select
                    name="role"
                    defaultValue="doctor"
                    className={INPUT}
                    disabled={pending || seatsRemaining === 0}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                  <button
                    type="submit"
                    disabled={pending || seatsRemaining === 0}
                    className={BTN}
                  >
                    {pending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Invite
                  </button>
                </form>
                <p className="text-xs text-on-surface-variant mt-2 ml-1">
                  Teammates must have a Lumina account first — send them the signup link, then
                  invite by email.
                </p>
              </div>

              {/* Member list */}
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant mb-3 ml-1">
                  Team ({active.members.length})
                </p>
                {active.members.length === 0 ? (
                  <div className="rounded-2xl bg-surface-container p-6 text-sm text-on-surface-variant text-center">
                    No members yet.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {active.members.map((m) => {
                      const name =
                        m.profile?.full_name ?? m.profile?.email ?? "Unknown user";
                      return (
                        <li
                          key={m.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container"
                        >
                          <span className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-xs font-semibold">
                            {(name ?? "?").slice(0, 1).toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{name}</p>
                            <p className="text-xs text-on-surface-variant truncate">
                              {m.profile?.email ?? "—"}
                            </p>
                          </div>
                          {roleBadge(m.role)}
                          {m.role !== "owner" && (
                            <button
                              type="button"
                              onClick={() => removeMember(m.id)}
                              disabled={pending}
                              className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/40 transition disabled:opacity-40"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
