import LevelCard from "@/app/components/LevelCard";
import {BasicModuleProps, LevelProps} from "@/types";
import FoundationsCard from "@/app/components/FoundationsCard";

interface DashboardProp {
  levels : LevelProps[],
  modules: BasicModuleProps[]
}

const HomeCard = ({ levels, modules }:DashboardProp) => {

  return (
    <div className="max-w-7xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">Your Learning Journey</h1>
        <p className="mt-6 max-w-2xl mx-auto text-xl text-[#3E3636]/80">Master Japanese by following the official JLPT path from N5 to N1.</p>
      </div>
      <div className="mt-20">
        <h2 className="text-3xl font-bold tracking-tight text-[#3E3636] text-center mb-10">Start with the Basics</h2>
        <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto">
          {
            modules.map((module) => (
                <FoundationsCard key={module.id} module={module} />
              )
            )
          }
        </div>
      </div>
      <div className={"mt-20"}>
        <h2 className="text-3xl font-bold tracking-tight text-[#3E3636] text-center mb-10">Prepare for the JLPT</h2>
        <div className="mt-20 grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {levels.map((level) => (<LevelCard key={level.id} level={level} />))}
        </div>
      </div>
    </div>
  )
};

export default HomeCard;