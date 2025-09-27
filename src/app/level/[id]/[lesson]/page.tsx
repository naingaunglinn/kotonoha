'use client'
import VocabularyCard from "@/app/components/lesson/VocabularyCard";
import KanjiCard from "@/app/components/lesson/KanjiCard";
import GrammarPointCard from "@/app/components/lesson/GrammarPointCard";
// import ReadingPassage from "@/app/components/lesson/ReadingPassage";
// import ListeningExercise from "@/app/components/lesson/ListeningExercise";
import {ChevronLeft} from "lucide-react";
import {GrammarProps, KanjiProps, VocabularyProps} from "@/types";
import {createClient} from "@/utils/supabase/client";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import Link from "next/link";

const LessonContentPage = () => {
  const params = useParams<{id: string, lesson: string}>();
  const {id, lesson} = params!;
  console.log(lesson);
  const supabase = createClient();
  const [ vocab, setVocabData ] = useState<VocabularyProps[]| null>([]);
  const [ kanji, setKanjiData ] = useState<KanjiProps[]| null>([]);
  const [ grammar, setGrammar ] = useState<GrammarProps[]>([]);

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

    if (lesson === 'vocab') getvocabData(id);
    if (lesson === 'kanji') getKanjiData(id, lesson);
    if (lesson === 'grammar') getGrammarData(id, lesson);
  }, [supabase, lesson, id]);

  let content;
  let header;
  const gridLayout = "grid-cols-1 md:grid-cols-3 gap-6"; // Default layout
  //


    if (lesson == 'vocab') {
      if(vocab) {
        content = vocab?.map((item, index) => <VocabularyCard key={index} item={item}/>);
        header = {
          'title': 'Vocabulary',
          'description': `Learn the first ${vocab.length} essential words.`
        }
      }
    }
    if (lesson == 'kanji') {
      header = {
        'title': 'Kanji',
        'description': `Master the first ${kanji?.length} kanji characters.`
      }
      if(kanji) {
        content = kanji?.map(item => <KanjiCard key={item.word} item={item}/>);
      }
    }
    if (lesson == 'grammar') {
      header = {
        'title': 'Grammar',
        'description': `Basic sentence structures and particles.`
      }
      if(grammar) {
        content = grammar?.map((item, index) => <GrammarPointCard key={index} item={item} />);
      }
    }
    if (lesson == 'reading') {
      header = {
        'title': 'Reading',
        'description': `Practice with simple passages.`
      }
    }

    // else if (lesson.id.includes('kanji')) {
  //   content = lesson.content?.map(item => <KanjiCard key={item.kanji} item={item} />);
  //   gridLayout = "grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6";
  // } else if (lesson.id.includes('grammar')) {
  //   content = lesson.content?.map((item, index) => <GrammarPointCard key={index} item={item} />);
  // } else if (lesson.id.includes('reading')) {
  //   content = lesson.content?.map((item, index) => <ReadingPassage key={index} item={item} />);
  // } else if (lesson.id.includes('listening')) {
  //   content = lesson.content?.map((item, index) => <ListeningExercise key={index} item={item} />);
  // }

  return (
    <div className="max-w-5xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="relative text-center mb-16 max-w-3xl mx-auto">
        <Link href={`/level/${id}`} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#3E3636]/10 transition-colors duration-300"><ChevronLeft className="h-6 w-6 text-[#3E3636]" /></Link>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">{header?.title}</h2>
        <p className="mt-4 text-lg text-[#3E3636]/80">{header?.description}</p>
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