'use client';
import Link from 'next/link';

const LEVELS: Array<{ id: string; label: string }> = [
  { id: '5', label: 'N5' },
  { id: '4', label: 'N4' },
  { id: '3', label: 'N3' },
  { id: '2', label: 'N2' },
  { id: '1', label: 'N1' },
];

interface LevelSwitcherProps {
  currentId: string;
  lesson: string;
}

export default function LevelSwitcher({ currentId, lesson }: LevelSwitcherProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-bold text-[#3E3636]/40 uppercase tracking-wider mr-1">Jump to</span>
      {LEVELS.map(({ id, label }) => {
        const isCurrent = id === currentId;
        return (
          <Link
            key={id}
            href={`/level/${id}/${lesson}`}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
              isCurrent
                ? 'bg-[#D72323] text-white shadow-md shadow-[#D72323]/30 cursor-default'
                : 'bg-white text-[#3E3636] border border-[#3E3636]/15 hover:border-[#D72323]/40'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
