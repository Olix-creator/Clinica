import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Stethoscope,
  Building2,
  UserRound,
} from "lucide-react";
import { getClinicById, listPublicDoctorsByClinic } from "@/lib/data/clinics";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ClinicBookingCta } from "@/components/public/ClinicBookingCta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clinic = await getClinicById(id);
  if (!clinic) return { title: "Clinic — MedDiscover" };
  return {
    title: `${clinic.name} — MedDiscover`,
    description:
      clinic.description ??
      `Learn about ${clinic.name} and book an appointment online.`,
  };
}

/**
 * Public clinic detail page.
 *
 * Server-rendered for SEO + fast first paint. Fetches the clinic, its
 * public-visible doctors, and the current session (so the booking CTA
 * can decide whether to go to /booking directly or via /login).
 */
export default async function ClinicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clinic = await getClinicById(id);
  if (!clinic) notFound();

  const [doctors, supabase] = await Promise.all([
    listPublicDoctorsByClinic(id),
    createClient(),
  ]);
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = Boolean(userData.user);

  const initials = clinic.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to results
        </Link>

        {/* Hero */}
        <div className="mt-4 rounded-[2rem] overflow-hidden bg-surface-container-lowest ring-1 ring-outline-variant/30 shadow-sm">
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/20 flex items-center justify-center">
            <span className="text-5xl sm:text-6xl font-headline font-bold text-primary/40">
              {initials || "·"}
            </span>
            {clinic.specialty ? (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-full bg-surface-container-lowest/90 backdrop-blur px-2.5 py-1 text-primary ring-1 ring-primary/20">
                {clinic.specialty}
              </span>
            ) : null}
          </div>

          <div className="p-5 sm:p-8">
            <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight text-on-surface">
              {clinic.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-on-surface-variant">
              {clinic.specialty ? (
                <span className="inline-flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4" />
                  {clinic.specialty}
                </span>
              ) : null}
              {clinic.city ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {clinic.city}
                </span>
              ) : null}
              {clinic.address ? (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {clinic.address}
                </span>
              ) : null}
            </div>

            {clinic.description ? (
              <p className="mt-5 text-on-surface-variant leading-relaxed max-w-2xl">
                {clinic.description}
              </p>
            ) : null}
          </div>
        </div>

        {/* Doctors + booking */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Doctors list */}
          <section className="rounded-3xl bg-surface-container-lowest ring-1 ring-outline-variant/30 shadow-sm p-5 sm:p-6">
            <h2 className="font-headline text-lg sm:text-xl font-semibold text-on-surface">
              Our doctors
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {doctors.length > 0
                ? `${doctors.length} ${doctors.length === 1 ? "specialist" : "specialists"} available at this clinic.`
                : "No doctors have joined this clinic yet."}
            </p>

            {doctors.length > 0 ? (
              <ul className="mt-4 divide-y divide-outline-variant/30">
                {doctors.map((d) => (
                  <li
                    key={d.id}
                    className="py-3 flex items-center gap-3 first:pt-0 last:pb-0"
                  >
                    <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <UserRound className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {d.name ?? "Doctor"}
                      </p>
                      {d.specialty ? (
                        <p className="text-xs text-on-surface-variant truncate">
                          {d.specialty}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* Booking CTA (sticky on desktop) */}
          <div className="lg:sticky lg:top-20">
            <ClinicBookingCta
              clinicId={clinic.id}
              doctors={doctors}
              isSignedIn={isSignedIn}
            />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
