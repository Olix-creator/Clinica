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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-surface text-on-surface font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          theme="dark"
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
