import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-outline-variant/30 bg-surface-container-lowest mt-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-on-surface-variant">
        <p>© {new Date().getFullYear()} MedDiscover · Care, discovered.</p>
        <div className="flex items-center gap-4">
          <Link href="/search" className="hover:text-on-surface transition">
            Clinics
          </Link>
          <Link href="/login" className="hover:text-on-surface transition">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-on-surface transition">
            For clinics
          </Link>
        </div>
      </div>
    </footer>
  );
}
