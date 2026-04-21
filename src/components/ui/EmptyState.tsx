import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/10 p-12 flex flex-col items-center text-center',
        className,
      )}
    >
      <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mb-6">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold font-headline text-on-surface tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-on-surface-variant max-w-md mb-8 leading-relaxed">{description}</p>
      {action ? (
        action.href ? (
          <Link
            href={action.href}
            className="px-6 py-3 rounded-xl bg-surface-container-highest ring-1 ring-inset ring-primary/30 text-primary font-semibold hover:bg-primary/5 transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="px-6 py-3 rounded-xl bg-surface-container-highest ring-1 ring-inset ring-primary/30 text-primary font-semibold hover:bg-primary/5 transition-colors"
          >
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}
