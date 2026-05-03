import {
  User,
  Mail,
  Shield,
  CalendarClock,
  Phone,
  Building2,
  Clock,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { clinicMemberService } from "@/lib/services/clinicMemberService";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { getDoctorByProfile } from "@/lib/data/doctors";
import { getAvailability, getBreaks } from "@/lib/data/availability";
import { createClient } from "@/lib/supabase/server";
import { ClinicManagementPanel } from "@/components/doctor/ClinicManagementPanel";
import { AvailabilitySetup } from "@/components/doctor/AvailabilitySetup";
import {
  ClinicProfileEditor,
  type EditableClinic,
} from "@/components/settings/ClinicProfileEditor";
import { DeleteClinicButton } from "@/components/settings/DeleteClinicButton";
import { DoctorProfileEditor } from "@/components/settings/DoctorProfileEditor";
import { DashTopbar } from "@/components/layout/DashTopbar";
import SignOutButton from "@/components/layout/SignOutButton";
import { ContactSupportButton } from "@/components/support/ContactSupportButton";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  patient: "Patient",
  doctor: "Clinician",
  receptionist: "Reception",
};

/**
 * Settings hub — everything a user can configure, in one place.
 *
 * Sections render conditionally:
 *   - Account + Memberships: always
 *   - Clinic management: only if the caller owns at least one clinic
 *   - Availability: only for doctors who are attached to a clinic
 *
 * This replaces the scattered "profile / doctor availability /
 * receptionist settings" split without breaking any existing URLs —
 * /profile still works and links here for the extra controls.
 */
