'use client'
import {BasicCharProps} from "@/types";
import {useEffect, useState, useCallback} from "react";
import {ChevronLeft, Volume2, BookOpen, PenLine, ClipboardCheck} from 'lucide-react';
import {useParams} from "next/navigation";
import Link from "next/link";
import { getDataUrl } from "@/utils/dataUrl";
import KanaWriter from "@/app/components/lesson/KanaWriter";
import KanaQuiz from "@/app/components/lesson/KanaQuiz";
import KanaTrace from "@/app/components/lesson/KanaTrace";

const speak = (text: string | null | undefined, lang = 'ja-JP') => {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.8;
  const voices = window.speechSynthesis.getVoices();
  const ja = voices.find(v => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
  if (ja) utterance.voice = ja;
  window.speechSynthesis.speak(utterance);
};

const Char = () => {
  const params = useParams<{ kana: string; char: string }>();
  const { kana, char } = params!;
  const [character, setCharacter] = useState<BasicCharProps>();
  const [mode, setMode] = useState<'order' | 'practice' | 'quiz'>('order');

  const fetchCharacter = useCallback(async (char: string) => {
    const response = await fetch(getDataUrl(`/data/character/${kana}.json`), {
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: { characters: BasicCharProps[] }[] = await response.json();
    const allCharacters = data.flatMap(group => group.characters);
    const foundCharacter = allCharacters.find(
      (c) => c.kana === char || c.romaji === char
    );
    setCharacter(foundCharacter);
  }, [kana]);

  useEffect(() => {
    fetchCharacter(char);
  }, [char, fetchCharacter]);

  return (
    <div className="max-w-5xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="relative text-center mb-16 max-w-3xl mx-auto">
        <Link href={`/module/${kana}`} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#1F150C]/10 transition-colors duration-300">
          <ChevronLeft className="h-6 w-6 text-[#1F150C]" />
        </Link>
      </div>
      <div className="bg-[#E1DCC9] rounded-3xl shadow-2xl w-full max-w-4xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative animate-fade-in">
        {/* Character Info */}
        <div className="flex flex-col items-center justify-center bg-white/50 rounded-2xl p-6 border border-black/5">
          <h1 className="text-9xl font-bold text-[#1F150C]">{character?.kana}</h1>
        </div>

        {/* Stroke-order / Practice / Quiz */}
        <div className="flex flex-col">
          {/* Mode tabs */}
          <div className="inline-flex p-1 bg-[#1F150C]/10 rounded-xl mb-4 self-center">
            <button
              onClick={() => setMode('order')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'order'
                  ? 'bg-white text-[#412D15] shadow-sm'
                  : 'text-[#1F150C]/60 hover:text-[#1F150C]'
              }`}
              aria-pressed={mode === 'order'}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Stroke </span>order
            </button>
            <button
              onClick={() => setMode('practice')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'practice'
                  ? 'bg-white text-[#412D15] shadow-sm'
                  : 'text-[#1F150C]/60 hover:text-[#1F150C]'
              }`}
              aria-pressed={mode === 'practice'}
            >
              <PenLine className="w-4 h-4" />
              Practice
            </button>
            <button
              onClick={() => setMode('quiz')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'quiz'
                  ? 'bg-white text-[#412D15] shadow-sm'
                  : 'text-[#1F150C]/60 hover:text-[#1F150C]'
              }`}
              aria-pressed={mode === 'quiz'}
            >
              <ClipboardCheck className="w-4 h-4" />
              Quiz
            </button>
          </div>

          <div className="relative w-[400px] h-[400px] max-w-full bg-white rounded-2xl border-2 border-dashed border-[#1F150C]/20 overflow-hidden mx-auto">
            {mode === 'order' && character?.kana && (
              <KanaWriter char={character.kana} autoplay />
            )}
            {mode === 'practice' && character?.kana && (
              <KanaTrace char={character.kana} />
            )}
            {mode === 'quiz' && character?.kana && (
              <KanaQuiz char={character.kana} />
            )}
          </div>

          <p className="mt-2 text-[10px] text-center text-[#1F150C]/40">
            Stroke data from{' '}
            <a
              href="https://kanjivg.tagaini.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              KanjiVG
            </a>{' '}
            (CC&nbsp;BY-SA&nbsp;3.0).
          </p>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => speak(character?.kana)}
              disabled={!character?.kana}
              title={character?.kana ? `Pronounce ${character.kana}` : ''}
              className="mt-4 p-3 rounded-full bg-white hover:bg-[#412D15] text-[#1F150C] hover:text-white transition-all duration-300 self-start disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Volume2 className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Char;
