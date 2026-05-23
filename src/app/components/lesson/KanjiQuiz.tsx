'use client'
import { useState, useMemo, useCallback, useEffect } from 'react';
import { KanjiProps } from '@/types';
import { X, Volume2, Check, ChevronRight, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuizKeyboard } from './quiz/useQuizKeyboard';

interface KanjiQuizProps {
  kanji: KanjiProps[];
  pageKanji: KanjiProps[];
  completedKanji: Set<string>;
  onClose: () => void;
}

type KanjiQuizMode = 'kanji-meaning' | 'meaning-kanji';
type SourceFilter = 'page' | 'incomplete' | 'completed' | 'all';
type QuizPhase = 'setup' | 'playing' | 'review';

interface KanjiQuestion {
  kanji: KanjiProps;
  options: string[];
  correctAnswer: string;
}

interface KanjiQuizResult {
  question: KanjiQuestion;
  selectedAnswer: string;
  isCorrect: boolean;
}

const MODE_LABELS: Record<KanjiQuizMode, { title: string; desc: string }> = {
  'kanji-meaning': { title: '漢 → EN', desc: 'See kanji, pick English meaning' },
  'meaning-kanji': { title: 'EN → 漢', desc: 'See English, pick kanji' },
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

const meaningOf = (k: KanjiProps) => k.meaning || '';
const charOf = (k: KanjiProps) => k.word || '';

const generateQuestions = (
  source: KanjiProps[],
  pool: KanjiProps[],
  mode: KanjiQuizMode,
  count: number,
): KanjiQuestion[] => {
  const selected = shuffle(source).slice(0, count);
  const getOption = mode === 'kanji-meaning' ? meaningOf : charOf;

  return selected.map((kanji) => {
    const correctAnswer = getOption(kanji);
    const distractors = shuffle(
      pool.filter((k) => getOption(k) && getOption(k) !== correctAnswer),
    )
      .slice(0, 3)
      .map(getOption);
    const options = shuffle([correctAnswer, ...distractors]);
    return { kanji, options, correctAnswer };
  });
};

const KanjiQuiz = ({ kanji, pageKanji, completedKanji, onClose }: KanjiQuizProps) => {
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [mode, setMode] = useState<KanjiQuizMode>('kanji-meaning');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('page');
  const [questionCount, setQuestionCount] = useState(10);

  const [questions, setQuestions] = useState<KanjiQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<KanjiQuizResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [expandedReview, setExpandedReview] = useState<Set<number>>(new Set());

  const incompleteKanji = useMemo(
    () => kanji.filter((k) => !completedKanji.has(k.word || '')),
    [kanji, completedKanji]
  );
  const studiedKanji = useMemo(
    () => kanji.filter((k) => completedKanji.has(k.word || '')),
    [kanji, completedKanji]
  );

  const sourceKanji = useMemo(() => {
    switch (sourceFilter) {
      case 'page': return pageKanji;
      case 'incomplete': return incompleteKanji;
      case 'completed': return studiedKanji;
      case 'all':
      default: return kanji;
    }
  }, [sourceFilter, pageKanji, incompleteKanji, studiedKanji, kanji]);

  const availableCount = sourceKanji.length;

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
    if (sourceKanji.length < 4) return;
    const count = Math.min(questionCount, sourceKanji.length);
    setQuestions(generateQuestions(sourceKanji, kanji, mode, count));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setExpandedReview(new Set());
    setPhase('playing');
  }, [sourceKanji, kanji, mode, questionCount]);

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    const q = questions[currentIndex];
    const isCorrect = answer === q.correctAnswer;
    setSelectedAnswer(answer);

    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    setResults((prev) => [...prev, { question: q, selectedAnswer: answer, isCorrect }]);

    if (mode === 'meaning-kanji' && isCorrect) {
      speak(q.kanji.word_kana || q.kanji.word || '');
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
            {phase === 'setup' && '🀄 Kanji Quiz Setup'}
            {phase === 'playing' && '🀄 Kanji Quiz'}
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
                {(Object.keys(MODE_LABELS) as KanjiQuizMode[]).map((m) => (
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
              <label className="block text-sm font-bold text-[#1F150C]/60 mb-2 uppercase tracking-wider">Kanji Source</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'page' as const, label: `This Page (${pageKanji.length})` },
                  { key: 'incomplete' as const, label: `Not Studied (${incompleteKanji.length})` },
                  { key: 'completed' as const, label: `Studied (${studiedKanji.length})` },
                  { key: 'all' as const, label: `All Kanji (${kanji.length})` },
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
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F150C]/60 mb-2 uppercase tracking-wider">Number of Questions</label>
              <div className="flex gap-2 flex-wrap">
                {QUESTION_COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setQuestionCount(c)}
                    disabled={c > availableCount}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                      questionCount === c ? 'bg-[#412D15] text-white shadow-md' : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#412D15]/40'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {c}
                  </button>
                ))}
                <button
                  onClick={() => setQuestionCount(availableCount)}
                  disabled={availableCount < 4}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    questionCount === availableCount && !QUESTION_COUNTS.includes(availableCount)
                      ? 'bg-[#412D15] text-white shadow-md'
                      : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#412D15]/40'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  All ({availableCount})
                </button>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={availableCount < 4}
              className="w-full py-4 bg-[#412D15] text-white font-extrabold text-lg rounded-2xl hover:bg-[#000000] transition-all active:scale-[0.98] shadow-lg shadow-[#412D15]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {availableCount < 4 ? 'Need at least 4 kanji' : 'Start Quiz →'}
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

              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                {mode === 'kanji-meaning' ? (
                  <>
                    <h3 className="text-8xl font-bold text-[#1F150C] leading-none mb-3">{q.kanji.word}</h3>
                    <button
                      onClick={() => speak(q.kanji.word_kana || q.kanji.word || '')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E1DCC9] hover:bg-[#412D15] hover:text-white text-[#1F150C] text-sm font-medium transition-all"
                    >
                      <Volume2 className="w-4 h-4" /> Hear reading
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold text-[#1F150C]/50 uppercase tracking-wider mb-2">English meaning</div>
                    <h3 className="text-2xl font-bold text-[#1F150C]">{q.kanji.meaning}</h3>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                      className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${cls} ${
                        !isAnswered && 'active:scale-[0.98]'
                      }`}
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
                {scorePercent >= 90 && '⭐ Excellent! Mastery is close.'}
                {scorePercent >= 70 && scorePercent < 90 && '👍 Great work — a few more reps and you\'ll have it.'}
                {scorePercent >= 50 && scorePercent < 70 && '💪 Solid start. Keep studying.'}
                {scorePercent < 50 && '📖 Time for another read-through. You got this.'}
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
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          r.isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {r.isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-2xl font-bold text-[#1F150C]">{r.question.kanji.word}</span>
                        <span className="text-sm text-[#1F150C]/60">{r.question.kanji.meaning}</span>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-[#1F150C]/40" /> : <ChevronDown className="w-4 h-4 text-[#1F150C]/40" />}
                    </button>
                    {expanded && (
                      <div className="px-3 pb-3 space-y-1.5 text-xs text-[#1F150C]/80 border-t border-black/5 pt-2">
                        {!r.isCorrect && (
                          <p><span className="font-bold text-red-600">Your answer:</span> {r.selectedAnswer}</p>
                        )}
                        <p><span className="font-bold text-emerald-700">Correct:</span> {r.question.correctAnswer}</p>
                        <p><span className="font-bold text-[#412D15]">On&apos;yomi:</span> {r.question.kanji.onyomi || '—'}</p>
                        <p><span className="font-bold text-[#412D15]">Kun&apos;yomi:</span> {r.question.kanji.kunyomi || '—'}</p>
                        <button
                          onClick={() => speak(r.question.kanji.word_kana || r.question.kanji.word || '')}
                          className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-white border border-black/5 text-[#1F150C] hover:bg-[#412D15] hover:text-white transition-colors"
                        >
                          <Volume2 className="w-3 h-3" /> Replay
                        </button>
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

export default KanjiQuiz;
