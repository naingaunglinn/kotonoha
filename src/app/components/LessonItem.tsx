'use client';
import {ChevronRight, Book, List, Headphones, BookOpen, BrainCircuit, LucideIcon, CheckCircle2} from "lucide-react";
import React, {useEffect, useState} from "react";
import {LessonContentPageProps} from "@/types";
import Link from "next/link";
import {getDataUrl} from "@/utils/dataUrl";
import {getCompletedCount} from "@/utils/progressSummary";
import type {LessonCategory} from "@/app/level/[id]/[lesson]/lessonStorage";

const ICONS: Record<string, LucideIcon> = {
  book: Book,
  braincircuit: BrainCircuit,
  list: List,
  headphones: Headphones,
  bookopen: BookOpen,
};

const TRACKED: ReadonlyArray<LessonCategory> = ['vocab', 'kanji', 'grammar', 'reading', 'listening'];

const dataPathFor = (route: LessonCategory, levelId: number | string): string => {
  if (route === 'vocab') return `/data/vocabulary/${levelId}/vocabulary.json`;
  return `/data/${route}/${levelId}/${route}.json`;
};

const LessonItem = ({lesson}: LessonContentPageProps) => {
  const iconKey = lesson.icon?.toLowerCase() ?? "book";
  const Icon = ICONS[iconKey] || Book;

  const route = lesson.route ?? "";
  const isTracked = (TRACKED as ReadonlyArray<string>).includes(route);
  const category = isTracked ? (route as LessonCategory) : null;

  const [total, setTotal] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!category || lesson.level_id == null) return;
    setCompleted(getCompletedCount(category, lesson.level_id));

    let cancelled = false;
    fetch(getDataUrl(dataPathFor(category, lesson.level_id)))
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        setTotal(Array.isArray(data) ? data.length : null);
      })
      .catch(() => { if (!cancelled) setTotal(null); });

    return () => { cancelled = true; };
  }, [category, lesson.level_id]);

  const hasProgress = total !== null && total > 0;
  const pct = hasProgress ? Math.round((completed / total) * 100) : 0;
  const isDone = hasProgress && completed >= total;

  return (
    <Link
      href={`${lesson.level_id}/${lesson.route}`}
      className="hover-lift group flex cursor-pointer items-center gap-5 rounded-card border border-line bg-surface p-5 shadow-card"
    >
      <div className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-card ${isDone ? 'bg-success/14 text-success' : 'bg-surface-alt text-ink'}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-grow">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-[family-name:var(--font-display)] text-lg text-ink">{lesson.title}</h4>
          {hasProgress && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isDone
                ? 'bg-success/12 text-success'
                : completed > 0
                  ? 'bg-accent/10 text-accent'
                  : 'bg-surface-alt text-ink-muted'
            }`}>
              {isDone && <CheckCircle2 className="h-3 w-3" />}
              {completed}/{total} · {pct}%
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">{lesson.description}</p>
        {hasProgress && completed > 0 && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: isDone ? 'var(--color-success)' : 'var(--color-accent)',
                transition: 'width 0.6s var(--ease-out-soft)',
              }}
            />
          </div>
        )}
      </div>
      <ChevronRight className="h-6 w-6 flex-shrink-0 text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-accent" />
    </Link>
  );
};

export default LessonItem;
