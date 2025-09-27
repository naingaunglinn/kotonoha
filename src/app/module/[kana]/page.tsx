
import Link from "next/link";
import {ChevronLeft} from "lucide-react";

interface Params {
  params: {
    kana: string,
  }
}

// Define the shape of a single row in our final chart structure
interface ChartRow {
  char_row: string;
  characters: {
    kana: string | null;
    romaji: string | null;
  }[];
}

const Kana = async ({ params }: Params) => {
  const { kana } = await params;
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/character/${kana}.json`, {
    cache: 'no-store'
  });

  // Throw an error if the network response is not ok (e.g., 404 Not Found)
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // Parse the JSON data from the response
  const data = await response.json();

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="md:col-span-2 text-center p-10 bg-white/50 rounded-2xl">
          <p className="text-[#3E3636]/80">Content coming soon!</p>
        </div>
      </div>
    );
  }

  const newStructure:ChartRow[] = data;

  if (newStructure) {
    return (
      <div className="max-w-5xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="relative text-center mb-16 max-w-3xl mx-auto">
          <Link href={`/`} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#3E3636]/10 transition-colors duration-300">
            <ChevronLeft className="h-6 w-6 text-[#3E3636]" />
          </Link>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">{kana}</h2>
          {/*<p className="mt-4 text-lg text-[#3E3636]/80">{data?.description}</p>*/}
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* 1. The first .map() iterates through each ROW object (e.g., { char_row: 'k', characters: [...] }) */}
          {newStructure.map((row) => (
            <div key={row.char_row}>
              <div className={'grid grid-cols-5 sm:grid-cols-5 gap-2 sm:gap-4'}>
                {/* 2. The second .map() iterates through the CHARACTERS array inside each row object */}
                {row.characters.map((character, index) => (
                  <Link href={`${kana}/${character.romaji}`} key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-black/5 flex flex-col items-center justify-center aspect-square p-2 transition-all duration-300 hover:shadow-lg hover:border-[#D72323]/50 cursor-pointer">
                    {/* 3. Now you can correctly access the 'kana' and 'romaji' of each character */}
                    <h3 className="text-4xl md:text-5xl font-bold text-[#3E3636]">{character.kana}</h3>
                    <p className="text-md text-[#3E3636]/70 mt-1">{character.romaji}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default Kana;