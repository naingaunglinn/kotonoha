import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { readFile } from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import KanaGrid from "@/app/components/KanaGrid";

interface Params {
  params: Promise<{ kana: string }>;
}

interface ChartRow {
  char_row: string;
  characters: {
    kana: string | null;
    romaji: string | null;
  }[];
}

const ALLOWED_KANA = new Set(['hiragana', 'katakana']);

const KANA_GLYPH: Record<string, string> = { hiragana: 'あ', katakana: 'ア' };

const Kana = async ({ params }: Params) => {
  const { kana } = await params;

  if (!ALLOWED_KANA.has(kana)) notFound();

  const filePath = path.join(process.cwd(), 'public', 'data', 'character', `${kana}.json`);
  let data: ChartRow[];
  try {
    const raw = await readFile(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      {/* Header band */}
      <div className="washi relative mb-8 overflow-hidden rounded-[20px] px-6 py-7 text-bg shadow-float">
        <span aria-hidden className="jp pointer-events-none absolute -right-2 -top-8 select-none text-[12rem] leading-none text-white/[0.07]">
          {KANA_GLYPH[kana]}
        </span>
        <div className="relative flex items-center gap-3">
          <Link
            href="/"
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white/10 text-bg transition-colors hover:bg-white/20"
            aria-label="Back to home"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl capitalize tracking-tight sm:text-4xl">{kana}</h1>
            <p className="mt-0.5 text-sm text-white/65">Tap a character to study stroke order, practice, and quiz.</p>
          </div>
        </div>
      </div>

      <KanaGrid kana={kana} rows={data} />
    </div>
  );
};

export default Kana;
