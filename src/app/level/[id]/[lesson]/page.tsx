'use client'
import VocabularyCard from "@/app/components/lesson/VocabularyCard";
import KanjiCard from "@/app/components/lesson/KanjiCard";
import GrammarPointCard from "@/app/components/lesson/GrammarPointCard";
import ReadingPassage from "@/app/components/lesson/ReadingPassage";
import ListeningExercise from "@/app/components/lesson/ListeningExercise";
import VocabularyQuiz from "@/app/components/lesson/VocabularyQuiz";
import PaginationControls from "@/app/components/lesson/PaginationControls";
import ProgressBar from "@/app/components/lesson/ProgressBar";
import { ChevronLeft, Shuffle, Home, ChevronRight, Eye, EyeOff, Calendar, RotateCcw, BrainCircuit } from "lucide-react";
import { VocabularyProps, PartOfSpeech } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { loadCompletedSet, saveCompletedSet } from "./lessonStorage";
import { useLessonData } from "./useLessonData";

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

const WORDS_PER_PAGE = 80;
const GRAMMAR_PER_PAGE = 6;
const KANJI_PER_PAGE = 12;

const POS_FILTERS: Array<{ label: string; value: PartOfSpeech | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: '名詞 Noun', value: 'Noun' },
  { label: '動詞 Verb', value: 'Verb' },
  { label: '形容詞 Adj', value: 'Adjective' },
  { label: '副詞 Adv', value: 'Adverb' },
  { label: '助詞 Part', value: 'Particle' },
  { label: '表現 Expr', value: 'Expression' },
];

