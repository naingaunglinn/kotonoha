'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, BookOpen, Sparkles, Library } from 'lucide-react';
import { getMostRecent } from '@/utils/recentActivity';

const LEVELS = [
  { id: '5', label: 'N5', color: 'var(--color-n5)' },
  { id: '4', label: 'N4', color: 'var(--color-n4)' },
  { id: '3', label: 'N3', color: 'var(--color-n3)' },
  { id: '2', label: 'N2', color: 'var(--color-n2)' },
  { id: '1', label: 'N1', color: 'var(--color-n1)' },
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
    className={`group relative flex h-11 w-11 items-center justify-center rounded-card transition-all duration-300 ${
      active
        ? 'bg-ink text-bg shadow-card'
        : 'text-ink-muted hover:bg-surface hover:text-ink'
    }`}
  >
    <Icon className="h-5 w-5" />
    <span className="pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-chip bg-ink px-2.5 py-1 text-xs font-semibold text-bg opacity-0 shadow-float transition-opacity duration-200 group-hover:opacity-100">
      {label}
    </span>
  </Link>
);

interface RailLevelProps {
  id: string;
  label: string;
  color: string;
  active: boolean;
}

const RailLevel = ({ id, label, color, active }: RailLevelProps) => (
  <Link
    href={`/level/${id}`}
    title={`JLPT ${label}`}
    aria-label={`JLPT ${label}`}
    aria-current={active ? 'page' : undefined}
    className="group relative flex h-11 w-11 items-center justify-center rounded-card text-xs font-bold transition-all duration-300"
    style={
      active
        ? { background: color, color: '#fff', boxShadow: 'var(--shadow-card)' }
        : undefined
    }
  >
    {!active && (
      <span
        className="absolute left-1.5 h-5 w-1 rounded-full opacity-70"
        style={{ background: color }}
      />
    )}
    <span className={active ? '' : 'text-ink-muted transition-colors group-hover:text-ink'}>
      {label}
    </span>
    <span className="pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-chip bg-ink px-2.5 py-1 text-xs font-semibold text-bg opacity-0 shadow-float transition-opacity duration-200 group-hover:opacity-100">
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
      className="fixed bottom-0 left-0 top-16 z-20 hidden w-[4.5rem] flex-col items-center gap-1.5 overflow-y-auto border-r border-line bg-surface-alt/70 py-5 backdrop-blur-md sm:top-20 sm:flex"
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

      <div className="my-1.5 h-px w-8 bg-line" />

      {LEVELS.map(({ id, label, color }) => (
        <RailLevel key={id} id={id} label={label} color={color} active={activeLevel === id} />
      ))}
    </aside>
  );
}
