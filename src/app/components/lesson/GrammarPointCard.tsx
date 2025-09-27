import {GrammarProps} from "@/types";
import {Volume2} from "lucide-react";

interface GrammarPointCardProps {
  key: number | null;
  item: GrammarProps;
}

const GrammarPointCard = ({item} :GrammarPointCardProps) => {
  console.log(item);

  // --- SPEECH UTILITY ---
  // const speak = (text: string, lang = 'ja-JP') => {
  //   if (typeof window === 'undefined' || !window.speechSynthesis) {
  //     console.warn('Speech synthesis not supported in this browser.');
  //     return;
  //   }
  //   window.speechSynthesis.cancel(); // Cancel any previous speech
  //   const utterance = new SpeechSynthesisUtterance(text);
  //   utterance.lang = lang;
  //   utterance.rate = 0.9;
  //   window.speechSynthesis.speak(utterance);
  // };

  return (
    <div className="col-span-3 bg-white/80 p-6 rounded-2xl border border-black/5">
      {/* Title Section */}
      <div>
        <h3 className="text-2xl font-bold text-[#3E3636]">{item.title}</h3>
        <p className="text-md text-[#3E3636]/70">{item.title_mm}</p>
      </div>

      {/* Explanations Section */}
      <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
        <div className="mb-6 border-l-4 border-[#D72323] pl-4">
          <span className="block text-xs font-bold text-[#3E3636]/50">ENGLISH</span>
          <p className="text-[#3E3636]/80 text-sm leading-relaxed">{item.explanation_en}</p>
        </div>
        <div className="mb-6 border-l-4 border-[#D72323] pl-4">
          <span className="block text-xs font-bold text-[#3E3636]/50">MYANMAR</span>
          <p className="text-[#3E3636]/80 text-sm leading-relaxed">{item.explanation_mm}</p>
        </div>
      </div>

      {/* Examples Section */}
      <div className="mt-4 space-y-4 border-t border-black/10 pt-4">
        <h4 className="font-bold text-[#3E3636]">Examples</h4>
        {item.examples.map((ex, index) => (
          <div key={index} className="bg-[#F5EDED]/80 p-4 rounded-lg">
            <div className="flex items-center">
              <p className="font-bold text-lg text-[#3E3636] flex-grow">{ex.japanese}</p>
              <button onClick={() => console.log()} className="p-2 rounded-full hover:bg-[#D72323]/20 transition-colors">
                <Volume2 className="h-5 w-5 text-[#3E3636]" />
              </button>
            </div>
            <p className="text-xs text-[#3E3636]/70 mt-1"><span className="font-bold">ENG:</span> {ex.english}</p>
            <p className="text-xs text-[#3E3636]/70"><span className="font-bold">MM:</span> {ex.myanmar}</p>
          </div>
        ))}
      </div>
    </div>
  )
};

export default GrammarPointCard;