'use client'
import VocabularyCard from "@/app/components/lesson/VocabularyCard";
import KanjiCard from "@/app/components/lesson/KanjiCard";
import GrammarPointCard from "@/app/components/lesson/GrammarPointCard";
import ReadingPassage from "@/app/components/lesson/ReadingPassage";
import ListeningExercise from "@/app/components/lesson/ListeningExercise";
import VocabularyQuiz from "@/app/components/lesson/VocabularyQuiz";
import { ChevronLeft, Shuffle, Home, ChevronRight, Eye, EyeOff, Calendar, RotateCcw, CheckCircle2, BrainCircuit } from "lucide-react";
import { GrammarProps, KanjiProps, VocabularyProps, ReadingProps, ListeningProps, PartOfSpeech } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
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
const COMPLETED_STORAGE_KEY = (levelId: string) => `kotonoha_vocab_completed_n${levelId}`;

// --- Helper: load/save completed set from localStorage ---
const loadCompletedSet = (levelId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(COMPLETED_STORAGE_KEY(levelId));
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch { /* ignore parse errors */ }
  return new Set();
};

const saveCompletedSet = (levelId: string, set: Set<string>) => {
  localStorage.setItem(COMPLETED_STORAGE_KEY(levelId), JSON.stringify([...set]));
};

// --- Pagination Component ---
const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-[#3E3636]/15 hover:bg-[#3E3636]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page Numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${page === currentPage
            ? 'bg-[#D72323] text-white shadow-lg shadow-[#D72323]/30 scale-110'
            : 'bg-white border border-[#3E3636]/15 text-[#3E3636] hover:bg-[#3E3636]/10'
            }`}
        >
          {page}
        </button>
      ))}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-[#3E3636]/15 hover:bg-[#3E3636]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Progress Bar Component ---
const ProgressBar = ({
  completedOnPage,
  totalOnPage,
  completedTotal,
  totalWords,
}: {
  completedOnPage: number;
  totalOnPage: number;
  completedTotal: number;
  totalWords: number;
}) => {
  const pagePercent = totalOnPage > 0 ? (completedOnPage / totalOnPage) * 100 : 0;
  const totalPercent = totalWords > 0 ? (completedTotal / totalWords) * 100 : 0;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-black/5 p-4 shadow-sm">
      {/* Page progress */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-[#3E3636]">Today&apos;s Progress</span>
        </div>
        <span className="text-sm font-bold text-emerald-600">
          {completedOnPage}/{totalOnPage}
        </span>
      </div>
      <div className="w-full h-3 bg-[#F5EDED] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pagePercent}%`,
            background: pagePercent === 100
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #D72323, #ef4444)',
          }}
        />
      </div>
      {pagePercent === 100 && (
        <p className="text-xs text-emerald-600 font-bold mt-1.5 text-center animate-pulse">
          🎉 All done for today! Great job!
        </p>
      )}

      {/* Total progress */}
      <div className="flex items-center justify-between mt-3 mb-1.5">
        <span className="text-xs text-[#3E3636]/50 font-medium">Overall</span>
        <span className="text-xs text-[#3E3636]/60 font-bold">
          {completedTotal}/{totalWords} ({Math.round(totalPercent)}%)
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#F5EDED] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3E3636]/30 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalPercent}%` }}
        />
      </div>
    </div>
  );
};

