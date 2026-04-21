import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <SkeletonCard />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <SkeletonCard />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <SkeletonCard />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
