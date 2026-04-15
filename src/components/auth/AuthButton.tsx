"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Shows Sign In link when not signed in, Dashboard link when signed in.
 */
export function AuthButton({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <span className={className ?? "text-sm font-medium text-gray-400 px-4 py-2"}>
        ...
      </span>
    );
  }

  if (isSignedIn) {
    return (
      <Link
        href="/dashboard"
        className={className ?? "text-sm font-medium text-primary hover:text-primary-dark transition-colors px-4 py-2"}
      >
        Dashboard
      </Link>
    );
  }

  return children ? (
    <Link href="/login">{children}</Link>
  ) : (
    <Link
      href="/login"
      className={className ?? "text-sm font-medium text-gray-600 hover:text-primary transition-colors px-4 py-2 cursor-pointer"}
    >
      Sign in
    </Link>
  );
}

/**
 * Mobile-friendly version for mobile menus.
 */
export function AuthButtonMobile({ label }: { label: string }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <span className="w-full py-2.5 text-center text-sm font-medium border border-gray-200 rounded-xl text-gray-400">
        ...
      </span>
    );
  }

  if (isSignedIn) {
    return (
      <Link
        href="/dashboard"
        className="w-full py-2.5 text-center text-sm font-semibold bg-primary text-white rounded-xl block"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="w-full py-2.5 text-center text-sm font-medium border border-gray-200 rounded-xl text-gray-700 block"
    >
      {label}
    </Link>
  );
}
