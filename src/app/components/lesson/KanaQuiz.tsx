'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Check, X, RotateCcw, Eye, Award } from 'lucide-react';
import { useKanjiVGStrokes, VIEWBOX } from './useKanjiVGStrokes';

interface KanaQuizProps {
  char: string;
  size?: number;
}

type Phase = 'idle' | 'drawing' | 'feedback-correct' | 'feedback-wrong' | 'complete';

interface Point { x: number; y: number }

const SAMPLE_COUNT = 24;
const PASS_AVG_DIST = 9;            // average per-sample distance threshold (in 109-unit space)
const PASS_ENDPOINT_DIST = 16;      // start/end point match
const HINT_REVEAL_MS = 900;         // how long to flash expected stroke after a miss

const samplePath = (pathEl: SVGPathElement, count: number): Point[] => {
  const length = pathEl.getTotalLength();
  if (length === 0) return [];
  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    const p = pathEl.getPointAtLength((i / (count - 1)) * length);
    out.push({ x: p.x, y: p.y });
  }
  return out;
};

const resamplePoints = (points: Point[], count: number): Point[] => {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(count).fill(points[0]);
  const cum: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    cum.push(total);
  }
  if (total === 0) return Array(count).fill(points[0]);
  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    const target = (i / (count - 1)) * total;
    let j = 0;
    while (j < cum.length - 1 && cum[j + 1] < target) j++;
    const segLen = cum[j + 1] - cum[j];
    const t = segLen > 0 ? (target - cum[j]) / segLen : 0;
    out.push({
      x: points[j].x + (points[j + 1].x - points[j].x) * t,
      y: points[j].y + (points[j + 1].y - points[j].y) * t,
    });
  }
  return out;
};

const scoreStroke = (expected: Point[], drawn: Point[]) => {
  if (expected.length === 0 || drawn.length < 2) {
    return { passed: false, avgDist: Infinity, startDist: Infinity, endDist: Infinity, drawnLen: 0 };
  }
  const sampled = resamplePoints(drawn, expected.length);
  let total = 0;
  for (let i = 0; i < expected.length; i++) {
    total += Math.hypot(sampled[i].x - expected[i].x, sampled[i].y - expected[i].y);
  }
  const avg = total / expected.length;
  const startDist = Math.hypot(sampled[0].x - expected[0].x, sampled[0].y - expected[0].y);
  const endDist = Math.hypot(
    sampled[sampled.length - 1].x - expected[expected.length - 1].x,
    sampled[sampled.length - 1].y - expected[expected.length - 1].y
  );
  // Require some minimum movement so a single tap doesn't accidentally pass
  let drawnLen = 0;
  for (let i = 1; i < drawn.length; i++) {
    drawnLen += Math.hypot(drawn[i].x - drawn[i - 1].x, drawn[i].y - drawn[i - 1].y);
  }
  const passed =
    avg < PASS_AVG_DIST &&
    startDist < PASS_ENDPOINT_DIST &&
    endDist < PASS_ENDPOINT_DIST &&
    drawnLen > 8;
  return { passed, avgDist: avg, startDist, endDist, drawnLen };
};

