import {Volume2, Eye, EyeOff, Check} from "lucide-react";
import React, {useState} from "react";
import {VocabularyProps} from "@/types";

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

// --- SPEECH UTILITY ---
const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }
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
  // Per-card override: null means "follow global", true/false means "locally overridden"
  const [localRomaji, setLocalRomaji] = useState<boolean | null>(null);
  const [localEnglish, setLocalEnglish] = useState<boolean | null>(null);
  const [localMyanmar, setLocalMyanmar] = useState<boolean | null>(null);

  // Effective visibility: local override wins, otherwise follow global
  const showRomaji = localRomaji !== null ? localRomaji : globalShowRomaji;
  const showEnglish = localEnglish !== null ? localEnglish : globalShowEnglish;
  const showMyanmar = localMyanmar !== null ? localMyanmar : globalShowMyanmar;

  // When user clicks per-card toggle, toggle local override
  const toggleLocalRomaji = () => setLocalRomaji(prev => prev === null ? !globalShowRomaji : !prev);
  const toggleLocalEnglish = () => setLocalEnglish(prev => prev === null ? !globalShowEnglish : !prev);
  const toggleLocalMyanmar = () => setLocalMyanmar(prev => prev === null ? !globalShowMyanmar : !prev);

  return (
    <div className={`p-6 rounded-2xl border-2 flex items-center justify-between relative transition-all duration-300 ${
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

      <div className="w-full pr-8">
        <div className={'flex-auto'}>
          {/* Container for Romaji and Toggle Button */}
          <div className="flex items-center gap-x-2">
            {/* Conditional rendering for the romaji */}
            {showRomaji ? (
              <p className="text-xs text-[#D72323] font-bold tracking-wider">{item.spelling}</p>
            ) : (
              <p className="text-xs text-gray-400 font-bold tracking-wider italic">Romaji hidden</p>
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

          <h3 className={`text-3xl font-bold mt-1 transition-colors ${
            isCompleted ? 'text-emerald-700' : 'text-[#3E3636]'
          }`}>{item.word}</h3>
        </div>
        <div className={`mt-3 space-y-2 flex-auto border-l-2 pl-3 ${
          isCompleted ? 'border-emerald-400/50' : 'border-[#D72323]/50'
        }`}>
          <div>
            <span className="block text-xs font-bold text-[#3E3636]/50">English</span>
            {showEnglish ? (
              <p className="text-md text-[#3E3636]/90">{item.meaning}</p>
            ) : (
              <p className="text-xs text-gray-400 font-bold tracking-wider italic">English hidden</p>
            )}
            {/* Toggle Button */}
            <button
              onClick={toggleLocalEnglish}
              className="text-gray-400 hover:text-[#3E3636] transition-colors"
              title={showEnglish ? "Hide English" : "Show English"}
            >
              {showEnglish ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div>
            <span className="block text-xs font-bold text-[#3E3636]/50">Myanmar</span>
            {showMyanmar ? (

              <p className="text-md text-[#3E3636]/90">{item.meaning_mm}</p>
            ) : (
              <p className="text-xs text-gray-400 font-bold tracking-wider italic">Myanmar hidden</p>
            )}
            {/* Toggle Button */}
            <button
              onClick={toggleLocalMyanmar}
              className="text-gray-400 hover:text-[#3E3636] transition-colors"
              title={showMyanmar ? "Hide Myanmar" : "Show Myanmar"}
            >
              {showMyanmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      <button
        onClick={() => speak(item.word || '')}
        className={`p-4 rounded-full hover:bg-[#D72323] hover:text-white transition-all duration-300 self-start ml-4 ${
          isCompleted
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-[#F5EDED] text-[#3E3636]'
        }`}>
        <Volume2 className="h-6 w-6" />
      </button>
    </div>
  );
}

export default VocabularyCard;