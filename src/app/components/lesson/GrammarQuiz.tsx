'use client'
import { useState, useMemo, useCallback, useEffect } from 'react';
import { GrammarProps } from '@/types';
import { X, Volume2, Check, ChevronRight, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuizKeyboard } from './quiz/useQuizKeyboard';

interface GrammarQuizProps {
  grammar: GrammarProps[];
  pageGrammar: GrammarProps[];
  completedGrammar: Set<string>;
  onClose: () => void;
}

type GrammarQuizMode = 'pattern-meaning' | 'fill-blank';
type SourceFilter = 'page' | 'incomplete' | 'completed' | 'all';
type QuizPhase = 'setup' | 'playing' | 'review';

interface GrammarQuestion {
  point: GrammarProps;
  mode: GrammarQuizMode;
  prompt: string;        // shown in the prompt area
  options: string[];
  correctAnswer: string;
  sentenceFull?: string; // for review (fill-blank: the un-blanked sentence)
  promptAudio?: string;  // jp text to read aloud, if any
}

interface GrammarQuizResult {
  question: GrammarQuestion;
  selectedAnswer: string;
  isCorrect: boolean;
}

const MODE_LABELS: Record<GrammarQuizMode, { title: string; desc: string }> = {
  'pattern-meaning': { title: 'Pattern → EN', desc: 'See pattern, pick English meaning' },
  'fill-blank':      { title: 'Fill the blank', desc: 'Pick the pattern that fits the sentence' },
};

const QUESTION_COUNTS = [10, 20, 50];

const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

const shuffle = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const stripTitlePrefix = (t: string) => t.replace(/^[〜～]/, '').trim();

// Look for an example sentence that literally contains the grammar pattern;
// returns the sentence + a blanked version, or null if none found.
const findBlankableExample = (item: GrammarProps): { full: string; blanked: string; needle: string } | null => {
  const needle = stripTitlePrefix(item.title || '');
  if (!needle) return null;
  for (const ex of item.examples || []) {
    const jp = ex.japanese || '';
    const idx = jp.indexOf(needle);
    if (idx >= 0) {
      return {
        full: jp,
        blanked: jp.slice(0, idx) + '＿＿＿' + jp.slice(idx + needle.length),
        needle,
      };
    }
  }
  return null;
};

const generatePatternMeaning = (
  source: GrammarProps[],
  pool: GrammarProps[],
  count: number,
): GrammarQuestion[] => {
  const selected = shuffle(source).slice(0, count);
  return selected.map((point) => {
    const correctAnswer = point.explanation_en || '';
    const distractors = shuffle(
      pool.filter((g) => (g.explanation_en || '') && g.explanation_en !== correctAnswer),
    )
      .slice(0, 3)
      .map((g) => g.explanation_en || '');
    const options = shuffle([correctAnswer, ...distractors]);
    return {
      point,
      mode: 'pattern-meaning',
      prompt: point.title || '',
      promptAudio: point.title || '',
      options,
      correctAnswer,
    };
  });
};

const generateFillBlank = (
  source: GrammarProps[],
  pool: GrammarProps[],
  count: number,
): GrammarQuestion[] => {
  // Only items where we can locate the pattern inside an example are usable.
  const candidates = source
    .map((point) => ({ point, blank: findBlankableExample(point) }))
    .filter((c): c is { point: GrammarProps; blank: { full: string; blanked: string; needle: string } } => c.blank !== null);

  const distractorPool = pool
    .map((g) => stripTitlePrefix(g.title || ''))
    .filter((t) => t.length > 0);

  const selected = shuffle(candidates).slice(0, count);
  return selected.map(({ point, blank }) => {
    const correctAnswer = blank.needle;
    const distractors = shuffle(distractorPool.filter((t) => t !== correctAnswer))
      .slice(0, 3);
    const options = shuffle([correctAnswer, ...distractors]);
    return {
      point,
      mode: 'fill-blank',
      prompt: blank.blanked,
      promptAudio: blank.full,
      options,
      correctAnswer,
      sentenceFull: blank.full,
    };
  });
};

