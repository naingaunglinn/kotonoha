'use client'
import { CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  completedOnPage: number;
  totalOnPage: number;
  completedTotal: number;
  totalWords: number;
  label?: string;
  doneMessage?: string;
}

export default function ProgressBar({
  completedOnPage,
  totalOnPage,
  completedTotal,
  totalWords,
  label = "Today's Progress",
  doneMessage = '🎉 All done for today! Great job!',
}: ProgressBarProps) {
  const pagePercent = totalOnPage > 0 ? (completedOnPage / totalOnPage) * 100 : 0;
  const totalPercent = totalWords > 0 ? (completedTotal / totalWords) * 100 : 0;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-black/5 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-[#3E3636]">{label}</span>
        </div>
        <span className="text-sm font-bold text-emerald-600">
          {completedOnPage}/{totalOnPage}
        </span>
      </div>
      <div className="w-full h-3 bg-[#F5EDED] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pagePercent}%`,
            background: pagePercent === 100
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #D72323, #ef4444)',
          }}
        />
      </div>
      {pagePercent === 100 && (
        <p className="text-xs text-emerald-600 font-bold mt-1.5 text-center animate-pulse">
          {doneMessage}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 mb-1.5">
        <span className="text-xs text-[#3E3636]/50 font-medium">Overall</span>
        <span className="text-xs text-[#3E3636]/60 font-bold">
          {completedTotal}/{totalWords} ({Math.round(totalPercent)}%)
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F5EDED] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3E3636]/30 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalPercent}%` }}
        />
      </div>
    </div>
  );
}
