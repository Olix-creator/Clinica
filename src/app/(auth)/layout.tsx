import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-surface text-on-surface flex relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      {/* Left brand panel */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-container-low">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[620px] h-[620px] rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-primary-container/15 blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-emerald">
              <Sparkles className="w-5 h-5 text-on-primary-fixed" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Lumina Clinical</span>
          </Link>

          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-5">The clinical sanctuary</p>
            <h1 className="font-headline text-4xl font-semibold tracking-tight leading-tight mb-5">
              A calm, coordinated clinic — one sign-in away.
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              Lumina quietly orchestrates scheduling, records and realtime notifications so your team can focus on healing.
            </p>
          </div>

          <p className="text-xs text-on-surface-variant">&copy; {new Date().getFullYear()} Lumina Clinical</p>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
