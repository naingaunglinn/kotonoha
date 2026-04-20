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
  ChevronUp,
  Timer,
  RotateCcw,
} from "lucide-react";

// --- Difficulty badge ---
const DIFFICULTY_STYLES: Record<string, string> = {
  Easy:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100   text-amber-700   border-amber-200',
  Hard:   'bg-red-100     text-[#D72323]   border-red-200',
};

// --- Highlight key vocab inside passage text ---
const HighlightedPassage = ({
  passage,
  keyVocab,
}: {
  passage: string;
  keyVocab: ReadingKeyVocabProps[];
}) => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  if (!keyVocab || keyVocab.length === 0) {
    return (
      <p className="text-[#3E3636] text-lg leading-relaxed whitespace-pre-line font-medium">
        {passage}
      </p>
    );
  }

  // Build a list of {start, end, vocab} matches
  type Match = { start: number; end: number; vocab: ReadingKeyVocabProps };
  const matches: Match[] = [];

  keyVocab.forEach(vocab => {
    const word = vocab.word;
    let idx = 0;
    while (idx < passage.length) {
      const pos = passage.indexOf(word, idx);
      if (pos === -1) break;
      // Avoid overlapping matches
      if (!matches.some(m => pos < m.end && pos + word.length > m.start)) {
        matches.push({ start: pos, end: pos + word.length, vocab });
      }
      idx = pos + 1;
    }
  });

  matches.sort((a, b) => a.start - b.start);

  // Render passage with inline highlights
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (cursor < m.start) {
      segments.push(
        <span key={`text-${i}`}>{passage.slice(cursor, m.start)}</span>
      );
    }
    segments.push(
      <span key={`vocab-${i}`} className="relative inline-block">
        <button
          onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
          className="text-[#D72323] font-bold underline underline-offset-2 decoration-dotted hover:text-[#b91c1c] transition-colors"
        >
          {passage.slice(m.start, m.end)}
        </button>
        {activeTooltip === i && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-44 bg-[#3E3636] text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-relaxed">
            <span className="block font-bold text-[#F5EDED]">{m.vocab.reading}</span>
            <span className="block text-white/80">{m.vocab.meaning_en}</span>
            <span className="block text-white/70 text-[10px]">{m.vocab.meaning_mm}</span>
            {/* Arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3E3636]" />
          </span>
        )}
      </span>
    );
    cursor = m.end;
  });
  if (cursor < passage.length) {
    segments.push(<span key="tail">{passage.slice(cursor)}</span>);
  }

  return (
    <p className="text-[#3E3636] text-lg leading-relaxed font-medium">
      {segments}
    </p>
  );
};

// --- Exam Timer ---
const TIMER_OPTIONS = [
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
];

const ExamTimer = ({ onExpire }: { onExpire: () => void }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSelected(seconds);
    setRemaining(seconds);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
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

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(selected ?? 0);
  }, [selected]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining > 0 && remaining <= 30;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Timer className="h-4 w-4 text-[#3E3636]/50" />
      <span className="text-xs font-bold text-[#3E3636]/50">Timer:</span>
      {TIMER_OPTIONS.map(opt => (
        <button
          key={opt.seconds}
          onClick={() => start(opt.seconds)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            selected === opt.seconds && running
              ? 'bg-[#D72323] text-white'
              : 'bg-[#F5EDED] text-[#3E3636]/70 hover:bg-[#3E3636]/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
      {selected !== null && (
        <>
          <span className={`font-mono text-sm font-bold tabular-nums ${
            isLow ? 'text-[#D72323] animate-pulse' : 'text-[#3E3636]'
          }`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <button onClick={reset} className="p-1 rounded hover:bg-[#3E3636]/10 transition-colors">
            <RotateCcw className="h-3.5 w-3.5 text-[#3E3636]/50" />
          </button>
        </>
      )}
    </div>
  );
};

// --- Main component ---
const ReadingPassage = ({ data }: { data: ReadingProps }) => {
  const [showTranslationEn, setShowTranslationEn] = useState(false);
  const [showTranslationMm, setShowTranslationMm] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reReadMode, setReReadMode] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);

  const handleAnswer = (qIndex: number, option: string) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleCheck = () => setShowResults(true);

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setReReadMode(false);
    setTimerExpired(false);
  };

  const correctCount = data.questions.filter(
    (q, i) => selectedAnswers[i] === q.answer
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-[#3E3636]/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#F5EDED]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-[#3E3636]">{data.title}</h3>
              {data.difficulty && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLES[data.difficulty]}`}>
                  {data.difficulty}
                </span>
              )}
            </div>
            <p className="text-sm text-[#3E3636]/60">{data.title_en} · {data.title_mm}</p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="h-5 w-5 text-[#3E3636]/40 flex-shrink-0" />
          : <ChevronDown className="h-5 w-5 text-[#3E3636]/40 flex-shrink-0" />
        }
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Timer */}
          <ExamTimer onExpire={() => setTimerExpired(true)} />
          {timerExpired && (
            <div className="text-xs font-bold text-[#D72323] bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              ⏰ Time&apos;s up! Check your answers below.
            </div>
          )}

          {/* Vocab hint (key_vocab legend) */}
          {data.key_vocab && data.key_vocab.length > 0 && !reReadMode && (
            <p className="text-xs text-[#3E3636]/50 italic">
              💡 Tap underlined <span className="text-[#D72323] font-bold underline decoration-dotted">red words</span> in the passage to see their meaning.
            </p>
          )}

          {/* Passage */}
          <div className="bg-gradient-to-br from-[#F5EDED] to-[#F5EDED]/60 rounded-xl p-5">
            <HighlightedPassage
              passage={data.passage}
              keyVocab={data.key_vocab ?? []}
            />
          </div>

          {/* Translation Toggles */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowTranslationEn(!showTranslationEn)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              {showTranslationEn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              English Translation
            </button>
            <button
              onClick={() => setShowTranslationMm(!showTranslationMm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
            >
              {showTranslationMm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              မြန်မာဘာသာ
            </button>
          </div>

          {showTranslationEn && (
            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{data.translation_en}</p>
            </div>
          )}
          {showTranslationMm && (
            <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
              <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">{data.translation_mm}</p>
            </div>
          )}

          {/* Key vocab legend */}
          {data.key_vocab && data.key_vocab.length > 0 && (
            <div className="bg-[#F5EDED]/60 rounded-xl p-4 border border-black/5">
              <p className="text-[11px] font-bold text-[#3E3636]/40 uppercase mb-2">Key Vocabulary</p>
              <div className="flex flex-wrap gap-2">
                {data.key_vocab.map((v, i) => (
                  <div key={i} className="bg-white rounded-lg px-3 py-1.5 border border-black/8 text-xs">
                    <span className="font-bold text-[#D72323]">{v.word}</span>
                    <span className="text-[#3E3636]/50 mx-1">·</span>
                    <span className="text-[#3E3636]/70">{v.reading}</span>
                    <span className="block text-[#3E3636]/60 text-[10px] mt-0.5">{v.meaning_en}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Re-read mode: annotated passage after answers submitted */}
          {reReadMode && showResults && (
            <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Re-read with Answer Annotations</p>
              <p className="text-[#3E3636] text-base leading-relaxed whitespace-pre-line font-medium">
                {data.passage}
              </p>
              <div className="space-y-2 pt-2 border-t border-blue-100">
                {data.questions.map((q, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <p className="font-bold text-blue-800">{i + 1}. {q.question}</p>
                    <p className={`font-medium ${selectedAnswers[i] === q.answer ? 'text-emerald-600' : 'text-[#D72323]'}`}>
                      Your answer: {selectedAnswers[i] ?? '—'}
                    </p>
                    {selectedAnswers[i] !== q.answer && (
                      <p className="text-emerald-700 font-medium">Correct: {q.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-[#3E3636]/60 uppercase tracking-wider">
              Comprehension Questions
            </h4>

            {data.questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-[#F5EDED]/40 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-[#3E3636]">{qIndex + 1}. {q.question}</p>
                <p className="text-sm text-[#3E3636]/50">{q.question_mm}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === option;
                    const isCorrect = option === q.answer;
                    let optionStyle = "bg-white border-[#3E3636]/10 hover:border-[#D72323]/40 text-[#3E3636]";

                    if (showResults) {
                      if (isCorrect) {
                        optionStyle = "bg-emerald-50 border-emerald-400 text-emerald-700";
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "bg-red-50 border-red-400 text-red-700";
                      } else {
                        optionStyle = "bg-white border-[#3E3636]/10 text-[#3E3636]/40";
                      }
                    } else if (isSelected) {
                      optionStyle = "bg-[#D72323]/10 border-[#D72323] text-[#D72323]";
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswer(qIndex, option)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${optionStyle}`}
                      >
                        {showResults && isCorrect && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                        {showResults && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Submit / Results */}
            <div className="flex flex-wrap items-center gap-3">
              {!showResults ? (
                <button
                  onClick={handleCheck}
                  disabled={Object.keys(selectedAnswers).length < data.questions.length}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D72323] to-[#B71C1C] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Check Answers
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-medium text-sm">
                    <CheckCircle className="h-4 w-4" />
                    {correctCount} / {data.questions.length} correct
                  </div>
                  <button
                    onClick={() => setReReadMode(prev => !prev)}
                    className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100 transition-colors"
                  >
                    {reReadMode ? 'Hide' : 'Re-read'} with annotations
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-xl bg-[#3E3636]/10 text-[#3E3636] font-medium text-sm hover:bg-[#3E3636]/20 transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPassage;
