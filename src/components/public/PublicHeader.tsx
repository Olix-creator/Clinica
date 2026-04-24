import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Header for the public (unauthenticated) discovery pages.
 *
 * If the visitor happens to already have a session we show a "Dashboard"
 * link back into the app; otherwise we surface the sign-in / sign-up
 * CTAs so they can book. Kept tiny and server-rendered so the first
 * paint stays fast on mobile.
 */
export async function PublicHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isSignedIn = Boolean(data.user);

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-headline font-bold text-on-surface"
        >
          <span className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </span>
          <span className="text-base tracking-tight">MedDiscover</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/search"
            className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition"
          >
            Discover
          </Link>

          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition shadow-sm"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition shadow-sm"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
