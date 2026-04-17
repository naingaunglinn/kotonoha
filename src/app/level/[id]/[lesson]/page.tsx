'use client'
import VocabularyCard from "@/app/components/lesson/VocabularyCard";
import KanjiCard from "@/app/components/lesson/KanjiCard";
import GrammarPointCard from "@/app/components/lesson/GrammarPointCard";
import ReadingPassage from "@/app/components/lesson/ReadingPassage";
import ListeningExercise from "@/app/components/lesson/ListeningExercise";
import {ChevronLeft, Shuffle, Home, ChevronRight} from "lucide-react";
import {GrammarProps, KanjiProps, VocabularyProps, ReadingProps, ListeningProps} from "@/types";
import {createClient} from "@/utils/supabase/client";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import Link from "next/link";

const LEVEL_LABELS: Record<string, string> = {
  "5": "N5",
  "4": "N4",
  "3": "N3",
  "2": "N2",
  "1": "N1",
};

const LESSON_LABELS: Record<string, string> = {
  "vocab": "Vocabulary",
  "kanji": "Kanji",
  "grammar": "Grammar",
  "reading": "Reading",
  "listening": "Listening",
};

const LessonContentPage = () => {
  const params = useParams<{id: string, lesson: string}>();
  const {id, lesson} = params!;
  const supabase = createClient();
  const [ vocab, setVocabData ] = useState<VocabularyProps[]| null>([]);
  const [ kanji, setKanjiData ] = useState<KanjiProps[]| null>([]);
  const [ grammar, setGrammar ] = useState<GrammarProps[]>([]);
  const [ reading, setReading ] = useState<ReadingProps[]>([]);
  const [ listening, setListening ] = useState<ListeningProps[]>([]);

  useEffect(() => {
    const getvocabData = async (id: string) => {
      const { data } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('level_id', id)
        .eq('status', true);

      setVocabData(data);
    };

    const getKanjiData = async (id: string, lesson: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/kanji/${id}/${lesson}.json`
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setKanjiData(data);
      } catch (error) {
        console.error("Failed to fetch local modules:", error);
      }
    };

    const getGrammarData = async (id: string, lesson: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/grammar/${id}/${lesson}.json`
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setGrammar(data);
      } catch (error) {
        console.error("Failed to fetch local modules:", error);
      }
    };

    const getReadingData = async (id: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/reading/${id}/reading.json`
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setReading(data);
      } catch (error) {
        console.error("Failed to fetch reading data:", error);
      }
    };

    const getListeningData = async (id: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/listening/${id}/listening.json`
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setListening(data);
      } catch (error) {
        console.error("Failed to fetch listening data:", error);
      }
    };

    if (lesson === 'vocab') getvocabData(id);
    if (lesson === 'kanji') getKanjiData(id, lesson);
    if (lesson === 'grammar') getGrammarData(id, lesson);
    if (lesson === 'reading') getReadingData(id);
    if (lesson === 'listening') getListeningData(id);
  }, [supabase, lesson, id]);

  const handleRandomizeVocab = () => {
    if (!vocab || vocab.length === 0) return;

    // Create a copy to avoid mutating state directly
    const shuffled = [...vocab];

    // Fisher-Yates Shuffle Algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setVocabData(shuffled);
  };

  let content;
  let header;
  let gridLayout = "grid-cols-1 md:grid-cols-3 gap-6";

    if (lesson == 'vocab') {
      if(vocab) {
        content = vocab?.map((item, index) => <VocabularyCard key={index} item={item}/>);
        header = {
          'title': 'Vocabulary',
          'description': `Master ${vocab.length} essential words for daily life conversations.`
        }
      }
    }
    if (lesson == 'kanji') {
      header = {
        'title': 'Kanji',
        'description': `Learn ${kanji?.length} fundamental kanji characters with readings and meanings.`
      }
      if(kanji) {
        content = kanji?.map(item => <KanjiCard key={item.word} item={item}/>);
      }
    }
    if (lesson == 'grammar') {
      header = {
        'title': 'Grammar',
        'description': `Understand ${grammar?.length} basic sentence structures and particles.`
      }
      if(grammar) {
        content = grammar?.map((item, index) => <GrammarPointCard key={index} item={item} />);
      }
    }
    if (lesson == 'reading') {
      gridLayout = "grid-cols-1 gap-4";
      header = {
        'title': 'Reading',
        'description': `Practice comprehension with ${reading?.length} beginner-friendly passages.`
      }
      if(reading && reading.length > 0) {
        content = reading.map((item, index) => <ReadingPassage key={index} data={item} />);
      }
    }
    if (lesson == 'listening') {
      gridLayout = "grid-cols-1 gap-4";
      header = {
        'title': 'Listening',
        'description': `Train your ear with ${listening?.length} real-life conversation exercises.`
      }
      if(listening && listening.length > 0) {
        content = listening.map((item, index) => <ListeningExercise key={index} data={item} />);
      }
    }

  const levelLabel = LEVEL_LABELS[id] || `Level ${id}`;
  const lessonLabel = LESSON_LABELS[lesson] || lesson;

  return (
    <div className="max-w-5xl mx-auto pt-10 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#3E3636]/50 mb-8">
        <Link href="/" className="flex items-center gap-1 hover:text-[#D72323] transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/level/${id}`} className="hover:text-[#D72323] transition-colors">
          {levelLabel}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#3E3636] font-medium">{lessonLabel}</span>
      </nav>

      <div className="relative text-center mb-12 max-w-3xl mx-auto">
        <Link href={`/level/${id}`} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#3E3636]/10 transition-colors duration-300"><ChevronLeft className="h-6 w-6 text-[#3E3636]" /></Link>
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-[#D72323]/10 text-[#D72323] text-xs font-bold tracking-wider">
            {levelLabel}
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">{header?.title}</h2>
        <p className="mt-3 text-lg text-[#3E3636]/70">{header?.description}</p>
        {lesson === 'vocab' && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleRandomizeVocab}
              className="flex items-center gap-2 px-6 py-2 bg-[#3E3636] text-white rounded-full hover:bg-[#3E3636]/80 transition-all active:scale-95 shadow-md"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        )}
      </div>
      {content ? (
        <div className={`grid ${gridLayout}`}>
          {content}
        </div>
      ):(
        <div className="md:col-span-2 text-center p-10 bg-white/50 rounded-2xl">
          <p className="text-[#3E3636]/80">Content coming soon!</p>
        </div>
      )}
    </div>
  );
};

export default LessonContentPage