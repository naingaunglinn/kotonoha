'use client';
import { useEffect, useState } from 'react';

const KANJIVG_BASE = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji';
const cache = new Map<string, string[]>();

export const fetchStrokes = async (char: string): Promise<string[]> => {
  if (cache.has(char)) return cache.get(char)!;
  const cp = char.codePointAt(0);
  if (!cp) return [];
  const hex = cp.toString(16).padStart(5, '0');
  const url = `${KANJIVG_BASE}/${hex}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`KanjiVG ${hex} returned ${res.status}`);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const ds = Array.from(doc.querySelectorAll('path'))
    .map(p => p.getAttribute('d') ?? '')
    .filter(Boolean);
  cache.set(char, ds);
  return ds;
};

export interface UseKanjiVGStrokesState {
  paths: string[];
  loading: boolean;
  error: string | null;
}

export const useKanjiVGStrokes = (char: string): UseKanjiVGStrokesState => {
  const [paths, setPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPaths([]);
    fetchStrokes(char)
      .then(ds => {
        if (cancelled) return;
        setPaths(ds);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load stroke data');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [char]);

  return { paths, loading, error };
};

export const VIEWBOX = 109;
