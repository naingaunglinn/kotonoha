'use client';
import { GrammarProps } from "@/types";
import { Volume2, AlertTriangle, Table, Check, ChevronDown, Sparkle } from "lucide-react";
import { useState, Fragment } from "react";

interface GrammarPointCardProps {
  item: GrammarProps;
  label?: number;
  isCompleted?: boolean;
  onToggleComplete?: (title: string) => void;
}

const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

/** Highlight occurrences of the grammar pattern inside an example sentence. */
const Highlighted = ({ text, focus }: { text: string; focus?: string }) => {
  if (!focus || focus.length < 1 || !text.includes(focus)) return <>{text}</>;
  const parts = text.split(focus);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <span className="font-semibold text-accent">{focus}</span>}
        </Fragment>
      ))}
    </>
  );
};

const GrammarPointCard = ({ item, label, isCompleted = false, onToggleComplete }: GrammarPointCardProps) => {
  const [showConjugation, setShowConjugation] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-card border bg-surface shadow-card transition-colors ${
        isCompleted ? 'border-success/40' : 'border-line'
      }`}
    >
      {/* Left accent ribbon */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: isCompleted ? 'var(--color-success)' : 'var(--color-accent)' }}
        aria-hidden
      />

      {label !== undefined && (
        <span
          className={`absolute -left-2.5 -top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-card ${
            isCompleted ? 'bg-success' : 'bg-ink'
          }`}
        >
          {isCompleted ? <Check className="h-3.5 w-3.5 animate-pop-check" /> : label}
        </span>
      )}

      <div className="p-6 pl-7 sm:p-7 sm:pl-8">
        {/* ===== HEADER ===== */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="rounded-chip bg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Grammar
            </span>
            <h3 className={`jp mt-2 text-3xl leading-tight ${isCompleted ? 'text-success' : 'text-ink'}`}>
              {item.title}
            </h3>
            {item.title_mm && <p className="mt-1 text-sm mm">{item.title_mm}</p>}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {onToggleComplete && (
              <button
                onClick={() => onToggleComplete(item.title || '')}
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
              onClick={() => speak(item.title || '')}
              className="grid h-9 w-9 place-items-center rounded-chip bg-surface-alt text-ink transition-all hover:bg-ink hover:text-bg"
              title="Pronounce"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ===== EXPLANATIONS ===== */}
        <div className="zone-rule mt-5 space-y-4 pt-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">English</span>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{item.explanation_en}</p>
          </div>
          {item.explanation_mm && (
            <div className="border-l-2 border-burmese/30 pl-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-burmese/80">Myanmar</span>
              <p className="mt-1 text-sm leading-relaxed mm">{item.explanation_mm}</p>
            </div>
          )}
        </div>

        {/* ===== EXAMPLES (paper strips) ===== */}
        <div className="zone-rule mt-5 pt-5">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Examples</h4>
          <div className="mt-3 space-y-2.5">
            {item.examples.map((ex, index) => (
              <div
                key={index}
                className="relative rounded-chip border border-line bg-surface-alt/60 p-3.5 pl-4"
              >
                <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-line-strong" aria-hidden />
                <div className="flex items-start justify-between gap-2">
                  <p className="jp flex-1 text-lg leading-snug text-ink">
                    <Highlighted text={ex.japanese ?? ''} focus={item.title ?? undefined} />
                  </p>
                  <button
                    onClick={() => speak(ex.japanese || '')}
                    className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink hover:text-bg"
                    title="Pronounce"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 text-sm text-ink-muted">{ex.english}</p>
                {ex.myanmar && <p className="mt-0.5 text-xs mm">{ex.myanmar}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* ===== CONJUGATION TABLE (collapsible) ===== */}
        {item.conjugation_table && item.conjugation_table.length > 0 && (
          <div className="zone-rule mt-5 pt-5">
            <button
              onClick={() => setShowConjugation((p) => !p)}
              className="flex items-center gap-2 text-sm font-bold text-ink-muted transition-colors hover:text-accent"
            >
              <Table className="h-4 w-4" />
              Conjugation / Pattern forms
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showConjugation ? 'rotate-180' : ''}`} />
            </button>

            {showConjugation && (
              <div className="animate-fade-in mt-3 overflow-hidden rounded-chip border border-line">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-surface-alt">
                      <th className="w-1/4 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">Form</th>
                      <th className="w-1/3 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">Pattern</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.conjugation_table.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt/50'}>
                        <td className="px-3 py-2 text-xs font-bold text-ink-muted">{row.form}</td>
                        <td className="jp px-3 py-2 font-medium text-accent">{row.japanese}</td>
                        <td className="px-3 py-2 text-ink-muted">
                          <span className="flex items-center gap-2">
                            <span className="jp">{row.example ?? '—'}</span>
                            {row.example && (
                              <button
                                onClick={() => speak(row.example!)}
                                className="rounded-full p-1 transition-colors hover:bg-ink/5"
                              >
                                <Volume2 className="h-3 w-3 text-ink-muted" />
                              </button>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== COMMON MISTAKE (amber warning) ===== */}
        {item.common_mistake_en && (
          <div className="mt-5 rounded-card border-l-4 border-accent-warm bg-accent-warm/12 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#c98a4f]" />
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a6b43]">Common mistake</p>
                <p className="text-sm leading-relaxed text-[#7d5634]">{item.common_mistake_en}</p>
                {item.common_mistake_mm && (
                  <p className="mt-1 text-xs leading-relaxed text-[#9a6b43]">{item.common_mistake_mm}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== JLPT TIP (deep navy, premium) ===== */}
        {item.exam_tip && (
          <div className="mt-3 overflow-hidden rounded-card bg-ink p-4 text-bg">
            <div className="flex items-start gap-3">
              <Sparkle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-warm" />
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">JLPT exam tip</p>
                <p className="text-sm leading-relaxed text-white/90">{item.exam_tip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarPointCard;
