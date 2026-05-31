import { ArrowRight } from "lucide-react";
import { BasicModuleProps } from "@/types";
import Link from "next/link";

interface FoundationsCardProps {
  module: BasicModuleProps;
}

// A representative glyph per script — sits as a tactile watermark on the flashcard.
const GLYPH: Record<string, string> = {
  hiragana: 'あ',
  katakana: 'ア',
};

const FoundationsCard = ({ module }: FoundationsCardProps) => {
  const glyph = GLYPH[(module.title ?? '').toLowerCase()] ?? 'あ';

  return (
    <Link
      href={`/module/${module.title}`}
      className="hover-lift group relative flex items-center gap-5 overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card"
    >
      {/* Paper flashcard glyph tile */}
      <div className="relative grid h-20 w-20 flex-shrink-0 place-items-center rounded-card border border-line bg-surface-alt">
        <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent/40" />
        <span className="jp text-4xl text-ink">{glyph}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-[family-name:var(--font-display)] text-xl capitalize tracking-tight text-ink">
          {module.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{module.description}</p>
        <span className="mt-3 inline-flex items-center text-sm font-bold text-ink transition-colors group-hover:text-accent">
          Practice
          <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
};

export default FoundationsCard;
