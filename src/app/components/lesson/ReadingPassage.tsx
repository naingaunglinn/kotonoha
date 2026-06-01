"use client";
import { ReadingProps, ReadingKeyVocabProps } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ChevronDown,
  Timer,
  RotateCcw,
  X,
} from "lucide-react";

// --- Difficulty pill ---
const DIFFICULTY_STYLES: Record<string, string> = {
  Easy:   'bg-success/12 text-success',
  Medium: 'bg-accent-warm/25 text-[#9a6b43]',
  Hard:   'bg-accent/12 text-accent',
};

// --- Highlight key vocab inside passage text ---
const HighlightedPassage = ({ passage, keyVocab }: { passage: string; keyVocab: ReadingKeyVocabProps[] }) => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  if (!keyVocab || keyVocab.length === 0) {
    return <p className="jp whitespace-pre-line text-lg leading-[1.95] text-ink">{passage}</p>;
  }

  type Match = { start: number; end: number; vocab: ReadingKeyVocabProps };
  const matches: Match[] = [];
  keyVocab.forEach((vocab) => {
    const word = vocab.word;
    let idx = 0;
    while (idx < passage.length) {
      const pos = passage.indexOf(word, idx);
      if (pos === -1) break;
      if (!matches.some((m) => pos < m.end && pos + word.length > m.start)) {
        matches.push({ start: pos, end: pos + word.length, vocab });
      }
      idx = pos + 1;
    }
  });
  matches.sort((a, b) => a.start - b.start);

  const segments: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (cursor < m.start) segments.push(<span key={`text-${i}`}>{passage.slice(cursor, m.start)}</span>);
    segments.push(
      <span key={`vocab-${i}`} className="relative inline-block">
        <button
          onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
          className="font-medium text-ink underline decoration-accent-warm decoration-2 underline-offset-[5px] transition-colors hover:text-accent"
        >
          {passage.slice(m.start, m.end)}
        </button>
        {activeTooltip === i && (
          <span className="absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-card border border-line bg-surface px-3 py-2 text-left shadow-float">
            <span className="jp block text-sm font-bold text-ink">{m.vocab.reading}</span>
            <span className="block text-xs text-ink-muted">{m.vocab.meaning_en}</span>
            <span className="mt-0.5 block text-[11px] mm">{m.vocab.meaning_mm}</span>
            <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-surface" />
          </span>
        )}
      </span>,
    );
    cursor = m.end;
  });
  if (cursor < passage.length) segments.push(<span key="tail">{passage.slice(cursor)}</span>);

  return <p className="jp text-lg leading-[1.95] text-ink">{segments}</p>;
};

// --- Floating timer with countdown ring ---
const TIMER_OPTIONS = [
  { label: '3', seconds: 180 },
  { label: '5', seconds: 300 },
  { label: '10', seconds: 600 },
];

