'use client'
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { VocabularyProps } from '@/types';
import { X, Volume2, ChevronRight, RotateCcw, Trophy, Flame, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

type QuizMode = 'jp-en' | 'en-jp' | 'jp-mm' | 'audio-jp';

interface QuizConfig {
  mode: QuizMode;
  questionCount: number;
  sourceFilter: 'all' | 'page' | 'incomplete';
}

interface QuizQuestion {
  word: VocabularyProps;
  options: string[];
  correctAnswer: string;
}

interface QuizResult {
  question: QuizQuestion;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface VocabularyQuizProps {
  vocab: VocabularyProps[];
  pageVocab: VocabularyProps[];
  completedWords: Set<string>;
  onClose: () => void;
}

const MODE_LABELS: Record<QuizMode, { title: string; desc: string }> = {
  'jp-en': { title: 'JP → EN', desc: 'See Japanese, pick English' },
  'en-jp': { title: 'EN → JP', desc: 'See English, pick Japanese' },
  'jp-mm': { title: 'JP → MM', desc: 'See Japanese, pick Myanmar' },
  'audio-jp': { title: '🔊 → JP', desc: 'Hear audio, pick the word' },
};

const QUESTION_COUNTS = [10, 20, 50];

// --- SPEECH UTILITY ---
const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

// --- Shuffle utility ---
const shuffle = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- Generate quiz questions ---
const generateQuestions = (
  sourceWords: VocabularyProps[],
  allWords: VocabularyProps[],
  mode: QuizMode,
  count: number
): QuizQuestion[] => {
  const selected = shuffle(sourceWords).slice(0, count);

  return selected.map((word) => {
    // Get the correct answer and distractors based on mode
    let correctAnswer: string;
    let getOptionText: (w: VocabularyProps) => string;

    switch (mode) {
      case 'jp-en':
        correctAnswer = word.meaning || '';
        getOptionText = (w) => w.meaning || '';
        break;
      case 'en-jp':
        correctAnswer = word.word || '';
        getOptionText = (w) => w.word || '';
        break;
      case 'jp-mm':
        correctAnswer = word.meaning_mm || '';
        getOptionText = (w) => w.meaning_mm || '';
        break;
      case 'audio-jp':
        correctAnswer = word.word || '';
        getOptionText = (w) => w.word || '';
        break;
      default:
        correctAnswer = word.meaning || '';
        getOptionText = (w) => w.meaning || '';
    }

    // Get 3 random distractors (different from correct)
    const distractors = shuffle(
      allWords.filter((w) => getOptionText(w) !== correctAnswer && getOptionText(w))
    )
      .slice(0, 3)
      .map(getOptionText);

    const options = shuffle([correctAnswer, ...distractors]);

    return { word, options, correctAnswer };
  });
};

const VocabularyQuiz = ({ vocab, pageVocab, completedWords, onClose }: VocabularyQuizProps) => {
  // Quiz phases: 'setup' | 'playing' | 'review'
  const [phase, setPhase] = useState<'setup' | 'playing' | 'review'>('setup');
  const [showRomaji, setShowRomaji] = useState<boolean>(false);

  const toggleLocalRomaji = () => setShowRomaji(prev => prev === null ? !showRomaji : !prev);

  // Setup state
  const [config, setConfig] = useState<QuizConfig>({
    mode: 'jp-en',
    questionCount: 10,
    sourceFilter: 'page',
  });

  // Playing state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Incomplete words
  const incompleteVocab = useMemo(
    () => vocab.filter((w) => !completedWords.has(w.word || '')),
    [vocab, completedWords]
  );

  const getSourceWords = useCallback(() => {
    switch (config.sourceFilter) {
      case 'page':
        return pageVocab;
      case 'incomplete':
        return incompleteVocab;
      case 'all':
      default:
        return vocab;
    }
  }, [config.sourceFilter, pageVocab, incompleteVocab, vocab]);

  const availableCount = getSourceWords().length;

  // Start quiz
  const handleStart = () => {
    const source = getSourceWords();
    if (source.length < 4) return; // Need at least 4 words for options
    const count = Math.min(config.questionCount, source.length);
    const q = generateQuestions(source, vocab, config.mode, count);
    setQuestions(q);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setPhase('playing');
  };

  // Auto-play audio for audio mode
  useEffect(() => {
    if (phase === 'playing' && config.mode === 'audio-jp' && questions[currentIndex]) {
      const timer = setTimeout(() => {
        speak(questions[currentIndex].word.word || '');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, currentIndex, config.mode, questions]);

  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return; // Already answered

    const isCorrect = answer === questions[currentIndex].correctAnswer;
    setSelectedAnswer(answer);

    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    setResults((prev) => [
      ...prev,
      { question: questions[currentIndex], selectedAnswer: answer, isCorrect },
    ]);
  };

  // Next question or finish
  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('review');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  };

  // Restart quiz
  const handleRestart = () => {
    setPhase('setup');
    setQuestions([]);
    setResults([]);
    setSelectedAnswer(null);
    setCurrentIndex(0);
  };

  const currentQuestion = questions[currentIndex];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongResults = results.filter((r) => !r.isCorrect);
  const scorePercent = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  // Prevent body scrolling when quiz is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#F5EDED] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5">
          <h2 className="text-xl font-extrabold text-[#3E3636] tracking-tight">
            {phase === 'setup' && '📝 Quiz Setup'}
            {phase === 'playing' && '📝 Vocabulary Quiz'}
            {phase === 'review' && '🏆 Results'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#3E3636]/10 transition-colors"
          >
            <X className="w-5 h-5 text-[#3E3636]" />
          </button>
        </div>

        {/* ======= SETUP PHASE ======= */}
        {phase === 'setup' && (
          <div className="p-6 space-y-6">
            {/* Quiz Mode */}
            <div>
              <label className="block text-sm font-bold text-[#3E3636]/60 mb-2 uppercase tracking-wider">Quiz Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(MODE_LABELS) as QuizMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setConfig((c) => ({ ...c, mode }))}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${config.mode === mode
                      ? 'border-[#D72323] bg-white shadow-md'
                      : 'border-transparent bg-white/60 hover:bg-white/80'
                      }`}
                  >
                    <div className="font-bold text-[#3E3636]">{MODE_LABELS[mode].title}</div>
                    <div className="text-xs text-[#3E3636]/50 mt-0.5">{MODE_LABELS[mode].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-bold text-[#3E3636]/60 mb-2 uppercase tracking-wider">Word Source</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'page' as const, label: `This Page (${pageVocab.length})` },
                  { key: 'incomplete' as const, label: `Not Studied (${incompleteVocab.length})` },
                  { key: 'all' as const, label: `All Words (${vocab.length})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setConfig((c) => ({ ...c, sourceFilter: key }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${config.sourceFilter === key
                      ? 'bg-[#3E3636] text-white'
                      : 'bg-white text-[#3E3636] border border-[#3E3636]/15 hover:border-[#3E3636]/40'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-sm font-bold text-[#3E3636]/60 mb-2 uppercase tracking-wider">Number of Questions</label>
              <div className="flex gap-2 flex-wrap">
                {QUESTION_COUNTS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setConfig((c) => ({ ...c, questionCount: count }))}
                    disabled={count > availableCount}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${config.questionCount === count
                      ? 'bg-[#D72323] text-white shadow-md'
                      : 'bg-white text-[#3E3636] border border-[#3E3636]/15 hover:border-[#D72323]/40'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {count}
                  </button>
                ))}
                <button
                  onClick={() => setConfig((c) => ({ ...c, questionCount: availableCount }))}
                  disabled={availableCount < 4}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${config.questionCount === availableCount && !QUESTION_COUNTS.includes(availableCount)
                    ? 'bg-[#D72323] text-white shadow-md'
                    : 'bg-white text-[#3E3636] border border-[#3E3636]/15 hover:border-[#D72323]/40'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  All ({availableCount})
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={availableCount < 4}
              className="w-full py-4 bg-[#D72323] text-white font-extrabold text-lg rounded-2xl hover:bg-[#b91c1c] transition-all active:scale-[0.98] shadow-lg shadow-[#D72323]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {availableCount < 4 ? 'Need at least 4 words' : 'Start Quiz →'}
            </button>
          </div>
        )}

        {/* ======= PLAYING PHASE ======= */}
        {phase === 'playing' && currentQuestion && (
          <div className="p-6">
            {/* Progress + Streak */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-[#3E3636]/60 font-medium">
                Question <span className="font-bold text-[#3E3636]">{currentIndex + 1}</span>/{questions.length}
              </div>
              {streak > 1 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold animate-bounce">
                  <Flame className="w-4 h-4" />
                  {streak} streak!
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#3E3636]/10 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-[#D72323] rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl p-8 text-center border border-black/5 shadow-sm mb-6">
              {config.mode === 'audio-jp' ? (
                <button
                  onClick={() => speak(currentQuestion.word.word || '')}
                  className="mx-auto p-6 rounded-full bg-[#D72323]/10 hover:bg-[#D72323]/20 transition-colors"
                >
                  <Volume2 className="w-12 h-12 text-[#D72323]" />
                </button>
              ) : (
                <div>
                  {(config.mode === 'jp-en' || config.mode === 'jp-mm') && (
                    <>
                      <p className="text-5xl font-bold text-[#3E3636] mb-2">{currentQuestion.word.word}</p>
                      {/* <p className="text-sm text-[#3E3636]/40">{currentQuestion.word.spelling}</p> */}
                      <div className="flex items-center justify-center gap-x-2">
                        {/* Conditional rendering for the romaji */}
                        {showRomaji ? (
                          <p className="text-md text-[#D72323] font-bold tracking-wider">{currentQuestion.word.spelling}</p>
                        ) : (
                          <p className="text-md text-gray-400 font-bold tracking-wider italic">Romaji hidden</p>
                        )}

                        {/* Toggle Button */}
                        <button
                          onClick={toggleLocalRomaji}
                          className="text-gray-400 hover:text-[#3E3636] transition-colors"
                          title={showRomaji ? "Hide Romaji" : "Show Romaji"}
                        >
                          {showRomaji ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </>
                  )}
                  {config.mode === 'en-jp' && (
                    <p className="text-2xl font-bold text-[#3E3636]">{currentQuestion.word.meaning}</p>
                  )}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, idx) => {
                let btnClass = 'bg-white border-2 border-[#3E3636]/10 hover:border-[#D72323]/50 text-[#3E3636]';

                if (selectedAnswer) {
                  if (option === currentQuestion.correctAnswer) {
                    btnClass = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-700';
                  } else if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
                    btnClass = 'bg-red-50 border-2 border-red-400 text-red-600';
                  } else {
                    btnClass = 'bg-white/50 border-2 border-[#3E3636]/5 text-[#3E3636]/40';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={`p-4 rounded-xl text-left font-medium text-lg transition-all ${btnClass} disabled:cursor-default`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#3E3636]/5 flex items-center justify-center text-sm font-bold text-[#3E3636]/40 flex-shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                      {selectedAnswer && option === currentQuestion.correctAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />
                      )}
                      {selectedAnswer && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                        <XCircle className="w-5 h-5 text-red-400 ml-auto flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback + Next */}
            {selectedAnswer && (
              <div className="mt-6 flex items-center justify-between">
                <div className={`text-sm font-bold ${selectedAnswer === currentQuestion.correctAnswer ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                  {selectedAnswer === currentQuestion.correctAnswer
                    ? '✓ Correct!'
                    : `✗ The answer was: ${currentQuestion.correctAnswer}`}
                </div>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-[#3E3636] text-white rounded-xl font-bold hover:bg-[#3E3636]/80 transition-all active:scale-95"
                >
                  {currentIndex + 1 >= questions.length ? 'See Results' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======= REVIEW PHASE ======= */}
        {phase === 'review' && (
          <div className="p-6 space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-2xl p-8 text-center border border-black/5 shadow-sm">
              <Trophy className={`w-16 h-16 mx-auto mb-4 ${scorePercent >= 80 ? 'text-yellow-500' : scorePercent >= 50 ? 'text-[#3E3636]/40' : 'text-red-400'
                }`} />
              <div className="text-6xl font-extrabold text-[#3E3636] mb-1">{scorePercent}%</div>
              <div className="text-lg text-[#3E3636]/60">
                {correctCount} of {results.length} correct
              </div>
              {bestStreak > 1 && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
                  <Flame className="w-4 h-4" />
                  Best streak: {bestStreak}
                </div>
              )}
              <div className="mt-4 text-sm text-[#3E3636]/50">
                {scorePercent === 100 && '🎉 Perfect score! You\'re amazing!'}
                {scorePercent >= 80 && scorePercent < 100 && '🌟 Great job! Almost perfect!'}
                {scorePercent >= 50 && scorePercent < 80 && '💪 Good effort! Keep practicing!'}
                {scorePercent < 50 && '📚 Keep studying, you\'ll get there!'}
              </div>
            </div>

            {/* Wrong Answers Review */}
            {wrongResults.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#3E3636]/60 uppercase tracking-wider mb-3">
                  Review incorrect ({wrongResults.length})
                </h3>
                <div className="space-y-2">
                  {wrongResults.map((r, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 border border-red-100 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#3E3636] truncate">{r.question.word.word}</p>
                        <p className="text-xs text-[#3E3636]/50">{r.question.word.spelling}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-red-400 line-through">{r.selectedAnswer}</p>
                        <p className="text-sm font-bold text-emerald-600">{r.question.correctAnswer}</p>
                      </div>
                      <button
                        onClick={() => speak(r.question.word.word || '')}
                        className="p-2 rounded-full hover:bg-[#F5EDED] transition-colors flex-shrink-0"
                      >
                        <Volume2 className="w-4 h-4 text-[#3E3636]/50" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#3E3636]/15 text-[#3E3636] rounded-xl font-bold hover:border-[#3E3636]/30 transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                New Quiz
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-[#3E3636] text-white rounded-xl font-bold hover:bg-[#3E3636]/80 transition-all active:scale-[0.98]"
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

export default VocabularyQuiz;
