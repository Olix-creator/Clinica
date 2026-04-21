import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-8">
      <Skeleton className="h-4 w-20" />
      <div>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-10 w-80 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="rounded-[2rem] bg-surface-container-lowest p-8 space-y-5">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
