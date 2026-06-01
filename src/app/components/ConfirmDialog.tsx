'use client';
import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const confirmCls = destructive
    ? 'bg-accent hover:bg-[#a83d30] text-white'
    : 'bg-ink hover:bg-ink/90 text-bg';

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="animate-rise w-full max-w-sm overflow-hidden rounded-card border border-line bg-surface shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-start gap-3">
            <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-card ${
              destructive ? 'bg-accent/12 text-accent' : 'bg-accent-warm/20 text-[#9a6b43]'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="pt-1">
              <h3 className="font-[family-name:var(--font-display)] text-base text-ink">{title}</h3>
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 border-t border-line bg-surface-alt/40 p-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-card border border-line bg-surface py-2.5 text-sm font-bold text-ink transition-all hover:border-line-strong active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-card py-2.5 text-sm font-bold shadow-card transition-all active:scale-[0.98] ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
