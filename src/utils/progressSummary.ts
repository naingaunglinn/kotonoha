import { LessonCategory, completedStorageKey } from '@/app/level/[id]/[lesson]/lessonStorage';

const CATEGORIES: ReadonlyArray<LessonCategory> = ['vocab', 'kanji', 'grammar', 'reading', 'listening'];

export const getCompletedCount = (category: LessonCategory, levelId: string | number): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(completedStorageKey(category, String(levelId)));
    if (!raw) return 0;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.length : 0;
  } catch { return 0; }
};

export const getLevelCompletedCount = (levelId: string | number): number => {
  return CATEGORIES.reduce((sum, cat) => sum + getCompletedCount(cat, levelId), 0);
};
