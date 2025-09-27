import {ChevronRight, Book, List, Headphones, BookOpen, BrainCircuit, LucideIcon} from "lucide-react";
import React from "react";
import {LessonContentPageProps} from "@/types";
import Link from "next/link";

const ICONS: Record<string, LucideIcon> = {
  book: Book,
  braincircuit: BrainCircuit,
  list: List,
  headphones: Headphones,
  bookopen: BookOpen,
};

const LessonItem = ({ lesson }:LessonContentPageProps) => {
  const iconKey = lesson.icon?.toLowerCase() ?? "book";
  const Icon = ICONS[iconKey] || Book;
  console.log(lesson);
  return (
    <Link href={`${lesson.level_id}/${lesson.route}`} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-xl hover:border-[#D72323]/50 transition-all duration-300 group flex items-center space-x-6 cursor-pointer">
      <div className="p-4 rounded-lg bg-[#F5EDED]"><Icon className="h-6 w-6 text-[#3E3636]" /></div>
      <div className="flex-grow">
        <h4 className="text-lg font-bold text-[#3E3636]">{lesson.title}</h4>
        <p className="text-sm text-[#3E3636]/70">{lesson.description}</p>
      </div>
      <div className="text-[#3E3636]/50 group-hover:text-[#D72323] transition-colors"><ChevronRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" /></div>
    </Link>
  );
};

export default LessonItem;