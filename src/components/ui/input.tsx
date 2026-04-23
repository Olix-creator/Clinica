"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Clinica input — white fill w/ hairline border, focus shows a blue ring glow.
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant",
          "px-4 py-3 rounded-xl border border-outline-variant font-body text-[15px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-on-surface",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
