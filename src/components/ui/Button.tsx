'use client';

import { clsx } from 'clsx';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  loading?: boolean;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

// Lumina Clinical — button variants.
// Primary: emerald gradient, on-primary-fixed ink, active scale-98.
// Secondary: surface-container-highest chip w/ primary text + hairline ring.
// Outline: transparent w/ primary hairline.
// Ghost: surface-container-low on hover only.
// Danger: tertiary container gradient.
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-semibold shadow-[0_8px_24px_rgba(78,222,163,0.18)] hover:shadow-[0_12px_32px_rgba(78,222,163,0.28)] active:scale-[0.98]',
  secondary:
    'bg-surface-container-highest text-primary font-medium ring-1 ring-inset ring-primary/20 hover:bg-surface-container-high active:scale-[0.98]',
  outline:
    'bg-transparent text-primary font-medium ring-1 ring-inset ring-primary/30 hover:bg-primary/5 active:scale-[0.98]',
  ghost:
    'bg-transparent text-on-surface-variant font-medium hover:bg-surface-container-low hover:text-on-surface',
  danger:
    'bg-gradient-to-br from-tertiary-container to-error-container text-on-error-container font-semibold hover:opacity-95 active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-4 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading,
  href,
  ...props
}: ButtonProps) {
  const classes = clsx(
    'inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

  const content = (
    <>
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            fill="currentColor"
          />
        </svg>
      ) : null}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(props as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className'>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={loading || (props as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled}
      {...(props as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'disabled'>)}
    >
      {content}
    </button>
  );
}
