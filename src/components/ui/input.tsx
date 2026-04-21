"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Lumina Clinical input — surface-container-highest fill, no visible border,
// focus shows a hairline outline-variant ring + subtle emerald glow.
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant",
          "px-5 py-4 rounded-xl border-0 font-body text-[15px]",
          "transition-all duration-200",
          "focus:outline-none focus:ring-1 focus:ring-primary focus:shadow-[0_0_0_1px_var(--color-outline-variant),0_0_20px_rgba(78,222,163,0.12)]",
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
