'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useKanjiVGStrokes } from './useKanjiVGStrokes';

interface KanaWriterProps {
  char: string;
  size?: number;
  className?: string;
  autoplay?: boolean;
}

const STROKE_MS = 900;
const PAUSE_BETWEEN_MS = 250;

export default function KanaWriter({ char, size = 280, className = '', autoplay = true }: KanaWriterProps) {
  const { paths, error } = useKanjiVGStrokes(char);
  const [activeIndex, setActiveIndex] = useState(-1); // -1 = idle, 0..n-1 animating, n = done
  const [isPlaying, setIsPlaying] = useState(false);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset animation styles for all paths
  const resetStyles = useCallback(() => {
    pathRefs.current.forEach(p => {
      if (!p) return;
      const length = p.getTotalLength();
      p.style.transition = 'none';
      p.style.strokeDasharray = String(length);
      p.style.strokeDashoffset = String(length);
    });
  }, []);

  // Animate a single stroke
  const playStroke = useCallback((index: number) => {
    const p = pathRefs.current[index];
    if (!p) return;
    const length = p.getTotalLength();
    p.style.transition = 'none';
    p.style.strokeDasharray = String(length);
    p.style.strokeDashoffset = String(length);
    // force reflow so the next style change starts a transition
    void p.getBoundingClientRect();
    p.style.transition = `stroke-dashoffset ${STROKE_MS}ms linear`;
    p.style.strokeDashoffset = '0';
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    setActiveIndex(-1);
    resetStyles();
  }, [resetStyles]);

  const play = useCallback(() => {
    if (paths.length === 0) return;
    clearTimer();
    setIsPlaying(true);
    // If we're done, restart from 0; otherwise advance from current
    setActiveIndex(prev => (prev < 0 || prev >= paths.length ? 0 : prev));
  }, [paths.length]);

  // Reset playback when char changes
  useEffect(() => {
    setActiveIndex(-1);
    setIsPlaying(false);
    return () => { clearTimer(); };
  }, [char]);

  // After paths load, reset styles and optionally autoplay
  useEffect(() => {
    if (paths.length === 0) return;
    pathRefs.current = pathRefs.current.slice(0, paths.length);
    // Wait a frame so refs are wired
    const id = requestAnimationFrame(() => {
      resetStyles();
      if (autoplay) {
        setIsPlaying(true);
        setActiveIndex(0);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [paths, autoplay, resetStyles]);

  // Drive the animation: when activeIndex changes and isPlaying, animate it
  useEffect(() => {
    if (!isPlaying) return;
    if (activeIndex < 0 || activeIndex >= paths.length) {
      setIsPlaying(false);
      return;
    }
    playStroke(activeIndex);
    timerRef.current = setTimeout(() => {
      setActiveIndex(prev => prev + 1);
    }, STROKE_MS + PAUSE_BETWEEN_MS);
    return clearTimer;
  }, [activeIndex, isPlaying, paths.length, playStroke]);

  const completedCount = activeIndex < 0
    ? 0
    : Math.min(activeIndex + (isPlaying ? 0 : 1), paths.length);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <p className="text-xs text-[#1F150C]/50">
            Stroke order unavailable for this character.
          </p>
        </div>
      )}

      {!error && (
        <svg
          viewBox="0 0 109 109"
          width={size}
          height={size}
          className="w-full h-full"
          aria-label={`Stroke order for ${char}`}
        >
          {/* Faint guide square */}
          <rect x="0.5" y="0.5" width="108" height="108" fill="none" stroke="rgba(31,21,12,0.06)" />
          <line x1="54.5" y1="0" x2="54.5" y2="109" stroke="rgba(31,21,12,0.08)" strokeDasharray="2 4" />
          <line x1="0" y1="54.5" x2="109" y2="54.5" stroke="rgba(31,21,12,0.08)" strokeDasharray="2 4" />

          {paths.map((d, i) => {
            const isCompleted = i < completedCount;
            const isActive = i === activeIndex && isPlaying;
            return (
              <path
                key={`${char}-${i}`}
                ref={el => { pathRefs.current[i] = el; }}
                d={d}
                fill="none"
                stroke={isActive || isCompleted ? '#1F150C' : 'rgba(31,21,12,0.12)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>
      )}

      {!error && paths.length > 0 && (
        <>
          <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full bg-[#1F150C]/85 text-white text-[10px] font-bold tabular-nums">
            {Math.min(completedCount, paths.length)} / {paths.length}
          </div>

          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-black/5">
            <button
              onClick={isPlaying ? stop : play}
              className="w-8 h-8 rounded-full bg-[#412D15] text-white flex items-center justify-center hover:bg-[#000000] transition-colors"
              title={isPlaying ? 'Pause animation' : 'Play stroke order'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button
              onClick={reset}
              className="w-8 h-8 rounded-full text-[#1F150C]/60 hover:bg-[#1F150C]/10 transition-colors flex items-center justify-center"
              title="Reset"
              aria-label="Reset animation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
