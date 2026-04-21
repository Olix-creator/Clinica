"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/**
 * Reads the current theme from the DOM (which the no-flash script in
 * `src/app/layout.tsx` has already initialized from localStorage or the OS
 * preference), mirrors it into local state, and persists changes.
 */
function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ variant = "topbar" }: { variant?: "topbar" | "sidebar" }) {
  // Start undefined so we match SSR output on first render (suppressHydrationWarning
  // is set on <html>), then resolve after mount.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(readInitialTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      // Only follow OS changes when the user hasn't explicitly chosen.
      if (!localStorage.getItem("theme")) {
        setTheme(mq.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    // Tailwind also ships a `dark:` variant keyed off the `dark` class on <html>.
    // Keep the two in sync so any lingering `dark:` utilities keep working.
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore (private mode, etc.) */
    }
  }, [theme]);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  const base =
    "inline-flex items-center justify-center rounded-xl transition hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface disabled:opacity-50";
  const size =
    variant === "sidebar"
      ? "gap-3 px-4 py-3 w-full justify-start text-sm font-medium"
      : "w-10 h-10";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`${base} ${size}`}
      // Prevent flicker before mount picks up the real theme.
      disabled={theme === null}
    >
      {theme === null ? (
        <span className="w-4 h-4" />
      ) : (
        <>
          <Icon className="w-4 h-4" />
          {variant === "sidebar" && (
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          )}
        </>
      )}
    </button>
  );
}
