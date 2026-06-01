'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Book, BrainCircuit, List, BookOpen, Headphones, ChevronRight } from 'lucide-react';
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

/** Smooth momentum curve — grows with activity, never claims a false 100%. */
const momentum = (n: number) => (n <= 0 ? 0 : n / (n + 60));

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
    levels.forEach((l) => { sum += getLevelCompletedCount(l.id); });
    setOverallCompleted(sum);
    setMounted(true);
  }, [levels]);

  const top = recent[0] ?? null;
  const others = recent.slice(1, 4);

  const continueHref = top ? `/level/${top.levelId}/${top.category}` : '/level/5/vocab';
  const continueLabel = top
    ? `Continue ${LEVEL_LABEL(top.levelId)} ${CATEGORY_LABEL[top.category]}`
    : 'Start with N5 Vocabulary';
  const continueSub = top ? `Set ${top.page} · pick up where you left off` : 'Your first 80 words await.';
  const ContinueIcon = top ? CATEGORY_ICON[top.category] : Book;

  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const studiedToday = days.some((d) => d.date === todayIso && d.studied);

  // Circular ring geometry
  const R = 26;
  const C = 2 * Math.PI * R;
  const ringFill = mounted ? momentum(overallCompleted) : 0;

  return (
    <section className="space-y-6">
      {/* ============ HERO ============ */}
      <div className="washi animate-rise relative overflow-hidden rounded-[20px] px-6 py-8 text-bg shadow-float sm:px-10 sm:py-11">
        {/* Decorative kanji watermark */}
        <span
          aria-hidden
          className="jp pointer-events-none absolute -right-4 -top-10 select-none text-[13rem] font-bold leading-none text-white/[0.06] sm:-right-2 sm:text-[17rem]"
        >
          勉
        </span>
        {/* Hairline frame */}
        <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[14px] border border-white/10" />

        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">
              {top ? '読み続ける · Continue' : '始めましょう · Begin'}
            </span>
            <h2 className="mt-3 flex items-center gap-3 font-[family-name:var(--font-display)] text-[1.7rem] leading-tight tracking-tight sm:text-4xl">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-card bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                <ContinueIcon className="h-5 w-5" />
              </span>
              <span className="truncate">{continueLabel}</span>
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/70">{continueSub}</p>
          </div>

          <Link
            href={continueHref}
            className="group inline-flex flex-shrink-0 items-center gap-2.5 self-start rounded-full bg-accent px-7 py-3.5 font-semibold text-white shadow-card transition-all duration-300 hover:bg-[#a83d30] active:scale-[0.97] sm:self-auto"
          >
            {top ? 'Resume' : 'Start'}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* ============ TODAY'S SNAPSHOT BAND ============ */}
      <div
        className="animate-rise grid grid-cols-1 divide-y divide-line rounded-card border border-line bg-surface shadow-card sm:grid-cols-[auto_1fr_auto] sm:divide-x sm:divide-y-0"
        style={{ animationDelay: '0.08s' }}
      >
        {/* Streak */}
        <div className="flex items-center gap-4 px-6 py-5">
          <div
            className={`grid h-12 w-12 place-items-center rounded-card ${
              streak > 0 ? 'bg-accent/10 text-accent' : 'bg-surface-alt text-ink-muted'
            }`}
          >
            <Flame className={`h-6 w-6 ${streak > 0 ? 'animate-flame' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="font-[family-name:var(--font-display)] text-3xl tabular-nums leading-none text-ink">
              {mounted ? streak : 0}
            </div>
            <div className="mt-1 text-xs font-medium text-ink-muted">
              day streak{longestStreak > streak ? ` · best ${longestStreak}` : ''}
            </div>
          </div>
        </div>

        {/* 7-day heatmap */}
        <div className="px-6 py-5">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">
            Last 7 days
          </div>
          <div className="flex justify-between gap-1.5">
            {(mounted ? days : Array.from({ length: 7 }, () => ({ date: '', studied: false }))).map((d, i) => {
              const isToday = d.date === todayIso;
              const dayName = DOW[new Date(d.date || todayIso).getDay()] || '';
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`aspect-square w-full rounded-chip transition-colors duration-300 ${
                      d.studied
                        ? 'bg-success'
                        : isToday
                          ? 'bg-accent/10 ring-1 ring-inset ring-accent/40'
                          : 'bg-surface-alt'
                    }`}
                    title={d.date}
                  />
                  <span className={`text-[9px] ${isToday ? 'font-bold text-accent' : 'text-ink-muted'}`}>
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items studied — circular ring */}
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="relative h-16 w-16 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
              <circle cx="32" cy="32" r={R} fill="none" stroke="var(--color-surface-alt)" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                stroke="var(--color-accent-cool)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - ringFill)}
                style={{ transition: 'stroke-dashoffset 1s var(--ease-out-soft)' }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-[family-name:var(--font-display)] text-lg tabular-nums text-ink">
              {mounted ? overallCompleted : 0}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">items studied</div>
            <div className="mt-1 text-xs text-ink-muted">
              {studiedToday ? 'studied today ✓' : 'not yet today'}
            </div>
          </div>
        </div>
      </div>

      {/* ============ RECENTLY STUDIED ============ */}
      {others.length > 0 && (
        <div>
          <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
            Recently studied
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((entry) => {
              const Icon = CATEGORY_ICON[entry.category];
              const completed = getCompletedCount(entry.category, entry.levelId);
              return (
                <Link
                  key={`${entry.category}-${entry.levelId}`}
                  href={`/level/${entry.levelId}/${entry.category}`}
                  className="hover-lift group flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
                >
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-chip bg-surface-alt text-ink">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink">
                      {LEVEL_LABEL(entry.levelId)} · {CATEGORY_LABEL[entry.category]}
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      Set {entry.page} · {completed} studied
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
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
