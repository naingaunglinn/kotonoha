'use client';
import { useEffect, useState } from 'react';
import { X, BookOpen, PenLine, ClipboardCheck } from 'lucide-react';
import KanaWriter from './KanaWriter';
import KanaTrace from './KanaTrace';
import KanaQuiz from './KanaQuiz';

interface KanjiWriteModalProps {
  char: string;
  meaning?: string;
  onyomi?: string;
  kunyomi?: string;
  strokes?: string | number;
  onClose: () => void;
}

type Mode = 'order' | 'practice' | 'quiz';

const TABS: { key: Mode; label: string; icon: typeof BookOpen }[] = [
  { key: 'order', label: 'Stroke order', icon: BookOpen },
  { key: 'practice', label: 'Practice', icon: PenLine },
  { key: 'quiz', label: 'Quiz', icon: ClipboardCheck },
];

export default function KanjiWriteModal({ char, meaning, onyomi, kunyomi, strokes, onClose }: KanjiWriteModalProps) {
  const [mode, setMode] = useState<Mode>('order');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-rise flex w-full max-w-3xl flex-col overflow-hidden rounded-[20px] border border-line bg-surface shadow-float md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== INFO PANEL ===== */}
        <div className="relative flex flex-col items-center gap-3 border-b border-line bg-surface-alt/50 p-6 md:w-2/5 md:border-b-0 md:border-r">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/5 md:hidden"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <span className="jp text-7xl leading-none text-ink sm:text-8xl">{char}</span>
          {strokes != null && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-bg">{strokes} 画</span>
          )}
          {meaning && <p className="text-center font-[family-name:var(--font-display)] text-lg text-ink">{meaning}</p>}

          <div className="flex w-full flex-col gap-2">
            {onyomi && (
              <div className="rounded-chip bg-[#4a7c9e]/10 px-3 py-1.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3a6480]">On&apos;yomi</span>
                <p className="jp text-sm text-ink">{onyomi}</p>
              </div>
            )}
            {kunyomi && (
              <div className="rounded-chip bg-[#e8a87c]/20 px-3 py-1.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9a6b43]">Kun&apos;yomi</span>
                <p className="jp text-sm text-ink">{kunyomi}</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== PRACTICE PANEL ===== */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-full bg-surface-alt p-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all sm:px-3.5 ${
                    mode === key ? 'bg-ink text-bg shadow-sm' : 'text-ink-muted hover:text-ink'
                  }`}
                  aria-pressed={mode === key}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="hidden h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/5 md:grid"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden rounded-card border-2 border-dashed border-line-strong bg-bg">
            {mode === 'order' && <KanaWriter char={char} autoplay />}
            {mode === 'practice' && <KanaTrace char={char} />}
            {mode === 'quiz' && <KanaQuiz char={char} />}
          </div>

          <p className="mt-3 text-center text-[10px] text-ink-muted">
            Stroke data from{' '}
            <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noopener noreferrer" className="underline">
              KanjiVG
            </a>{' '}
            (CC&nbsp;BY-SA&nbsp;3.0).
          </p>
        </div>
      </div>
    </div>
  );
}
