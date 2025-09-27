'use client'
import LessonItem from "@/app/components/LessonItem";
import {ChevronLeft} from "lucide-react";
import {LessonProps, LevelProps} from "@/types";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";


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

  console.log(level);

  if (!level) {
    return (
      <div className="text-center p-10 bg-white/50 rounded-2xl">
        <p className="text-[#3E3636]/80">Level not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="relative text-center">
        <Link href={`/`} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#3E3636]/10 transition-colors duration-300"><ChevronLeft className="h-6 w-6 text-[#3E3636]" /></Link>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">{level?.title} Lessons</h2>
        <p className="mt-4 text-lg text-[#3E3636]/80">{level?.description}</p>
      </div>
      <div className="mt-16 space-y-6">
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