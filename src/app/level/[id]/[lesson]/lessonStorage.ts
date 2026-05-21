import type { PartOfSpeech, VocabularyProps } from "@/types";

export const COMPLETED_STORAGE_KEY = (levelId: string) =>
  `kotonoha_vocab_completed_n${levelId}`;

export const loadCompletedSet = (levelId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(COMPLETED_STORAGE_KEY(levelId));
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch { /* ignore parse errors */ }
  return new Set();
};

export const saveCompletedSet = (levelId: string, set: Set<string>) => {
  localStorage.setItem(COMPLETED_STORAGE_KEY(levelId), JSON.stringify([...set]));
};

type RawVocabularyItem = Omit<VocabularyProps, 'part_of_speech' | 'formality' | 'tag'> & {
  part_of_speech?: string | null;
  formality?: string | null;
  tag?: string | string[] | null;
};

export const normalizeVocabulary = (data: unknown): VocabularyProps[] => {
  return (data as RawVocabularyItem[]).map((item) => {
    let pos: PartOfSpeech | null | undefined = null;
    if (item.part_of_speech) {
      const p = item.part_of_speech.toLowerCase();
      if (p.includes('noun') || p.includes('counter')) pos = 'Noun';
      else if (p.includes('verb')) pos = 'Verb';
      else if (p.includes('adj')) pos = 'Adjective';
      else if (p.includes('adv')) pos = 'Adverb';
      else if (p.includes('particle')) pos = 'Particle';
      else if (
        p.includes('expression') || p.includes('phrase') ||
        p.includes('conjunction') || p.includes('suffix') || p.includes('pronoun')
      ) pos = 'Expression';
      else pos = 'Noun';
    }

    let form: VocabularyProps['formality'] = null;
    if (item.formality) {
      const f = item.formality.toLowerCase();
      if (f.includes('formal')) form = 'Formal';
      else if (f.includes('casual')) form = 'Casual';
      else form = 'Neutral';
    }

    let rawTag = item.tag;
    if (Array.isArray(rawTag)) {
      rawTag = rawTag.length > 0 ? rawTag[0] : null;
    }
    const tag: VocabularyProps['tag'] = rawTag && typeof rawTag === 'string'
      ? (rawTag.charAt(0).toUpperCase() + rawTag.slice(1)) as VocabularyProps['tag']
      : null;

    return { ...item, part_of_speech: pos, formality: form, tag };
  });
};
