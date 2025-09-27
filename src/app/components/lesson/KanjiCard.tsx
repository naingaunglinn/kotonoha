import {KanjiProps} from "@/types";
import {Volume2} from "lucide-react";

interface KanjiCardProps {
  key: string | null;
  item: KanjiProps;
}

const KanjiCard = ({item}:KanjiCardProps) => {

  return (
    <div className="bg-white/80 p-6 rounded-2xl border border-black/5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start">
        <h3 className="text-7xl font-bold text-[#3E3636] leading-none">{item.word}</h3>
        <div className="text-right">
          <div className="text-xs text-[#3E3636]/60">{item.strokes} strokes</div>
          <button
            onClick={(e) => { console.log(e) }}
            className="p-2 mt-1 rounded-full bg-[#F5EDED] hover:bg-[#D72323] text-[#3E3636] hover:text-white transition-all duration-300">
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Readings */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <span className="block text-xs font-bold text-[#D72323] uppercase">On&apos;yomi</span>
          <p className="text-sm text-[#3E3636] truncate">{item.onyomi}</p>
        </div>
        <div>
          <span className="block text-xs font-bold text-[#D72323] uppercase">Kun&apos;yomi</span>
          <p className="text-sm text-[#3E3636] truncate">{item.kunyomi}</p>
        </div>
      </div>

      {/* Meanings */}
      <div className="mt-4 space-y-2 border-t border-black/10 pt-4">

        <div className={"flex w-full"}>
          <div className={"flex-auto"}>
            <div>
              <span className="block text-xs font-bold text-[#3E3636]/50">ENG</span>
              <p className="text-md text-[#3E3636]/90">{item.meaning}</p>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#3E3636]/50">MM</span>
              <p className="text-md text-[#3E3636]/90">{item.meaning_mm}</p>
            </div>
          </div>
          <div className="flex-auto">
            <span className="block text-xs font-bold text-[#3E3636]/50 uppercase">Example</span>
            <p className="text-xs text-[#D72323] font-bold tracking-wider">{item.word_rmj}</p>
            <p className="text-lg font-bold text-[#3E3636]">{item.word_kana}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-black/10 pt-4">
          <span className="block text-xs font-bold text-[#3E3636]/50 uppercase">Description</span>
          <p className="mt-1 text-xs font-bold text-[#3E3636]">{item.description}</p>
        </div>
      </div>
    </div>
  )
};

export default KanjiCard;