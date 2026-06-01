import { User } from "lucide-react";
import Link from "next/link";

const AppHeader = () => (
  <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between sm:h-20">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="jp grid h-9 w-9 place-items-center rounded-card bg-ink text-[1.35rem] leading-none text-bg shadow-card transition-transform duration-300 group-hover:-rotate-6">
            葉
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-ink sm:text-2xl">
              Kotonoha
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-muted">
              ことのは · JLPT
            </span>
          </span>
        </Link>

        <button
          aria-label="Account"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink-muted transition-colors duration-300 hover:border-line-strong hover:text-ink"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </div>
  </header>
);

export default AppHeader;
