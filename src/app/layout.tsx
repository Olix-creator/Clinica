import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clinica — Clinic Management, Reimagined",
  description:
    "Modern clinic management built for doctors, receptionists, and patients. Clean, fast, and trustworthy.",
  icons: { icon: "/favicon.ico" },
};

// Runs before first paint — sets data-theme on <html> from localStorage. We
// default to the new light SaaS theme; users can flip to dark via the toggle.
const noFlashThemeScript = `(() => {
  try {
    const stored = localStorage.getItem("theme");
    const theme = stored === "dark" ? "dark" : "light";
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
  } catch {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body
        className="min-h-full bg-surface text-on-surface font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          theme="system"
          toastOptions={{
            style: {
              background: "var(--color-surface-container-high)",
              color: "var(--color-on-surface)",
              border: "1px solid var(--color-outline-variant)",
              borderRadius: "1rem",
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
