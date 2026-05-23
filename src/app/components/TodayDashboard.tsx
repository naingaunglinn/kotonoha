'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Sparkles, Book, BrainCircuit, List, BookOpen, Headphones, ChevronRight, BarChart3 } from 'lucide-react';
import { loadStreak, getEffectiveStreak } from '@/app/level/[id]/[lesson]/streakStorage';
import { getRecentDays } from '@/utils/studyDays';
import { loadRecentActivity, RecentActivityEntry } from '@/utils/recentActivity';
import { LessonCategory } from '@/app/level/[id]/[lesson]/lessonStorage';
import { getCompletedCount, getLevelCompletedCount } from '@/utils/progressSummary';
import { LevelProps } from '@/types';

const CATEGORY_LABEL: Record<LessonCategory, string> = {
  vocab: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
};

const CATEGORY_ICON: Record<LessonCategory, React.ComponentType<{ className?: string }>> = {
  vocab: Book,
  kanji: BrainCircuit,
  grammar: List,
  reading: BookOpen,
  listening: Headphones,
};

const LEVEL_LABEL = (id: string | number) => `N${id}`;

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface TodayDashboardProps {
  levels: LevelProps[];
}

const TodayDashboard = ({ levels }: TodayDashboardProps) => {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [recent, setRecent] = useState<RecentActivityEntry[]>([]);
  const [days, setDays] = useState<Array<{ date: string; studied: boolean }>>([]);
  const [overallCompleted, setOverallCompleted] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const streakState = loadStreak();
    setStreak(getEffectiveStreak(streakState));
    setLongestStreak(streakState.longestStreak);
    setRecent(loadRecentActivity());
    setDays(getRecentDays(7));
    let sum = 0;
    levels.forEach(l => { sum += getLevelCompletedCount(l.id); });
    setOverallCompleted(sum);
    setMounted(true);
  }, [levels]);

  const top = recent[0] ?? null;
  const others = recent.slice(1, 4);

  const continueHref = top
    ? `/level/${top.levelId}/${top.category}`
    : '/level/5/vocab';

  const continueLabel = top
    ? `Continue ${LEVEL_LABEL(top.levelId)} ${CATEGORY_LABEL[top.category]}`
    : 'Start with N5 Vocabulary';

  const continueSub = top
    ? `Set ${top.page}`
    : 'Your first 80 words await.';

  const ContinueIcon = top ? CATEGORY_ICON[top.category] : Book;

  const todayIso = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const studiedToday = days.some(d => d.date === todayIso && d.studied);

  return (
    <section className="space-y-6">
      {/* PRIMARY CTA */}
      <div className="bg-[#1F150C] text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#412D15]" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-[#E1DCC9]" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E1DCC9]/70">
                {top ? 'Pick up where you left off' : 'Begin your journey'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#412D15]/40">
                <ContinueIcon className="w-6 h-6" />
              </span>
              <span className="truncate">{continueLabel}</span>
            </h2>
            <p className="mt-2 text-sm text-[#E1DCC9]/80">{continueSub}</p>
          </div>

          <Link
            href={continueHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#E1DCC9] text-[#1F150C] rounded-full font-bold hover:bg-white transition-all active:scale-95 shadow-md flex-shrink-0 self-start sm:self-auto"
          >
            {top ? 'Continue' : 'Start'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* STREAK + HEATMAP + STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-black/5 flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${streak > 0 ? 'bg-orange-100 text-orange-600' : 'bg-[#1F150C]/5 text-[#1F150C]/40'}`}>
            <Flame className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="text-3xl font-extrabold text-[#1F150C] tabular-nums">
              {mounted ? streak : 0}
            </div>
            <div className="text-[11px] font-medium text-[#1F150C]/60">
              day streak{longestStreak > streak ? ` · best ${longestStreak}` : ''}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-black/5">
          <div className="text-[10px] font-bold text-[#1F150C]/50 uppercase tracking-wider mb-3">
            Last 7 days
          </div>
          <div className="flex justify-between gap-1">
            {(mounted ? days : Array.from({ length: 7 }, () => ({ date: '', studied: false }))).map((d, i) => {
              const isToday = d.date === todayIso;
              const dayName = DOW[new Date(d.date || todayIso).getDay()] || '';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full aspect-square rounded-md flex items-center justify-center text-[9px] font-bold transition-colors ${
                      d.studied
                        ? 'bg-emerald-500 text-white'
                        : isToday
                          ? 'bg-[#412D15]/15 text-[#412D15] ring-1 ring-[#412D15]/40'
                          : 'bg-[#1F150C]/5 text-[#1F150C]/30'
                    }`}
                    title={d.date}
                  >
                    {d.studied && <Sparkles className="w-3 h-3" />}
                  </div>
                  <span className={`text-[9px] ${isToday ? 'font-bold text-[#412D15]' : 'text-[#1F150C]/40'}`}>
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-black/5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#412D15]/10 text-[#412D15]">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="text-3xl font-extrabold text-[#1F150C] tabular-nums">
              {mounted ? overallCompleted : 0}
            </div>
            <div className="text-[11px] font-medium text-[#1F150C]/60">
              items studied · {studiedToday ? 'studied today' : 'no study yet today'}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY TILES */}
      {others.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-[#1F150C]/60 uppercase tracking-wider mb-3 px-1">
            Recently studied
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {others.map((entry) => {
              const Icon = CATEGORY_ICON[entry.category];
              const completed = getCompletedCount(entry.category, entry.levelId);
              return (
                <Link
                  key={`${entry.category}-${entry.levelId}`}
                  href={`/level/${entry.levelId}/${entry.category}`}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-black/5 hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center gap-3"
                >
                  <div className="p-2.5 rounded-xl bg-[#E1DCC9] flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#1F150C]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-[#1F150C] truncate">
                      {LEVEL_LABEL(entry.levelId)} · {CATEGORY_LABEL[entry.category]}
                    </div>
                    <div className="text-[11px] text-[#1F150C]/60">
                      Set {entry.page} · {completed} studied
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1F150C]/40 group-hover:translate-x-0.5 group-hover:text-[#412D15] transition-all flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default TodayDashboard;
