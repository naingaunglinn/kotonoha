"use client";
import { ListeningProps } from "@/types";
import { useState, useCallback, useEffect } from "react";
import {
  Headphones,
  Play,
  Pause,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Mic,
} from "lucide-react";

// Speed options: label + rate + button label
const SPEED_OPTIONS = [
  { label: 'Slow',   rate: 0.6 },
  { label: 'Normal', rate: 0.8 },
  { label: 'Fast',   rate: 1.0 },
  { label: '1.2×',   rate: 1.2 },
];

// Split raw transcript into clean sentence segments
const splitTranscript = (transcript: string): string[] => {
  return transcript
    .split('\n')
    .map(line => line.replace(/^[A-Za-z]:\s*/, '').trim())
    .filter(line => line.length > 0);
};

// Speak a single string using Web Speech API
const speakText = (
  text: string,
  rate: number,
  onStart: () => void,
  onEnd: () => void,
): void => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate;
  utterance.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const japaneseVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
  if (japaneseVoice) utterance.voice = japaneseVoice;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
};

const ListeningExercise = ({ data }: { data: ListeningProps }) => {
  const [isPlaying, setIsPlaying]           = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTranslationEn, setShowTranslationEn] = useState(false);
  const [showTranslationMm, setShowTranslationMm] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults]       = useState(false);
  const [expanded, setExpanded]             = useState(false);
  const [speed, setSpeed]                   = useState(0.8);

  // Listen-first mode: hide transcript & translations until all questions answered
  const [listenFirstMode, setListenFirstMode] = useState(false);
  const listenFirstLocked = listenFirstMode && !showResults;

  // Shadowing mode: per-sentence highlight + 0.6× playback
  const [shadowingMode, setShadowingMode]   = useState(false);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const shadowingSpeed = 0.6;

  // Build sentence list: prefer data.sentences[], fallback to splitting transcript
  const sentences: string[] = data.sentences && data.sentences.length > 0
    ? data.sentences.map(s => s.text)
    : splitTranscript(data.transcript);

  const playFull = useCallback(() => {
    const cleanText = data.transcript
      .replace(/[A-Za-z]:\s*/g, '')
      .replace(/\n/g, '。');
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

  // Play a single sentence (per-sentence replay + shadowing highlight)
  const playSentence = useCallback((text: string, index: number) => {
    setActiveSentence(index);
    speakText(
      text,
      shadowingMode ? shadowingSpeed : speed,
      () => setIsPlaying(true),
      () => { setIsPlaying(false); setActiveSentence(null); },
    );
  }, [speed, shadowingMode]);

  // Cancel speech when component unmounts or collapses
  useEffect(() => {
    if (!expanded) stopSpeaking();
    return () => stopSpeaking();
  }, [expanded, stopSpeaking]);

  const handleAnswer = (qIndex: number, option: string) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleCheck = () => setShowResults(true);

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    stopSpeaking();
  };

  const correctCount = data.questions.filter(
    (q, i) => selectedAnswers[i] === q.answer
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-[#3E3636]/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#F5EDED]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#3E3636]">{data.title}</h3>
            <p className="text-sm text-[#3E3636]/60">{data.title_en} · {data.title_mm}</p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="h-5 w-5 text-[#3E3636]/40 flex-shrink-0" />
          : <ChevronDown className="h-5 w-5 text-[#3E3636]/40 flex-shrink-0" />
        }
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Mode Toggles */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setListenFirstMode(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                listenFirstMode
                  ? 'bg-violet-500 text-white'
                  : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
              }`}
              title="Hide transcript and translations until you submit answers"
            >
              <Headphones className="h-3.5 w-3.5" />
              Listen-First
            </button>
            <button
              onClick={() => setShadowingMode(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                shadowingMode
                  ? 'bg-[#D72323] text-white'
                  : 'bg-red-50 text-[#D72323] hover:bg-red-100'
              }`}
              title="Shadowing mode: plays slowly with each sentence highlighted"
            >
              <Mic className="h-3.5 w-3.5" />
              Shadowing {shadowingMode && '(0.6×)'}
            </button>
          </div>

          {/* Audio Controls */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 space-y-4">
            {/* Play / Pause */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={isPlaying ? stopSpeaking : playFull}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isPlaying
                  ? <Pause className="h-6 w-6 text-white" />
                  : <Play className="h-6 w-6 text-white ml-0.5" />
                }
              </button>
            </div>

            {/* Speed Controls */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs text-[#3E3636]/50 font-medium">Speed:</span>
              {SPEED_OPTIONS.map(opt => (
                <button
                  key={opt.rate}
                  onClick={() => { setSpeed(opt.rate); if (shadowingMode) setShadowingMode(false); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    speed === opt.rate && !shadowingMode
                      ? 'bg-violet-500 text-white shadow-sm'
                      : 'bg-white text-[#3E3636]/60 hover:bg-violet-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {shadowingMode && (
              <p className="text-center text-xs font-bold text-[#D72323]">
                🎤 Shadowing mode active — playing at 0.6×, tap each sentence to repeat it
              </p>
            )}
            {!shadowingMode && (
              <p className="text-center text-xs text-[#3E3636]/40">
                🎧 Listen carefully, then answer the questions below
              </p>
            )}
          </div>

          {/* Per-sentence replay / shadowing panel */}
          {sentences.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-[#3E3636]/40 uppercase tracking-wider">
                {shadowingMode ? 'Tap to shadow each line' : 'Replay a sentence'}
              </p>
              <div className="space-y-1">
                {sentences.map((sent, i) => (
                  <button
                    key={i}
                    onClick={() => playSentence(sent, i)}
                    className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      activeSentence === i
                        ? shadowingMode
                          ? 'bg-[#D72323]/10 border border-[#D72323]/30 text-[#D72323] font-bold'
                          : 'bg-violet-100 border border-violet-300 text-violet-800 font-bold'
                        : 'bg-[#F5EDED]/60 hover:bg-violet-50 text-[#3E3636]'
                    }`}
                  >
                    <Play className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-50" />
                    <span className="leading-snug">{sent}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Buttons — locked in listen-first mode */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => !listenFirstLocked && setShowTranscript(!showTranscript)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                listenFirstLocked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
              }`}
              title={listenFirstLocked ? 'Submit answers first to reveal transcript' : ''}
            >
              {showTranscript ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Transcript {listenFirstLocked && '🔒'}
            </button>
            <button
              onClick={() => !listenFirstLocked && setShowTranslationEn(!showTranslationEn)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                listenFirstLocked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {showTranslationEn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              English {listenFirstLocked && '🔒'}
            </button>
            <button
              onClick={() => !listenFirstLocked && setShowTranslationMm(!showTranslationMm)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                listenFirstLocked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
            >
              {showTranslationMm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              မြန်မာဘာသာ {listenFirstLocked && '🔒'}
            </button>
          </div>

          {listenFirstLocked && (
            <p className="text-xs text-[#3E3636]/50 italic">
              Answer all questions below to unlock transcript and translations.
            </p>
          )}

          {showTranscript && !listenFirstLocked && (
            <div className="bg-violet-50/60 rounded-xl p-4 border border-violet-100">
              <p className="text-sm text-violet-800 leading-relaxed whitespace-pre-line font-medium">
                {data.transcript}
              </p>
            </div>
          )}
          {showTranslationEn && !listenFirstLocked && (
            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{data.translation_en}</p>
            </div>
          )}
          {showTranslationMm && !listenFirstLocked && (
            <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
              <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">{data.translation_mm}</p>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-[#3E3636]/60 uppercase tracking-wider">
              Comprehension Questions
            </h4>

            {data.questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-[#F5EDED]/40 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-[#3E3636]">{qIndex + 1}. {q.question}</p>
                <p className="text-sm text-[#3E3636]/50">{q.question_mm}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === option;
                    const isCorrect = option === q.answer;
                    let optionStyle = "bg-white border-[#3E3636]/10 hover:border-violet-400 text-[#3E3636]";

                    if (showResults) {
                      if (isCorrect) {
                        optionStyle = "bg-emerald-50 border-emerald-400 text-emerald-700";
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "bg-red-50 border-red-400 text-red-700";
                      } else {
                        optionStyle = "bg-white border-[#3E3636]/10 text-[#3E3636]/40";
                      }
                    } else if (isSelected) {
                      optionStyle = "bg-violet-100 border-violet-500 text-violet-700";
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswer(qIndex, option)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${optionStyle}`}
                      >
                        {showResults && isCorrect && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                        {showResults && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Submit / Reset */}
            <div className="flex items-center gap-3 flex-wrap">
              {!showResults ? (
                <button
                  onClick={handleCheck}
                  disabled={Object.keys(selectedAnswers).length < data.questions.length}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Check Answers
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-medium text-sm">
                    <CheckCircle className="h-4 w-4" />
                    {correctCount} / {data.questions.length} correct
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3E3636]/10 text-[#3E3636] font-medium text-sm hover:bg-[#3E3636]/20 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListeningExercise;
