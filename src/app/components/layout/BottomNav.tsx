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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      aria-label="Primary"
    >
      <ul className="flex h-16 items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label} className="flex-1">
              <Link
                href={href}
                className={`relative flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                  active ? 'text-accent' : 'text-ink-muted hover:text-ink'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />
                )}
                <Icon className="h-5 w-5" />
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
