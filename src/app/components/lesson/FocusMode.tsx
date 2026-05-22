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
      <div className="fixed inset-0 z-50 bg-[#E1DCC9] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#1F150C]/70">Nothing to focus on.</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-[#1F150C] text-white rounded-full font-bold"
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
    <div className="fixed inset-0 z-50 bg-[#E1DCC9] flex flex-col">
      {/* Top bar */}
      <div className="flex-none px-4 sm:px-8 pt-4 pb-3 flex items-center gap-3 border-b border-[#1F150C]/10">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#1F150C]/10 transition-colors flex-shrink-0"
          aria-label="Exit focus mode"
        >
          <X className="w-5 h-5 text-[#1F150C]" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-[#1F150C]">Focus · {categoryLabel}</span>
          {pageLabel && (
            <>
              <span className="text-xs text-[#1F150C]/40">·</span>
              <span className="text-xs font-medium text-[#1F150C]/60 truncate">{pageLabel}</span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] font-bold tabular-nums text-[#1F150C]/70 hidden sm:inline">
            {completedCount}/{items.length} studied
          </span>
          <button
            onClick={() => setShowHints(v => !v)}
            className={`p-2 rounded-full transition-colors ${
              showHints ? 'bg-[#1F150C] text-white' : 'text-[#1F150C]/60 hover:bg-[#1F150C]/10'
            }`}
            aria-pressed={showHints}
            title="Show keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress strip */}
      <div className="flex-none h-1 bg-[#1F150C]/5 relative">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: progressPct === 100
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #412D15, #ef4444)',
          }}
        />
        <div
          className="absolute top-0 w-0.5 h-full bg-[#1F150C]/40 transition-all"
          style={{ left: `${positionPct}%`, transform: 'translateX(-50%)' }}
          title={`Card ${index + 1} of ${items.length}`}
        />
      </div>

      {/* Card area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-8 sm:py-12 flex items-start sm:items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-4 text-[11px] font-bold text-[#1F150C]/50 tabular-nums">
            Card {index + 1} of {items.length}
          </div>
          {renderCard(current, isCurrentDone)}
        </div>
      </div>

      {/* Keyboard hints overlay */}
      {showHints && (
        <div className="absolute top-16 right-4 z-10 bg-white rounded-2xl shadow-xl border border-black/5 p-4 text-xs space-y-2 max-w-[240px]">
          <div className="font-bold text-[#1F150C] mb-1">Keyboard</div>
          <div className="flex justify-between gap-3"><span>← / →</span><span className="text-[#1F150C]/60">Prev / next</span></div>
          <div className="flex justify-between gap-3"><span>Space / Enter</span><span className="text-[#1F150C]/60">Mark + next</span></div>
          <div className="flex justify-between gap-3"><span>X</span><span className="text-[#1F150C]/60">Toggle studied</span></div>
          <div className="flex justify-between gap-3"><span>Esc</span><span className="text-[#1F150C]/60">Exit</span></div>
          <div className="pt-2 mt-2 border-t border-black/5 text-[10px] text-[#1F150C]/50">
            Mobile: swipe ← to mark, swipe → to skip, swipe ↓ to exit.
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex-none border-t border-[#1F150C]/10 bg-[#E1DCC9]/95 backdrop-blur-md px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="p-3 rounded-2xl bg-white border border-[#1F150C]/15 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#412D15]/40 transition-all active:scale-95 flex-shrink-0"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={markAndNext}
            className={`flex-1 px-4 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shadow-md ${
              isCurrentDone
                ? 'bg-emerald-500 text-white'
                : 'bg-[#412D15] text-white hover:bg-[#000000]'
            }`}
          >
            {isCurrentDone ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                Next
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                Mark studied
              </span>
            )}
          </button>

          <button
            onClick={goNext}
            disabled={index === items.length - 1}
            className="px-3 py-3 rounded-2xl bg-white border border-[#1F150C]/15 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#412D15]/40 transition-all active:scale-95 flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold"
            aria-label="Skip"
            title="Skip without marking"
          >
            <SkipForward className="w-4 h-4" />
            <span className="hidden sm:inline">Skip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
