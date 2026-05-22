'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, BookOpen, Sparkles, Library } from 'lucide-react';
import { getMostRecent } from '@/utils/recentActivity';

const LEVELS = [
  { id: '5', label: 'N5' },
  { id: '4', label: 'N4' },
  { id: '3', label: 'N3' },
  { id: '2', label: 'N2' },
  { id: '1', label: 'N1' },
];

interface RailItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

const RailIcon = ({ href, label, icon: Icon, active }: RailItemProps) => (
  <Link
    href={href}
    title={label}
    aria-label={label}
    aria-current={active ? 'page' : undefined}
    className={`group relative w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
      active
        ? 'bg-[#1F150C] text-white shadow-md'
        : 'text-[#1F150C]/60 hover:text-[#1F150C] hover:bg-[#1F150C]/5'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#1F150C] text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
      {label}
    </span>
  </Link>
);

interface RailLevelProps {
  id: string;
  label: string;
  active: boolean;
}

const RailLevel = ({ id, label, active }: RailLevelProps) => (
  <Link
    href={`/level/${id}`}
    title={`JLPT ${label}`}
    aria-label={`JLPT ${label}`}
    aria-current={active ? 'page' : undefined}
    className={`group relative w-11 h-11 flex items-center justify-center rounded-xl text-xs font-extrabold transition-all ${
      active
        ? 'bg-[#412D15] text-white shadow-md'
        : 'text-[#1F150C]/55 hover:text-[#412D15] hover:bg-[#412D15]/10 border border-transparent hover:border-[#412D15]/20'
    }`}
  >
    {label}
    <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#1F150C] text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
      JLPT {label}
    </span>
  </Link>
);

export default function SideNav() {
  const pathname = usePathname() || '/';
  const [continueHref, setContinueHref] = useState('/level/5/vocab');

  useEffect(() => {
    const top = getMostRecent();
    if (top) setContinueHref(`/level/${top.levelId}/${top.category}`);
  }, [pathname]);

  const levelMatch = pathname.match(/^\/level\/(\d+)/);
  const activeLevel = levelMatch?.[1];

  return (
    <aside
      className="hidden sm:flex fixed left-0 top-20 bottom-0 w-16 z-20 bg-[#E1DCC9]/85 backdrop-blur-md border-r border-[#1F150C]/10 flex-col items-center py-4 gap-1.5 overflow-y-auto"
      aria-label="Primary"
    >
      <RailIcon href="/" label="Home" icon={Home} active={pathname === '/'} />
      <RailIcon
        href={continueHref}
        label="Continue studying"
        icon={BookOpen}
        active={pathname.startsWith('/level') && !!pathname.match(/\/[a-z]+$/)}
      />
      <RailIcon
        href="/module/hiragana"
        label="Hiragana"
        icon={Sparkles}
        active={pathname.startsWith('/module/hiragana')}
      />
      <RailIcon
        href="/module/katakana"
        label="Katakana"
        icon={Library}
        active={pathname.startsWith('/module/katakana')}
      />

      <div className="w-8 my-1 border-t border-[#1F150C]/10" />

      {LEVELS.map(({ id, label }) => (
        <RailLevel key={id} id={id} label={label} active={activeLevel === id} />
      ))}
    </aside>
  );
}
