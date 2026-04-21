import { clsx } from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

// Pills: tonal container colors, uppercase tracked labels.
const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-secondary-container text-on-secondary-container',
  warning: 'bg-tertiary-container text-on-tertiary-container',
  danger:
    'bg-[color:color-mix(in_oklab,var(--color-error-container)_28%,transparent)] text-error ring-1 ring-inset ring-error/30',
  info: 'bg-surface-container-highest text-on-surface-variant',
  neutral: 'bg-surface-container-highest text-on-surface-variant',
  primary:
    'bg-[color:color-mix(in_oklab,var(--color-primary)_14%,transparent)] text-primary-fixed',
};

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-on-secondary-container',
  warning: 'bg-on-tertiary-container',
  danger: 'bg-error',
  info: 'bg-on-surface-variant',
  neutral: 'bg-on-surface-variant',
  primary: 'bg-primary',
};

export function Badge({ variant, children, className, pulse }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest font-label',
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
