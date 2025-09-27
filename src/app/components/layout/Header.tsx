import {User} from "lucide-react";

const AppHeader = () => (
  <header className="bg-[#F5EDED]/80 backdrop-blur-md sticky top-0 border-b border-[#3E3636]/10 z-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        <div className="flex items-center">
          <span className="text-3xl font-bold text-[#3E3636] tracking-tight">
            <span className="text-[#D72323]">葉</span> Konotoha
          </span>
        </div>
        <div className="flex items-center">
          <button className="p-3 rounded-full hover:bg-[#3E3636]/10 transition-colors duration-300">
            <User className="h-6 w-6 text-[#3E3636]" />
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default AppHeader;