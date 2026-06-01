'use client'
import LessonItem from "@/app/components/LessonItem";
import {ChevronLeft, Lightbulb, GraduationCap} from "lucide-react";
import {LessonProps, LevelProps} from "@/types";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import { getDataUrl } from "@/utils/dataUrl";

const STUDY_TIPS: Record<number, { tip: string; steps: string[] }> = {
  5: {
    tip: "N5 is your first step into Japanese! Follow this recommended study order:",
    steps: [
      "Start with Vocabulary to build your word bank",
      "Learn Kanji to recognize characters in context",
      "Study Grammar to form sentences with your words",
      "Practice Reading to test your comprehension",
      "Train with Listening to sharpen your ear",
    ],
  },
};

const LEVEL_TAGS: Record<number, string> = {
  5: "Beginner",
  4: "Elementary",
  3: "Intermediate",
  2: "Upper Intermediate",
  1: "Advanced",
};

const Lessons = () => {
  const params = useParams<{ id: string; lesson: string }>();
  const [level, setLevel] = useState<LevelProps>();
  const { id } = params!;
  const levelId :number = Number(id);

  useEffect(() => {
    const fetchLevel = async (id: number) => {
      const response = await fetch(getDataUrl('/data/lesson/level.json'), {
        cache: 'no-store'
      });

      const data: LevelProps[] = await response.json();
      const levelData: LevelProps[] = data.filter(l => l?.id == id);
      setLevel(levelData[0]);
    };

    fetchLevel(levelId);
  }, [levelId]);

  if (!level) {
    return (
      <div className="mx-auto mt-10 max-w-2xl rounded-card border border-line bg-surface p-10 text-center shadow-card">
        <p className="text-ink-muted">Level not found.</p>
      </div>
    );
  }

  const studyTip = STUDY_TIPS[levelId];
  const levelTag = LEVEL_TAGS[levelId] || "";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        Home
      </Link>

      <div>
        <div className="mb-3 inline-flex items-center gap-2">
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold tracking-wider text-bg">{levelTag}</span>
          <span className="rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-ink-muted">
            {level.lessons.length} lessons
          </span>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink md:text-5xl">
          {level?.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">{level?.description}</p>
      </div>

      {/* Study Tips */}
      {studyTip && (
        <div className="mt-8 rounded-card border-l-4 border-accent-warm bg-accent-warm/12 p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-card bg-accent-warm/30 text-[#9a6b43]">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-ink">
                <GraduationCap className="h-4 w-4 text-[#9a6b43]" />
                Study guide
              </h3>
              <p className="mb-3 text-sm text-ink-muted">{studyTip.tip}</p>
              <ol className="space-y-1.5">
                {studyTip.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink">
                    <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-accent-warm/40 text-xs font-bold text-[#9a6b43]">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {level.lessons.length > 0 ? (
          level?.lessons?.map((lesson: LessonProps) => <LessonItem key={lesson.id} lesson={lesson} />)
        ) : (
          <div className="rounded-card border border-line bg-surface p-10 text-center shadow-card">
            <p className="text-ink-muted">Lessons for {level.title} are being prepared.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lessons;