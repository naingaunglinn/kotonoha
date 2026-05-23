import type { VocabularyProps } from "@/types";

export type QuizMode = 'jp-en' | 'en-jp' | 'jp-mm' | 'audio-jp';

export interface QuizConfig {
  mode: QuizMode;
  questionCount: number;
  sourceFilter: 'all' | 'page' | 'incomplete' | 'completed';
}

export interface QuizQuestion {
  word: VocabularyProps;
  options: string[];
  correctAnswer: string;
}

export interface QuizResult {
  question: QuizQuestion;
  selectedAnswer: string;
  isCorrect: boolean;
}

export const MODE_LABELS: Record<QuizMode, { title: string; desc: string }> = {
  'jp-en': { title: 'JP → EN', desc: 'See Japanese, pick English' },
  'en-jp': { title: 'EN → JP', desc: 'See English, pick Japanese' },
  'jp-mm': { title: 'JP → MM', desc: 'See Japanese, pick Myanmar' },
  'audio-jp': { title: '🔊 → JP', desc: 'Hear audio, pick the word' },
};

export const QUESTION_COUNTS = [10, 20, 50];