const GrammarQuiz = ({ grammar, pageGrammar, completedGrammar, onClose }: GrammarQuizProps) => {
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [mode, setMode] = useState<GrammarQuizMode>('pattern-meaning');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('page');
  const [questionCount, setQuestionCount] = useState(10);

  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<GrammarQuizResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [expandedReview, setExpandedReview] = useState<Set<number>>(new Set());

  const incompleteGrammar = useMemo(
    () => grammar.filter((g) => !completedGrammar.has(g.title || '')),
    [grammar, completedGrammar]
  );
  const studiedGrammar = useMemo(
    () => grammar.filter((g) => completedGrammar.has(g.title || '')),
    [grammar, completedGrammar]
  );

  const sourceGrammar = useMemo(() => {
    switch (sourceFilter) {
      case 'page': return pageGrammar;
      case 'incomplete': return incompleteGrammar;
      case 'completed': return studiedGrammar;
      case 'all':
      default: return grammar;
    }
  }, [sourceFilter, pageGrammar, incompleteGrammar, studiedGrammar, grammar]);

  // For fill-blank, only items with a blankable example qualify.
  const usableSourceCount = useMemo(() => {
    if (mode !== 'fill-blank') return sourceGrammar.length;
    return sourceGrammar.filter((g) => findBlankableExample(g) !== null).length;
  }, [sourceGrammar, mode]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useQuizKeyboard({
    active: phase === 'playing',
    options: questions[currentIndex]?.options,
    hasAnswered: selectedAnswer !== null,
    onSelect: (opt) => handleSelectAnswer(opt),
    onNext: () => handleNext(),
  });

  const handleStart = useCallback(() => {
    if (usableSourceCount < 4) return;
    const count = Math.min(questionCount, usableSourceCount);
    const qs = mode === 'pattern-meaning'
      ? generatePatternMeaning(sourceGrammar, grammar, count)
      : generateFillBlank(sourceGrammar, grammar, count);
    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setExpandedReview(new Set());
    setPhase('playing');
  }, [usableSourceCount, sourceGrammar, grammar, mode, questionCount]);

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    const q = questions[currentIndex];
    const isCorrect = answer === q.correctAnswer;
    setSelectedAnswer(answer);

    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    setResults((prev) => [...prev, { question: q, selectedAnswer: answer, isCorrect }]);

    if (isCorrect && q.sentenceFull) {
      speak(q.sentenceFull);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('review');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  };

  const handleRestart = () => {
    setPhase('setup');
    setQuestions([]);
    setResults([]);
    setSelectedAnswer(null);
    setCurrentIndex(0);
  };

  const toggleReviewItem = (idx: number) => {
    setExpandedReview((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const correctCount = results.filter((r) => r.isCorrect).length;
  const scorePercent = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#E1DCC9] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-black/5">
          <h2 className="text-xl font-extrabold text-[#1F150C] tracking-tight">
            {phase === 'setup' && '📚 Grammar Quiz Setup'}
            {phase === 'playing' && '📚 Grammar Quiz'}
            {phase === 'review' && '🏆 Results'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#1F150C]/10 transition-colors">
            <X className="w-5 h-5 text-[#1F150C]" />
          </button>
        </div>

        {phase === 'setup' && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1F150C]/60 mb-2 uppercase tracking-wider">Quiz Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(MODE_LABELS) as GrammarQuizMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${
                      mode === m ? 'border-[#412D15] bg-white shadow-md' : 'border-transparent bg-white/60 hover:bg-white/80'
                    }`}
                  >
                    <div className="font-bold text-[#1F150C]">{MODE_LABELS[m].title}</div>
                    <div className="text-xs text-[#1F150C]/50 mt-0.5">{MODE_LABELS[m].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F150C]/60 mb-2 uppercase tracking-wider">Grammar Source</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'page' as const, label: `This Page (${pageGrammar.length})` },
                  { key: 'incomplete' as const, label: `Not Studied (${incompleteGrammar.length})` },
                  { key: 'completed' as const, label: `Studied (${studiedGrammar.length})` },
                  { key: 'all' as const, label: `All Grammar (${grammar.length})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSourceFilter(key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      sourceFilter === key ? 'bg-[#1F150C] text-white' : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#1F150C]/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === 'fill-blank' && usableSourceCount < sourceGrammar.length && (
                <p className="text-xs text-[#1F150C]/50 mt-2 italic">
                  Fill-the-blank uses {usableSourceCount} of {sourceGrammar.length} points (skips items where the pattern can&apos;t be located in an example).
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F150C]/60 mb-2 uppercase tracking-wider">Number of Questions</label>
              <div className="flex gap-2 flex-wrap">
                {QUESTION_COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setQuestionCount(c)}
                    disabled={c > usableSourceCount}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                      questionCount === c ? 'bg-[#412D15] text-white shadow-md' : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#412D15]/40'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {c}
                  </button>
                ))}
                <button
                  onClick={() => setQuestionCount(usableSourceCount)}
                  disabled={usableSourceCount < 4}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    questionCount === usableSourceCount && !QUESTION_COUNTS.includes(usableSourceCount)
                      ? 'bg-[#412D15] text-white shadow-md'
                      : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#412D15]/40'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  All ({usableSourceCount})
                </button>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={usableSourceCount < 4}
              className="w-full py-4 bg-[#412D15] text-white font-extrabold text-lg rounded-2xl hover:bg-[#000000] transition-all active:scale-[0.98] shadow-lg shadow-[#412D15]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {usableSourceCount < 4 ? 'Need at least 4 grammar points' : 'Start Quiz →'}
            </button>
          </div>
        )}

        {phase === 'playing' && questions.length > 0 && (() => {
          const q = questions[currentIndex];
          const isAnswered = selectedAnswer !== null;
          return (
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[#1F150C]/60">
                  Question {currentIndex + 1} / {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-[10px] text-[#1F150C]/40 font-medium">
                    Tip: press 1–4 · Enter to advance
                  </span>
                  {streak > 1 && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                      🔥 {streak} streak
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                {q.mode === 'pattern-meaning' ? (
                  <>
                    <h3 className="text-4xl font-bold text-[#1F150C] mb-3">{q.prompt}</h3>
                    <p className="text-xs text-[#1F150C]/50 uppercase tracking-wider">What does this pattern mean?</p>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold text-[#1F150C]/50 uppercase tracking-wider mb-3">Fill in the blank</div>
                    <h3 className="text-2xl font-bold text-[#1F150C] leading-relaxed">{q.prompt}</h3>
                    {q.promptAudio && (
                      <button
                        onClick={() => speak(q.promptAudio!)}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E1DCC9] hover:bg-[#412D15] hover:text-white text-[#1F150C] text-sm font-medium transition-all"
                      >
                        <Volume2 className="w-4 h-4" /> Hear sentence
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className={`grid gap-3 ${q.mode === 'pattern-meaning' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {q.options.map((opt) => {
                  const isCorrect = opt === q.correctAnswer;
                  const isSelected = opt === selectedAnswer;
                  let cls = 'bg-white border-[#1F150C]/10 hover:border-[#412D15]/40 text-[#1F150C]';
                  if (isAnswered) {
                    if (isCorrect) cls = 'bg-emerald-50 border-emerald-400 text-emerald-700';
                    else if (isSelected) cls = 'bg-red-50 border-red-400 text-red-700';
                    else cls = 'bg-white border-[#1F150C]/10 text-[#1F150C]/40';
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(opt)}
                      disabled={isAnswered}
                      className={`p-4 rounded-xl border-2 font-bold transition-all text-left ${cls} ${
                        q.mode === 'fill-blank' ? 'text-lg text-center' : 'text-sm'
                      } ${!isAnswered && 'active:scale-[0.98]'}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <button
                  onClick={handleNext}
                  className="w-full py-3 bg-[#1F150C] text-white font-bold rounded-2xl hover:bg-[#1F150C]/80 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {currentIndex + 1 >= questions.length ? 'See Results' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })()}

        {phase === 'review' && (
          <div className="p-6 space-y-5">
            <div className="text-center bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-5xl font-extrabold text-[#412D15]">{scorePercent}%</div>
              <p className="text-sm text-[#1F150C]/60 mt-1">
                {correctCount} of {results.length} correct
                {bestStreak > 1 && <> · 🔥 best streak {bestStreak}</>}
              </p>
              <p className="mt-3 text-sm text-[#1F150C]/80 font-medium">
                {scorePercent >= 90 && '⭐ Excellent grasp of the patterns!'}
                {scorePercent >= 70 && scorePercent < 90 && '👍 Solid — a couple more reviews and you\'re set.'}
                {scorePercent >= 50 && scorePercent < 70 && '💪 Getting there. Re-read the tricky ones.'}
                {scorePercent < 50 && '📖 Worth another pass through the explanations.'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-[#1F150C]/50 uppercase tracking-wider">Review</div>
              {results.map((r, idx) => {
                const expanded = expandedReview.has(idx);
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border-2 ${
                      r.isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleReviewItem(idx)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                          r.isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {r.isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-lg font-bold text-[#1F150C] truncate">{r.question.point.title}</span>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-[#1F150C]/40" /> : <ChevronDown className="w-4 h-4 text-[#1F150C]/40" />}
                    </button>
                    {expanded && (
                      <div className="px-3 pb-3 space-y-1.5 text-xs text-[#1F150C]/80 border-t border-black/5 pt-2">
                        {!r.isCorrect && (
                          <p><span className="font-bold text-red-600">Your answer:</span> {r.selectedAnswer}</p>
                        )}
                        <p><span className="font-bold text-emerald-700">Correct:</span> {r.question.correctAnswer}</p>
                        {r.question.sentenceFull && (
                          <div className="flex items-start gap-2">
                            <p className="flex-1"><span className="font-bold text-[#412D15]">Sentence:</span> {r.question.sentenceFull}</p>
                            <button
                              onClick={() => speak(r.question.sentenceFull!)}
                              className="p-1 rounded-full bg-white border border-black/5 hover:bg-[#412D15] hover:text-white transition-colors flex-shrink-0"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-[#1F150C]/70 italic">{r.question.point.explanation_en}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-white border-2 border-[#1F150C]/15 text-[#1F150C] font-bold rounded-2xl hover:border-[#412D15] transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-[#412D15] text-white font-bold rounded-2xl hover:bg-[#000000] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarQuiz;
