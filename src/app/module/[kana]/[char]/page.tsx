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

  const TABS = [
    { key: 'order' as const, label: 'Stroke order', icon: BookOpen },
    { key: 'practice' as const, label: 'Practice', icon: PenLine },
    { key: 'quiz' as const, label: 'Quiz', icon: ClipboardCheck },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <Link
        href={`/module/${kana}`}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="capitalize">{kana}</span>
      </Link>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Character Info */}
        <div className="relative grid place-items-center overflow-hidden rounded-[20px] border border-line bg-surface p-6 shadow-card">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(26,26,46,0.04) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(26,26,46,0.04) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-4">
            <h1 className="jp text-[10rem] leading-none text-ink">{character?.kana}</h1>
            {character?.romaji && (
              <span className="rounded-full bg-surface-alt px-4 py-1 text-sm font-bold uppercase tracking-[0.2em] text-accent">
                {character.romaji}
              </span>
            )}
            <button
              onClick={() => speak(character?.kana)}
              disabled={!character?.kana}
              title={character?.kana ? `Pronounce ${character.kana}` : ''}
              className="grid h-12 w-12 place-items-center rounded-full bg-ink text-bg transition-all hover:bg-accent active:scale-95 disabled:opacity-40"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stroke-order / Practice / Quiz */}
        <div className="flex flex-col rounded-[20px] border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 inline-flex self-center rounded-full bg-surface-alt p-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
                  mode === key ? 'bg-ink text-bg shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
                aria-pressed={mode === key}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="relative mx-auto h-[360px] w-[360px] max-w-full overflow-hidden rounded-card border-2 border-dashed border-line-strong bg-bg">
            {mode === 'order' && character?.kana && <KanaWriter char={character.kana} autoplay />}
            {mode === 'practice' && character?.kana && <KanaTrace char={character.kana} />}
            {mode === 'quiz' && character?.kana && <KanaQuiz char={character.kana} />}
          </div>

          <p className="mt-3 text-center text-[10px] text-ink-muted">
            Stroke data from{' '}
            <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noopener noreferrer" className="underline">
              KanjiVG
            </a>{' '}
            (CC&nbsp;BY-SA&nbsp;3.0).
          </p>
        </div>
      </div>
    </div>
  )
}
export default Char;
