import type { VocabularyProps } from "@/types";
import type { QuizMode, QuizQuestion } from "./types";

export const speak = (text: string, lang = 'ja-JP') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

export const shuffle = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const generateQuestions = (
  sourceWords: VocabularyProps[],
  allWords: VocabularyProps[],
  mode: QuizMode,
  count: number
): QuizQuestion[] => {
  const selected = shuffle(sourceWords).slice(0, count);

  return selected.map((word) => {
    let correctAnswer: string;
    let getOptionText: (w: VocabularyProps) => string;

    switch (mode) {
      case 'jp-en':
        correctAnswer = word.meaning || '';
        getOptionText = (w) => w.meaning || '';
        break;
      case 'en-jp':
        correctAnswer = word.word || '';
        getOptionText = (w) => w.word || '';
        break;
      case 'jp-mm':
        correctAnswer = word.meaning_mm || '';
        getOptionText = (w) => w.meaning_mm || '';
        break;
      case 'audio-jp':
        correctAnswer = word.word || '';
        getOptionText = (w) => w.word || '';
        break;
      default:
        correctAnswer = word.meaning || '';
        getOptionText = (w) => w.meaning || '';
    }

    const distractors = shuffle(
      allWords.filter((w) => getOptionText(w) !== correctAnswer && getOptionText(w))
    )
      .slice(0, 3)
      .map(getOptionText);

    const options = shuffle([correctAnswer, ...distractors]);
    return { word, options, correctAnswer };
  });
};

export const findVocabByString = (
  str: string,
  vocab: VocabularyProps[],
  mode: QuizMode
): VocabularyProps | undefined => {
  return vocab.find(v => {
    switch (mode) {
      case 'jp-en':
      case 'audio-jp':
        return v.meaning === str;
      case 'en-jp':
        return v.word === str;
      case 'jp-mm':
        return v.meaning_mm === str;
      default:
        return false;
    }
  });
};
