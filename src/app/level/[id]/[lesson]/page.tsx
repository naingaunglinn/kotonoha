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
import FocusMode from "@/app/components/lesson/FocusMode";
import { ChevronLeft, Shuffle, Eye, EyeOff, RotateCcw, BrainCircuit, Flame, ChevronDown, Focus } from "lucide-react";
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
  const [showFocus, setShowFocus] = useState(false);
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
    gridLayout = "grid-cols-1 max-w-[760px] mx-auto gap-5";
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
    <div className="mx-auto max-w-7xl pb-24">
      {/* SLIM TOOLBAR — sticks under site header. */}
      {isTrackedCategory(lesson) && (
        <div className="sticky top-16 z-30 border-b border-line bg-bg/85 backdrop-blur-md sm:top-20">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 lg:px-8">
            {/* Back */}
            <Link
              href={`/level/${id}`}
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
              title="Back to lessons"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>

            {/* Level chip with dropdown */}
            <div className="relative flex-shrink-0" ref={levelMenuRef}>
              <button
                onClick={() => setShowLevelMenu(v => !v)}
                className="inline-flex items-center gap-1 rounded-chip bg-ink px-2.5 py-1 text-[11px] font-bold tracking-wider text-bg transition-colors hover:bg-ink/90"
                title="Switch level"
              >
                {levelLabel}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showLevelMenu && (
                <div className="absolute left-0 top-full z-40 mt-1 min-w-[80px] rounded-card border border-line bg-surface p-1 shadow-float">
                  {LEVELS.map(lvId => (
                    <Link
                      key={lvId}
                      href={`/level/${lvId}/${lesson}`}
                      onClick={() => setShowLevelMenu(false)}
                      className={`block rounded-chip px-3 py-1.5 text-center text-xs font-bold transition-colors ${
                        lvId === id ? 'bg-ink text-bg' : 'text-ink hover:bg-surface-alt'
                      }`}
                    >
                      {LEVEL_LABELS[lvId]}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Category + set */}
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs font-bold text-ink">{lessonLabel}</span>
              <span className="hidden text-xs text-ink-muted/50 sm:inline">·</span>
              <span className="hidden whitespace-nowrap text-xs font-medium text-ink-muted sm:inline">
                Set {currentPage}/{totalPages}
              </span>
            </div>

            {/* Progress bar — flex-fills */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pagePct}%`,
                    background: pagePct === 100 ? 'var(--color-success)' : 'var(--color-accent)',
                    transition: 'width 0.6s var(--ease-out-soft)',
                  }}
                />
              </div>
              <span className="whitespace-nowrap text-[11px] font-bold tabular-nums text-ink-muted">
                {doneOnPage}/{totalOnPage}
              </span>
            </div>

            {/* Streak — desktop only, compact */}
            {streakCount > 0 && (
              <span
                className="hidden flex-shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-[11px] font-bold text-accent sm:inline-flex"
                title={`${streakCount}-day study streak`}
              >
                <Flame className="h-3 w-3" />
                {streakCount}
              </span>
            )}

            {/* Focus button */}
            {hasQuiz && (
              <button
                onClick={() => setShowFocus(true)}
                className="flex flex-shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-ink transition-all hover:border-line-strong hover:text-accent active:scale-95 sm:px-3"
                title="Focus mode — one card at a time"
              >
                <Focus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Focus</span>
              </button>
            )}

            {/* Quiz button */}
            {hasQuiz && (
              <button
                onClick={() => setShowQuiz(true)}
                className="flex flex-shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#a83d30] active:scale-95 sm:px-3"
                title="Open quiz"
              >
                <BrainCircuit className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Quiz</span>
              </button>
            )}

            {/* Tools toggle */}
            {hasTools && (
              <button
                onClick={() => setShowTools(v => !v)}
                className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full transition-colors ${
                  showTools ? 'bg-ink text-bg' : 'text-ink hover:bg-ink/5'
                }`}
                title="Toggle study tools"
                aria-pressed={showTools}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showTools ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* COLLAPSIBLE TOOLS STRIP */}
          {showTools && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-3 text-xs sm:px-6 lg:px-8">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                {rangeLabel} of {totalUnits} {unitLabel}
              </span>

              {lesson === 'vocab' && (
                <>
                  <button
                    onClick={handleRandomizeVocab}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 transition-all hover:border-line-strong active:scale-95"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Shuffle
                  </button>
                  {([
                    ['romaji', globalShowRomaji, () => updateVisibility({ romaji: !globalShowRomaji }), 'Romaji'],
                    ['english', globalShowEnglish, () => updateVisibility({ english: !globalShowEnglish }), 'English'],
                    ['myanmar', globalShowMyanmar, () => updateVisibility({ myanmar: !globalShowMyanmar }), 'Myanmar'],
                  ] as const).map(([key, on, fn, lbl]) => (
                    <button
                      key={key}
                      onClick={fn}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-all active:scale-95 ${
                        on ? 'bg-ink text-bg' : 'border border-line bg-surface text-ink'
                      }`}
                    >
                      {on ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {lbl}
                    </button>
                  ))}

                  <div className="mx-1 h-5 w-px bg-line" />
                  {POS_FILTERS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setPosFilter(value)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 ${
                        posFilter === value
                          ? 'bg-ink text-bg'
                          : 'border border-line bg-surface text-ink hover:border-line-strong'
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
                  className="ml-auto inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-ink transition-all hover:border-accent hover:text-accent active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-6 sm:px-6 lg:px-8">
        {posFilter !== 'All' && lesson === 'vocab' && (
          <p className="mb-4 text-center text-xs text-ink-muted">
            Showing <span className="font-bold text-accent">{displayVocab.length}</span> {posFilter}s on this page
          </p>
        )}

        {(lesson === 'reading' || lesson === 'listening') && content && (
          <p className="mb-4 text-center text-xs italic text-ink-muted">
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
                <div className="text-center text-sm font-medium text-ink-muted">
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
          <div className="mx-auto max-w-2xl rounded-card border border-line bg-surface p-10 text-center shadow-card">
            <p className="text-ink-muted">Content coming soon!</p>
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

      {showFocus && lesson === 'vocab' && paginatedVocab.length > 0 && (
        <FocusMode
          items={paginatedVocab}
          itemKey={(v) => v.word || ''}
          completedItems={completedItems}
          onToggleComplete={handleToggleComplete}
          onClose={() => setShowFocus(false)}
          categoryLabel="Vocabulary"
          pageLabel={`Set ${currentPage} · ${rangeLabel}`}
          renderCard={(item, isDone) => (
            <VocabularyCard
              item={item}
              isCompleted={isDone}
              onToggleComplete={handleToggleComplete}
              globalShowRomaji={globalShowRomaji}
              globalShowEnglish={globalShowEnglish}
              globalShowMyanmar={globalShowMyanmar}
            />
          )}
        />
      )}

      {showFocus && lesson === 'kanji' && paginatedKanji.length > 0 && (
        <FocusMode
          items={paginatedKanji}
          itemKey={(k) => k.word || ''}
          completedItems={completedItems}
          onToggleComplete={handleToggleComplete}
          onClose={() => setShowFocus(false)}
          categoryLabel="Kanji"
          pageLabel={`Set ${currentPage} · ${rangeLabel}`}
          renderCard={(item, isDone) => (
            <KanjiCard
              item={item}
              isCompleted={isDone}
              onToggleComplete={handleToggleComplete}
            />
          )}
        />
      )}

      {showFocus && lesson === 'grammar' && paginatedGrammar.length > 0 && (
        <FocusMode
          items={paginatedGrammar}
          itemKey={(g) => g.title || ''}
          completedItems={completedItems}
          onToggleComplete={handleToggleComplete}
          onClose={() => setShowFocus(false)}
          categoryLabel="Grammar"
          pageLabel={`Set ${currentPage} · ${rangeLabel}`}
          renderCard={(item, isDone) => (
            <GrammarPointCard
              item={item}
              isCompleted={isDone}
              onToggleComplete={handleToggleComplete}
            />
          )}
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
