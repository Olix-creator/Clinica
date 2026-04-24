import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12">
        <div className="h-5 w-32 rounded bg-surface-container-high animate-pulse" />
        <div className="mt-4 rounded-[2rem] overflow-hidden bg-surface-container-lowest ring-1 ring-outline-variant/30">
          <div className="h-48 sm:h-64 bg-surface-container-high animate-pulse" />
          <div className="p-5 sm:p-8 space-y-3">
            <div className="h-8 w-2/3 rounded bg-surface-container-high animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-surface-container-high animate-pulse" />
            <div className="h-4 w-full rounded bg-surface-container-high animate-pulse" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="h-60 rounded-3xl bg-surface-container-lowest ring-1 ring-outline-variant/30 animate-pulse" />
          <div className="h-52 rounded-3xl bg-surface-container-lowest ring-1 ring-outline-variant/30 animate-pulse" />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
