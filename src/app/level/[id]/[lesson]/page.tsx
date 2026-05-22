'use client'
import VocabularyCard from "@/app/components/lesson/VocabularyCard";
import KanjiCard from "@/app/components/lesson/KanjiCard";
import GrammarPointCard from "@/app/components/lesson/GrammarPointCard";
import ReadingPassage from "@/app/components/lesson/ReadingPassage";
import ListeningExercise from "@/app/components/lesson/ListeningExercise";
import VocabularyQuiz from "@/app/components/lesson/VocabularyQuiz";
import KanjiQuiz from "@/app/components/lesson/KanjiQuiz";
import GrammarQuiz from "@/app/components/lesson/GrammarQuiz";
import LevelSwitcher from "@/app/components/lesson/LevelSwitcher";
import PaginationControls from "@/app/components/lesson/PaginationControls";
import ProgressBar from "@/app/components/lesson/ProgressBar";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { ChevronLeft, Shuffle, Home, ChevronRight, Eye, EyeOff, Calendar, RotateCcw, BrainCircuit, Flame } from "lucide-react";
import { VocabularyProps, PartOfSpeech } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { loadCompletedSet, saveCompletedSet, LessonCategory } from "./lessonStorage";
import { useLessonData } from "./useLessonData";
import { loadStreak, getEffectiveStreak, recordStudyActivity } from "./streakStorage";

const VISIBILITY_KEY = 'kotonoha_vocab_visibility';
type VocabVisibility = { romaji: boolean; english: boolean; myanmar: boolean };
const DEFAULT_VISIBILITY: VocabVisibility = { romaji: true, english: true, myanmar: true };

const loadVisibility = (): VocabVisibility => {
  try {
    const raw = localStorage.getItem(VISIBILITY_KEY);
    if (!raw) return DEFAULT_VISIBILITY;
    const parsed = JSON.parse(raw);
    return {
      romaji: typeof parsed.romaji === 'boolean' ? parsed.romaji : true,
      english: typeof parsed.english === 'boolean' ? parsed.english : true,
      myanmar: typeof parsed.myanmar === 'boolean' ? parsed.myanmar : true,
    };
  } catch { return DEFAULT_VISIBILITY; }
};

const saveVisibility = (v: VocabVisibility) => {
  localStorage.setItem(VISIBILITY_KEY, JSON.stringify(v));
};

