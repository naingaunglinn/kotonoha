import {User} from "lucide-react";
import Link from "next/link";

const AppHeader = () => (
  <header className="bg-[#E1DCC9]/80 backdrop-blur-md sticky top-0 border-b border-[#1F150C]/10 z-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        <div className="flex items-center">
          <Link href={"/"} className="text-3xl font-bold text-[#1F150C] tracking-tight">
            <span className="text-[#412D15]">葉</span> Kotonoha
          </Link>
        </div>
        <div className="flex items-center">
          <button className="p-3 rounded-full hover:bg-[#1F150C]/10 transition-colors duration-300">
            <User className="h-6 w-6 text-[#1F150C]" />
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default AppHeader;