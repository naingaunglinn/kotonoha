'use client'
import React, {useState, useEffect} from 'react';
import {BookA, X, Volume2} from 'lucide-react';

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
        const hRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/character/hiragana.json`);
        const hData = await hRes.json();
        setHiraganaData(hData);

        const kRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/data/character/katakana.json`);
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
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg bg-[#3E3636] text-white hover:bg-[#D72323] transition-all hover:scale-105 active:scale-95 group"
        title="Kana Reference Sheet (Ctrl+K)"
      >
        <BookA className="w-6 h-6" />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#3E3636] text-sm text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
          Kana Chart
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="bg-[#F5EDED] w-full max-w-4xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex-none p-6 border-b border-black/5 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <h2 className="text-2xl font-extrabold text-[#3E3636]">Kana Chart</h2>
                <div className="flex bg-[#3E3636]/10 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('hiragana')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeTab === 'hiragana' 
                        ? 'bg-white text-[#D72323] shadow-sm' 
                        : 'text-[#3E3636]/60 hover:text-[#3E3636]'
                    }`}
                  >
                    あ Hiragana
                  </button>
                  <button
                    onClick={() => setActiveTab('katakana')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeTab === 'katakana' 
                        ? 'bg-white text-[#D72323] shadow-sm' 
                        : 'text-[#3E3636]/60 hover:text-[#3E3636]'
                    }`}
                  >
                    ア Katakana
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex text-xs font-bold text-[#3E3636]/40 bg-[#3E3636]/5 px-3 py-1.5 rounded-full">
                  Ctrl + K
                </div>
                <button
                  onClick={toggleModal}
                  className="p-2 rounded-full bg-white hover:bg-black/5 transition-colors text-[#3E3636]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {currentData.map((row, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                    <div className="text-xs font-bold text-[#3E3636]/40 uppercase mb-3 px-1 border-b border-black/5 pb-2">
                      {row.char_row === 'basic' ? 'Vowels' : 
                       row.char_row.startsWith('yoon') ? 'Combinations' : 
                       row.char_row + '-row'}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {row.characters.map((char, charIdx) => {
                        const isEmpty = !char.kana || char.kana.trim() === '';
                        return (
                          <div key={charIdx} className="aspect-square flex-1">
                            {!isEmpty ? (
                              <button
                                onClick={() => speak(char.kana)}
                                className="w-full h-full flex flex-col items-center justify-center rounded-xl hover:bg-[#D72323]/10 hover:text-[#D72323] transition-colors group relative"
                              >
                                <span className="text-2xl font-bold text-[#3E3636] group-hover:text-[#D72323] transition-colors">
                                  {char.kana}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-[#3E3636]/50 mt-1">
                                  {char.romaji}
                                </span>
                                
                                {/* Hover Speaker Icon */}
                                <div className="absolute inset-0 bg-transparent flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none">
                                  <Volume2 className="w-8 h-8" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-full h-full rounded-xl bg-black/5" />
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
