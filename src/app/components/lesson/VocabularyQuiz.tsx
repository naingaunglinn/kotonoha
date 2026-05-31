'use client'
import { useState, useMemo, useCallback, useEffect } from 'react';
import { VocabularyProps } from '@/types';
import { X } from 'lucide-react';
import QuizSetup from './quiz/QuizSetup';
import QuizGame from './quiz/QuizGame';
import QuizResults from './quiz/QuizResults';
import type { QuizConfig, QuizQuestion, QuizResult } from './quiz/types';
import { generateQuestions } from './quiz/utils';
import { useQuizKeyboard } from './quiz/useQuizKeyboard';

interface VocabularyQuizProps {
  vocab: VocabularyProps[];
  pageVocab: VocabularyProps[];
  completedWords: Set<string>;
  onClose: () => void;
}

type QuizPhase = 'setup' | 'playing' | 'review';

const VocabularyQuiz = ({ vocab, pageVocab, completedWords, onClose }: VocabularyQuizProps) => {
  const [phase, setPhase] = useState<QuizPhase>('setup');

  const [config, setConfig] = useState<QuizConfig>({
    mode: 'jp-en',
    questionCount: 10,
    sourceFilter: 'page',
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const incompleteVocab = useMemo(
    () => vocab.filter((w) => !completedWords.has(w.word || '')),
    [vocab, completedWords]
  );

  const completedVocab = useMemo(
    () => vocab.filter((w) => completedWords.has(w.word || '')),
    [vocab, completedWords]
  );

  const getSourceWords = useCallback(() => {
    switch (config.sourceFilter) {
      case 'page': return pageVocab;
      case 'incomplete': return incompleteVocab;
      case 'completed': return completedVocab;
      case 'all':
      default: return vocab;
    }
  }, [config.sourceFilter, pageVocab, incompleteVocab, completedVocab, vocab]);

  const availableCount = getSourceWords().length;

  const handleStart = () => {
    const source = getSourceWords();
    if (source.length < 4) return;
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

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useQuizKeyboard({
    active: phase === 'playing',
    options: questions[currentIndex]?.options,
    hasAnswered: selectedAnswer !== null,
    onSelect: handleSelectAnswer,
    onNext: handleNext,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#f0ede6] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-y-auto">

        <div className="flex items-center justify-between p-5 border-b border-black/5">
          <h2 className="text-xl font-extrabold text-[#1a1a2e] tracking-tight">
            {phase === 'setup' && '📝 Quiz Setup'}
            {phase === 'playing' && '📝 Vocabulary Quiz'}
            {phase === 'review' && '🏆 Results'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#1a1a2e]/10 transition-colors"
          >
            <X className="w-5 h-5 text-[#1a1a2e]" />
          </button>
        </div>

        {phase === 'setup' && (
          <QuizSetup
            config={config}
            setConfig={setConfig}
            pageVocab={pageVocab}
            incompleteVocab={incompleteVocab}
            completedVocab={completedVocab}
            vocab={vocab}
            availableCount={availableCount}
            onStart={handleStart}
          />
        )}

        {phase === 'playing' && (
          <QuizGame
            questions={questions}
            currentIndex={currentIndex}
            selectedAnswer={selectedAnswer}
            streak={streak}
            config={config}
            vocab={vocab}
            onSelectAnswer={handleSelectAnswer}
            onNext={handleNext}
          />
        )}

        {phase === 'review' && (
          <QuizResults
            results={results}
            bestStreak={bestStreak}
            config={config}
            vocab={vocab}
            onRestart={handleRestart}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default VocabularyQuiz;
