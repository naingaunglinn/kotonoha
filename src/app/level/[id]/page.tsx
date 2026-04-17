'use client'
import LessonItem from "@/app/components/LessonItem";
import {ChevronLeft, Lightbulb, GraduationCap} from "lucide-react";
import {LessonProps, LevelProps} from "@/types";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";

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
    fetchLevel(levelId);
  }, [levelId])

  async function fetchLevel(id:number) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/lesson/level.json`, {
    cache: 'no-store'
  });

  const data:LevelProps[] = await response.json();

  const levelData:LevelProps[] = data.filter(l => l?.id == id);
  setLevel(levelData[0]);
  }

  if (!level) {
    return (
      <div className="text-center p-10 bg-white/50 rounded-2xl">
        <p className="text-[#3E3636]/80">Level not found.</p>
      </div>
    );
  }

  const studyTip = STUDY_TIPS[levelId];
  const levelTag = LEVEL_TAGS[levelId] || "";

  return (
    <div className="max-w-4xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="relative text-center">
        <Link href={`/`} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#3E3636]/10 transition-colors duration-300"><ChevronLeft className="h-6 w-6 text-[#3E3636]" /></Link>
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-[#D72323]/10 text-[#D72323] text-xs font-bold tracking-wider">
            {levelTag}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#3E3636]/5 text-[#3E3636]/60 text-xs font-medium">
            {level.lessons.length} Lessons
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">{level?.title} Lessons</h2>
        <p className="mt-4 text-lg text-[#3E3636]/80">{level?.description}</p>
      </div>

      {/* Study Tips */}
      {studyTip && (
        <div className="mt-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shrink-0">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#3E3636] mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-amber-600" />
                Study Guide
              </h3>
              <p className="text-sm text-[#3E3636]/70 mb-3">{studyTip.tip}</p>
              <ol className="space-y-1.5">
                {studyTip.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#3E3636]/80">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
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

      <div className="mt-10 space-y-4">
        {level.lessons.length > 0 ?
          (level?.lessons?.map((lesson: LessonProps) =>
            <LessonItem key={lesson.id} lesson={lesson} />))
          : (
            <div className="text-center p-10 bg-white/50 rounded-2xl"><p className="text-[#3E3636]/80">Lessons for {level.title} are being prepared.</p></div>
          )}
      </div>
    </div>
  );
}

export default Lessons;