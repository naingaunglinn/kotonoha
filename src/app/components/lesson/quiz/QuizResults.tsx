'use client'
import type { VocabularyProps } from "@/types";
import type { QuizConfig, QuizResult } from "./types";
import { speak, findVocabByString } from "./utils";
import { Volume2, RotateCcw, Trophy, Flame } from 'lucide-react';

interface QuizResultsProps {
  results: QuizResult[];
  bestStreak: number;
  config: QuizConfig;
  vocab: VocabularyProps[];
  onRestart: () => void;
  onClose: () => void;
}

export default function QuizResults({
  results,
  bestStreak,
  config,
  vocab,
  onRestart,
  onClose,
}: QuizResultsProps) {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongResults = results.filter((r) => !r.isCorrect);
  const scorePercent = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl p-8 text-center border border-black/5 shadow-sm">
        <Trophy className={`w-16 h-16 mx-auto mb-4 ${scorePercent >= 80 ? 'text-yellow-500' : scorePercent >= 50 ? 'text-[#1F150C]/40' : 'text-red-400'
          }`} />
        <div className="text-6xl font-extrabold text-[#1F150C] mb-1">{scorePercent}%</div>
        <div className="text-lg text-[#1F150C]/60">
          {correctCount} of {results.length} correct
        </div>
        {bestStreak > 1 && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
            <Flame className="w-4 h-4" />
            Best streak: {bestStreak}
          </div>
        )}
        <div className="mt-4 text-sm text-[#1F150C]/50">
          {scorePercent === 100 && '🎉 Perfect score! You\'re amazing!'}
          {scorePercent >= 80 && scorePercent < 100 && '🌟 Great job! Almost perfect!'}
          {scorePercent >= 50 && scorePercent < 80 && '💪 Good effort! Keep practicing!'}
          {scorePercent < 50 && '📚 Keep studying, you\'ll get there!'}
        </div>
      </div>

      {wrongResults.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#1F150C]/60 uppercase tracking-wider mb-3 font-outfit">
            Review incorrect ({wrongResults.length})
          </h3>
          <div className="space-y-4">
            {wrongResults.map((r, idx) => {
              const wrongWord = findVocabByString(r.selectedAnswer, vocab, config.mode);
              return (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-red-100 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-[#1F150C] mb-1">{r.question.word.word}</p>
                    <p className="text-[11px] text-[#1F150C]/40 font-bold uppercase tracking-widest mb-3">{r.question.word.spelling}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[11px] px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-extrabold border border-blue-100 shadow-sm">
                        {r.question.word.meaning}
                      </span>
                      <span className="text-[11px] px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-extrabold border border-emerald-100 shadow-sm">
                        {r.question.word.meaning_mm}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-tighter leading-none mb-1">You picked</p>
                      <p className="text-sm text-red-500 font-bold line-through">{r.selectedAnswer}</p>
                      {wrongWord && (
                        <p className="text-[10px] text-red-400 italic">({wrongWord.meaning})</p>
                      )}
                    </div>

                    <div className="text-right pt-2 border-t border-black/5 w-full">
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter leading-none mb-1">Correct</p>
                      <p className="text-md font-black text-emerald-600">{r.question.correctAnswer}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => speak(r.question.word.word || '')}
                    className="p-3 rounded-full bg-[#E1DCC9] hover:bg-[#412D15]/10 text-gray-400 hover:text-[#412D15] transition-all flex-shrink-0"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#1F150C]/15 text-[#1F150C] rounded-xl font-bold hover:border-[#1F150C]/30 transition-all active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4" />
          New Quiz
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-[#1F150C] text-white rounded-xl font-bold hover:bg-[#1F150C]/80 transition-all active:scale-[0.98]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
