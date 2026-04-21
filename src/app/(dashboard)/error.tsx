"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[lumina] dashboard error boundary:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="max-w-md w-full rounded-[2rem] bg-surface-container-low p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-tertiary-container/30 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-6 h-6 text-tertiary" />
        </div>
        <h2 className="font-headline text-xl font-semibold mb-2">Something went wrong.</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
