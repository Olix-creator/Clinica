import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

/**
 * Search skeleton — matches the card grid shape so the layout doesn't
 * shift when results stream in.
 */
export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-8 pb-6 max-w-5xl mx-auto w-full">
          <div className="h-4 w-36 rounded bg-surface-container-high animate-pulse" />
          <div className="h-10 w-64 rounded bg-surface-container-high animate-pulse mt-3" />
          <div className="h-5 w-80 rounded bg-surface-container-high animate-pulse mt-3" />
        </section>
        <section className="px-4 sm:px-6 max-w-5xl mx-auto w-full">
          <div className="h-20 rounded-3xl bg-surface-container-lowest ring-1 ring-outline-variant/30 animate-pulse" />
        </section>
        <section className="px-4 sm:px-6 max-w-5xl mx-auto w-full py-6 sm:py-8">
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="rounded-3xl overflow-hidden bg-surface-container-lowest ring-1 ring-outline-variant/30 shadow-sm"
              >
                <div className="h-36 bg-surface-container-high animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 rounded bg-surface-container-high animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-surface-container-high animate-pulse" />
                  <div className="h-3 w-full rounded bg-surface-container-high animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
