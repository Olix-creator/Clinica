import { clsx } from 'clsx';

type CardTone = 'default' | 'raised' | 'sunken' | 'glass';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  tone?: CardTone;
}

// Modern SaaS surface system — white cards with soft shadow + hairline border.
// default  → white card, soft shadow, light border
// raised   → same white card with a deeper shadow (dialogs, featured panels)
// sunken   → subtle gray surface for nested panels (inputs, code blocks)
// glass    → floating / backdrop-blur (for top nav only)
const toneStyles: Record<CardTone, string> = {
  default:
    'bg-surface-container-lowest border border-outline-variant shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)]',
  raised:
    'bg-surface-container-lowest border border-outline-variant shadow-[0_12px_24px_rgba(16,24,40,0.08),0_4px_8px_rgba(16,24,40,0.04)]',
  sunken:
    'bg-surface-container border border-outline-variant',
  glass:
    'glass border border-outline-variant',
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
