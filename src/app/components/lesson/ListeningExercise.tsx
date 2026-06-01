"use client";
import { ListeningProps } from "@/types";
import { useState, useCallback, useEffect } from "react";
import {
  Headphones,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  ChevronDown,
  RotateCcw,
  Mic,
  Clock,
  Loader2,
} from "lucide-react";

const SPEED_OPTIONS = [
  { label: 'Slow', rate: 0.6 },
  { label: 'Normal', rate: 0.8 },
  { label: 'Fast', rate: 1.0 },
  { label: '1.2×', rate: 1.2 },
];

const splitTranscript = (transcript: string): string[] =>
  transcript
    .split('\n')
    .map((line) => line.replace(/^[A-Za-z]:\s*/, '').trim())
    .filter((line) => line.length > 0);

const speakText = (text: string, rate: number, onStart: () => void, onEnd: () => void): void => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate;
  utterance.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const japaneseVoice = voices.find((v) => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
  if (japaneseVoice) utterance.voice = japaneseVoice;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
};

type TabKey = 'transcript' | 'en' | 'mm';
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'transcript', label: 'Transcript' },
  { key: 'en', label: 'English' },
  { key: 'mm', label: 'မြန်မာ' },
];

interface ListeningExerciseProps {
  data: ListeningProps;
  label?: number;
  isCompleted?: boolean;
  defaultExpanded?: boolean;
  onComplete?: (title: string) => void;
}

