'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="fixed inset-0 bg-[color:color-mix(in_oklab,#0f172a_35%,transparent)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${sizeStyles[size]} max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-[0_20px_50px_rgba(16,24,40,0.15),0_8px_20px_rgba(16,24,40,0.08)] animate-scale-in`}
      >
        <div className="flex items-start justify-between gap-6 px-8 pt-8 pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-on-surface-variant">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-8 pb-8">{children}</div>
      </div>
    </div>
  );
}
