'use client';
import { KanjiProps } from "@/types";
import { Volume2, Lightbulb, Layers, PenLine, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface KanjiCardProps {
  key: string | null;
  item: KanjiProps;
}

// --- SPEECH UTILITY ---
const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

const KanjiCard = ({ item }: KanjiCardProps) => {
  const [showMnemonic, setShowMnemonic] = useState(false);

  return (
    <div className="bg-white/80 p-5 rounded-2xl border border-black/5 flex flex-col justify-between gap-3">
      {/* Header: kanji + stroke count + audio */}
      <div className="flex justify-between items-start">
        <h3 className="text-7xl font-bold text-[#3E3636] leading-none">{item.word}</h3>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="text-xs text-[#3E3636]/60 font-medium">{item.strokes} strokes</div>
          <button
            onClick={() => speak(item.word_kana || item.word || '')}
            className="p-2 rounded-full bg-[#F5EDED] hover:bg-[#D72323] text-[#3E3636] hover:text-white transition-all duration-300"
            title="Pronounce"
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Readings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="block text-[10px] font-bold text-[#D72323] uppercase tracking-wider">On&apos;yomi</span>
          <p className="text-sm text-[#3E3636] font-medium">{item.onyomi || '—'}</p>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-[#D72323] uppercase tracking-wider">Kun&apos;yomi</span>
          <p className="text-sm text-[#3E3636] font-medium">{item.kunyomi || '—'}</p>
        </div>
      </div>

      {/* Meanings */}
      <div className="border-t border-black/8 pt-3 space-y-1">
        <div>
          <span className="block text-[10px] font-bold text-[#3E3636]/40 uppercase">ENG</span>
          <p className="text-sm text-[#3E3636]/90 font-medium">{item.meaning}</p>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-[#3E3636]/40 uppercase">MM</span>
          <p className="text-sm text-[#3E3636]/90">{item.meaning_mm}</p>
        </div>
      </div>

      {/* Examples — show up to 2 */}
      {item.examples && item.examples.length > 0 ? (
        <div className="border-t border-black/8 pt-3">
          <span className="block text-[10px] font-bold text-[#3E3636]/40 uppercase mb-2">Examples</span>
          <div className="space-y-2">
            {item.examples.slice(0, 2).map((ex, i) => (
              <div key={i} className="flex items-center justify-between bg-[#F5EDED]/60 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-bold text-[#3E3636]">{ex.japanese}</p>
                  <p className="text-[10px] text-[#D72323] font-medium">{ex.reading}</p>
                  <p className="text-[10px] text-[#3E3636]/60">{ex.meaning_en}</p>
                </div>
                <button
                  onClick={() => speak(ex.japanese || '')}
                  className="p-1.5 rounded-full hover:bg-[#D72323]/20 transition-colors ml-2 flex-shrink-0"
                  title="Pronounce"
                >
                  <Volume2 className="h-4 w-4 text-[#3E3636]/50" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Fallback to old single-example layout if no examples[] yet */
        <div className="border-t border-black/8 pt-3">
          <span className="block text-[10px] font-bold text-[#3E3636]/40 uppercase">Example</span>
          <p className="text-xs text-[#D72323] font-bold tracking-wider">{item.word_rmj}</p>
          <p className="text-lg font-bold text-[#3E3636]">{item.word_kana}</p>
        </div>
      )}

      {/* Stroke hint (if available) */}
      {item.stroke_hint && (
        <div className="flex items-start gap-2 bg-[#F5EDED]/40 rounded-lg p-3 border border-black/5">
          <PenLine className="h-3.5 w-3.5 text-[#3E3636]/40 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-[#3E3636]/60 leading-relaxed">{item.stroke_hint}</p>
        </div>
      )}

      {/* Radical (if available) */}
      {item.radical && (
        <div className="flex items-start gap-2 bg-blue-50/60 rounded-lg p-3 border border-blue-100/50">
          <Layers className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-blue-700/80 leading-relaxed">{item.radical}</p>
        </div>
      )}

      {/* Mnemonic — collapsible */}
      {item.mnemonic && (
        <div>
          <button
            onClick={() => setShowMnemonic(prev => !prev)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Memory trick
            {showMnemonic
              ? <ChevronUp className="h-3 w-3" />
              : <ChevronDown className="h-3 w-3" />
            }
          </button>
          {showMnemonic && (
            <div className="mt-2 bg-amber-50/60 rounded-lg p-3 border border-amber-100/60">
              <p className="text-[11px] text-amber-800 leading-relaxed italic">{item.mnemonic}</p>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="border-t border-black/8 pt-3">
          <span className="block text-[10px] font-bold text-[#3E3636]/40 uppercase mb-1">Note</span>
          <p className="text-[11px] text-[#3E3636]/60 leading-relaxed">{item.description}</p>
        </div>
      )}
    </div>
  );
};

export default KanjiCard;
