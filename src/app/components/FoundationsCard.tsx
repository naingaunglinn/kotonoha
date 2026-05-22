import {ChevronRight, PenSquare} from "lucide-react";
import {BasicModuleProps} from "@/types";
import Link from "next/link";

interface FoundationsCardProps {
  module : BasicModuleProps;
}

const FoundationsCard = ({ module } : FoundationsCardProps ) => {
  return (
    <Link
      href={`/module/${module.title}`}
      className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-black/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col cursor-pointer"
    >
      <div className="flex-grow">
        <div className="p-2.5 rounded-xl bg-[#E1DCC9] w-min mb-4">
          <PenSquare className="h-5 w-5 text-[#1F150C]" />
        </div>
        <h3 className="text-lg font-bold text-[#1F150C]">{module.title}</h3>
        <p className="mt-1 text-sm text-[#1F150C]/70 leading-relaxed line-clamp-2">{module.description}</p>
      </div>
      <div className="mt-5 flex items-center justify-end text-[#1F150C] font-bold text-sm transition-all duration-300 transform group-hover:text-[#412D15]">
        Start <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </Link>
  )
}

export default FoundationsCard;
