'use client';

import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            destructive
              ? 'bg-[color:color-mix(in_oklab,var(--color-error-container)_28%,transparent)] text-error'
              : 'bg-surface-container-low text-primary'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-on-surface-variant leading-relaxed pt-2">{description}</p>
      </div>
      <div className="flex items-center justify-end gap-3 mt-8">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
