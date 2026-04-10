"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shows SignInButton when not signed in, UserButton + Dashboard link when signed in.
 * Prevents the "cannot_render_single_session_enabled" error.
 */
export function AuthButton({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <span className={className ?? "text-sm font-medium text-gray-400 px-4 py-2"}>
        ...
      </span>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors px-4 py-2"
        >
          Dashboard
        </Link>
        <UserButton />
      </div>
    );
  }

  return (
    <SignInButton mode="modal" forceRedirectUrl="/dashboard">
      {children ?? (
        <button
          type="button"
          className={className ?? "text-sm font-medium text-gray-600 hover:text-primary transition-colors px-4 py-2 cursor-pointer"}
        >
          Sign in
        </button>
      )}
    </SignInButton>
  );
}

/**
 * Mobile-friendly version for mobile menus.
 */
export function AuthButtonMobile({ label }: { label: string }) {
  const { isSignedIn, isLoaded } = useUser();

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
    <SignInButton mode="modal" forceRedirectUrl="/dashboard">
      <button
        type="button"
        className="w-full py-2.5 text-center text-sm font-medium border border-gray-200 rounded-xl text-gray-700 cursor-pointer"
      >
        {label}
      </button>
    </SignInButton>
  );
}