const ListeningExercise = ({ data, label, isCompleted = false, defaultExpanded = false, onComplete }: ListeningExerciseProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [speed, setSpeed] = useState(0.8);
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);

  const [listenFirstMode, setListenFirstMode] = useState(false);
  const listenFirstLocked = listenFirstMode && !showResults;

  const [shadowingMode, setShadowingMode] = useState(false);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const [playedSentences, setPlayedSentences] = useState<Set<number>>(new Set());
  const shadowingSpeed = 0.6;

  const sentences: string[] =
    data.sentences && data.sentences.length > 0
      ? data.sentences.map((s) => s.text)
      : splitTranscript(data.transcript);

  const estMin = Math.max(1, Math.round((sentences.length * 8 + data.questions.length * 15) / 60));

  const playFull = useCallback(() => {
    const cleanText = data.transcript.replace(/[A-Za-z]:\s*/g, '').replace(/\n/g, '。');
    speakText(
      cleanText,
      shadowingMode ? shadowingSpeed : speed,
      () => setIsPlaying(true),
      () => { setIsPlaying(false); setActiveSentence(null); },
    );
  }, [data.transcript, speed, shadowingMode]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setActiveSentence(null);
    }
  }, []);

  const playSentence = useCallback((text: string, index: number) => {
    setActiveSentence(index);
    setPlayedSentences((prev) => new Set(prev).add(index));
    speakText(
      text,
      shadowingMode ? shadowingSpeed : speed,
      () => setIsPlaying(true),
      () => { setIsPlaying(false); setActiveSentence(null); },
    );
  }, [speed, shadowingMode]);

  useEffect(() => {
    return () => stopSpeaking();
  }, [expanded, stopSpeaking]);

  const handleAnswer = (qIndex: number, option: string) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleCheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setShowResults(true);
      if (!isCompleted) onComplete?.(data.title);
    }, 450);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    stopSpeaking();
  };

  const correctCount = data.questions.filter((q, i) => selectedAnswers[i] === q.answer).length;
  const tabContent: Record<TabKey, string> = {
    transcript: data.transcript,
    en: data.translation_en,
    mm: data.translation_mm,
  };

  return (
    <div className="relative">
      {label !== undefined && (
        <span
          className={`absolute -left-2.5 -top-2.5 z-30 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-card ${
            isCompleted ? 'bg-success' : 'bg-ink'
          }`}
        >
          {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : label}
        </span>
      )}
      <div
        className={`relative overflow-hidden rounded-card border bg-surface shadow-card transition-colors ${
          isCompleted ? 'border-success/40' : 'border-line'
        }`}
      >

      {/* ===== HEADER (collapsed shows icon + title + difficulty/meta + time) ===== */}
      <button
        className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-surface-alt/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-card ${
            isCompleted ? 'bg-success text-white' : 'bg-accent-cool/15 text-accent-cool'
          }`}
        >
          <Headphones className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-[family-name:var(--font-display)] text-lg leading-tight ${isCompleted ? 'text-success' : 'text-ink'}`}>
              {data.title}
            </h3>
            {isCompleted && (
              <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold text-success">✓ Studied</span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
            <span className="truncate">{data.title_en}</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3" /> ~{estMin} min
            </span>
            <span className="hidden whitespace-nowrap sm:inline">· {data.questions.length} Q</span>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 flex-shrink-0 text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-4 px-5 pb-5">
          {/* Mode toggles */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setListenFirstMode((p) => !p)}
              className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-xs font-bold transition-all ${
                listenFirstMode ? 'bg-accent-cool text-white' : 'bg-accent-cool/10 text-accent-cool hover:bg-accent-cool/20'
              }`}
              title="Hide transcript and translations until you submit answers"
            >
              <Headphones className="h-3.5 w-3.5" />
              Listen-first
            </button>
            <button
              onClick={() => setShadowingMode((p) => !p)}
              className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-xs font-bold transition-all ${
                shadowingMode ? 'bg-accent text-white' : 'bg-accent/10 text-accent hover:bg-accent/20'
              }`}
              title="Shadowing mode: plays slowly with each sentence highlighted"
            >
              <Mic className="h-3.5 w-3.5" />
              Shadowing {shadowingMode && '(0.6×)'}
            </button>
          </div>

          {/* ===== AUDIO PLAYER ===== */}
          <div className="rounded-card bg-ink p-5 text-bg">
            {/* Waveform */}
            <div className="mb-4 flex h-12 items-center justify-center gap-[3px]" aria-hidden>
              {Array.from({ length: 48 }).map((_, i) => {
                const base = [40, 70, 30, 90, 55, 75, 35, 100, 60, 45, 80, 50][i % 12];
                return (
                  <span
                    key={i}
                    className="w-[3px] rounded-full"
                    style={{
                      height: `${base}%`,
                      background: isPlaying ? 'var(--color-accent-warm)' : 'rgba(255,255,255,0.22)',
                      transformOrigin: 'center',
                      animation: isPlaying ? `wave 0.9s ease-in-out ${i * 0.04}s infinite` : 'none',
                    }}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={isPlaying ? stopSpeaking : playFull}
                className="grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-float transition-all duration-200 hover:scale-105 hover:bg-[#a83d30] active:scale-95"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
              </button>
            </div>

            {/* Segmented speed control */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-[11px] font-medium text-white/45">Speed</span>
              <div className="inline-flex rounded-full bg-white/10 p-0.5">
                {SPEED_OPTIONS.map((opt) => {
                  const active = speed === opt.rate && !shadowingMode;
                  return (
                    <button
                      key={opt.rate}
                      onClick={() => { setSpeed(opt.rate); if (shadowingMode) setShadowingMode(false); }}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                        active ? 'bg-bg text-ink shadow-sm' : 'text-white/65 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== SENTENCE REPLAY ===== */}
          {sentences.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                {shadowingMode ? 'Tap to shadow each line' : 'Replay a sentence'}
              </p>
              <div className="space-y-1.5">
                {sentences.map((sent, i) => {
                  const isActive = activeSentence === i;
                  const isPlayed = playedSentences.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => playSentence(sent, i)}
                      className={`flex w-full items-start gap-2.5 rounded-chip border px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                        isActive
                          ? 'border-accent bg-accent/8 font-semibold text-ink'
                          : isPlayed
                            ? 'border-success/30 bg-success/[0.06] text-ink'
                            : 'border-line bg-surface-alt/50 text-ink hover:border-line-strong'
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-accent text-white' : isPlayed ? 'bg-success text-white' : 'bg-surface text-ink-muted'
                        }`}
                      >
                        {isPlayed && !isActive ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span className="jp pt-0.5 leading-snug">{sent}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== NOTEBOOK TABS: transcript / EN / MM ===== */}
          <div>
            <div className="flex gap-1 border-b border-line">
              {TABS.map((t) => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    disabled={listenFirstLocked}
                    onClick={() => setActiveTab(isActive ? null : t.key)}
                    className={`relative -mb-px px-3.5 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      isActive ? 'text-accent' : 'text-ink-muted hover:text-ink'
                    }`}
                    title={listenFirstLocked ? 'Submit answers first to reveal' : ''}
                  >
                    {t.label} {listenFirstLocked && '🔒'}
                    {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />}
                  </button>
                );
              })}
            </div>
            {listenFirstLocked && (
              <p className="mt-2 text-xs italic text-ink-muted">Answer all questions to unlock transcript and translations.</p>
            )}
            {activeTab && !listenFirstLocked && (
              <div
                key={activeTab}
                className={`animate-fade-in mt-3 rounded-chip border border-line p-4 ${activeTab === 'transcript' ? 'jp' : ''}`}
              >
                <p className={`whitespace-pre-line text-sm leading-relaxed ${activeTab === 'mm' ? 'mm' : 'text-ink'}`}>
                  {tabContent[activeTab]}
                </p>
              </div>
            )}
          </div>

          {/* ===== QUESTIONS ===== */}
          <div className="space-y-4 pt-1">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Comprehension questions</h4>

            {data.questions.map((q, qIndex) => (
              <div key={qIndex} className="rounded-card border border-line bg-surface-alt/40 p-4">
                <p className="font-semibold text-ink">{qIndex + 1}. <span className="jp">{q.question}</span></p>
                {q.question_mm && <p className="mt-0.5 text-sm mm">{q.question_mm}</p>}

                <div className="mt-3 grid grid-cols-1 gap-2">
                  {q.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === option;
                    const isCorrect = option === q.answer;
                    let cls = 'border-line bg-surface text-ink hover:border-accent/50';
                    if (showResults) {
                      if (isCorrect) cls = 'border-success bg-success/8 text-success';
                      else if (isSelected) cls = 'border-accent bg-accent/8 text-accent';
                      else cls = 'border-line bg-surface text-ink-muted/60';
                    } else if (isSelected) {
                      cls = 'border-accent bg-accent/8 text-ink font-semibold';
                    }
                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswer(qIndex, option)}
                        className={`flex items-center gap-2.5 rounded-chip border-2 p-3 text-left text-sm transition-all duration-200 ${cls}`}
                      >
                        <span
                          className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 ${
                            isSelected || (showResults && isCorrect) ? 'border-current' : 'border-line-strong'
                          }`}
                        >
                          {showResults && isCorrect && <CheckCircle className="h-4 w-4" />}
                          {showResults && isSelected && !isCorrect && <XCircle className="h-4 w-4" />}
                          {!showResults && isSelected && <span className="h-2 w-2 rounded-full bg-current" />}
                        </span>
                        <span className="jp">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3">
              {!showResults ? (
                <button
                  onClick={handleCheck}
                  disabled={isChecking || Object.keys(selectedAnswers).length < data.questions.length}
                  className="flex w-full items-center justify-center gap-2 rounded-card bg-accent px-5 py-3 text-sm font-bold text-white shadow-card transition-all hover:bg-[#a83d30] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isChecking ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : 'Check answers'}
                </button>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-card bg-success/10 px-4 py-2.5 text-sm font-bold text-success">
                    <CheckCircle className="h-4 w-4" />
                    {correctCount} / {data.questions.length} correct
                  </div>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-card border border-line bg-surface px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:border-line-strong"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ListeningExercise;
