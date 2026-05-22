const STUDY_DAYS_KEY = 'kotonoha_study_days';
const MAX_DAYS = 30;

const isoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const loadStudyDays = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STUDY_DAYS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((s): s is string => typeof s === 'string')) : new Set();
  } catch { return new Set(); }
};

export const recordStudyDay = () => {
  if (typeof window === 'undefined') return;
  try {
    const days = loadStudyDays();
    days.add(isoDate(new Date()));
    const trimmed = [...days].sort().slice(-MAX_DAYS);
    localStorage.setItem(STUDY_DAYS_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
};

// Returns an array of {date, studied} for the last N calendar days, oldest → newest.
export const getRecentDays = (n: number = 7): Array<{ date: string; studied: boolean }> => {
  const studied = loadStudyDays();
  const out: Array<{ date: string; studied: boolean }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = isoDate(d);
    out.push({ date: iso, studied: studied.has(iso) });
  }
  return out;
};
