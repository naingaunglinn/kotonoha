'use client';
import { Volume2, Eye, EyeOff, Check } from "lucide-react";
import React, { useState } from "react";
import { VocabularyProps, PartOfSpeech } from "@/types";

interface VocabularyCardProps {
  key: number | null;
  item: VocabularyProps;
  label?: number;
  isCompleted?: boolean;
  onToggleComplete?: (word: string) => void;
  globalShowRomaji?: boolean;
  globalShowEnglish?: boolean;
  globalShowMyanmar?: boolean;
}

// --- POS badge color map ---
const POS_COLORS: Record<PartOfSpeech, string> = {
  Noun:       'bg-blue-100 text-blue-700',
  Verb:       'bg-green-100 text-green-700',
  Adjective:  'bg-purple-100 text-purple-700',
  Adverb:     'bg-amber-100 text-amber-700',
  Particle:   'bg-rose-100 text-rose-700',
  Expression: 'bg-teal-100 text-teal-700',
};

const FORMALITY_COLORS: Record<string, string> = {
  Formal:  'bg-slate-100 text-slate-600',
  Casual:  'bg-orange-100 text-orange-600',
  Neutral: 'bg-gray-100 text-gray-500',
};

// --- SPEECH UTILITY ---
const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

const VocabularyCard = ({
  item,
  label,
  isCompleted = false,
  onToggleComplete,
  globalShowRomaji = false,
  globalShowEnglish = false,
  globalShowMyanmar = false,
}: VocabularyCardProps) => {
  const [localRomaji, setLocalRomaji] = useState<boolean | null>(null);
  const [localEnglish, setLocalEnglish] = useState<boolean | null>(null);
  const [localMyanmar, setLocalMyanmar] = useState<boolean | null>(null);
  const [showExample, setShowExample] = useState(false);

  const showRomaji  = localRomaji  !== null ? localRomaji  : globalShowRomaji;
  const showEnglish = localEnglish !== null ? localEnglish : globalShowEnglish;
  const showMyanmar = localMyanmar !== null ? localMyanmar : globalShowMyanmar;

  const toggleLocalRomaji  = () => setLocalRomaji(prev  => prev === null ? !globalShowRomaji  : !prev);
  const toggleLocalEnglish = () => setLocalEnglish(prev => prev === null ? !globalShowEnglish : !prev);
  const toggleLocalMyanmar = () => setLocalMyanmar(prev => prev === null ? !globalShowMyanmar : !prev);

  const hasExample = !!(item.example_jp);

  return (
    <div className={`p-5 rounded-2xl border-2 flex flex-col relative transition-all duration-300 ${
      isCompleted
        ? 'bg-emerald-50/80 border-emerald-400/50'
        : 'bg-white/80 border-black/5'
    }`}>
      {/* Label Number Badge */}
      {label !== undefined && (
        <span className={`absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md transition-colors ${
          isCompleted ? 'bg-emerald-500' : 'bg-[#3E3636]'
        }`}>
          {isCompleted ? <Check className="w-4 h-4" /> : label}
        </span>
      )}

      {/* Completed Toggle — top-right */}
      {onToggleComplete && (
        <button
          onClick={() => onToggleComplete(item.word || '')}
          className={`absolute top-3 right-3 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white scale-110'
              : 'border-[#3E3636]/20 text-transparent hover:border-emerald-400 hover:text-emerald-400'
          }`}
          title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
        >
          <Check className="w-4 h-4" />
        </button>
      )}

      {/* Top row: badges + audio */}
      <div className="flex items-center justify-between mb-2 pr-8">
        <div className="flex flex-wrap gap-1.5">
          {item.part_of_speech && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${POS_COLORS[item.part_of_speech]}`}>
              {item.part_of_speech}
            </span>
          )}
          {item.tag && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              item.tag === 'Core' ? 'bg-[#D72323]/10 text-[#D72323]' : 'bg-[#3E3636]/10 text-[#3E3636]/70'
            }`}>
              {item.tag}
            </span>
          )}
          {item.formality && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${FORMALITY_COLORS[item.formality]}`}>
              {item.formality}
            </span>
          )}
        </div>
      </div>

      {/* Main content row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Romaji */}
          <div className="flex items-center gap-x-2">
            {showRomaji ? (
              <p className="text-xs text-[#D72323] font-bold tracking-wider">{item.spelling}</p>
            ) : (
              <p className="text-xs text-gray-400 font-bold tracking-wider italic">Romaji hidden</p>
            )}
            <button
              onClick={toggleLocalRomaji}
              className="text-gray-400 hover:text-[#3E3636] transition-colors"
              title={showRomaji ? "Hide Romaji" : "Show Romaji"}
            >
              {showRomaji ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Word */}
          <h3 className={`text-3xl font-bold mt-1 transition-colors leading-tight ${
            isCompleted ? 'text-emerald-700' : 'text-[#3E3636]'
          }`}>{item.word}</h3>

          {/* Meanings */}
          <div className={`mt-3 space-y-1.5 border-l-2 pl-3 ${
            isCompleted ? 'border-emerald-400/50' : 'border-[#D72323]/50'
          }`}>
            <div>
              <span className="block text-xs font-bold text-[#3E3636]/50">English</span>
              {showEnglish ? (
                <p className="text-sm text-[#3E3636]/90">{item.meaning}</p>
              ) : (
                <p className="text-xs text-gray-400 font-bold tracking-wider italic">hidden</p>
              )}
              <button
                onClick={toggleLocalEnglish}
                className="text-gray-400 hover:text-[#3E3636] transition-colors"
                title={showEnglish ? "Hide English" : "Show English"}
              >
                {showEnglish ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#3E3636]/50">Myanmar</span>
              {showMyanmar ? (
                <p className="text-sm text-[#3E3636]/90">{item.meaning_mm}</p>
              ) : (
                <p className="text-xs text-gray-400 font-bold tracking-wider italic">hidden</p>
              )}
              <button
                onClick={toggleLocalMyanmar}
                className="text-gray-400 hover:text-[#3E3636] transition-colors"
                title={showMyanmar ? "Hide Myanmar" : "Show Myanmar"}
              >
                {showMyanmar ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Audio button */}
        <button
          onClick={() => speak(item.word || '')}
          className={`p-3 rounded-full hover:bg-[#D72323] hover:text-white transition-all duration-300 ml-3 flex-shrink-0 ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-[#F5EDED] text-[#3E3636]'
          }`}
        >
          <Volume2 className="h-5 w-5" />
        </button>
      </div>

      {/* Example sentence section */}
      {hasExample && (
        <div className="mt-3 border-t border-black/5 pt-3">
          <button
            onClick={() => setShowExample(prev => !prev)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#3E3636]/50 hover:text-[#D72323] transition-colors"
          >
            {showExample ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Example sentence
          </button>

          {showExample && (
            <div className="mt-2 bg-[#F5EDED]/60 rounded-lg p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-[#3E3636] leading-snug flex-1">
                  {item.example_jp}
                </p>
                <button
                  onClick={() => speak(item.example_jp || '')}
                  className="p-1.5 rounded-full bg-white hover:bg-[#D72323] text-[#3E3636] hover:text-white transition-all flex-shrink-0"
                  title="Play example"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {showEnglish && item.example_en && (
                <p className="text-xs text-[#3E3636]/70">
                  <span className="font-bold text-[#3E3636]/40">EN: </span>{item.example_en}
                </p>
              )}
              {showMyanmar && item.example_mm && (
                <p className="text-xs text-[#3E3636]/70">
                  <span className="font-bold text-[#3E3636]/40">MM: </span>{item.example_mm}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabularyCard;
