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
  title: "Lumina Clinical — The Clinical Sanctuary",
  description:
    "Manage your clinic efficiently. Editorial precision, zero friction, built for modern practitioners.",
  icons: { icon: "/favicon.ico" },
};

// Runs before first paint — sets data-theme on <html> from localStorage or OS
// preference so there's no flash of the wrong theme. Keep this tiny and dependency-free.
const noFlashThemeScript = `(() => {
  try {
    const stored = localStorage.getItem("theme");
    const theme = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
