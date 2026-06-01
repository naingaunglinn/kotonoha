'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, Check, SkipForward, Keyboard } from 'lucide-react';

interface FocusModeProps<T> {
  items: T[];
  itemKey: (item: T) => string;
  renderCard: (item: T, isCompleted: boolean) => React.ReactNode;
  completedItems: Set<string>;
  onToggleComplete: (key: string) => void;
  onClose: () => void;
  categoryLabel: string;
  pageLabel?: string;
}

export default function FocusMode<T>({
  items,
  itemKey,
  renderCard,
  completedItems,
  onToggleComplete,
  onClose,
  categoryLabel,
  pageLabel,
}: FocusModeProps<T>) {
  const initialIndex = items.findIndex(it => !completedItems.has(itemKey(it)));
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [showHints, setShowHints] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const current = items[index];
  const currentKey = current ? itemKey(current) : '';
  const isCurrentDone = currentKey ? completedItems.has(currentKey) : false;
  const completedCount = items.filter(it => completedItems.has(itemKey(it))).length;

  const goPrev = useCallback(() => {
    setIndex(i => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex(i => Math.min(items.length - 1, i + 1));
  }, [items.length]);

  const markAndNext = useCallback(() => {
    if (!current) return;
    const key = itemKey(current);
    if (!completedItems.has(key)) onToggleComplete(key);
    if (index < items.length - 1) goNext();
  }, [current, itemKey, completedItems, onToggleComplete, index, items.length, goNext]);

  const toggleCurrent = useCallback(() => {
    if (!current) return;
    onToggleComplete(itemKey(current));
  }, [current, itemKey, onToggleComplete]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); markAndNext(); return; }
      if (e.key.toLowerCase() === 'x') { e.preventDefault(); toggleCurrent(); return; }
      if (e.key === '?') { e.preventDefault(); setShowHints(v => !v); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext, markAndNext, toggleCurrent]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) markAndNext();
      else goNext();
    } else if (dy > 120 && Math.abs(dx) < 80) {
      onClose();
    }
  };

  if (items.length === 0 || !current) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg p-6">
        <div className="text-center">
          <p className="text-ink-muted">Nothing to focus on.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-full bg-ink px-6 py-2 font-bold text-bg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const progressPct = (completedCount / items.length) * 100;
  const positionPct = ((index + 1) / items.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Top bar */}
      <div className="flex flex-none items-center gap-3 border-b border-line px-4 pb-3 pt-4 sm:px-8">
        <button
          onClick={onClose}
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
          aria-label="Exit focus mode"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-bold text-ink">Focus · {categoryLabel}</span>
          {pageLabel && (
            <>
              <span className="text-xs text-ink-muted/50">·</span>
              <span className="truncate text-xs font-medium text-ink-muted">{pageLabel}</span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[11px] font-bold tabular-nums text-ink-muted sm:inline">
            {completedCount}/{items.length} studied
          </span>
          <button
            onClick={() => setShowHints(v => !v)}
            className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
              showHints ? 'bg-ink text-bg' : 'text-ink-muted hover:bg-ink/5'
            }`}
            aria-pressed={showHints}
            title="Show keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress strip */}
      <div className="relative h-1 flex-none bg-surface-alt">
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${progressPct}%`,
            background: progressPct === 100 ? 'var(--color-success)' : 'var(--color-accent)',
            transition: 'width 0.5s var(--ease-out-soft)',
          }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-ink/40 transition-all"
          style={{ left: `${positionPct}%`, transform: 'translateX(-50%)' }}
          title={`Card ${index + 1} of ${items.length}`}
        />
      </div>

      {/* Card area */}
      <div
        className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-12"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 text-center text-[11px] font-bold tabular-nums text-ink-muted">
            Card {index + 1} of {items.length}
          </div>
          {renderCard(current, isCurrentDone)}
        </div>
      </div>

      {/* Keyboard hints overlay */}
      {showHints && (
        <div className="absolute right-4 top-16 z-10 max-w-[240px] space-y-2 rounded-card border border-line bg-surface p-4 text-xs shadow-float">
          <div className="mb-1 font-bold text-ink">Keyboard</div>
          <div className="flex justify-between gap-3"><span>← / →</span><span className="text-ink-muted">Prev / next</span></div>
          <div className="flex justify-between gap-3"><span>Space / Enter</span><span className="text-ink-muted">Mark + next</span></div>
          <div className="flex justify-between gap-3"><span>X</span><span className="text-ink-muted">Toggle studied</span></div>
          <div className="flex justify-between gap-3"><span>Esc</span><span className="text-ink-muted">Exit</span></div>
          <div className="mt-2 border-t border-line pt-2 text-[10px] text-ink-muted">
            Mobile: swipe ← to mark, swipe → to skip, swipe ↓ to exit.
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex-none border-t border-line bg-bg/95 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="grid flex-shrink-0 place-items-center rounded-card border border-line bg-surface p-3 transition-all hover:border-line-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={markAndNext}
            className={`flex-1 rounded-card px-4 py-3 text-sm font-bold text-white shadow-card transition-all active:scale-[0.98] ${
              isCurrentDone ? 'bg-success' : 'bg-accent hover:bg-[#a83d30]'
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <Check className="h-4 w-4" />
              {isCurrentDone ? 'Next' : 'Mark studied'}
            </span>
          </button>

          <button
            onClick={goNext}
            disabled={index === items.length - 1}
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-card border border-line bg-surface px-3 py-3 text-xs font-bold transition-all hover:border-line-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Skip"
            title="Skip without marking"
          >
            <SkipForward className="h-4 w-4" />
            <span className="hidden sm:inline">Skip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