const TRACKED_CATEGORIES: ReadonlyArray<LessonCategory> = ['vocab', 'kanji', 'grammar', 'reading', 'listening'];
const isTrackedCategory = (lesson: string): lesson is LessonCategory =>
  (TRACKED_CATEGORIES as ReadonlyArray<string>).includes(lesson);

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
const GRAMMAR_PER_PAGE = 10;
const KANJI_PER_PAGE = 20;
const READING_PER_PAGE = 2;
const LISTENING_PER_PAGE = 3;

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

  // Global show/hide state for vocabulary (default ON; persisted once user touches them)
  const [globalShowRomaji, setGlobalShowRomaji] = useState(DEFAULT_VISIBILITY.romaji);
  const [globalShowEnglish, setGlobalShowEnglish] = useState(DEFAULT_VISIBILITY.english);
  const [globalShowMyanmar, setGlobalShowMyanmar] = useState(DEFAULT_VISIBILITY.myanmar);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isShuffled, setIsShuffled] = useState(false);

  // Completion tracking state (active category's set; reloads on lesson change)
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);

  // Reset-progress confirmation dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Streak (across calendar days; global across categories)
  const [streakCount, setStreakCount] = useState(0);

  // POS filter (session-only, not persisted)
  const [posFilter, setPosFilter] = useState<PartOfSpeech | 'All'>('All');

  useEffect(() => {
    if (isTrackedCategory(lesson)) {
      setCompletedItems(loadCompletedSet(lesson, id));
    } else {
      setCompletedItems(new Set());
    }

    const savedPage = localStorage.getItem(`kotonoha_${lesson}_page_${id}`);
    if (savedPage) {
      const parsed = parseInt(savedPage, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        setCurrentPage(parsed);
      }
    }

    // Hydrate vocab visibility from localStorage (preserves user toggles across visits;
    // falls back to DEFAULT_VISIBILITY for first-time users so cards aren't all "hidden").
    const v = loadVisibility();
    setGlobalShowRomaji(v.romaji);
    setGlobalShowEnglish(v.english);
    setGlobalShowMyanmar(v.myanmar);

    // Streak: show 0 if the user has missed more than a day.
    setStreakCount(getEffectiveStreak(loadStreak()));
  }, [lesson, id]);

  // Persist any visibility-toggle change so first-visit defaults are replaced
  // by the user's chosen state on subsequent visits.
  const updateVisibility = useCallback((patch: Partial<VocabVisibility>) => {
    const next: VocabVisibility = {
      romaji: patch.romaji ?? globalShowRomaji,
      english: patch.english ?? globalShowEnglish,
      myanmar: patch.myanmar ?? globalShowMyanmar,
    };
    if (patch.romaji !== undefined) setGlobalShowRomaji(patch.romaji);
    if (patch.english !== undefined) setGlobalShowEnglish(patch.english);
    if (patch.myanmar !== undefined) setGlobalShowMyanmar(patch.myanmar);
    saveVisibility(next);
  }, [globalShowRomaji, globalShowEnglish, globalShowMyanmar]);

  const handleToggleComplete = useCallback((itemKey: string) => {
    if (!isTrackedCategory(lesson)) return;
    setCompletedItems(prev => {
      const next = new Set(prev);
      const wasComplete = next.has(itemKey);
      if (wasComplete) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
        // Only credit the streak when newly completing — un-toggling shouldn't bump it.
        const updated = recordStudyActivity();
        setStreakCount(getEffectiveStreak(updated));
      }
      saveCompletedSet(lesson, id, next);
      return next;
    });
  }, [id, lesson]);

  const handleResetCompletions = useCallback(() => {
    if (!isTrackedCategory(lesson)) return;
    setShowResetConfirm(true);
  }, [lesson]);

  const confirmReset = useCallback(() => {
    if (isTrackedCategory(lesson)) {
      setCompletedItems(new Set());
      saveCompletedSet(lesson, id, new Set());
    }
    setShowResetConfirm(false);
  }, [id, lesson]);

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
    } else if (lesson === 'reading') {
      if (!reading || reading.length === 0) return 1;
      return Math.ceil(reading.length / READING_PER_PAGE);
    } else if (lesson === 'listening') {
      if (!listening || listening.length === 0) return 1;
      return Math.ceil(listening.length / LISTENING_PER_PAGE);
    }
    return 1;
  }, [vocab, grammar, kanji, reading, listening, lesson]);

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

  const paginatedReading = useMemo(() => {
    if (!reading || reading.length === 0) return [];
    const startIndex = (currentPage - 1) * READING_PER_PAGE;
    return reading.slice(startIndex, startIndex + READING_PER_PAGE);
  }, [reading, currentPage]);

  const paginatedListening = useMemo(() => {
    if (!listening || listening.length === 0) return [];
    const startIndex = (currentPage - 1) * LISTENING_PER_PAGE;
    return listening.slice(startIndex, startIndex + LISTENING_PER_PAGE);
  }, [listening, currentPage]);

  const [shuffledPageVocab, setShuffledPageVocab] = useState<VocabularyProps[]>([]);
  const baseDisplayVocab = isShuffled ? shuffledPageVocab : paginatedVocab;

  const displayVocab = useMemo(() => {
    if (posFilter === 'All') return baseDisplayVocab;
    return baseDisplayVocab.filter(item => item.part_of_speech === posFilter);
  }, [baseDisplayVocab, posFilter]);

  const completedOnPage = useMemo(() => {
    return paginatedVocab.filter(item => completedItems.has(item.word || '')).length;
  }, [paginatedVocab, completedItems]);

  const kanjiCompletedOnPage = useMemo(() => {
    return paginatedKanji.filter(item => completedItems.has(item.word || '')).length;
  }, [paginatedKanji, completedItems]);

  const grammarCompletedOnPage = useMemo(() => {
    return paginatedGrammar.filter(item => completedItems.has(item.title || '')).length;
  }, [paginatedGrammar, completedItems]);

  const readingCompletedOnPage = useMemo(() => {
    return paginatedReading.filter(item => completedItems.has(item.title)).length;
  }, [paginatedReading, completedItems]);

  const listeningCompletedOnPage = useMemo(() => {
    return paginatedListening.filter(item => completedItems.has(item.title)).length;
  }, [paginatedListening, completedItems]);

  const completedTotal = completedItems.size;

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

  const readingStart = (currentPage - 1) * READING_PER_PAGE + 1;
  const readingEnd = Math.min(currentPage * READING_PER_PAGE, reading?.length || 0);

  const listeningStart = (currentPage - 1) * LISTENING_PER_PAGE + 1;
  const listeningEnd = Math.min(currentPage * LISTENING_PER_PAGE, listening?.length || 0);

  let content;
  let header;
  let gridLayout = "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6";

  if (lesson == 'vocab') {
    if (vocab && vocab.length > 0) {
      content = displayVocab.map((item, index) => (
        <VocabularyCard
          key={index}
          item={item}
          label={isShuffled ? undefined : (pageStartWord + index)}
          isCompleted={completedItems.has(item.word || '')}
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
      content = paginatedKanji.map((item, index) => (
        <KanjiCard
          key={item.word}
          item={item}
          label={kanjiStart + index}
          isCompleted={completedItems.has(item.word || '')}
          onToggleComplete={handleToggleComplete}
        />
      ));
    }
  }
  if (lesson == 'grammar') {
    header = {
      'title': 'Grammar',
      'description': `Understand ${grammar?.length} basic sentence structures and particles.`
    }
    if (grammar && grammar.length > 0) {
      content = paginatedGrammar.map((item, index) => (
        <GrammarPointCard
          key={index}
          item={item}
          label={grammarStart + index}
          isCompleted={completedItems.has(item.title || '')}
          onToggleComplete={handleToggleComplete}
        />
      ));
    }
  }
  if (lesson == 'reading') {
    gridLayout = "grid-cols-1 gap-4";
    header = {
      'title': 'Reading',
      'description': `Practice comprehension with ${reading?.length} beginner-friendly passages.`
    }
    if (reading && reading.length > 0) {
      content = paginatedReading.map((item, index) => (
        <ReadingPassage
          key={item.title}
          data={item}
          label={readingStart + index}
          isCompleted={completedItems.has(item.title)}
          defaultExpanded={index === 0}
          onComplete={handleToggleComplete}
        />
      ));
    }
  }
  if (lesson == 'listening') {
    gridLayout = "grid-cols-1 gap-4";
    header = {
      'title': 'Listening',
      'description': `Train your ear with ${listening?.length} real-life conversation exercises.`
    }
    if (listening && listening.length > 0) {
      content = paginatedListening.map((item, index) => (
        <ListeningExercise
          key={item.title}
          data={item}
          label={listeningStart + index}
          isCompleted={completedItems.has(item.title)}
          defaultExpanded={index === 0}
          onComplete={handleToggleComplete}
        />
      ));
    }
  }

  const levelLabel = LEVEL_LABELS[id] || `Level ${id}`;
  const lessonLabel = LESSON_LABELS[lesson] || lesson;

  return (
    <div className="max-w-8xl mx-auto pt-10 pb-24 px-4 sm:px-6 lg:px-8">
      <nav className="flex items-center flex-wrap gap-1.5 text-sm text-[#1F150C]/50 mb-8">
        <Link href="/" className="flex items-center gap-1 hover:text-[#412D15] transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/level/${id}`} className="hover:text-[#412D15] transition-colors">
          {levelLabel}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1F150C] font-medium">{lessonLabel}</span>
      </nav>

      <div className="relative text-center mb-12 max-w-3xl mx-auto">
        <Link href={`/level/${id}`} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#1F150C]/10 transition-colors duration-300"><ChevronLeft className="h-6 w-6 text-[#1F150C]" /></Link>
        <div className="inline-flex items-center gap-2 mb-3 flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full bg-[#412D15]/10 text-[#412D15] text-xs font-bold tracking-wider">
            {levelLabel}
          </span>
          {streakCount > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold tracking-wider" title={`${streakCount}-day study streak`}>
              <Flame className="w-3.5 h-3.5" />
              {streakCount}-day streak
            </span>
          )}
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">{header?.title}</h2>
        <p className="mt-3 text-lg text-[#1F150C]/70">{header?.description}</p>

        <div className="mt-5">
          <LevelSwitcher currentId={id} lesson={lesson} />
        </div>

        {lesson === 'vocab' && vocab && vocab.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F150C] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Set {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#1F150C]/60 font-medium">
                Words {pageStartWord}–{pageEndWord} of {vocab.length}
              </div>
            </div>

            <ProgressBar
              completedOnPage={completedOnPage}
              totalOnPage={paginatedVocab.length}
              completedTotal={completedTotal}
              totalWords={vocab.length}
              label="Today's Words"
              doneMessage="🎉 80 words down — fantastic pace!"
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
                    ? 'bg-[#412D15] text-white shadow-md shadow-[#412D15]/30'
                    : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#412D15]/40'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {posFilter !== 'All' && (
              <p className="text-xs text-center text-[#1F150C]/50">
                Showing <span className="font-bold text-[#412D15]">{displayVocab.length}</span> {posFilter}s on this page
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleRandomizeVocab}
                className="flex items-center gap-2 px-6 py-2 bg-[#1F150C] text-white rounded-full hover:bg-[#1F150C]/80 transition-all active:scale-95 shadow-md"
              >
                <Shuffle className="w-4 h-4" />
                <span>Shuffle</span>
              </button>

              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center gap-2 px-6 py-2 bg-[#412D15] text-white rounded-full hover:bg-[#000000] transition-all active:scale-95 shadow-md"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Quiz</span>
              </button>

              {completedTotal > 0 && (
                <button
                  onClick={handleResetCompletions}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#1F150C] border border-[#1F150C]/20 hover:border-red-400 hover:text-red-500 transition-all active:scale-95 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Progress</span>
                </button>
              )}

              <button
                onClick={() => updateVisibility({ romaji: !globalShowRomaji })}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 shadow-md ${globalShowRomaji
                  ? 'bg-[#412D15] text-white'
                  : 'bg-white text-[#1F150C] border border-[#1F150C]/20'
                  }`}
              >
                {globalShowRomaji ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>Romaji</span>
              </button>
              <button
                onClick={() => updateVisibility({ english: !globalShowEnglish })}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 shadow-md ${globalShowEnglish
                  ? 'bg-[#412D15] text-white'
                  : 'bg-white text-[#1F150C] border border-[#1F150C]/20'
                  }`}
              >
                {globalShowEnglish ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>English</span>
              </button>
              <button
                onClick={() => updateVisibility({ myanmar: !globalShowMyanmar })}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 shadow-md ${globalShowMyanmar
                  ? 'bg-[#412D15] text-white'
                  : 'bg-white text-[#1F150C] border border-[#1F150C]/20'
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F150C] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Set {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#1F150C]/60 font-medium">
                Points {grammarStart}–{grammarEnd} of {grammar.length}
              </div>
            </div>

            <ProgressBar
              completedOnPage={grammarCompletedOnPage}
              totalOnPage={paginatedGrammar.length}
              completedTotal={completedTotal}
              totalWords={grammar.length}
              label="Today's Grammar"
              doneMessage="🎉 Patterns mastered for today — well done!"
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center gap-2 px-6 py-2 bg-[#412D15] text-white rounded-full hover:bg-[#000000] transition-all active:scale-95 shadow-md"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Quiz</span>
              </button>

              {completedTotal > 0 && (
                <button
                  onClick={handleResetCompletions}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#1F150C] border border-[#1F150C]/20 hover:border-red-400 hover:text-red-500 transition-all active:scale-95 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Progress</span>
                </button>
              )}
            </div>
          </div>
        )}

        {lesson === 'kanji' && kanji && kanji.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F150C] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Set {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#1F150C]/60 font-medium">
                Characters {kanjiStart}–{kanjiEnd} of {kanji.length}
              </div>
            </div>

            <ProgressBar
              completedOnPage={kanjiCompletedOnPage}
              totalOnPage={paginatedKanji.length}
              completedTotal={completedTotal}
              totalWords={kanji.length}
              label="Today's Kanji"
              doneMessage="🎉 All kanji studied — your brushwork is paying off!"
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center gap-2 px-6 py-2 bg-[#412D15] text-white rounded-full hover:bg-[#000000] transition-all active:scale-95 shadow-md"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Quiz</span>
              </button>

              {completedTotal > 0 && (
                <button
                  onClick={handleResetCompletions}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#1F150C] border border-[#1F150C]/20 hover:border-red-400 hover:text-red-500 transition-all active:scale-95 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Progress</span>
                </button>
              )}
            </div>
          </div>
        )}

        {lesson === 'reading' && reading && reading.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F150C] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Set {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#1F150C]/60 font-medium">
                Passages {readingStart}–{readingEnd} of {reading.length}
              </div>
            </div>

            <ProgressBar
              completedOnPage={readingCompletedOnPage}
              totalOnPage={paginatedReading.length}
              completedTotal={completedTotal}
              totalWords={reading.length}
              label="Today's Reading"
              doneMessage="🎉 Both passages done — well read!"
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            <p className="text-xs text-[#1F150C]/50 italic">
              Submit a passage&apos;s comprehension answers to mark it as studied.
            </p>

            {completedTotal > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleResetCompletions}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#1F150C] border border-[#1F150C]/20 hover:border-red-400 hover:text-red-500 transition-all active:scale-95 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Progress</span>
                </button>
              </div>
            )}
          </div>
        )}

        {lesson === 'listening' && listening && listening.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F150C] text-white rounded-full text-sm font-bold shadow-md">
                <Calendar className="w-4 h-4" />
                <span>Set {currentPage} of {totalPages}</span>
              </div>
              <div className="text-sm text-[#1F150C]/60 font-medium">
                Exercises {listeningStart}–{listeningEnd} of {listening.length}
              </div>
            </div>

            <ProgressBar
              completedOnPage={listeningCompletedOnPage}
              totalOnPage={paginatedListening.length}
              completedTotal={completedTotal}
              totalWords={listening.length}
              label="Today's Listening"
              doneMessage="🎧 All ears! Today's exercises complete."
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            <p className="text-xs text-[#1F150C]/50 italic">
              Submit an exercise&apos;s comprehension answers to mark it as studied.
            </p>

            {completedTotal > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleResetCompletions}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#1F150C] border border-[#1F150C]/20 hover:border-red-400 hover:text-red-500 transition-all active:scale-95 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Progress</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {isTrackedCategory(lesson) && content && (() => {
        let done = 0;
        let total = 0;
        if (lesson === 'vocab') { done = completedOnPage; total = paginatedVocab.length; }
        else if (lesson === 'kanji') { done = kanjiCompletedOnPage; total = paginatedKanji.length; }
        else if (lesson === 'grammar') { done = grammarCompletedOnPage; total = paginatedGrammar.length; }
        else if (lesson === 'reading') { done = readingCompletedOnPage; total = paginatedReading.length; }
        else if (lesson === 'listening') { done = listeningCompletedOnPage; total = paginatedListening.length; }
        const pct = total > 0 ? (done / total) * 100 : 0;
        const hasQuiz = lesson === 'vocab' || lesson === 'kanji' || lesson === 'grammar';
        return (
          <div className="sticky top-20 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 bg-[#E1DCC9]/85 backdrop-blur-md border-y border-black/5">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-[#1F150C] truncate">
                  {lessonLabel}
                </span>
                <span className="hidden sm:inline text-xs text-[#1F150C]/50">·</span>
                <span className="text-xs font-medium text-[#1F150C]/60 whitespace-nowrap">
                  Set {currentPage}/{totalPages}
                </span>
              </div>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#1F150C]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #412D15, #ef4444)',
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-[#1F150C]/70 whitespace-nowrap tabular-nums">
                  {done}/{total}
                </span>
              </div>

              {hasQuiz && (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#412D15] text-white text-xs font-bold rounded-full hover:bg-[#000000] transition-all active:scale-95 shadow-sm flex-shrink-0"
                  title="Open quiz"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Quiz</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {content ? (
        <>
          <div className={`grid ${gridLayout}`}>
            {content}
          </div>

          {lesson === 'vocab' && vocab && vocab.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="text-center text-sm text-[#1F150C]/60 font-medium">
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
              <div className="text-center text-sm text-[#1F150C]/60 font-medium">
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
              <div className="text-center text-sm text-[#1F150C]/60 font-medium">
                Characters {kanjiStart}–{kanjiEnd} of {kanji.length}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {lesson === 'reading' && reading && reading.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="text-center text-sm text-[#1F150C]/60 font-medium">
                Passages {readingStart}–{readingEnd} of {reading.length}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {lesson === 'listening' && listening && listening.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="text-center text-sm text-[#1F150C]/60 font-medium">
                Exercises {listeningStart}–{listeningEnd} of {listening.length}
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
          <p className="text-[#1F150C]/80">Content coming soon!</p>
        </div>
      )}

      {showQuiz && lesson === 'vocab' && vocab && vocab.length > 0 && (
        <VocabularyQuiz
          vocab={vocab}
          pageVocab={paginatedVocab}
          completedWords={completedItems}
          onClose={() => setShowQuiz(false)}
        />
      )}

      {showQuiz && lesson === 'kanji' && kanji && kanji.length > 0 && (
        <KanjiQuiz
          kanji={kanji}
          pageKanji={paginatedKanji}
          completedKanji={completedItems}
          onClose={() => setShowQuiz(false)}
        />
      )}

      {showQuiz && lesson === 'grammar' && grammar && grammar.length > 0 && (
        <GrammarQuiz
          grammar={grammar}
          pageGrammar={paginatedGrammar}
          completedGrammar={completedItems}
          onClose={() => setShowQuiz(false)}
        />
      )}

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset progress?"
        description={`This clears your completed ${LESSON_LABELS[lesson]?.toLowerCase() ?? lesson} for ${LEVEL_LABELS[id] ?? `Level ${id}`}. Your study streak isn't affected.`}
        confirmLabel="Reset"
        cancelLabel="Keep"
        destructive
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default LessonContentPage
