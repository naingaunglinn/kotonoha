'use client'
import { useState, useEffect } from 'react';
import type { VocabularyProps } from "@/types";
import type { QuizConfig, QuizQuestion } from "./types";
import { speak, findVocabByString } from "./utils";
import { Volume2, ChevronRight, Flame, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

interface QuizGameProps {
  questions: QuizQuestion[];
  currentIndex: number;
  selectedAnswer: string | null;
  streak: number;
  config: QuizConfig;
  vocab: VocabularyProps[];
  onSelectAnswer: (answer: string) => void;
  onNext: () => void;
}

export default function QuizGame({
  questions,
  currentIndex,
  selectedAnswer,
  streak,
  config,
  vocab,
  onSelectAnswer,
  onNext,
}: QuizGameProps) {
  const [showRomaji, setShowRomaji] = useState(false);
  const toggleLocalRomaji = () => setShowRomaji(prev => !prev);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (config.mode === 'audio-jp' && currentQuestion) {
      const timer = setTimeout(() => {
        speak(currentQuestion.word.word || '');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, config.mode, currentQuestion]);

  if (!currentQuestion) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-[#3E3636]/60 font-medium">
          Question <span className="font-bold text-[#3E3636]">{currentIndex + 1}</span>/{questions.length}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[10px] text-[#3E3636]/40 font-medium">
            Tip: press 1–4 · Enter to advance
          </span>
          {streak > 1 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold animate-bounce">
              <Flame className="w-4 h-4" />
              {streak} streak!
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-2 bg-[#3E3636]/10 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-[#D72323] rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

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
                <div className="flex items-center justify-center gap-x-2">
                  {showRomaji ? (
                    <p className="text-md text-[#D72323] font-bold tracking-wider">{currentQuestion.word.spelling}</p>
                  ) : (
                    <p className="text-md text-gray-400 font-bold tracking-wider italic">Romaji hidden</p>
                  )}
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
              onClick={() => onSelectAnswer(option)}
              disabled={selectedAnswer !== null}
              className={`p-4 rounded-xl text-left font-medium text-lg transition-all ${btnClass} disabled:cursor-default`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#3E3636]/5 flex items-center justify-center text-sm font-bold text-[#3E3636]/40 flex-shrink-0">
                  {idx + 1}
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

      {selectedAnswer && (
        <div className="mt-6 bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`text-sm font-bold flex items-center gap-2 ${selectedAnswer === currentQuestion.correctAnswer ? 'text-emerald-600' : 'text-red-500'
                }`}>
                {selectedAnswer === currentQuestion.correctAnswer ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {selectedAnswer === currentQuestion.correctAnswer
                  ? 'Correct!'
                  : `The answer was: ${currentQuestion.correctAnswer}`}
              </div>
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3E3636] text-white rounded-xl font-bold hover:bg-[#3E3636]/80 transition-all active:scale-95 shadow-md shadow-black/10"
              >
                {currentIndex + 1 >= questions.length ? 'Results' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-400 font-bold uppercase mb-1 tracking-wider">English</p>
                <p className="text-sm font-extrabold text-blue-800 leading-tight">{currentQuestion.word.meaning}</p>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1 tracking-wider">Myanmar</p>
                <p className="text-sm font-extrabold text-emerald-800 leading-tight">{currentQuestion.word.meaning_mm}</p>
              </div>
            </div>

            {selectedAnswer !== currentQuestion.correctAnswer && (() => {
              const wrongWord = findVocabByString(selectedAnswer, vocab, config.mode);
              if (!wrongWord) return null;
              return (
                <div className="p-3 bg-red-50/30 rounded-xl border border-red-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-red-400 font-bold uppercase mb-1 tracking-wider">Your choice: {selectedAnswer}</p>
                    <p className="text-xs text-red-800 font-bold truncate">
                      {wrongWord.meaning} • {wrongWord.meaning_mm}
                    </p>
                  </div>
                  <button
                    onClick={() => speak(wrongWord.word || '')}
                    className="p-2 rounded-full bg-red-100/50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
