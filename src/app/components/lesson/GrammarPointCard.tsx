'use client';
import { GrammarProps } from "@/types";
import { Volume2, AlertTriangle, GraduationCap, Table } from "lucide-react";
import { useState } from "react";

interface GrammarPointCardProps {
  key: number | null;
  item: GrammarProps;
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

const GrammarPointCard = ({ item }: GrammarPointCardProps) => {
  const [showConjugation, setShowConjugation] = useState(false);

  return (
    <div className="col-span-3 bg-white/80 p-6 rounded-2xl border border-black/5">
      {/* Title Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#3E3636]">{item.title}</h3>
          <p className="text-md text-[#3E3636]/70">{item.title_mm}</p>
        </div>
        <button
          onClick={() => speak(item.title || '')}
          className="p-3 rounded-full bg-[#F5EDED] hover:bg-[#D72323] text-[#3E3636] hover:text-white transition-all duration-300 flex-shrink-0"
        >
          <Volume2 className="h-5 w-5" />
        </button>
      </div>

      {/* Explanations */}
      <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
        <div className="mb-4 border-l-4 border-[#D72323] pl-4">
          <span className="block text-xs font-bold text-[#3E3636]/50">ENGLISH</span>
          <p className="text-[#3E3636]/80 text-sm leading-relaxed">{item.explanation_en}</p>
        </div>
        <div className="mb-4 border-l-4 border-[#D72323] pl-4">
          <span className="block text-xs font-bold text-[#3E3636]/50">MYANMAR</span>
          <p className="text-[#3E3636]/80 text-sm leading-relaxed">{item.explanation_mm}</p>
        </div>
      </div>

      {/* Conjugation Table (collapsible) */}
      {item.conjugation_table && item.conjugation_table.length > 0 && (
        <div className="mt-2 border-t border-black/10 pt-4">
          <button
            onClick={() => setShowConjugation(prev => !prev)}
            className="flex items-center gap-2 text-sm font-bold text-[#3E3636]/70 hover:text-[#D72323] transition-colors"
          >
            <Table className="h-4 w-4" />
            Conjugation / Pattern Forms
            <span className="text-[#3E3636]/30 text-xs">{showConjugation ? '▲' : '▼'}</span>
          </button>

          {showConjugation && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#3E3636]/5">
                    <th className="text-left px-3 py-2 text-xs font-bold text-[#3E3636]/50 border border-black/8 w-1/4">Form</th>
                    <th className="text-left px-3 py-2 text-xs font-bold text-[#3E3636]/50 border border-black/8 w-1/3">Pattern</th>
                    <th className="text-left px-3 py-2 text-xs font-bold text-[#3E3636]/50 border border-black/8">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {item.conjugation_table.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5EDED]/40'}>
                      <td className="px-3 py-2 text-xs font-bold text-[#3E3636]/70 border border-black/8">{row.form}</td>
                      <td className="px-3 py-2 font-bold text-[#D72323] border border-black/8">{row.japanese}</td>
                      <td className="px-3 py-2 text-[#3E3636]/70 border border-black/8 flex items-center gap-2">
                        <span>{row.example ?? '—'}</span>
                        {row.example && (
                          <button
                            onClick={() => speak(row.example!)}
                            className="p-1 rounded-full hover:bg-[#D72323]/10 transition-colors"
                          >
                            <Volume2 className="h-3 w-3 text-[#3E3636]/40" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Examples Section */}
      <div className="mt-4 space-y-4 border-t border-black/10 pt-4">
        <h4 className="font-bold text-[#3E3636]">Examples</h4>
        {item.examples.map((ex, index) => (
          <div key={index} className="bg-[#F5EDED]/80 p-4 rounded-lg">
            <div className="flex items-center">
              <p className="font-bold text-lg text-[#3E3636] flex-grow">{ex.japanese}</p>
              <button
                onClick={() => speak(ex.japanese || '')}
                className="p-2 rounded-full hover:bg-[#D72323]/20 transition-colors"
              >
                <Volume2 className="h-5 w-5 text-[#3E3636]" />
              </button>
            </div>
            <p className="text-xs text-[#3E3636]/70 mt-1">
              <span className="font-bold">ENG:</span> {ex.english}
            </p>
            <p className="text-xs text-[#3E3636]/70">
              <span className="font-bold">MM:</span> {ex.myanmar}
            </p>
          </div>
        ))}
      </div>

      {/* Common Mistake Warning */}
      {item.common_mistake_en && (
        <div className="mt-4 border-t border-black/10 pt-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Common Mistake</p>
              <p className="text-sm text-amber-800 leading-relaxed">{item.common_mistake_en}</p>
              {item.common_mistake_mm && (
                <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">{item.common_mistake_mm}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JLPT Exam Tip */}
      {item.exam_tip && (
        <div className="mt-3">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <GraduationCap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">JLPT N5 Exam Tip</p>
              <p className="text-sm text-blue-800 leading-relaxed">{item.exam_tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarPointCard;
