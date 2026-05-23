import { useEffect, useState } from "react";
import type {
  VocabularyProps,
  KanjiProps,
  GrammarProps,
  ReadingProps,
  ListeningProps,
} from "@/types";
import { getDataUrl } from "@/utils/dataUrl";
import { normalizeVocabulary } from "./lessonStorage";

interface LessonData {
  vocab: VocabularyProps[] | null;
  kanji: KanjiProps[] | null;
  grammar: GrammarProps[];
  reading: ReadingProps[];
  listening: ListeningProps[];
}

export const useLessonData = (lesson: string, id: string): LessonData => {
  const [vocab, setVocab] = useState<VocabularyProps[] | null>([]);
  const [kanji, setKanji] = useState<KanjiProps[] | null>([]);
  const [grammar, setGrammar] = useState<GrammarProps[]>([]);
  const [reading, setReading] = useState<ReadingProps[]>([]);
  const [listening, setListening] = useState<ListeningProps[]>([]);

  useEffect(() => {
    const fetchJson = async <T,>(path: string): Promise<T | null> => {
      try {
        const response = await fetch(getDataUrl(path));
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error(`Failed to fetch ${path}:`, error);
        return null;
      }
    };

    if (lesson === 'vocab') {
      fetchJson<unknown>(`/data/vocabulary/${id}/vocabulary.json`).then((data) => {
        if (data) setVocab(normalizeVocabulary(data));
      });
    }
    if (lesson === 'kanji') {
      fetchJson<KanjiProps[]>(`/data/kanji/${id}/${lesson}.json`).then((data) => {
        if (data) setKanji(data);
      });
    }
    if (lesson === 'grammar') {
      fetchJson<GrammarProps[]>(`/data/grammar/${id}/${lesson}.json`).then((data) => {
        if (data) setGrammar(data);
      });
    }
    if (lesson === 'reading') {
      fetchJson<ReadingProps[]>(`/data/reading/${id}/reading.json`).then((data) => {
        if (data) setReading(data);
      });
    }
    if (lesson === 'listening') {
      fetchJson<ListeningProps[]>(`/data/listening/${id}/listening.json`).then((data) => {
        if (data) setListening(data);
      });
    }
  }, [lesson, id]);

  return { vocab, kanji, grammar, reading, listening };
};
