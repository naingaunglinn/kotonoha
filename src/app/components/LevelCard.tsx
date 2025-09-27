import {Award, ChevronRight} from "lucide-react";
import {LevelProps} from "@/types";
import Link from "next/link";

interface LevelCardProps {
  level: LevelProps;
}
const LevelCard = ({ level }:LevelCardProps) => {
  return (
    <Link href={`/level/${level.id}`} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col cursor-pointer">
      <div className="flex-grow">
        <div className="p-4 rounded-xl bg-[#F5EDED] w-min mb-6"><Award className="h-7 w-7 text-[#3E3636]" /></div>
        <h3 className="text-2xl font-bold text-[#3E3636]">{level.title}</h3>
        <p className="mt-2 text-[#3E3636]/70 leading-relaxed">{level.description}</p>
      </div>
      <div className="mt-8 flex items-center justify-end text-[#3E3636] font-bold transition-all duration-300 transform group-hover:text-[#D72323]">
        View Lessons
        <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
      </div>
    </Link>
  );
};

export default LevelCard;