import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { readFile } from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";

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
    <div className="max-w-5xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="relative text-center mb-16 max-w-3xl mx-auto">
        <Link
          href="/"
          className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#1F150C]/10 transition-colors duration-300"
        >
          <ChevronLeft className="h-6 w-6 text-[#1F150C]" />
        </Link>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter capitalize">{kana}</h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {data.map((row) => (
          <div key={row.char_row}>
            <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 sm:gap-4">
              {row.characters.map((character, index) => (
                <Link
                  href={`${kana}/${character.romaji}`}
                  key={index}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl border border-black/5 flex flex-col items-center justify-center aspect-square p-2 transition-all duration-300 hover:shadow-lg hover:border-[#412D15]/50 cursor-pointer"
                >
                  <h3 className="text-4xl md:text-5xl font-bold text-[#1F150C]">{character.kana}</h3>
                  <p className="text-md text-[#1F150C]/70 mt-1">{character.romaji}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kana;
