"use client";
import { ListeningProps } from "@/types";
import { useState, useCallback } from "react";
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
} from "lucide-react";

const ListeningExercise = ({ data }: { data: ListeningProps }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTranslationEn, setShowTranslationEn] = useState(false);
  const [showTranslationMm, setShowTranslationMm] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [speed, setSpeed] = useState(0.8);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const cleanText = data.transcript
      .replace(/[A-Za-z]:\s*/g, "")
      .replace(/\n/g, "。");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ja-JP";
    utterance.rate = speed;
    utterance.pitch = 1.0;

    // Try to find a Japanese voice
    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice = voices.find(
      (v) => v.lang === "ja-JP" || v.lang.startsWith("ja")
    );
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [data.transcript, speed]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  const handleAnswer = (qIndex: number, option: string) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleCheck = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#3E3636]">{data.title}</h3>
            <p className="text-sm text-[#3E3636]/60">{data.title_en} · {data.title_mm}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-[#3E3636]/40" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#3E3636]/40" />
        )}
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Audio Controls */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={isPlaying ? stopSpeaking : speak}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-white" />
                ) : (
                  <Play className="h-6 w-6 text-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Speed Controls */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-[#3E3636]/50 font-medium">Speed:</span>
              {[0.5, 0.8, 1.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    speed === s
                      ? "bg-violet-500 text-white shadow-sm"
                      : "bg-white text-[#3E3636]/60 hover:bg-violet-100"
                  }`}
                >
                  {s === 0.5 ? "Slow" : s === 0.8 ? "Normal" : "Fast"}
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-[#3E3636]/40">
              🎧 Listen carefully, then answer the questions below
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
            >
              {showTranscript ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Transcript
            </button>
            <button
              onClick={() => setShowTranslationEn(!showTranslationEn)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              {showTranslationEn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              English
            </button>
            <button
              onClick={() => setShowTranslationMm(!showTranslationMm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
            >
              {showTranslationMm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              မြန်မာဘာသာ
            </button>
          </div>

          {showTranscript && (
            <div className="bg-violet-50/60 rounded-xl p-4 border border-violet-100">
              <p className="text-sm text-violet-800 leading-relaxed whitespace-pre-line font-medium">
                {data.transcript}
              </p>
            </div>
          )}

          {showTranslationEn && (
            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{data.translation_en}</p>
            </div>
          )}

          {showTranslationMm && (
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
                <p className="font-semibold text-[#3E3636]">
                  {qIndex + 1}. {q.question}
                </p>
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
            <div className="flex items-center gap-3">
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