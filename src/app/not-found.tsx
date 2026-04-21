import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface px-4">
      <span className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-emerald mb-6">
        <Sparkles className="w-6 h-6 text-on-primary-fixed" />
      </span>
      <p className="font-headline text-7xl font-semibold tracking-tight bg-gradient-to-r from-primary-fixed to-primary bg-clip-text text-transparent">
        404
      </p>
      <p className="text-on-surface-variant mt-3 mb-8">This page slipped out of the schedule.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-emerald hover:brightness-110 active:scale-[0.98] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>
    </div>
  );
}
