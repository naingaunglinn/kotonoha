import {Volume2, Eye, EyeOff} from "lucide-react";
import React, {useState} from "react";
import {VocabularyProps} from "@/types";

interface VocabularyCardProps {
  key: number | null;
  item: VocabularyProps;
}

const VocabularyCard = ({item}: VocabularyCardProps) => {
  // State to manage the visibility of the romaji spelling
  const [showRomaji, setShowRomaji] = useState(false);

  return (
    <div className="bg-white/80 p-6 rounded-2xl border border-black/5 flex items-center justify-between">
      <div className="w-full">
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
              onClick={() => setShowRomaji(!showRomaji)}
              className="text-gray-400 hover:text-[#3E3636] transition-colors"
              title={showRomaji ? "Hide Romaji" : "Show Romaji"}
            >
              {showRomaji ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <h3 className="text-3xl font-bold text-[#3E3636] mt-1">{item.word}</h3>
        </div>
        <div className="mt-3 space-y-2 flex-auto border-l-2 border-[#D72323]/50 pl-3">
          <div>
            <span className="block text-xs font-bold text-[#3E3636]/50">English</span>
            <p className="text-md text-[#3E3636]/90">{item.meaning}</p>
          </div>
          <div>
            <span className="block text-xs font-bold text-[#3E3636]/50">Myanmar</span>
            <p className="text-md text-[#3E3636]/90">{item.meaning_mm}</p>
          </div>
        </div>
      </div>
      <button
        onClick={(e) => console.log(e)}
        className="p-4 rounded-full bg-[#F5EDED] hover:bg-[#D72323] text-[#3E3636] hover:text-white transition-all duration-300 self-start ml-4">
        <Volume2 className="h-6 w-6" />
      </button>
    </div>
  );
}

export default VocabularyCard;