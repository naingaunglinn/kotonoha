'use client'
import VocabularyCard from "@/app/components/lesson/VocabularyCard";
import KanjiCard from "@/app/components/lesson/KanjiCard";
import GrammarPointCard from "@/app/components/lesson/GrammarPointCard";
import ReadingPassage from "@/app/components/lesson/ReadingPassage";
import ListeningExercise from "@/app/components/lesson/ListeningExercise";
import VocabularyQuiz from "@/app/components/lesson/VocabularyQuiz";
import KanjiQuiz from "@/app/components/lesson/KanjiQuiz";
import GrammarQuiz from "@/app/components/lesson/GrammarQuiz";
import PaginationControls from "@/app/components/lesson/PaginationControls";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { ChevronLeft, Shuffle, Eye, EyeOff, RotateCcw, BrainCircuit, Flame, ChevronDown } from "lucide-react";
import { VocabularyProps, PartOfSpeech } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { loadCompletedSet, saveCompletedSet, LessonCategory } from "./lessonStorage";
import { useLessonData } from "./useLessonData";
import { loadStreak, getEffectiveStreak, recordStudyActivity } from "./streakStorage";
import { recordVisit } from "@/utils/recentActivity";
import { recordStudyDay } from "@/utils/studyDays";

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

const LEVELS = ['5', '4', '3', '2', '1'];

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

  const [globalShowRomaji, setGlobalShowRomaji] = useState(DEFAULT_VISIBILITY.romaji);
  const [globalShowEnglish, setGlobalShowEnglish] = useState(DEFAULT_VISIBILITY.english);
  const [globalShowMyanmar, setGlobalShowMyanmar] = useState(DEFAULT_VISIBILITY.myanmar);

  const [currentPage, setCurrentPage] = useState(1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [posFilter, setPosFilter] = useState<PartOfSpeech | 'All'>('All');
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const levelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTrackedCategory(lesson)) {
      setCompletedItems(loadCompletedSet(lesson, id));
    } else {
      setCompletedItems(new Set());
    }

    const savedPage = localStorage.getItem(`kotonoha_${lesson}_page_${id}`);
    let resolvedPage = 1;
    if (savedPage) {
      const parsed = parseInt(savedPage, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        resolvedPage = parsed;
        setCurrentPage(parsed);
      }
    } else {
      setCurrentPage(1);
    }

    const v = loadVisibility();
    setGlobalShowRomaji(v.romaji);
    setGlobalShowEnglish(v.english);
    setGlobalShowMyanmar(v.myanmar);

    setStreakCount(getEffectiveStreak(loadStreak()));

    if (isTrackedCategory(lesson)) {
      recordVisit(lesson, id, resolvedPage);
    }
  }, [lesson, id]);

  useEffect(() => {
    if (!showLevelMenu) return;
    const onClick = (e: MouseEvent) => {
      if (levelMenuRef.current && !levelMenuRef.current.contains(e.target as Node)) {
        setShowLevelMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showLevelMenu]);

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
        const updated = recordStudyActivity();
        setStreakCount(getEffectiveStreak(updated));
        recordStudyDay();
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
    if (isTrackedCategory(lesson)) recordVisit(lesson, id, page);
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
  let gridLayout = "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6";

  if (lesson == 'vocab' && vocab && vocab.length > 0) {
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
  }
  if (lesson == 'kanji' && kanji && kanji.length > 0) {
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
  if (lesson == 'grammar' && grammar && grammar.length > 0) {
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
  if (lesson == 'reading') {
    gridLayout = "grid-cols-1 gap-4";
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

  let doneOnPage = 0;
  let totalOnPage = 0;
  let rangeLabel = '';
  let totalUnits = 0;
  let unitLabel = '';
  if (lesson === 'vocab') {
    doneOnPage = completedOnPage; totalOnPage = paginatedVocab.length;
    rangeLabel = `${pageStartWord}–${pageEndWord}`; totalUnits = vocab?.length || 0; unitLabel = 'words';
  } else if (lesson === 'kanji') {
    doneOnPage = kanjiCompletedOnPage; totalOnPage = paginatedKanji.length;
    rangeLabel = `${kanjiStart}–${kanjiEnd}`; totalUnits = kanji?.length || 0; unitLabel = 'kanji';
  } else if (lesson === 'grammar') {
    doneOnPage = grammarCompletedOnPage; totalOnPage = paginatedGrammar.length;
    rangeLabel = `${grammarStart}–${grammarEnd}`; totalUnits = grammar?.length || 0; unitLabel = 'points';
  } else if (lesson === 'reading') {
    doneOnPage = readingCompletedOnPage; totalOnPage = paginatedReading.length;
    rangeLabel = `${readingStart}–${readingEnd}`; totalUnits = reading?.length || 0; unitLabel = 'passages';
  } else if (lesson === 'listening') {
    doneOnPage = listeningCompletedOnPage; totalOnPage = paginatedListening.length;
    rangeLabel = `${listeningStart}–${listeningEnd}`; totalUnits = listening?.length || 0; unitLabel = 'exercises';
  }
  const pagePct = totalOnPage > 0 ? (doneOnPage / totalOnPage) * 100 : 0;
  const hasQuiz = lesson === 'vocab' || lesson === 'kanji' || lesson === 'grammar';
  const hasTools = isTrackedCategory(lesson) && content;

  return (
    <div className="max-w-8xl mx-auto pb-24">
      {/* SLIM TOOLBAR — replaces the old centered hero. Sticks under site header (h-20). */}
      {isTrackedCategory(lesson) && (
        <div className="sticky top-20 z-30 bg-[#E1DCC9]/90 backdrop-blur-md border-b border-[#1F150C]/10">
          <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center gap-2 sm:gap-3">
            {/* Back */}
            <Link
              href={`/level/${id}`}
              className="p-1.5 rounded-full hover:bg-[#1F150C]/10 transition-colors flex-shrink-0"
              title="Back to lessons"
            >
              <ChevronLeft className="h-5 w-5 text-[#1F150C]" />
            </Link>

            {/* Level chip with dropdown */}
            <div className="relative flex-shrink-0" ref={levelMenuRef}>
              <button
                onClick={() => setShowLevelMenu(v => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#412D15]/10 text-[#412D15] text-[11px] font-bold tracking-wider hover:bg-[#412D15]/15 transition-colors"
                title="Switch level"
              >
                {levelLabel}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showLevelMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-black/5 p-1 z-40 min-w-[80px]">
                  {LEVELS.map(lvId => (
                    <Link
                      key={lvId}
                      href={`/level/${lvId}/${lesson}`}
                      onClick={() => setShowLevelMenu(false)}
                      className={`block px-3 py-1.5 rounded-lg text-xs font-bold text-center transition-colors ${
                        lvId === id
                          ? 'bg-[#412D15] text-white'
                          : 'text-[#1F150C] hover:bg-[#E1DCC9]'
                      }`}
                    >
                      {LEVEL_LABELS[lvId]}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Category + set */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-[#1F150C] truncate">{lessonLabel}</span>
              <span className="hidden sm:inline text-xs text-[#1F150C]/40">·</span>
              <span className="hidden sm:inline text-xs font-medium text-[#1F150C]/60 whitespace-nowrap">
                Set {currentPage}/{totalPages}
              </span>
            </div>

            {/* Progress bar — flex-fills */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#1F150C]/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pagePct}%`,
                    background: pagePct === 100
                      ? 'linear-gradient(90deg, #10b981, #059669)'
                      : 'linear-gradient(90deg, #412D15, #ef4444)',
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#1F150C]/70 whitespace-nowrap tabular-nums">
                {doneOnPage}/{totalOnPage}
              </span>
            </div>

            {/* Streak — desktop only, compact */}
            {streakCount > 0 && (
              <span
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold flex-shrink-0"
                title={`${streakCount}-day study streak`}
              >
                <Flame className="w-3 h-3" />
                {streakCount}
              </span>
            )}

            {/* Quiz button */}
            {hasQuiz && (
              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-[#412D15] text-white text-xs font-bold rounded-full hover:bg-[#000000] transition-all active:scale-95 shadow-sm flex-shrink-0"
                title="Open quiz"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quiz</span>
              </button>
            )}

            {/* Tools toggle (mobile-first) */}
            {hasTools && (
              <button
                onClick={() => setShowTools(v => !v)}
                className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
                  showTools ? 'bg-[#1F150C] text-white' : 'text-[#1F150C] hover:bg-[#1F150C]/10'
                }`}
                title="Toggle study tools"
                aria-pressed={showTools}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showTools ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* COLLAPSIBLE TOOLS STRIP */}
          {showTools && (
            <div className="border-t border-[#1F150C]/10 px-3 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[10px] font-bold text-[#1F150C]/40 uppercase tracking-wider mr-1">
                {rangeLabel} of {totalUnits} {unitLabel}
              </span>

              {lesson === 'vocab' && (
                <>
                  <button
                    onClick={handleRandomizeVocab}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#1F150C]/15 rounded-full hover:border-[#412D15]/40 transition-all active:scale-95"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    Shuffle
                  </button>
                  <button
                    onClick={() => updateVisibility({ romaji: !globalShowRomaji })}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      globalShowRomaji ? 'bg-[#412D15] text-white' : 'bg-white text-[#1F150C] border border-[#1F150C]/15'
                    }`}
                  >
                    {globalShowRomaji ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Romaji
                  </button>
                  <button
                    onClick={() => updateVisibility({ english: !globalShowEnglish })}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      globalShowEnglish ? 'bg-[#412D15] text-white' : 'bg-white text-[#1F150C] border border-[#1F150C]/15'
                    }`}
                  >
                    {globalShowEnglish ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    English
                  </button>
                  <button
                    onClick={() => updateVisibility({ myanmar: !globalShowMyanmar })}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      globalShowMyanmar ? 'bg-[#412D15] text-white' : 'bg-white text-[#1F150C] border border-[#1F150C]/15'
                    }`}
                  >
                    {globalShowMyanmar ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Myanmar
                  </button>

                  <div className="w-px h-5 bg-[#1F150C]/10 mx-1" />
                  {POS_FILTERS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setPosFilter(value)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
                        posFilter === value
                          ? 'bg-[#1F150C] text-white'
                          : 'bg-white text-[#1F150C] border border-[#1F150C]/15 hover:border-[#412D15]/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </>
              )}

              {completedTotal > 0 && (
                <button
                  onClick={handleResetCompletions}
                  className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-white text-[#1F150C] border border-[#1F150C]/20 rounded-full hover:border-red-400 hover:text-red-500 transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        {posFilter !== 'All' && lesson === 'vocab' && (
          <p className="text-xs text-center text-[#1F150C]/50 mb-4">
            Showing <span className="font-bold text-[#412D15]">{displayVocab.length}</span> {posFilter}s on this page
          </p>
        )}

        {(lesson === 'reading' || lesson === 'listening') && content && (
          <p className="text-xs text-center text-[#1F150C]/50 italic mb-4">
            Submit a {lesson === 'reading' ? 'passage' : 'exercise'}&apos;s comprehension answers to mark it as studied.
          </p>
        )}

        {content ? (
          <>
            <div className={`grid ${gridLayout}`}>
              {content}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 space-y-3">
                <div className="text-center text-sm text-[#1F150C]/60 font-medium">
                  {rangeLabel} of {totalUnits} {unitLabel}
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
          <div className="text-center p-10 bg-white/50 rounded-2xl max-w-2xl mx-auto">
            <p className="text-[#1F150C]/80">Content coming soon!</p>
          </div>
        )}
      </div>

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
