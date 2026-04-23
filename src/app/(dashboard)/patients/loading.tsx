import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="rounded-2xl bg-surface-container-low p-3 space-y-3">
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="rounded-2xl bg-surface-container-low p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="pt-3 border-t border-outline-variant/15 flex gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