export default async function SettingsPage() {
  const { profile } = await requireProfile();
  const [memberships, ownedRaw, doctor] = await Promise.all([
    profile.role === "patient" ? [] : clinicMemberService.listClinicsForUser(),
    clinicMemberService.listOwnedClinics(),
    profile.role === "doctor" ? getDoctorByProfile(profile.id) : null,
  ]);

  const ownedClinicIds = ownedRaw.map((c) => c.id);
  const [memberLists, subMap] =
    ownedClinicIds.length > 0
      ? await Promise.all([
          Promise.all(ownedRaw.map((c) => clinicMemberService.list(c.id))),
          subscriptionService.getMany(ownedClinicIds),
        ])
      : [[], {} as Awaited<ReturnType<typeof subscriptionService.getMany>>];

  const ownedClinics = ownedRaw.map((c, i) => {
    const sub = subMap[c.id];
    return {
      id: c.id,
      name: c.name,
      plan: sub?.plan ?? "free",
      seats: sub?.seats ?? subscriptionService.seatLimit(sub?.plan ?? "free"),
      members: memberLists[i] ?? [],
    };
  });

  const [availability, breaks] = doctor
    ? await Promise.all([
        getAvailability(doctor.id),
        getBreaks(doctor.id, new Date().toISOString().slice(0, 10)),
      ])
    : [[], []];

  // `Profile` doesn't expose phone, so fetch it directly for the account card.
  const supabase = await createClient();
  const { data: phoneRow } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", profile.id)
    .maybeSingle();
  const phone = phoneRow?.phone ?? null;

  // Pull the full clinic rows (with migration 0013 fields) so the owner can
  // edit phone/address/etc and see trial status. We also pull `created_by`
  // so we can decide which clinics expose the delete button — RLS
  // (migration 0015) gates the actual SQL DELETE to that same column.
  let editableClinics: (EditableClinic & { created_by: string })[] = [];
  if (ownedClinicIds.length > 0) {
    const { data: rows } = await supabase
      .from("clinics")
      .select(
        "id, name, phone, address, city, specialty, description, since_year, trust_reason, latitude, longitude, status, plan_type, trial_end_date, monthly_appointments_count, created_by",
      )
      .in("id", ownedClinicIds);
    editableClinics = (rows ?? []) as (EditableClinic & {
      created_by: string;
    })[];
  }

  const joined = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const initials = (profile.full_name ?? profile.email ?? "U")
    .slice(0, 1)
    .toUpperCase();

  return (
    <>
      <DashTopbar
        title="Settings"
        subtitle="Clinic profile, hours, and team"
      />
      <div
        className="max-w-4xl mx-auto space-y-6 animate-fade-in resp-page-pad"
        style={{ padding: "24px 32px 60px" }}
      >

      {/* Account card */}
      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-5">
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
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field Icon={User} label="Full name" value={profile.full_name ?? "—"} />
          <Field Icon={Mail} label="Email" value={profile.email ?? "—"} />
          <Field
            Icon={Shield}
            label="Role"
            value={ROLE_LABEL[profile.role] ?? profile.role}
          />
          <Field Icon={Phone} label="Phone" value={phone ?? "—"} />
          <Field Icon={CalendarClock} label="Joined" value={joined} />
          {doctor && (
            <Field
              Icon={Building2}
              label="Specialty"
              value={doctor.specialty ?? "General practice"}
            />
          )}
        </div>
      </section>

      {/* Doctor profile — doctor-only */}
      {doctor && profile.role === "doctor" && (
        <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Doctor profile</h2>
              <p className="text-sm text-on-surface-variant">
                Specialty, diploma, and experience shown to patients.
              </p>
            </div>
          </div>
          <DoctorProfileEditor
            doctor={{
              id: doctor.id,
              name: doctor.name,
              specialty: doctor.specialty,
              diploma: doctor.diploma,
              since_year: doctor.since_year,
              description: doctor.description,
            }}
            initialFullName={profile.full_name ?? ""}
          />
        </section>
      )}

      {/* Availability — doctor-only */}
      {doctor && (
        <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Weekly availability</h2>
              <p className="text-sm text-on-surface-variant">
                Patients can only book inside these windows. Set a break for
                one-off time off.
              </p>
            </div>
          </div>
          <AvailabilitySetup
            doctorId={doctor.id}
            initialAvailability={availability}
            initialBreaks={breaks}
          />
        </section>
      )}

      {/* Clinic profile — owners only. Edit the public-facing fields
          (name, phone, address, city, specialty, description) and see
          the plan / trial / usage snapshot per clinic. */}
      {editableClinics.length > 0 && (
        <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Clinic profile</h2>
              <p className="text-sm text-on-surface-variant">
                Edit your public clinic page and check your plan status.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {editableClinics.map((c) => {
              const isCreator = c.created_by === profile.id;
              return (
                <div key={c.id} className="space-y-2">
                  <ClinicProfileEditor clinic={c} />
                  {isCreator ? (
                    <div className="flex items-center justify-between rounded-2xl border border-error/30 bg-error-container/10 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          Danger zone
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Permanently delete this clinic. Only the creator can do this.
                        </p>
                      </div>
                      <DeleteClinicButton
                        clinicId={c.id}
                        clinicName={c.name}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Clinic management — owners only */}
      {ownedClinics.length > 0 && (
        <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Your clinics</h2>
              <p className="text-sm text-on-surface-variant">
                Invite staff, manage seats, and review your plan.
              </p>
            </div>
          </div>
          <ClinicManagementPanel clinics={ownedClinics} />
        </section>
      )}

      {/* Memberships — non-owners + non-patients */}
      {memberships.length > 0 && ownedClinics.length === 0 && (
        <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-semibold">Clinic memberships</h2>
          <ul className="divide-y divide-outline-variant/30">
            {memberships.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm font-medium">{c.name}</span>
                <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {c.role}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Support — opens prefilled mailto with the operator's details. */}
      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold">Need help?</h2>
          <p className="text-sm text-on-surface-variant">
            Email our team. We answer within one business day.
          </p>
        </div>
        <ContactSupportButton
          clinicName={editableClinics[0]?.name ?? null}
          userName={profile.full_name}
          email={profile.email}
          phone={phone}
          variant="secondary"
        />
      </section>

      {/* Sign out */}
      <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold">Sign out</h2>
          <p className="text-sm text-on-surface-variant">
            You&rsquo;ll need to sign back in to access your dashboard.
          </p>
        </div>
        <SignOutButton />
      </section>
    </div>
    </>
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
