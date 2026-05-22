'use client'
import type { VocabularyProps } from "@/types";
import type { QuizConfig, QuizMode } from "./types";
import { MODE_LABELS, QUESTION_COUNTS } from "./types";

interface QuizSetupProps {
  config: QuizConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuizConfig>>;
  pageVocab: VocabularyProps[];
  incompleteVocab: VocabularyProps[];
  completedVocab: VocabularyProps[];
  vocab: VocabularyProps[];
  availableCount: number;
  onStart: () => void;
}

export default function QuizSetup({
  config,
  setConfig,
  pageVocab,
  incompleteVocab,
  completedVocab,
  vocab,
  availableCount,
  onStart,
}: QuizSetupProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-bold text-[#1F150C]/60 mb-2 uppercase tracking-wider">Quiz Mode</label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(MODE_LABELS) as QuizMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setConfig((c) => ({ ...c, mode }))}
              className={`p-4 rounded-xl text-left border-2 transition-all ${config.mode === mode
                ? 'border-[#412D15] bg-white shadow-md'
                : 'border-transparent bg-white/60 hover:bg-white/80'
                }`}
            >
              <div className="font-bold text-[#1F150C]">{MODE_LABELS[mode].title}</div>
              <div className="text-xs text-[#1F150C]/50 mt-0.5">{MODE_LABELS[mode].desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-[#1F150C]/60 mb-2 uppercase tracking-wider">Word Source</label>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'page' as const, label: `This Page (${pageVocab.length})` },
            { key: 'incomplete' as const, label: `Not Studied (${incompleteVocab.length})` },
            { key: 'completed' as const, label: `Studied (${completedVocab.length})` },
            { key: 'all' as const, label: `All Words (${vocab.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setConfig((c) => ({ ...c, sourceFilter: key }))}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${config.sourceFilter === key
                ? 'bg-[#1F150C] text-white'
                : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#1F150C]/40'
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
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => setConfig((c) => ({ ...c, questionCount: count }))}
              disabled={count > availableCount}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${config.questionCount === count
                ? 'bg-[#412D15] text-white shadow-md'
                : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#412D15]/40'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {count}
            </button>
          ))}
          <button
            onClick={() => setConfig((c) => ({ ...c, questionCount: availableCount }))}
            disabled={availableCount < 4}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${config.questionCount === availableCount && !QUESTION_COUNTS.includes(availableCount)
              ? 'bg-[#412D15] text-white shadow-md'
              : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#412D15]/40'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            All ({availableCount})
          </button>
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={availableCount < 4}
        className="w-full py-4 bg-[#412D15] text-white font-extrabold text-lg rounded-2xl hover:bg-[#000000] transition-all active:scale-[0.98] shadow-lg shadow-[#412D15]/30 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {availableCount < 4 ? 'Need at least 4 words' : 'Start Quiz →'}
      </button>
    </div>
  );
}
