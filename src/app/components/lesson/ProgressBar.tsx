'use client'
import { CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  completedOnPage: number;
  totalOnPage: number;
  completedTotal: number;
  totalWords: number;
  label?: string;
  doneMessage?: string;
}

export default function ProgressBar({
  completedOnPage,
  totalOnPage,
  completedTotal,
  totalWords,
  label = "Today's Progress",
  doneMessage = '🎉 All done for today! Great job!',
}: ProgressBarProps) {
  const pagePercent = totalOnPage > 0 ? (completedOnPage / totalOnPage) * 100 : 0;
  const totalPercent = totalWords > 0 ? (completedTotal / totalWords) * 100 : 0;

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-sm font-bold text-ink">{label}</span>
        </div>
        <span className="text-sm font-bold text-success">
          {completedOnPage}/{totalOnPage}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pagePercent}%`,
            background: pagePercent === 100 ? 'var(--color-success)' : 'var(--color-accent)',
            transition: 'width 0.5s var(--ease-out-soft)',
          }}
        />
      </div>
      {pagePercent === 100 && (
        <p className="mt-1.5 text-center text-xs font-bold text-success">{doneMessage}</p>
      )}

      <div className="mb-1.5 mt-3 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">Overall</span>
        <span className="text-xs font-bold text-ink-muted">
          {completedTotal}/{totalWords} ({Math.round(totalPercent)}%)
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full bg-ink/30"
          style={{ width: `${totalPercent}%`, transition: 'width 0.5s var(--ease-out-soft)' }}
        />
      </div>
    </div>
  );
}
