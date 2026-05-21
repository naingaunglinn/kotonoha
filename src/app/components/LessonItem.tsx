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
      className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-xl hover:border-[#D72323]/50 transition-all duration-300 group flex items-center space-x-6 cursor-pointer"
    >
      <div className={`p-4 rounded-lg flex-shrink-0 ${isDone ? 'bg-emerald-50' : 'bg-[#F5EDED]'}`}>
        <Icon className={`h-6 w-6 ${isDone ? 'text-emerald-600' : 'text-[#3E3636]'}`} />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-lg font-bold text-[#3E3636]">{lesson.title}</h4>
          {hasProgress && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isDone
                ? 'bg-emerald-100 text-emerald-700'
                : completed > 0
                  ? 'bg-[#D72323]/10 text-[#D72323]'
                  : 'bg-[#3E3636]/5 text-[#3E3636]/60'
            }`}>
              {isDone && <CheckCircle2 className="w-3 h-3" />}
              {completed}/{total} · {pct}%
            </span>
          )}
        </div>
        <p className="text-sm text-[#3E3636]/70 mt-0.5">{lesson.description}</p>
        {hasProgress && completed > 0 && (
          <div className="mt-2 h-1 w-full bg-[#3E3636]/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: isDone
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : 'linear-gradient(90deg, #D72323, #ef4444)',
              }}
            />
          </div>
        )}
      </div>
      <div className="text-[#3E3636]/50 group-hover:text-[#D72323] transition-colors flex-shrink-0">
        <ChevronRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default LessonItem;