const ExamTimer = ({ onExpire }: { onExpire: () => void }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSelected(seconds);
    setRemaining(seconds);
    setRunning(true);
    setMenuOpen(false);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onExpire]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setSelected(null);
    setRemaining(0);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining > 0 && remaining <= 30;
  const R = 13;
  const C = 2 * Math.PI * R;
  const frac = selected ? remaining / selected : 0;

  if (selected !== null) {
    return (
      <div
        className={`flex items-center gap-2 rounded-full border bg-surface/90 px-2 py-1 shadow-card backdrop-blur-sm ${
          isLow ? 'border-accent' : 'border-line'
        }`}
      >
        <span className="relative grid h-7 w-7 place-items-center">
          <svg viewBox="0 0 32 32" className="h-7 w-7 -rotate-90">
            <circle cx="16" cy="16" r={R} fill="none" stroke="var(--color-line)" strokeWidth="3" />
            <circle
              cx="16" cy="16" r={R} fill="none"
              stroke={isLow ? 'var(--color-accent)' : 'var(--color-accent-cool)'}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
        </span>
        <span className={`font-mono text-xs font-bold tabular-nums ${isLow ? 'text-accent' : 'text-ink'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <button onClick={stop} className="grid h-5 w-5 place-items-center rounded-full text-ink-muted hover:bg-ink/5" aria-label="Stop timer">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-xs font-bold text-ink-muted shadow-card backdrop-blur-sm transition-colors hover:text-ink"
      >
        <Timer className="h-3.5 w-3.5" />
        Timer
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full z-30 mt-1 flex gap-1 rounded-card border border-line bg-surface p-1 shadow-float">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.seconds}
              onClick={() => start(opt.seconds)}
              className="rounded-chip px-2.5 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-surface-alt"
            >
              {opt.label}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ReadingPassageProps {
  data: ReadingProps;
  label?: number;
  isCompleted?: boolean;
  defaultExpanded?: boolean;
  onComplete?: (title: string) => void;
}

const ReadingPassage = ({ data, label, isCompleted = false, defaultExpanded = false, onComplete }: ReadingPassageProps) => {
  const [showTranslationEn, setShowTranslationEn] = useState(false);
  const [showTranslationMm, setShowTranslationMm] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [reReadMode, setReReadMode] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);

  const handleAnswer = (qIndex: number, option: string) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleCheck = () => {
    setShowResults(true);
    if (!isCompleted) onComplete?.(data.title);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setReReadMode(false);
    setTimerExpired(false);
  };

  const correctCount = data.questions.filter((q, i) => selectedAnswers[i] === q.answer).length;

  return (
    <div className="relative">
      {label !== undefined && (
        <span
          className={`absolute -left-2.5 -top-2.5 z-30 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-card ${
            isCompleted ? 'bg-success' : 'bg-ink'
          }`}
        >
          {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : label}
        </span>
      )}
      <div
        className={`relative overflow-hidden rounded-card border bg-surface shadow-card transition-colors ${
          isCompleted ? 'border-success/40' : 'border-line'
        }`}
      >

      {/* ===== HEADER ===== */}
      <button
        className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-surface-alt/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-card ${
            isCompleted ? 'bg-success text-white' : 'bg-success/14 text-success'
          }`}
        >
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-[family-name:var(--font-display)] text-lg leading-tight ${isCompleted ? 'text-success' : 'text-ink'}`}>
              {data.title}
            </h3>
            {data.difficulty && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_STYLES[data.difficulty]}`}>
                {data.difficulty}
              </span>
            )}
            {isCompleted && (
              <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold text-success">✓ Studied</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{data.title_en} · {data.title_mm}</p>
        </div>
        <ChevronDown className={`h-5 w-5 flex-shrink-0 text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-4 px-5 pb-5">
          {timerExpired && (
            <div className="rounded-chip border-l-4 border-accent bg-accent/8 px-3 py-2 text-xs font-bold text-accent">
              ⏰ Time&apos;s up! Check your answers below.
            </div>
          )}

          {data.key_vocab && data.key_vocab.length > 0 && (
            <p className="text-xs italic text-ink-muted">
              Tap the <span className="font-medium text-ink underline decoration-accent-warm decoration-2 underline-offset-2">underlined words</span> in the passage to see their meaning.
            </p>
          )}

          {/* ===== PASSAGE CARD (with floating timer) ===== */}
          <div className="relative rounded-card border border-line bg-surface-alt/50 p-6 pt-12 sm:p-7 sm:pt-12">
            <div className="absolute right-3 top-3 z-10">
              <ExamTimer onExpire={() => setTimerExpired(true)} />
            </div>
            <HighlightedPassage passage={data.passage} keyVocab={data.key_vocab ?? []} />
          </div>

          {/* ===== KEY VOCAB — index-card chips ===== */}
          {data.key_vocab && data.key_vocab.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Key vocabulary</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {data.key_vocab.map((v, i) => (
                  <div
                    key={i}
                    className="min-w-[8.5rem] flex-shrink-0 rounded-chip border border-line bg-surface p-2.5 shadow-card"
                  >
                    <p className="jp text-base leading-tight text-ink">{v.word}</p>
                    <p className="jp text-[11px] text-accent">{v.reading}</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">{v.meaning_en}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== TRANSLATION TOGGLES ===== */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowTranslationEn(!showTranslationEn)}
              className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-xs font-bold transition-colors ${
                showTranslationEn ? 'bg-accent-cool text-white' : 'bg-accent-cool/10 text-accent-cool hover:bg-accent-cool/20'
              }`}
            >
              {showTranslationEn ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              English
            </button>
            <button
              onClick={() => setShowTranslationMm(!showTranslationMm)}
              className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-xs font-bold transition-colors ${
                showTranslationMm ? 'bg-burmese text-white' : 'bg-burmese/10 text-burmese hover:bg-burmese/20'
              }`}
            >
              {showTranslationMm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              မြန်မာ
            </button>
          </div>

          {showTranslationEn && (
            <div className="animate-fade-in rounded-chip border border-line p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{data.translation_en}</p>
            </div>
          )}
          {showTranslationMm && (
            <div className="animate-fade-in rounded-chip border border-line p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed mm">{data.translation_mm}</p>
            </div>
          )}

          {/* ===== RE-READ ANNOTATIONS ===== */}
          {reReadMode && showResults && (
            <div className="animate-fade-in space-y-3 rounded-card border border-accent-cool/30 bg-accent-cool/[0.06] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-cool">Re-read with answer annotations</p>
              <p className="jp whitespace-pre-line text-base leading-[1.9] text-ink">{data.passage}</p>
              <div className="space-y-2 border-t border-line pt-3">
                {data.questions.map((q, i) => (
                  <div key={i} className="space-y-0.5 text-xs">
                    <p className="font-bold text-ink">{i + 1}. {q.question}</p>
                    <p className={`font-medium ${selectedAnswers[i] === q.answer ? 'text-success' : 'text-accent'}`}>
                      Your answer: {selectedAnswers[i] ?? '—'}
                    </p>
                    {selectedAnswers[i] !== q.answer && <p className="font-medium text-success">Correct: {q.answer}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== QUESTIONS ===== */}
          <div className="space-y-4 pt-1">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Comprehension questions</h4>

            {data.questions.map((q, qIndex) => (
              <div key={qIndex} className="rounded-card border border-line bg-surface-alt/40 p-4">
                <p className="font-semibold text-ink">{qIndex + 1}. <span className="jp">{q.question}</span></p>
                {q.question_mm && <p className="mt-0.5 text-sm mm">{q.question_mm}</p>}

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {q.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === option;
                    const isCorrect = option === q.answer;
                    let cls = 'border-line bg-surface text-ink hover:border-accent/50';
                    if (showResults) {
                      if (isCorrect) cls = 'border-success bg-success/8 text-success';
                      else if (isSelected) cls = 'border-accent bg-accent/8 text-accent';
                      else cls = 'border-line bg-surface text-ink-muted/60';
                    } else if (isSelected) {
                      cls = 'border-accent bg-accent/8 text-ink font-semibold';
                    }
                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswer(qIndex, option)}
                        className={`flex items-center gap-2.5 rounded-chip border-2 p-3 text-left text-sm transition-all duration-200 ${cls}`}
                      >
                        <span
                          className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 ${
                            isSelected || (showResults && isCorrect) ? 'border-current' : 'border-line-strong'
                          }`}
                        >
                          {showResults && isCorrect && <CheckCircle className="h-4 w-4" />}
                          {showResults && isSelected && !isCorrect && <XCircle className="h-4 w-4" />}
                          {!showResults && isSelected && <span className="h-2 w-2 rounded-full bg-current" />}
                        </span>
                        <span className="jp">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3">
              {!showResults ? (
                <button
                  onClick={handleCheck}
                  disabled={Object.keys(selectedAnswers).length < data.questions.length}
                  className="flex w-full items-center justify-center gap-2 rounded-card bg-accent px-5 py-3 text-sm font-bold text-white shadow-card transition-all hover:bg-[#a83d30] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Check answers
                </button>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-card bg-success/10 px-4 py-2.5 text-sm font-bold text-success">
                    <CheckCircle className="h-4 w-4" />
                    {correctCount} / {data.questions.length} correct
                  </div>
                  <button
                    onClick={() => setReReadMode((p) => !p)}
                    className="inline-flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5 text-sm font-bold text-accent-cool transition-colors hover:border-line-strong"
                  >
                    {reReadMode ? 'Hide' : 'Re-read'} annotations
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-card border border-line bg-surface px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:border-line-strong"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ReadingPassage;
