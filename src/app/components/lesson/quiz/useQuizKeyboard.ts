'use client';
import { useEffect, useRef } from 'react';

interface UseQuizKeyboardArgs {
  active: boolean;
  options: string[] | undefined;
  hasAnswered: boolean;
  onSelect: (option: string) => void;
  onNext: () => void;
}

// 1–4 selects an option (when none picked); Enter or Space advances (after picking).
export function useQuizKeyboard({ active, options, hasAnswered, onSelect, onNext }: UseQuizKeyboardArgs) {
  const onSelectRef = useRef(onSelect);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onNextRef.current = onNext;
  });

  useEffect(() => {
    if (!active || !options) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!hasAnswered && /^[1-4]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < options.length) {
          e.preventDefault();
          onSelectRef.current(options[idx]);
        }
      } else if (hasAnswered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onNextRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, options, hasAnswered]);
}
