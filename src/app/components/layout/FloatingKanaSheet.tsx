'use client'
import React, {useState, useEffect} from 'react';
import {BookA, X} from 'lucide-react';
import { getDataUrl } from '@/utils/dataUrl';

// Character data structure matching the JSON
interface KanaCharacter {
  kana: string;
  romaji: string;
}

interface KanaRow {
  char_row: string;
  characters: KanaCharacter[];
}

export default function FloatingKanaSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hiragana' | 'katakana'>('hiragana');
  const [hiraganaData, setHiraganaData] = useState<KanaRow[]>([]);
  const [katakanaData, setKatakanaData] = useState<KanaRow[]>([]);

  useEffect(() => {
    // Fetch JSON data for kana
    const fetchKana = async () => {
      try {
        const hRes = await fetch(getDataUrl('/data/character/hiragana.json'));
        const hData = await hRes.json();
        setHiraganaData(hData);

        const kRes = await fetch(getDataUrl('/data/character/katakana.json'));
        const kData = await kRes.json();
        setKatakanaData(kData);
      } catch (err) {
        console.error("Failed to fetch kana data", err);
      }
    };
    fetchKana();
  }, []);

  // Keyboard shortcut Ctrl+K or Ctrl+H
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'k' || e.key === 'h')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleModal = () => setIsOpen(!isOpen);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Speech Utility
  const speak = (text: string, lang = 'ja-JP') => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const currentData = activeTab === 'hiragana' ? hiraganaData : katakanaData;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleModal}
        className="group fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-ink text-bg shadow-float transition-all hover:scale-105 hover:bg-accent active:scale-95 sm:bottom-6 sm:right-6"
        title="Kana Reference Sheet (Ctrl+K)"
      >
        <BookA className="h-6 w-6" />
        <span className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2 whitespace-nowrap rounded-chip bg-ink px-3 py-1.5 text-sm font-bold text-bg opacity-0 shadow-float transition-opacity group-hover:opacity-100">
          Kana chart
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm sm:p-8">
          <div className="animate-rise flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[20px] border border-line bg-bg shadow-float">
            {/* Header */}
            <div className="flex flex-none items-center justify-between border-b border-line p-5">
              <div className="flex items-center gap-4">
                <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">Kana chart</h2>
                <div className="flex rounded-full bg-surface-alt p-1">
                  <button
                    onClick={() => setActiveTab('hiragana')}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                      activeTab === 'hiragana' ? 'bg-ink text-bg shadow-sm' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <span className="jp">あ</span> Hiragana
                  </button>
                  <button
                    onClick={() => setActiveTab('katakana')}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                      activeTab === 'katakana' ? 'bg-ink text-bg shadow-sm' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <span className="jp">ア</span> Katakana
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full bg-surface-alt px-3 py-1.5 text-xs font-bold text-ink-muted sm:flex">
                  Ctrl + K
                </div>
                <button
                  onClick={toggleModal}
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/5"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="relative flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {currentData.map((row, idx) => (
                  <div key={idx} className="rounded-card border border-line bg-surface p-4 shadow-card">
                    <div className="mb-3 border-b border-line pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      {row.char_row === 'basic' ? 'Vowels' :
                       row.char_row.startsWith('yoon') ? 'Combinations' :
                       row.char_row + '-row'}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {row.characters.map((char, charIdx) => {
                        const isEmpty = !char.kana || char.kana.trim() === '';
                        return (
                          <div key={charIdx} className="aspect-square">
                            {!isEmpty ? (
                              <button
                                onClick={() => speak(char.kana)}
                                className="group flex h-full w-full flex-col items-center justify-center rounded-chip transition-colors hover:bg-surface-alt"
                              >
                                <span className="jp text-2xl text-ink transition-colors group-hover:text-accent">
                                  {char.kana}
                                </span>
                                <span className="text-[10px] font-bold uppercase text-ink-muted">{char.romaji}</span>
                              </button>
                            ) : (
                              <div className="h-full w-full rounded-chip bg-surface-alt/50" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
