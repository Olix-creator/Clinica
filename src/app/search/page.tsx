import Link from "next/link";
import { MapPin, Search, Stethoscope, ArrowRight } from "lucide-react";
import {
  searchClinics,
  listClinicSpecialties,
  type Clinic,
} from "@/lib/data/clinics";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find a clinic — MedDiscover",
  description:
    "Search top-rated medical professionals in your area. Filter by city and specialty, and book in three taps.",
};

/**
 * Public clinic directory.
 *
 * Renders server-side from the `clinics` table. Filters come in through
 * URL search params so:
 *   - the page is shareable ("/search?city=Algiers&specialty=Dermatology")
 *   - the form works without JS (progressive enhancement)
 *   - Next can cache + revalidate per (city, specialty, q) combination.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; specialty?: string; q?: string }>;
}) {
  const params = await searchParams;
  const city = params.city?.trim() ?? "";
  const specialty = params.specialty?.trim() ?? "";
  const q = params.q?.trim() ?? "";

  // Fire the two reads in parallel — the specialty list is small and cacheable.
  const [clinics, specialties] = await Promise.all([
    searchClinics({ city, specialty, query: q }),
    listClinicSpecialties(),
  ]);

  const hasFilters = Boolean(city || specialty || q);

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 sm:px-6 pt-8 pb-6 max-w-5xl mx-auto w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">
            Patient discovery
          </p>
          <h1 className="font-headline text-3xl sm:text-5xl font-semibold tracking-tight text-on-surface">
            Find your clinic
          </h1>
          <p className="text-on-surface-variant mt-3 text-base sm:text-lg max-w-2xl">
            Discover top-rated medical professionals in your area. Filter by
            city and specialty, then book in three taps.
          </p>
        </section>

        {/* Filters */}
        <section className="px-4 sm:px-6 max-w-5xl mx-auto w-full">
          <form
            method="get"
            action="/search"
            className="rounded-3xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-sm p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-stretch"
          >
            <label className="relative flex items-center">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                name="city"
                defaultValue={city}
                placeholder="City (e.g. Algiers)"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-highest border-0 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </label>

            <label className="relative flex items-center">
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <select
                name="specialty"
                defaultValue={specialty}
                className="w-full pl-11 pr-9 py-3 rounded-xl bg-surface-container-highest border-0 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 transition appearance-none"
              >
                <option value="">All specialties</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            {/* The free-text query piggybacks on the form so the user can
                press enter from the city field and also narrow by name. */}
            {q ? <input type="hidden" name="q" value={q} /> : null}

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition shadow-sm"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </form>

          {hasFilters && (
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-xs text-on-surface-variant">
                {clinics.length}{" "}
                {clinics.length === 1 ? "clinic" : "clinics"} match
                {city ? ` in ${city}` : ""}
                {specialty ? ` · ${specialty}` : ""}
              </p>
              <Link
                href="/search"
                className="text-xs font-medium text-primary hover:underline underline-offset-2"
              >
                Clear filters
              </Link>
            </div>
          )}
        </section>

        {/* Results */}
        <section className="px-4 sm:px-6 max-w-5xl mx-auto w-full py-6 sm:py-8">
          {clinics.length === 0 ? (
            <EmptyResults hasFilters={hasFilters} />
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinics.map((c) => (
                <li key={c.id}>
                  <ClinicCard clinic={c} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function ClinicCard({ clinic }: { clinic: Clinic }) {
  const initials = clinic.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/clinic/${clinic.id}`}
      className="group block rounded-3xl bg-surface-container-lowest ring-1 ring-outline-variant/30 shadow-sm hover:shadow-md hover:ring-outline-variant/60 transition overflow-hidden"
    >
      {/* Banner — gradient placeholder until we have real photos. */}
      <div className="relative h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
        <span className="text-4xl font-headline font-bold text-primary/40">
          {initials || "·"}
        </span>
        {clinic.specialty ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-full bg-surface-container-lowest/90 backdrop-blur px-2.5 py-1 text-primary ring-1 ring-primary/20">
            {clinic.specialty}
          </span>
        ) : null}
      </div>

      <div className="p-5">
        <h3 className="font-headline text-lg font-semibold text-on-surface leading-tight group-hover:text-primary transition">
          {clinic.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
          {clinic.specialty ? (
            <span className="inline-flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              {clinic.specialty}
            </span>
          ) : null}
          {clinic.city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {clinic.city}
            </span>
          ) : null}
        </div>

        {clinic.description ? (
          <p className="text-sm text-on-surface-variant mt-3 line-clamp-2 leading-relaxed">
            {clinic.description}
          </p>
        ) : null}

        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          View clinic
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function EmptyResults({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-3xl bg-surface-container-lowest ring-1 ring-outline-variant/30 p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Search className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-on-surface">
        {hasFilters ? "No clinics match your search" : "No clinics yet"}
      </h3>
      <p className="text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
        {hasFilters
          ? "Try a broader query, a different city, or clear the specialty filter."
          : "Once clinics join the network they'll appear here."}
      </p>
      {hasFilters && (
        <Link
          href="/search"
          className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}
