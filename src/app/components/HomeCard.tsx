import LevelCard from "@/app/components/LevelCard";
import {BasicModuleProps, LevelProps} from "@/types";
import FoundationsCard from "@/app/components/FoundationsCard";
import TodayDashboard from "@/app/components/TodayDashboard";

interface DashboardProp {
  levels : LevelProps[],
  modules: BasicModuleProps[]
}

const HomeCard = ({ levels, modules }:DashboardProp) => {
  return (
    <div className="max-w-7xl mx-auto pt-8 pb-24 px-4 sm:px-6 lg:px-8">
      <TodayDashboard levels={levels} />

      {modules && modules.length > 0 && (
        <div className="mt-14">
          <div className="flex items-end justify-between mb-5 px-1">
            <h2 className="text-lg font-bold tracking-tight text-[#1F150C]">Foundations</h2>
            <span className="text-[11px] text-[#1F150C]/50 font-medium">Hiragana &amp; Katakana</span>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            {modules.map((module) => (
              <FoundationsCard key={module.id} module={module} />
            ))}
          </div>
        </div>
      )}

      {levels && levels.length > 0 && (
        <div className="mt-14">
          <div className="flex items-end justify-between mb-5 px-1">
            <h2 className="text-lg font-bold tracking-tight text-[#1F150C]">Browse JLPT levels</h2>
            <span className="text-[11px] text-[#1F150C]/50 font-medium">N5 → N1</span>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((level) => (<LevelCard key={level.id} level={level} />))}
          </div>
        </div>
      )}
    </div>
  )
};

export default HomeCard;
