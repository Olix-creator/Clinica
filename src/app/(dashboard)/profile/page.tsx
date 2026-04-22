import { User, Mail, Shield, CalendarClock } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import SignOutButton from "@/components/layout/SignOutButton";
import { clinicMemberService } from "@/lib/services/clinicMemberService";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  patient: "Patient",
  doctor: "Clinician",
  receptionist: "Reception",
};

export default async function ProfilePage() {
  const { profile } = await requireProfile();
  const initials = (profile.full_name ?? profile.email ?? "U")
    .slice(0, 1)
    .toUpperCase();

  const clinics =
    profile.role === "patient" ? [] : await clinicMemberService.listClinicsForUser();

  const joined = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Profile</p>
        <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
          Your account
        </h1>
      </header>

      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 flex items-center gap-5">
        <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed flex items-center justify-center text-2xl font-semibold shadow-emerald">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold truncate">
            {profile.full_name ?? "Unnamed"}
          </p>
          <p className="text-sm text-on-surface-variant truncate">
            {profile.email ?? "—"}
          </p>
        </div>
      </section>

      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-semibold">Account details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field Icon={User} label="Full name" value={profile.full_name ?? "—"} />
          <Field Icon={Mail} label="Email" value={profile.email ?? "—"} />
          <Field Icon={Shield} label="Role" value={ROLE_LABEL[profile.role] ?? profile.role} />
          <Field Icon={CalendarClock} label="Joined" value={joined} />
        </div>
      </section>

      {clinics.length > 0 && (
        <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-semibold">Clinic memberships</h2>
          <ul className="divide-y divide-outline-variant/30">
            {clinics.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {c.role}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold">Sign out</h2>
          <p className="text-sm text-on-surface-variant">
            You&apos;ll need to sign back in to access your dashboard.
          </p>
        </div>
        <SignOutButton />
      </section>
    </div>
  );
}

function Field({
  Icon,
  label,
  value,
}: {
  Icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-container">
      <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
          {label}
        </p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
