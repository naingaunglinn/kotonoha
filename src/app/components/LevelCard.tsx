'use client';
import {Award, ChevronRight, Sparkles} from "lucide-react";
import {useEffect, useState} from "react";
import {LevelProps} from "@/types";
import Link from "next/link";
import {getLevelCompletedCount} from "@/utils/progressSummary";

interface LevelCardProps {
  level: LevelProps;
}

const LevelCard = ({level}: LevelCardProps) => {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    setCompletedCount(getLevelCompletedCount(level.id));
  }, [level.id]);

  return (
    <Link
      href={`/level/${level.id}`}
      className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col cursor-pointer"
    >
      <div className="flex-grow">
        <div className="flex items-start justify-between mb-6">
          <div className="p-4 rounded-xl bg-[#E1DCC9] w-min">
            <Award className="h-7 w-7 text-[#1F150C]" />
          </div>
          {completedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <Sparkles className="w-3 h-3" />
              {completedCount} studied
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-[#1F150C]">{level.title}</h3>
        <p className="mt-2 text-[#1F150C]/70 leading-relaxed">{level.description}</p>
      </div>
      <div className="mt-8 flex items-center justify-end text-[#1F150C] font-bold transition-all duration-300 transform group-hover:text-[#412D15]">
        {completedCount > 0 ? 'Continue' : 'View Lessons'}
        <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
      </div>
    </Link>
  );
};

export default LevelCard;
