import { clsx } from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

// Pills: soft tonal fill + strong label color, rounded-full.
const variantStyles: Record<BadgeVariant, string> = {
  success:
    'bg-secondary-container text-on-secondary-container ring-1 ring-inset ring-secondary/20',
  warning:
    'bg-tertiary-container text-on-tertiary-container ring-1 ring-inset ring-tertiary/25',
  danger:
    'bg-error-container text-on-error-container ring-1 ring-inset ring-error/25',
  info:
    'bg-primary-fixed text-on-primary-fixed ring-1 ring-inset ring-primary/20',
  neutral:
    'bg-surface-container text-on-surface-variant ring-1 ring-inset ring-outline-variant',
  primary:
    'bg-[color:color-mix(in_oklab,var(--color-primary)_14%,transparent)] text-primary ring-1 ring-inset ring-primary/30',
};

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-secondary',
  warning: 'bg-tertiary',
  danger: 'bg-error',
  info: 'bg-primary',
  neutral: 'bg-on-surface-variant',
  primary: 'bg-primary',
};

export function Badge({ variant, children, className, pulse }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider font-label',
        variantStyles[variant],
        className,
      )}
    >
      {pulse ? (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            dotStyles[variant],
          )}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}