export default function KanaQuiz({ char, size = 280 }: KanaQuizProps) {
  const { paths, error } = useKanjiVGStrokes(char);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);

  const [strokeIndex, setStrokeIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const isPointerDown = useRef(false);

  // Reset everything when character changes
  useEffect(() => {
    setStrokeIndex(0);
    setPhase('idle');
    setDrawnPoints([]);
    setMistakes(0);
    setFirstTryCorrect(0);
    setCurrentAttempts(0);
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
    if (phase !== 'idle' || strokeIndex >= paths.length) return;
    const p = eventToSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    isPointerDown.current = true;
    setDrawnPoints([p]);
    setPhase('drawing');
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPointerDown.current || phase !== 'drawing') return;
    const p = eventToSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    setDrawnPoints(prev => [...prev, p]);
  };

  const onPointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    if (phase !== 'drawing') return;

    const expectedEl = pathRefs.current[strokeIndex];
    if (!expectedEl) { setPhase('idle'); return; }
    const expected = samplePath(expectedEl, SAMPLE_COUNT);
    const result = scoreStroke(expected, drawnPoints);

    if (result.passed) {
      setPhase('feedback-correct');
      if (currentAttempts === 0) setFirstTryCorrect(c => c + 1);
      setTimeout(() => {
        const next = strokeIndex + 1;
        setDrawnPoints([]);
        setCurrentAttempts(0);
        if (next >= paths.length) {
          setPhase('complete');
          setStrokeIndex(next);
        } else {
          setStrokeIndex(next);
          setPhase('idle');
        }
      }, 600);
    } else {
      setPhase('feedback-wrong');
      setMistakes(m => m + 1);
      setCurrentAttempts(c => c + 1);
      setTimeout(() => {
        setDrawnPoints([]);
        setPhase('idle');
      }, HINT_REVEAL_MS + 200);
    }
  };

  const restart = useCallback(() => {
    setStrokeIndex(0);
    setPhase('idle');
    setDrawnPoints([]);
    setMistakes(0);
    setFirstTryCorrect(0);
    setCurrentAttempts(0);
  }, []);

  const showHintNow = useCallback(() => {
    if (phase === 'complete') return;
    const el = pathRefs.current[strokeIndex];
    if (!el) return;
    const length = el.getTotalLength();
    el.style.transition = 'none';
    el.style.strokeDasharray = String(length);
    el.style.strokeDashoffset = String(length);
    el.style.stroke = '#412D15';
    el.style.opacity = '0.5';
    void el.getBoundingClientRect();
    el.style.transition = `stroke-dashoffset ${HINT_REVEAL_MS}ms linear`;
    el.style.strokeDashoffset = '0';
    setTimeout(() => {
      el.style.stroke = '';
      el.style.opacity = '';
      el.style.strokeDasharray = '';
      el.style.strokeDashoffset = '';
    }, HINT_REVEAL_MS + 200);
  }, [strokeIndex, phase]);

  // Flash the expected stroke after a miss
  useEffect(() => {
    if (phase !== 'feedback-wrong') return;
    showHintNow();
  }, [phase, showHintNow]);

  // Compute the next stroke's start point whenever it changes (refs are available after layout)
  useEffect(() => {
    if (phase === 'complete' || strokeIndex >= paths.length) {
      setStartPoint(null);
      return;
    }
    const id = requestAnimationFrame(() => {
      const el = pathRefs.current[strokeIndex];
      if (!el) { setStartPoint(null); return; }
      const p = el.getPointAtLength(0);
      setStartPoint({ x: p.x, y: p.y });
    });
    return () => cancelAnimationFrame(id);
  }, [strokeIndex, paths, phase]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
        <p className="text-xs text-[#1F150C]/50">Quiz unavailable for this character.</p>
      </div>
    );
  }

  const drawnPath = drawnPoints.length > 1
    ? `M ${drawnPoints[0].x} ${drawnPoints[0].y} ` +
      drawnPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const isDone = phase === 'complete';

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
        {/* Guide square */}
        <rect x="0.5" y="0.5" width={VIEWBOX - 1} height={VIEWBOX - 1} fill="none" stroke="rgba(31,21,12,0.06)" />
        <line x1={VIEWBOX / 2} y1="0" x2={VIEWBOX / 2} y2={VIEWBOX} stroke="rgba(31,21,12,0.08)" strokeDasharray="2 4" />
        <line x1="0" y1={VIEWBOX / 2} x2={VIEWBOX} y2={VIEWBOX / 2} stroke="rgba(31,21,12,0.08)" strokeDasharray="2 4" />

        {/* Completed strokes — solid */}
        {paths.map((d, i) => {
          if (i >= strokeIndex && phase !== 'complete') return null;
          return (
            <path
              key={`done-${i}`}
              d={d}
              fill="none"
              stroke="#1F150C"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Expected paths kept hidden until used (refs only) for getTotalLength + hint flash */}
        {paths.map((d, i) => (
          <path
            key={`ref-${i}`}
            ref={el => { pathRefs.current[i] = el; }}
            d={d}
            fill="none"
            stroke="transparent"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* User's in-progress stroke */}
        {drawnPath && (
          <path
            d={drawnPath}
            fill="none"
            stroke={phase === 'feedback-wrong' ? '#dc2626' : '#412D15'}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Start-point indicator for the current stroke */}
        {!isDone && phase === 'idle' && startPoint && (
          <g style={{ pointerEvents: 'none' }}>
            <circle cx={startPoint.x} cy={startPoint.y} r="4" fill="#412D15" />
            <circle cx={startPoint.x} cy={startPoint.y} r="7" fill="none" stroke="#412D15" strokeWidth="1" opacity="0.4">
              <animate attributeName="r" values="6;10;6" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <text x={startPoint.x} y={startPoint.y + 1.5} textAnchor="middle" fontSize="5.5" fill="white" fontWeight="bold" style={{ userSelect: 'none' }}>
              {strokeIndex + 1}
            </text>
          </g>
        )}
      </svg>

      {/* Feedback overlay */}
      {phase === 'feedback-correct' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-emerald-500 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg animate-[fade-in_0.15s_ease]">
            <Check className="w-10 h-10" strokeWidth={3} />
          </div>
        </div>
      )}
      {phase === 'feedback-wrong' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-red-500 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
            <X className="w-10 h-10" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Completion banner */}
      {isDone && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#E1DCC9]/85 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg max-w-[260px]">
            <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <p className="text-lg font-extrabold text-[#1F150C] mb-1">
              {mistakes === 0 ? 'Perfect!' : 'Done!'}
            </p>
            <p className="text-xs text-[#1F150C]/70 mb-4">
              {firstTryCorrect}/{paths.length} first try
              {mistakes > 0 && ` · ${mistakes} ${mistakes === 1 ? 'miss' : 'misses'}`}
            </p>
            <button
              onClick={restart}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#412D15] text-white text-sm font-bold rounded-full hover:bg-[#000000] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Status bar */}
      {!isDone && paths.length > 0 && (
        <>
          <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full bg-[#1F150C]/85 text-white text-[10px] font-bold tabular-nums">
            {Math.min(strokeIndex + 1, paths.length)} / {paths.length}
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-black/5">
            <button
              onClick={showHintNow}
              disabled={phase !== 'idle'}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[#1F150C]/70 hover:bg-[#1F150C]/10 text-xs font-bold transition-colors disabled:opacity-40"
              title="Show me this stroke"
            >
              <Eye className="w-3.5 h-3.5" />
              Hint
            </button>
            <button
              onClick={restart}
              className="w-8 h-8 rounded-full text-[#1F150C]/60 hover:bg-[#1F150C]/10 transition-colors flex items-center justify-center"
              title="Restart"
              aria-label="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
