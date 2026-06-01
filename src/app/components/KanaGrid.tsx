'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, Shuffle, X, CheckCircle, RotateCcw } from 'lucide-react';

interface KanaChar {
  kana: string | null;
  romaji: string | null;
}
interface ChartRow {
  char_row: string;
  characters: KanaChar[];
}

interface KanaGridProps {
  kana: string;
  rows: ChartRow[];
}

// Classify gojūon rows into the three teaching groups.
const BASIC = new Set(['basic', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'a', 'vowel', 'vowels']);
const DAKUTEN = new Set(['g', 'z', 'j', 'd', 'b', 'p']);

type GroupKey = 'basic' | 'dakuten' | 'combo';
const GROUPS: { key: GroupKey; title: string; jp: string; romaji: string }[] = [
  { key: 'basic', title: 'Basic', jp: '五十音', romaji: 'gojūon · あ–ん' },
  { key: 'dakuten', title: 'Voiced', jp: '濁音・半濁音', romaji: 'dakuten · が–ぱ' },
  { key: 'combo', title: 'Combination', jp: '拗音', romaji: 'yōon · きゃ–ぴょ' },
];

const classify = (row: string): GroupKey => {
  if (DAKUTEN.has(row)) return 'dakuten';
  if (BASIC.has(row)) return 'basic';
  return 'combo';
};

// ---- Quick quiz modal ----
const QuizModal = ({ pool, onClose }: { pool: KanaChar[]; onClose: () => void }) => {
  const questions = useMemo(() => {
    const valid = pool.filter((c) => c.kana && c.romaji);
    const shuffled = [...valid].sort(() => Math.random() - 0.5).slice(0, 5);
    return shuffled.map((q) => {
      const distractors = valid
        .filter((c) => c.romaji !== q.romaji)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.romaji!);
      const options = [q.romaji!, ...distractors].sort(() => Math.random() - 0.5);
      return { kana: q.kana!, answer: q.romaji!, options };
    });
  }, [pool]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  const pick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setPicked(null);
    } else {
      setDone(true);
    }
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-rise w-full max-w-sm rounded-[20px] border border-line bg-surface p-6 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-display)] text-lg text-ink">Quick quiz</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-ink/5" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!done ? (
          <>
            <div className="mt-1 text-xs font-medium text-ink-muted">
              {index + 1} / {questions.length} · which reading?
            </div>
            <div className="mt-5 grid place-items-center">
              <span className="jp text-7xl text-ink">{q.kana}</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const isAnswer = opt === q.answer;
                const isPicked = picked === opt;
                let cls = 'border-line bg-surface text-ink hover:border-accent/50';
                if (picked) {
                  if (isAnswer) cls = 'border-success bg-success/8 text-success';
                  else if (isPicked) cls = 'border-accent bg-accent/8 text-accent';
                  else cls = 'border-line bg-surface text-ink-muted/50';
                }
                return (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    className={`rounded-chip border-2 px-3 py-3 text-sm font-bold uppercase tracking-wide transition-all ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {picked && (
              <button
                onClick={next}
                className="animate-fade-in mt-5 w-full rounded-card bg-accent px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#a83d30]"
              >
                {index < questions.length - 1 ? 'Next' : 'See result'}
              </button>
            )}
          </>
        ) : (
          <div className="py-6 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-success" />
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl text-ink">
              {score} / {questions.length}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {score === questions.length ? 'Perfect!' : 'Keep practicing.'}
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={restart} className="flex flex-1 items-center justify-center gap-1.5 rounded-card border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink hover:border-line-strong">
                <RotateCcw className="h-4 w-4" /> Again
              </button>
              <button onClick={onClose} className="flex-1 rounded-card bg-ink px-4 py-2.5 text-sm font-bold text-bg">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function KanaGrid({ kana, rows }: KanaGridProps) {
  const [collapsed, setCollapsed] = useState<Record<GroupKey, boolean>>({
    basic: false,
    dakuten: false,
    combo: false,
  });
  const [quizOpen, setQuizOpen] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<GroupKey, KanaChar[]> = { basic: [], dakuten: [], combo: [] };
    rows.forEach((row) => {
      const g = classify(row.char_row);
      row.characters.forEach((c) => {
        if (c.kana) map[g].push(c);
      });
    });
    return map;
  }, [rows]);

  const allChars = useMemo(
    () => [...grouped.basic, ...grouped.dakuten, ...grouped.combo],
    [grouped],
  );

  return (
    <div className="space-y-7">
      {GROUPS.map((group) => {
        const chars = grouped[group.key];
        if (chars.length === 0) return null;
        const isCollapsed = collapsed[group.key];
        return (
          <section key={group.key}>
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
              className="sticky top-16 z-10 flex w-full items-center gap-3 rounded-chip bg-bg/85 py-2.5 backdrop-blur-md sm:top-20"
            >
              <span className="font-[family-name:var(--font-display)] text-lg text-ink">{group.title}</span>
              <span className="jp text-sm text-ink-muted">{group.jp}</span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted sm:inline">
                {group.romaji}
              </span>
              <span className="ml-auto flex items-center gap-2 text-xs font-medium text-ink-muted">
                {chars.length}
                <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
              </span>
            </button>

            {!isCollapsed && (
              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-3">
                {chars.map((c, i) => (
                  <Link
                    key={`${c.romaji}-${i}`}
                    href={`/module/${kana}/${c.romaji}`}
                    className="hover-lift group grid aspect-square min-h-[64px] place-items-center rounded-card border border-line bg-surface shadow-card"
                  >
                    <span className="jp text-3xl text-ink transition-colors group-hover:text-accent sm:text-4xl">
                      {c.kana}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{c.romaji}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Floating Test-me button */}
      <button
        onClick={() => setQuizOpen(true)}
        className="fixed bottom-36 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3.5 font-bold text-white shadow-float transition-all hover:bg-[#a83d30] active:scale-95 sm:bottom-24 sm:right-6"
      >
        <Shuffle className="h-4 w-4" />
        Test me
      </button>

      {quizOpen && <QuizModal pool={allChars} onClose={() => setQuizOpen(false)} />}
    </div>
  );
}
