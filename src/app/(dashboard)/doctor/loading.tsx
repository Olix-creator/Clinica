import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-10 w-80 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-surface-container-low p-5 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <SkeletonCard />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
