'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Eye, EyeOff, Eraser } from 'lucide-react';
import { useKanjiVGStrokes, VIEWBOX } from './useKanjiVGStrokes';

interface KanaTraceProps {
  char: string;
  size?: number;
}

interface Point { x: number; y: number }

const pointsToPath = (pts: Point[]): string => {
  if (pts.length < 2) return '';
  return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} ` +
    pts.slice(1).map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
};

export default function KanaTrace({ char, size = 280 }: KanaTraceProps) {
  const { paths, error } = useKanjiVGStrokes(char);
  const svgRef = useRef<SVGSVGElement>(null);
  const isPointerDown = useRef(false);

  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [current, setCurrent] = useState<Point[]>([]);
  const [showGuide, setShowGuide] = useState(true);

  // Reset drawing when character changes
  useEffect(() => {
    setStrokes([]);
    setCurrent([]);
  }, [char]);

  const eventToSvgPoint = useCallback((clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = eventToSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    isPointerDown.current = true;
    setCurrent([p]);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPointerDown.current) return;
    const p = eventToSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    setCurrent(prev => [...prev, p]);
  };

  const onPointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setCurrent(prev => {
      if (prev.length > 1) {
        setStrokes(s => [...s, prev]);
      }
      return [];
    });
  };

  const clearStrokes = useCallback(() => {
    setStrokes([]);
    setCurrent([]);
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
        <p className="text-xs text-[#1a1a2e]/50">Practice unavailable for this character.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        width={size}
        height={size}
        className="w-full h-full touch-none cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Guide square + crosshair */}
        <rect x="0.5" y="0.5" width={VIEWBOX - 1} height={VIEWBOX - 1} fill="none" stroke="rgba(31,21,12,0.06)" />
        <line x1={VIEWBOX / 2} y1="0" x2={VIEWBOX / 2} y2={VIEWBOX} stroke="rgba(31,21,12,0.08)" strokeDasharray="2 4" />
        <line x1="0" y1={VIEWBOX / 2} x2={VIEWBOX} y2={VIEWBOX / 2} stroke="rgba(31,21,12,0.08)" strokeDasharray="2 4" />

        {/* Faint character guide */}
        {showGuide && paths.map((d, i) => (
          <path
            key={`guide-${i}`}
            d={d}
            fill="none"
            stroke="rgba(31,21,12,0.13)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* Completed user strokes */}
        {strokes.map((s, i) => (
          <path
            key={`stroke-${i}`}
            d={pointsToPath(s)}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* In-progress stroke */}
        {current.length > 1 && (
          <path
            d={pointsToPath(current)}
            fill="none"
            stroke="#bf4b3c"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {/* Controls */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-black/5">
        <button
          onClick={() => setShowGuide(v => !v)}
          className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/10 text-xs font-bold transition-colors"
          aria-pressed={showGuide}
          title={showGuide ? 'Hide guide' : 'Show guide'}
        >
          {showGuide ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showGuide ? 'Hide' : 'Show'}
        </button>
        <button
          onClick={clearStrokes}
          disabled={strokes.length === 0 && current.length === 0}
          className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/10 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Clear"
        >
          <Eraser className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
}
