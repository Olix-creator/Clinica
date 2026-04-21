import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx('skeleton', className)} aria-hidden />;
}

/** Card-shaped skeleton block (default list item shape). */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-surface-container-low p-6 space-y-4',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-4/5 rounded" />
    </div>
  );
}

/** Table-row skeleton for the receptionist dashboard. */
export function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-6 items-center bg-surface-container p-6 rounded-lg">
      <div className="col-span-3 flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <div className="col-span-3 space-y-2">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
      <div className="col-span-3 space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      <div className="col-span-2">
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="col-span-1 flex justify-end">
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}
