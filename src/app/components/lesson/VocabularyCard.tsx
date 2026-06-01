'use client';
import { Volume2, Eye, EyeOff, Check, ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { VocabularyProps, PartOfSpeech } from "@/types";

interface VocabularyCardProps {
  item: VocabularyProps;
  label?: number;
  isCompleted?: boolean;
  onToggleComplete?: (word: string) => void;
  globalShowRomaji?: boolean;
  globalShowEnglish?: boolean;
  globalShowMyanmar?: boolean;
}

// POS chips — muted, palette-aligned tints
const POS_COLORS: Record<PartOfSpeech, string> = {
  Noun:       'bg-[#4a7c9e]/12 text-[#3a6480]',
  Verb:       'bg-[#4a7c5e]/14 text-[#3a6249]',
  Adjective:  'bg-[#bf4b3c]/12 text-[#a83d30]',
  Adverb:     'bg-[#e8a87c]/22 text-[#9a6b43]',
  Particle:   'bg-[#8a6d9e]/14 text-[#6d5480]',
  Expression: 'bg-[#2d7a6b]/14 text-[#236054]',
};

const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className="text-ink-muted/70 transition-colors hover:text-ink"
    title={on ? `Hide ${label}` : `Show ${label}`}
    aria-label={on ? `Hide ${label}` : `Show ${label}`}
  >
    {on ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
  </button>
);

const VocabularyCard = ({
  item,
  label,
  isCompleted = false,
  onToggleComplete,
  globalShowRomaji = false,
  globalShowEnglish = false,
  globalShowMyanmar = false,
}: VocabularyCardProps) => {
  const [localRomaji, setLocalRomaji] = useState<boolean | null>(null);
  const [localEnglish, setLocalEnglish] = useState<boolean | null>(null);
  const [localMyanmar, setLocalMyanmar] = useState<boolean | null>(null);
  const [showExample, setShowExample] = useState(false);

  const showRomaji  = localRomaji  !== null ? localRomaji  : globalShowRomaji;
  const showEnglish = localEnglish !== null ? localEnglish : globalShowEnglish;
  const showMyanmar = localMyanmar !== null ? localMyanmar : globalShowMyanmar;

  const toggleLocalRomaji  = () => setLocalRomaji(prev  => prev === null ? !globalShowRomaji  : !prev);
  const toggleLocalEnglish = () => setLocalEnglish(prev => prev === null ? !globalShowEnglish : !prev);
  const toggleLocalMyanmar = () => setLocalMyanmar(prev => prev === null ? !globalShowMyanmar : !prev);

  const hasExample = !!item.example_jp;

  return (
    <div
      className={`hover-lift relative flex flex-col rounded-card border bg-surface shadow-card transition-colors ${
        isCompleted ? 'border-success/40' : 'border-line'
      }`}
    >
      {isCompleted && <span className="absolute inset-y-0 left-0 w-1 rounded-l-card bg-success" />}

      {/* Label badge */}
      {label !== undefined && (
        <span
          className={`absolute -left-2.5 -top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-card ${
            isCompleted ? 'bg-success' : 'bg-ink'
          }`}
        >
          {isCompleted ? <Check className="h-3.5 w-3.5 animate-pop-check" /> : label}
        </span>
      )}

      {/* ===== TOP BAND: word + readings + audio ===== */}
      <div className="flex items-start gap-3 p-5 pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.part_of_speech && (
              <span className={`rounded-chip px-2 py-0.5 text-[10px] font-bold ${POS_COLORS[item.part_of_speech]}`}>
                {item.part_of_speech}
              </span>
            )}
            {item.tag && (
              <span className="rounded-chip bg-ink/8 px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                {item.tag}
              </span>
            )}
            {item.formality && (
              <span className="rounded-chip bg-surface-alt px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                {item.formality}
              </span>
            )}
          </div>

          <h3 className={`jp mt-2 text-3xl leading-tight ${isCompleted ? 'text-success' : 'text-ink'}`}>
            {item.word}
          </h3>

          <div className="mt-1 flex items-center gap-2">
            {showRomaji ? (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{item.spelling}</p>
            ) : (
              <p className="text-xs italic tracking-wide text-ink-muted/60">romaji hidden</p>
            )}
            <Toggle on={showRomaji} onClick={toggleLocalRomaji} label="romaji" />
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
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
          <button
            onClick={() => speak(item.word || '')}
            className="grid h-9 w-9 place-items-center rounded-chip bg-surface-alt text-ink transition-all hover:bg-ink hover:text-bg"
            title="Pronounce"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ===== MEANING ZONE ===== */}
      <div className="zone-rule px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">English</span>
              <Toggle on={showEnglish} onClick={toggleLocalEnglish} label="English" />
            </div>
            <p className="mt-0.5 text-sm leading-snug text-ink">
              {showEnglish ? item.meaning : <span className="italic text-ink-muted/50">hidden</span>}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-burmese/80">Myanmar</span>
              <Toggle on={showMyanmar} onClick={toggleLocalMyanmar} label="Myanmar" />
            </div>
            <p className="mt-0.5 text-sm leading-snug mm">
              {showMyanmar ? item.meaning_mm : <span className="italic text-ink-muted/50">hidden</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ===== EXAMPLE (collapsible) ===== */}
      {hasExample && (
        <div className="zone-rule px-5 py-3">
          <button
            onClick={() => setShowExample((p) => !p)}
            className="flex w-full items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-accent"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showExample ? 'rotate-180' : ''}`} />
            Example sentence
          </button>

          {showExample && (
            <div className="animate-fade-in mt-2.5 space-y-1.5 rounded-chip bg-surface-alt p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="jp flex-1 text-sm leading-snug text-ink">{item.example_jp}</p>
                <button
                  onClick={() => speak(item.example_jp || '')}
                  className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-surface text-ink transition-all hover:bg-ink hover:text-bg"
                  title="Play example"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {showEnglish && item.example_en && (
                <p className="text-xs text-ink-muted">{item.example_en}</p>
              )}
              {showMyanmar && item.example_mm && <p className="text-xs mm">{item.example_mm}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabularyCard;
