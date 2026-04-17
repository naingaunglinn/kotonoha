"use client";
import { ReadingProps } from "@/types";
import { useState } from "react";
import { BookOpen, Eye, EyeOff, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

const ReadingPassage = ({ data }: { data: ReadingProps }) => {
  const [showTranslationEn, setShowTranslationEn] = useState(false);
  const [showTranslationMm, setShowTranslationMm] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
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
          {/* Passage */}
          <div className="bg-gradient-to-br from-[#F5EDED] to-[#F5EDED]/60 rounded-xl p-5">
            <p className="text-[#3E3636] text-lg leading-relaxed whitespace-pre-line font-medium">
              {data.passage}
            </p>
          </div>

          {/* Translation Toggles */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowTranslationEn(!showTranslationEn)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              {showTranslationEn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              English Translation
            </button>
            <button
              onClick={() => setShowTranslationMm(!showTranslationMm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
            >
              {showTranslationMm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              မြန်မာဘာသာ
            </button>
          </div>

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
                    let optionStyle = "bg-white border-[#3E3636]/10 hover:border-[#D72323]/40 text-[#3E3636]";

                    if (showResults) {
                      if (isCorrect) {
                        optionStyle = "bg-emerald-50 border-emerald-400 text-emerald-700";
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "bg-red-50 border-red-400 text-red-700";
                      } else {
                        optionStyle = "bg-white border-[#3E3636]/10 text-[#3E3636]/40";
                      }
                    } else if (isSelected) {
                      optionStyle = "bg-[#D72323]/10 border-[#D72323] text-[#D72323]";
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D72323] to-[#B71C1C] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="px-5 py-2.5 rounded-xl bg-[#3E3636]/10 text-[#3E3636] font-medium text-sm hover:bg-[#3E3636]/20 transition-colors"
                  >
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

export default ReadingPassage;