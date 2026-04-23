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
// Clinica — button variants (modern SaaS, blue primary).
// Primary: solid blue, white ink, soft blue glow, active scale-98.
// Secondary: white on soft gray with border.
// Outline: transparent w/ primary hairline.
// Ghost: transparent on hover only.
// Danger: solid red.
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary font-semibold shadow-[0_4px_12px_rgba(37,99,235,0.22)] hover:bg-primary-container hover:shadow-[0_8px_20px_rgba(37,99,235,0.30)] active:scale-[0.98]',
  secondary:
    'bg-surface-container-lowest text-on-surface font-medium ring-1 ring-inset ring-outline-variant hover:bg-surface-container active:scale-[0.98] shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
  outline:
    'bg-transparent text-primary font-medium ring-1 ring-inset ring-primary/40 hover:bg-primary/5 active:scale-[0.98]',
  ghost:
    'bg-transparent text-on-surface-variant font-medium hover:bg-surface-container hover:text-on-surface',
  danger:
    'bg-error text-on-error font-semibold hover:brightness-110 active:scale-[0.98] shadow-[0_4px_12px_rgba(239,68,68,0.22)]',
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
