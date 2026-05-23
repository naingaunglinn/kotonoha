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
    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
    : 'bg-[#412D15] hover:bg-[#000000] text-white shadow-[#412D15]/30';

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-[#E1DCC9] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              destructive ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="pt-1">
              <h3 className="text-base font-bold text-[#1F150C]">{title}</h3>
              {description && (
                <p className="text-sm text-[#1F150C]/70 mt-1 leading-relaxed">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-[#1F150C]/10 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[#1F150C]/60" />
          </button>
        </div>

        <div className="flex gap-2 p-4 pt-3 bg-white/40">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white border border-[#1F150C]/15 text-[#1F150C] font-bold text-sm hover:border-[#1F150C]/40 transition-all active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
