'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, BookOpen, Sparkles, Library } from 'lucide-react';
import { getMostRecent } from '@/utils/recentActivity';

const STATIC_ITEMS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/module/hiragana', label: 'Hiragana', icon: Sparkles, match: (p: string) => p.startsWith('/module/hiragana') },
  { href: '/module/katakana', label: 'Katakana', icon: Library, match: (p: string) => p.startsWith('/module/katakana') },
];

export default function BottomNav() {
  const pathname = usePathname() || '/';
  const [continueHref, setContinueHref] = useState('/level/5/vocab');

  useEffect(() => {
    const top = getMostRecent();
    if (top) setContinueHref(`/level/${top.levelId}/${top.category}`);
  }, [pathname]);

  const items = [
    STATIC_ITEMS[0],
    {
      href: continueHref,
      label: 'Study',
      icon: BookOpen,
      match: (p: string) => p.startsWith('/level'),
    },
    STATIC_ITEMS[1],
    STATIC_ITEMS[2],
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-[#E1DCC9]/95 backdrop-blur-md border-t border-[#1F150C]/10 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around h-16">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label} className="flex-1">
              <Link
                href={href}
                className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-[#412D15]' : 'text-[#1F150C]/55 hover:text-[#1F150C]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 ${active ? '' : 'opacity-80'}`} />
                <span className={`text-[10px] tracking-wide ${active ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
