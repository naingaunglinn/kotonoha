import LevelCard from "@/app/components/LevelCard";
import { BasicModuleProps, LevelProps } from "@/types";
import FoundationsCard from "@/app/components/FoundationsCard";
import TodayDashboard from "@/app/components/TodayDashboard";

interface DashboardProp {
  levels: LevelProps[];
  modules: BasicModuleProps[];
}

const SectionHeading = ({ title, jp, meta }: { title: string; jp: string; meta: string }) => (
  <div className="mb-5 flex items-end justify-between px-1">
    <div className="flex items-baseline gap-3">
      <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-ink">{title}</h2>
      <span className="jp text-sm text-ink-muted">{jp}</span>
    </div>
    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">{meta}</span>
  </div>
);

const HomeCard = ({ levels, modules }: DashboardProp) => {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <TodayDashboard levels={levels} />

      {modules && modules.length > 0 && (
        <div className="mt-16">
          <SectionHeading title="Foundations" jp="基礎" meta="Hiragana & Katakana" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            {modules.map((module) => (
              <FoundationsCard key={module.id} module={module} />
            ))}
          </div>
        </div>
      )}

      {levels && levels.length > 0 && (
        <div className="mt-16">
          <SectionHeading title="JLPT Levels" jp="級" meta="N5 → N1" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {levels.map((level) => (
              <LevelCard key={level.id} level={level} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeCard;