const LessonContentPage = () => {
  const params = useParams<{ id: string, lesson: string }>();
  const { id, lesson } = params!;
  const [vocab, setVocabData] = useState<VocabularyProps[] | null>([]);
  const [kanji, setKanjiData] = useState<KanjiProps[] | null>([]);
  const [grammar, setGrammar] = useState<GrammarProps[]>([]);
  const [reading, setReading] = useState<ReadingProps[]>([]);
  const [listening, setListening] = useState<ListeningProps[]>([]);

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

  // Load completed words from localStorage on mount
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

  // Toggle completion for a word
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

  // Reset all completions
  const handleResetCompletions = useCallback(() => {
    if (window.confirm('Reset all completed words? This will clear your progress.')) {
      setCompletedWords(new Set());
      saveCompletedSet(id, new Set());
    }
  }, [id]);

  // Save page to localStorage when it changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setIsShuffled(false); // Reset shuffle when changing page
    localStorage.setItem(`kotonoha_${lesson}_page_${id}`, String(page));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, lesson]);

  // Pagination calculations
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
    const endIndex = startIndex + WORDS_PER_PAGE;
    return vocab.slice(startIndex, endIndex);
  }, [vocab, currentPage]);

  const paginatedGrammar = useMemo(() => {
    if (!grammar || grammar.length === 0) return [];
    const startIndex = (currentPage - 1) * GRAMMAR_PER_PAGE;
    const endIndex = startIndex + GRAMMAR_PER_PAGE;
    return grammar.slice(startIndex, endIndex);
  }, [grammar, currentPage]);

  const paginatedKanji = useMemo(() => {
    if (!kanji || kanji.length === 0) return [];
    const startIndex = (currentPage - 1) * KANJI_PER_PAGE;
    const endIndex = startIndex + KANJI_PER_PAGE;
    return kanji.slice(startIndex, endIndex);
  }, [kanji, currentPage]);

  // Track shuffled version of current page
  const [shuffledPageVocab, setShuffledPageVocab] = useState<VocabularyProps[]>([]);

  const baseDisplayVocab = isShuffled ? shuffledPageVocab : paginatedVocab;

  // Apply POS filter on top of pagination/shuffle
  const displayVocab = useMemo(() => {
    if (posFilter === 'All') return baseDisplayVocab;
    return baseDisplayVocab.filter(
      item => item.part_of_speech === posFilter
    );
  }, [baseDisplayVocab, posFilter]);

  // Completion counts
  const completedOnPage = useMemo(() => {
    return paginatedVocab.filter(item => completedWords.has(item.word || '')).length;
  }, [paginatedVocab, completedWords]);

  const completedTotal = completedWords.size;

  useEffect(() => {
    const getVocabData = async (id: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/vocabulary/${id}/vocabulary.json`
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        // Normalize generated properties to ensure pagination and filters match perfectly
        const normalizedData = data.map((item: any) => {
          let pos = item.part_of_speech;
          if (pos) {
            const p = pos.toLowerCase();
            if (p.includes('noun') || p.includes('counter')) pos = 'Noun';
            else if (p.includes('verb')) pos = 'Verb';
            else if (p.includes('adj')) pos = 'Adjective';
            else if (p.includes('adv')) pos = 'Adverb';
            else if (p.includes('particle')) pos = 'Particle';
            else if (p.includes('expression') || p.includes('phrase') || p.includes('conjunction') || p.includes('suffix') || p.includes('pronoun')) pos = 'Expression';
            else pos = 'Noun';
          }

          let form = item.formality;
          if (form) {
            const f = form.toLowerCase();
            if (f.includes('formal')) form = 'Formal';
            else if (f.includes('casual')) form = 'Casual';
            else form = 'Neutral';
          }

          let tag = item.tag;
          if (Array.isArray(tag)) {
            tag = tag.length > 0 ? tag[0] : null;
          }
          if (tag && typeof tag === 'string') {
            tag = tag.charAt(0).toUpperCase() + tag.slice(1);
          }

          return { ...item, part_of_speech: pos, formality: form, tag };
        });

        setVocabData(normalizedData);
      } catch (error) {
        console.error("Failed to fetch vocabulary data:", error);
      }
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

    if (lesson === 'vocab') getVocabData(id);
    if (lesson === 'kanji') getKanjiData(id, lesson);
    if (lesson === 'grammar') getGrammarData(id, lesson);
    if (lesson === 'reading') getReadingData(id);
    if (lesson === 'listening') getListeningData(id);
  }, [lesson, id]);

  const handleRandomizeVocab = () => {
    if (paginatedVocab.length === 0) return;

    const shuffled = [...paginatedVocab];
    // Fisher-Yates Shuffle Algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setShuffledPageVocab(shuffled);
    setIsShuffled(true);
  };

  // Compute the global range for current page
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

        {/* Vocabulary-specific controls */}
        {lesson === 'vocab' && vocab && vocab.length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Day indicator + word range */}
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3E3636] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Day {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#3E3636]/60 font-medium">
                Words {pageStartWord}–{pageEndWord} of {vocab.length}
              </div>
            </div>

            {/* Progress Bar */}
            <ProgressBar
              completedOnPage={completedOnPage}
              totalOnPage={paginatedVocab.length}
              completedTotal={completedTotal}
              totalWords={vocab.length}
            />

            {/* Top Pagination */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            {/* POS Filter Buttons */}
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

            {/* Active filter indicator */}
            {posFilter !== 'All' && (
              <p className="text-xs text-center text-[#3E3636]/50">
                Showing <span className="font-bold text-[#D72323]">{displayVocab.length}</span> {posFilter}s on this page
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleRandomizeVocab}
                className="flex items-center gap-2 px-6 py-2 bg-[#3E3636] text-white rounded-full hover:bg-[#3E3636]/80 transition-all active:scale-95 shadow-md"
              >
                <Shuffle className="w-4 h-4" />
                <span>Shuffle</span>
              </button>

              {/* Quiz button */}
              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center gap-2 px-6 py-2 bg-[#D72323] text-white rounded-full hover:bg-[#b91c1c] transition-all active:scale-95 shadow-md"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Quiz</span>
              </button>

              {/* Reset completions button */}
              {completedTotal > 0 && (
                <button
                  onClick={handleResetCompletions}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#3E3636] border border-[#3E3636]/20 hover:border-red-400 hover:text-red-500 transition-all active:scale-95 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Progress</span>
                </button>
              )}

              {/* Global Show/Hide Toggles */}
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

        {/* Grammar-specific controls */}
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

        {/* Kanji-specific controls */}
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

          {/* Bottom Pagination for vocab */}
          {lesson === 'vocab' && vocab && vocab.length > 0 && (
            <div className="mt-12 space-y-4">
              {/* Bottom word range */}
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

          {/* Bottom Pagination for grammar */}
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

          {/* Bottom Pagination for kanji */}
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

      {/* Quiz Modal */}
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