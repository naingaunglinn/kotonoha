import type { LessonCategory } from '@/app/level/[id]/[lesson]/lessonStorage';

const RECENT_KEY = 'kotonoha_recent_activity';
const MAX_ENTRIES = 5;

export interface RecentActivityEntry {
  category: LessonCategory;
  levelId: string;
  page: number;
  visitedAt: number;
}

const isCategory = (val: unknown): val is LessonCategory =>
  val === 'vocab' || val === 'kanji' || val === 'grammar' || val === 'reading' || val === 'listening';

export const loadRecentActivity = (): RecentActivityEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((e): e is RecentActivityEntry =>
      e && isCategory(e.category) && typeof e.levelId === 'string' &&
      typeof e.page === 'number' && typeof e.visitedAt === 'number'
    );
  } catch { return []; }
};

export const recordVisit = (category: LessonCategory, levelId: string, page: number) => {
  if (typeof window === 'undefined') return;
  try {
    const entries = loadRecentActivity().filter(
      e => !(e.category === category && e.levelId === levelId)
    );
    entries.unshift({ category, levelId, page, visitedAt: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch { /* ignore */ }
};

export const getMostRecent = (): RecentActivityEntry | null => {
  const entries = loadRecentActivity();
  return entries[0] ?? null;
};
