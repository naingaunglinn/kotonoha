'use client';
import { ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { LevelProps } from "@/types";
import Link from "next/link";
import { getLevelCompletedCount } from "@/utils/progressSummary";

interface LevelCardProps {
  level: LevelProps;
}

// Ink-wash band per level: warm sand → moss → slate → indigo → near-black
const LEVEL_THEME: Record<string, { color: string; tint: string }> = {
  '5': { color: 'var(--color-n5)', tint: 'rgba(200,169,120,0.14)' },
  '4': { color: 'var(--color-n4)', tint: 'rgba(125,140,92,0.14)' },
  '3': { color: 'var(--color-n3)', tint: 'rgba(95,107,117,0.14)' },
  '2': { color: 'var(--color-n2)', tint: 'rgba(58,74,107,0.14)' },
  '1': { color: 'var(--color-n1)', tint: 'rgba(35,35,51,0.16)' },
};

const momentum = (n: number) => (n <= 0 ? 0 : n / (n + 60));

const LevelCard = ({ level }: LevelCardProps) => {
  const [completedCount, setCompletedCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCompletedCount(getLevelCompletedCount(level.id));
    setMounted(true);
  }, [level.id]);

  const theme = LEVEL_THEME[String(level.id)] ?? LEVEL_THEME['5'];
  const active = completedCount > 0;
  const fill = mounted ? momentum(completedCount) : 0;

  return (
    <Link
      href={`/level/${level.id}`}
      className="hover-lift group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card"
      style={active ? { borderLeft: `3px solid ${theme.color}` } : undefined}
    >
      {/* Ink-wash top band */}
      <div
        className="relative flex h-20 items-center px-5"
        style={{ background: theme.tint }}
      >
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: theme.color }}
        />
        <span
          className="jp font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight"
          style={{ color: theme.color }}
        >
          {level.title}
        </span>
        {active && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface/80 px-2.5 py-1 text-[10px] font-bold text-ink shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3 w-3" style={{ color: theme.color }} />
            {completedCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">{level.description}</p>

        {/* Progress momentum bar */}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full"
              style={{
                width: `${fill * 100}%`,
                background: theme.color,
                transition: 'width 0.9s var(--ease-out-soft)',
              }}
            />
          </div>
          <div className="mt-1.5 text-[11px] font-medium text-ink-muted">
            {active ? `${completedCount} items studied` : 'Not started yet'}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end text-sm font-bold text-ink transition-colors group-hover:text-accent">
          {active ? 'Continue' : 'Explore'}
          <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};

export default LevelCard;
