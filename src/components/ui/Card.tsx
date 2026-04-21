import { clsx } from 'clsx';

type CardTone = 'default' | 'raised' | 'sunken' | 'glass';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  tone?: CardTone;
}

// No 1px dividers — all separation via tonal surface shifts.
// default  → surface-container-low
// raised   → surface-container-highest + deep shadow
// sunken   → surface-container-lowest (inset panels)
// glass    → floating / backdrop-blur (for top nav only)
const toneStyles: Record<CardTone, string> = {
  default: 'bg-surface-container-low',
  raised:
    'bg-surface-container-highest shadow-[0_24px_48px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-outline-variant/15',
  sunken: 'bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/10',
  glass: 'glass ring-1 ring-inset ring-outline-variant/15',
};

export function Card({ className, children, tone = 'default' }: CardProps) {
  return (
    <div className={clsx('rounded-xl overflow-hidden', toneStyles[tone], className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  // No bottom border — let the child CardContent rest directly below.
  return <div className={clsx('px-8 pt-8', className)}>{children}</div>;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export function CardContent({ className, children }: CardContentProps) {
  return <div className={clsx('px-8 py-8', className)}>{children}</div>;
}

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={clsx('text-xl font-bold font-headline text-on-surface tracking-tight', className)}>
      {children}
    </h3>
  );
}
