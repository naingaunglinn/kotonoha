'use client';
import { KanjiProps } from "@/types";
import { Volume2, Lightbulb, Layers, PenLine, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import KanjiWriteModal from "./KanjiWriteModal";

interface KanjiCardProps {
  item: KanjiProps;
  label?: number;
  isCompleted?: boolean;
  onToggleComplete?: (kanji: string) => void;
}

const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

const KanjiCard = ({ item, label, isCompleted = false, onToggleComplete }: KanjiCardProps) => {
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const [showWrite, setShowWrite] = useState(false);

  const examples = item.examples ?? [];
  const visibleExamples = showAllExamples ? examples : examples.slice(0, 1);

  return (
    <>
    <div className="hover-lift relative">
      {label !== undefined && (
        <span
          className={`absolute -left-2.5 -top-2.5 z-30 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-card ${
            isCompleted ? 'bg-success' : 'bg-ink'
          }`}
        >
          {isCompleted ? <Check className="h-3.5 w-3.5 animate-pop-check" /> : label}
        </span>
      )}
      <div
        className={`relative flex flex-col overflow-hidden rounded-card border bg-surface shadow-card transition-colors ${
          isCompleted ? 'border-success/40' : 'border-line'
        }`}
      >
        {isCompleted && <span className="absolute inset-y-0 left-0 z-10 w-1 bg-success" />}

      {/* ===== TOP BAND: kanji + stroke pill + audio ===== */}
      <div className="relative flex items-start gap-3 p-5 pb-4">
        {/* Genkō-yōshi grid behind the glyph */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(26,26,46,0.04) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(26,26,46,0.04) 1px, transparent 1px)`,
            backgroundSize: '26px 26px',
          }}
          aria-hidden
        />
        <h3 className={`jp relative text-[80px] font-medium leading-none ${isCompleted ? 'text-success' : 'text-ink'}`}>
          {item.word}
        </h3>

        <div className="relative ml-auto flex flex-col items-end gap-2">
          {onToggleComplete && (
            <button
              onClick={() => onToggleComplete(item.word || '')}
              className={`grid h-9 w-9 place-items-center rounded-chip border transition-all duration-200 ${
                isCompleted
                  ? 'border-success bg-success text-white'
                  : 'border-line-strong text-ink-muted/50 hover:border-success hover:bg-success/5 hover:text-success'
              }`}
              aria-pressed={isCompleted}
              title={isCompleted ? 'Mark as not studied' : 'Mark as studied'}
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-bg">
            {item.strokes} 画
          </span>
          <button
            onClick={() => speak(item.word_kana || item.word || '')}
            className="grid h-9 w-9 place-items-center rounded-chip bg-surface-alt text-ink transition-all hover:bg-ink hover:text-bg"
            title="Pronounce"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowWrite(true)}
            className="inline-flex items-center gap-1 rounded-chip bg-accent/10 px-2.5 py-1.5 text-[11px] font-bold text-accent transition-colors hover:bg-accent hover:text-white"
            title="Practice writing strokes"
          >
            <PenLine className="h-3.5 w-3.5" />
            Write
          </button>
        </div>
      </div>

      {/* ===== READINGS ZONE: on (cool) + kun (warm) chips ===== */}
      <div className="zone-rule flex flex-wrap gap-2 px-5 py-4">
        <div className="min-w-[7rem] flex-1 rounded-chip bg-[#4a7c9e]/10 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3a6480]">On&apos;yomi</span>
          <p className="jp mt-0.5 text-sm text-ink">{item.onyomi || '—'}</p>
        </div>
        <div className="min-w-[7rem] flex-1 rounded-chip bg-[#e8a87c]/20 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9a6b43]">Kun&apos;yomi</span>
          <p className="jp mt-0.5 text-sm text-ink">{item.kunyomi || '—'}</p>
        </div>
      </div>

      {/* ===== MEANING ===== */}
      <div className="zone-rule px-5 py-4">
        <p className="font-[family-name:var(--font-display)] text-lg leading-tight text-ink">{item.meaning}</p>
        {item.meaning_mm && <p className="mt-1 text-sm mm">{item.meaning_mm}</p>}
      </div>

      {/* ===== EXAMPLES (accordion) ===== */}
      {examples.length > 0 && (
        <div className="zone-rule px-5 py-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Examples</span>
          <div className="mt-2 space-y-2">
            {visibleExamples.map((ex, i) => (
              <div key={i} className="flex items-center justify-between rounded-chip bg-surface-alt px-3 py-2">
                <div className="min-w-0">
                  <p className="jp text-sm text-ink">{ex.japanese}</p>
                  <p className="text-[11px] font-medium text-accent">{ex.reading}</p>
                  <p className="text-[11px] text-ink-muted">{ex.meaning_en}</p>
                </div>
                <button
                  onClick={() => speak(ex.japanese || '')}
                  className="ml-2 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink hover:text-bg"
                  title="Pronounce"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {examples.length > 1 && (
            <button
              onClick={() => setShowAllExamples((p) => !p)}
              className="mt-2 flex items-center gap-1 text-[11px] font-bold text-ink-muted transition-colors hover:text-accent"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllExamples ? 'rotate-180' : ''}`} />
              {showAllExamples ? 'Show less' : `Show ${examples.length - 1} more`}
            </button>
          )}
        </div>
      )}

      {/* ===== STROKE HINT + RADICAL ===== */}
      {(item.stroke_hint || item.radical) && (
        <div className="zone-rule space-y-2 px-5 py-4">
          {item.stroke_hint && (
            <div className="flex items-start gap-2 rounded-chip bg-surface-alt p-2.5">
              <PenLine className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-muted" />
              <p className="text-[11px] leading-relaxed text-ink-muted">{item.stroke_hint}</p>
            </div>
          )}
          {item.radical && (
            <div className="flex items-start gap-2 rounded-chip bg-[#4a7c9e]/10 p-2.5">
              <Layers className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#4a7c9e]" />
              <p className="text-[11px] leading-relaxed text-[#3a6480]">{item.radical}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== MNEMONIC (amber/cream box) ===== */}
      {item.mnemonic && (
        <div className="zone-rule px-5 py-3">
          <button
            onClick={() => setShowMnemonic((p) => !p)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#9a6b43] transition-colors hover:text-[#7d5634]"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Memory trick
            <ChevronDown className={`h-3 w-3 transition-transform ${showMnemonic ? 'rotate-180' : ''}`} />
          </button>
          {showMnemonic && (
            <div className="animate-fade-in mt-2 rounded-chip border border-[#e8a87c]/40 bg-[#e8a87c]/12 p-3">
              <p className="text-[12px] italic leading-relaxed text-[#7d5634]">{item.mnemonic}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== NOTE (muted, collapsible) ===== */}
      {item.description && (
        <div className="zone-rule px-5 py-3">
          <button
            onClick={() => setShowNote((p) => !p)}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNote ? 'rotate-180' : ''}`} />
            Note
          </button>
          {showNote && (
            <p className="animate-fade-in mt-2 text-[11px] leading-relaxed text-ink-muted">{item.description}</p>
          )}
        </div>
      )}
      </div>
    </div>
    {showWrite && (
      <KanjiWriteModal
        char={item.word || ''}
        meaning={item.meaning ?? undefined}
        onyomi={item.onyomi ?? undefined}
        kunyomi={item.kunyomi ?? undefined}
        strokes={item.strokes ?? undefined}
        onClose={() => setShowWrite(false)}
      />
    )}
    </>
  );
};

export default KanjiCard;
