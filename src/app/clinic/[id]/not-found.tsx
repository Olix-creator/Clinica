import Link from "next/link";
import { MapPin } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <h1 className="font-headline text-2xl font-semibold text-on-surface">
            Clinic not found
          </h1>
          <p className="text-sm text-on-surface-variant mt-2">
            This clinic may have been removed or the link is incorrect.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center mt-6 px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition"
          >
            Browse clinics
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
