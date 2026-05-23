const STREAK_KEY = 'kotonoha_streak';

export interface StreakState {
  lastStudyDate: string;   // ISO date YYYY-MM-DD in local time
  currentStreak: number;
  longestStreak: number;
}

const isoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const loadStreak = (): StreakState => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.currentStreak === 'number' &&
        typeof parsed.longestStreak === 'number' &&
        typeof parsed.lastStudyDate === 'string'
      ) {
        return parsed as StreakState;
      }
    }
  } catch { /* ignore */ }
  return { lastStudyDate: '', currentStreak: 0, longestStreak: 0 };
};

// Returns the *effective* current streak: if more than one day has passed
// since lastStudyDate, the streak is considered broken (0) until the user
// studies again today.
export const getEffectiveStreak = (state: StreakState): number => {
  if (!state.lastStudyDate) return 0;
  const today = isoDate(new Date());
  if (state.lastStudyDate === today) return state.currentStreak;
  const yesterday = isoDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (state.lastStudyDate === yesterday) return state.currentStreak;
  return 0;
};

// Call when the user marks any item complete. Bumps the streak on first
// activity per local day; does nothing if already credited for today.
export const recordStudyActivity = (): StreakState => {
  const today = isoDate(new Date());
  const yesterday = isoDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const prev = loadStreak();

  if (prev.lastStudyDate === today) return prev;

  const next: StreakState = {
    lastStudyDate: today,
    currentStreak: prev.lastStudyDate === yesterday ? prev.currentStreak + 1 : 1,
    longestStreak: prev.longestStreak,
  };
  if (next.currentStreak > next.longestStreak) {
    next.longestStreak = next.currentStreak;
  }
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
};