const LessonContentPage = () => {
  const params = useParams<{ id: string, lesson: string }>();
  const { id, lesson } = params!;
  const { vocab, kanji, grammar, reading, listening } = useLessonData(lesson, id);

  // Global show/hide state for vocabulary
  const [globalShowRomaji, setGlobalShowRomaji] = useState(false);
  const [globalShowEnglish, setGlobalShowEnglish] = useState(false);
  const [globalShowMyanmar, setGlobalShowMyanmar] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isShuffled, setIsShuffled] = useState(false);

  // Completion tracking state
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);

  // POS filter (session-only, not persisted)
  const [posFilter, setPosFilter] = useState<PartOfSpeech | 'All'>('All');

  useEffect(() => {
    if (lesson === 'vocab') {
      setCompletedWords(loadCompletedSet(id));
    }

    const savedPage = localStorage.getItem(`kotonoha_${lesson}_page_${id}`);
    if (savedPage) {
      const parsed = parseInt(savedPage, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        setCurrentPage(parsed);
      }
    } else if (lesson === 'vocab') {
      const oldSavedPage = localStorage.getItem(`kotonoha_vocab_page_${id}`);
      if (oldSavedPage) {
        const parsed = parseInt(oldSavedPage, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          setCurrentPage(parsed);
        }
      }
    }
  }, [lesson, id]);

  const handleToggleComplete = useCallback((word: string) => {
    setCompletedWords(prev => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      saveCompletedSet(id, next);
      return next;
    });
  }, [id]);

  const handleResetCompletions = useCallback(() => {
    if (window.confirm('Reset all completed words? This will clear your progress.')) {
      setCompletedWords(new Set());
      saveCompletedSet(id, new Set());
    }
  }, [id]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setIsShuffled(false);
    localStorage.setItem(`kotonoha_${lesson}_page_${id}`, String(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, lesson]);

  const totalPages = useMemo(() => {
    if (lesson === 'vocab') {
      if (!vocab || vocab.length === 0) return 1;
      return Math.ceil(vocab.length / WORDS_PER_PAGE);
    } else if (lesson === 'grammar') {
      if (!grammar || grammar.length === 0) return 1;
      return Math.ceil(grammar.length / GRAMMAR_PER_PAGE);
    } else if (lesson === 'kanji') {
      if (!kanji || kanji.length === 0) return 1;
      return Math.ceil(kanji.length / KANJI_PER_PAGE);
    }
    return 1;
  }, [vocab, grammar, kanji, lesson]);

  const paginatedVocab = useMemo(() => {
    if (!vocab || vocab.length === 0) return [];
    const startIndex = (currentPage - 1) * WORDS_PER_PAGE;
    return vocab.slice(startIndex, startIndex + WORDS_PER_PAGE);
  }, [vocab, currentPage]);

  const paginatedGrammar = useMemo(() => {
    if (!grammar || grammar.length === 0) return [];
    const startIndex = (currentPage - 1) * GRAMMAR_PER_PAGE;
    return grammar.slice(startIndex, startIndex + GRAMMAR_PER_PAGE);
  }, [grammar, currentPage]);

  const paginatedKanji = useMemo(() => {
    if (!kanji || kanji.length === 0) return [];
    const startIndex = (currentPage - 1) * KANJI_PER_PAGE;
    return kanji.slice(startIndex, startIndex + KANJI_PER_PAGE);
  }, [kanji, currentPage]);

  const [shuffledPageVocab, setShuffledPageVocab] = useState<VocabularyProps[]>([]);
  const baseDisplayVocab = isShuffled ? shuffledPageVocab : paginatedVocab;

  const displayVocab = useMemo(() => {
    if (posFilter === 'All') return baseDisplayVocab;
    return baseDisplayVocab.filter(item => item.part_of_speech === posFilter);
  }, [baseDisplayVocab, posFilter]);

  const completedOnPage = useMemo(() => {
    return paginatedVocab.filter(item => completedWords.has(item.word || '')).length;
  }, [paginatedVocab, completedWords]);

  const completedTotal = completedWords.size;

  const handleRandomizeVocab = () => {
    if (paginatedVocab.length === 0) return;
    const shuffled = [...paginatedVocab];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledPageVocab(shuffled);
    setIsShuffled(true);
  };

  const pageStartWord = (currentPage - 1) * WORDS_PER_PAGE + 1;
  const pageEndWord = Math.min(currentPage * WORDS_PER_PAGE, vocab?.length || 0);

  const grammarStart = (currentPage - 1) * GRAMMAR_PER_PAGE + 1;
  const grammarEnd = Math.min(currentPage * GRAMMAR_PER_PAGE, grammar?.length || 0);

  const kanjiStart = (currentPage - 1) * KANJI_PER_PAGE + 1;
  const kanjiEnd = Math.min(currentPage * KANJI_PER_PAGE, kanji?.length || 0);

  let content;
  let header;
  let gridLayout = "grid-cols-1 md:grid-cols-4 gap-6";

  if (lesson == 'vocab') {
    if (vocab && vocab.length > 0) {
      content = displayVocab.map((item, index) => (
        <VocabularyCard
          key={index}
          item={item}
          label={isShuffled ? undefined : (pageStartWord + index)}
          isCompleted={completedWords.has(item.word || '')}
          onToggleComplete={handleToggleComplete}
          globalShowRomaji={globalShowRomaji}
          globalShowEnglish={globalShowEnglish}
          globalShowMyanmar={globalShowMyanmar}
        />
      ));
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
    if (kanji && kanji.length > 0) {
      content = paginatedKanji.map(item => <KanjiCard key={item.word} item={item} />);
    }
  }
  if (lesson == 'grammar') {
    header = {
      'title': 'Grammar',
      'description': `Understand ${grammar?.length} basic sentence structures and particles.`
    }
    if (grammar && grammar.length > 0) {
      content = paginatedGrammar.map((item, index) => <GrammarPointCard key={index} item={item} />);
    }
  }
  if (lesson == 'reading') {
    gridLayout = "grid-cols-1 gap-4";
    header = {
      'title': 'Reading',
      'description': `Practice comprehension with ${reading?.length} beginner-friendly passages.`
    }
    if (reading && reading.length > 0) {
      content = reading.map((item, index) => <ReadingPassage key={index} data={item} />);
    }
  }
  if (lesson == 'listening') {
    gridLayout = "grid-cols-1 gap-4";
    header = {
      'title': 'Listening',
      'description': `Train your ear with ${listening?.length} real-life conversation exercises.`
    }
    if (listening && listening.length > 0) {
      content = listening.map((item, index) => <ListeningExercise key={index} data={item} />);
    }
  }

  const levelLabel = LEVEL_LABELS[id] || `Level ${id}`;
  const lessonLabel = LESSON_LABELS[lesson] || lesson;

  return (
    <div className="max-w-8xl mx-auto pt-10 pb-24 px-4 sm:px-6 lg:px-8">
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

        {lesson === 'vocab' && vocab && vocab.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3E3636] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Day {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#3E3636]/60 font-medium">
                Words {pageStartWord}–{pageEndWord} of {vocab.length}
              </div>
            </div>

            <ProgressBar
              completedOnPage={completedOnPage}
              totalOnPage={paginatedVocab.length}
              completedTotal={completedTotal}
              totalWords={vocab.length}
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            <div className="flex flex-wrap justify-center gap-2">
              {POS_FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setPosFilter(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${posFilter === value
                    ? 'bg-[#D72323] text-white shadow-md shadow-[#D72323]/30'
                    : 'bg-white text-[#3E3636] border border-[#3E3636]/15 hover:border-[#D72323]/40'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {posFilter !== 'All' && (
              <p className="text-xs text-center text-[#3E3636]/50">
                Showing <span className="font-bold text-[#D72323]">{displayVocab.length}</span> {posFilter}s on this page
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleRandomizeVocab}
                className="flex items-center gap-2 px-6 py-2 bg-[#3E3636] text-white rounded-full hover:bg-[#3E3636]/80 transition-all active:scale-95 shadow-md"
              >
                <Shuffle className="w-4 h-4" />
                <span>Shuffle</span>
              </button>

              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center gap-2 px-6 py-2 bg-[#D72323] text-white rounded-full hover:bg-[#b91c1c] transition-all active:scale-95 shadow-md"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Quiz</span>
              </button>

              {completedTotal > 0 && (
                <button
                  onClick={handleResetCompletions}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#3E3636] border border-[#3E3636]/20 hover:border-red-400 hover:text-red-500 transition-all active:scale-95 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Progress</span>
                </button>
              )}

              <button
                onClick={() => setGlobalShowRomaji(!globalShowRomaji)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 shadow-md ${globalShowRomaji
                  ? 'bg-[#D72323] text-white'
                  : 'bg-white text-[#3E3636] border border-[#3E3636]/20'
                  }`}
              >
                {globalShowRomaji ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>Romaji</span>
              </button>
              <button
                onClick={() => setGlobalShowEnglish(!globalShowEnglish)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 shadow-md ${globalShowEnglish
                  ? 'bg-[#D72323] text-white'
                  : 'bg-white text-[#3E3636] border border-[#3E3636]/20'
                  }`}
              >
                {globalShowEnglish ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>English</span>
              </button>
              <button
                onClick={() => setGlobalShowMyanmar(!globalShowMyanmar)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 shadow-md ${globalShowMyanmar
                  ? 'bg-[#D72323] text-white'
                  : 'bg-white text-[#3E3636] border border-[#3E3636]/20'
                  }`}
              >
                {globalShowMyanmar ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>Myanmar</span>
              </button>
            </div>
          </div>
        )}

        {lesson === 'grammar' && grammar && grammar.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3E3636] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Page {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#3E3636]/60 font-medium">
                Points {grammarStart}–{grammarEnd} of {grammar.length}
              </div>
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {lesson === 'kanji' && kanji && kanji.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3E3636] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Page {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#3E3636]/60 font-medium">
                Characters {kanjiStart}–{kanjiEnd} of {kanji.length}
              </div>
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
      {content ? (
        <>
          <div className={`grid ${gridLayout}`}>
            {content}
          </div>

          {lesson === 'vocab' && vocab && vocab.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="text-center text-sm text-[#3E3636]/60 font-medium">
                Words {pageStartWord}–{pageEndWord} of {vocab.length}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {lesson === 'grammar' && grammar && grammar.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="text-center text-sm text-[#3E3636]/60 font-medium">
                Points {grammarStart}–{grammarEnd} of {grammar.length}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {lesson === 'kanji' && kanji && kanji.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="text-center text-sm text-[#3E3636]/60 font-medium">
                Characters {kanjiStart}–{kanjiEnd} of {kanji.length}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="md:col-span-2 text-center p-10 bg-white/50 rounded-2xl">
          <p className="text-[#3E3636]/80">Content coming soon!</p>
        </div>
      )}

      {showQuiz && vocab && vocab.length > 0 && (
        <VocabularyQuiz
          vocab={vocab}
          pageVocab={paginatedVocab}
          completedWords={completedWords}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
};

export default LessonContentPage
