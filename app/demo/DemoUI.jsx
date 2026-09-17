'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  CheckCircle2,
  Package,
  Circle,
  UploadCloud,
  Cpu,
  ScanText,
  ClipboardCheck,
  Scale,
  Gauge,
  Tag,
  IndianRupee,
  Building2,
  BadgeCheck,
  CalendarDays,
  Info,
  AlertCircle,
  AlertTriangle,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { DEMO_PRODUCT } from '../../lib/demoData';

// ============================================================
// LEGAL LENS — SHARED DEMO UI PRIMITIVES
// ============================================================
// Flat, minimal, enterprise-dark visual language. One accent
// color (blue) for interactive/neutral elements; status colors
// (emerald / amber / red) carry meaning, not decoration.
// Every Demo* page composes these so the five tabs + chatbot
// read as one product.
// ============================================================

export function DemoPage({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground ml-20 lg:ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">{children}</div>
    </div>
  );
}

// `accentColor` / `variant="hero"` are optional, additive-only
// extensions from the Part 1 color-system overhaul — every existing
// call site (none of which pass these props) renders exactly as
// before. Later parts can opt individual cards into a colored
// left-border + soft tint (e.g. per category, via
// lib/categoryColors.js) or a gradient hero surface without each
// page inventing its own one-off styling.
export function DemoCard({ children, className = '', style, accentColor, tint = false, variant }) {
  const isHero = variant === 'hero';
  const accentStyle = accentColor
    ? {
        borderLeftWidth: '4px',
        borderLeftColor: accentColor,
        ...(tint ? { backgroundColor: `color-mix(in srgb, ${accentColor} 12%, var(--card))` } : {}),
      }
    : {};
  const heroStyle = isHero ? { backgroundImage: 'var(--gradient-hero-vivid)' } : {};
  return (
    <div
      className={`rounded-2xl border border-white/[0.04] ${isHero ? '' : 'bg-card'} shadow-sm shadow-black/40 p-6 ${className}`}
      style={{ ...heroStyle, ...accentStyle, ...style }}
    >
      {children}
    </div>
  );
}

// ---- Page chrome: top bar + active-product strip + breadcrumb ----

export function TopBar({ icon: Icon, label }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/[0.06]">
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        {Icon && <Icon className="w-4 h-4 text-foreground-muted" />}
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border border-amber-500/30 bg-amber-500/15 text-amber-300">
          Instant cache
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border border-amber-500/30 bg-amber-500/15 text-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Demo
        </span>
      </div>
    </div>
  );
}

export function ActiveProductBar({ code = DEMO_PRODUCT.code }) {
  return (
    <DemoCard className="!py-3 !px-4">
      <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-foreground-muted" />
          <span className="uppercase tracking-widest text-foreground-muted">Active product</span>
          <span className="text-foreground font-medium">{code}</span>
        </div>
        <div className="flex items-center gap-1.5 text-foreground-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Local cached results · zero latency
        </div>
      </div>
    </DemoCard>
  );
}

export function Breadcrumb({ page }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 text-[11px]">
      <div className="uppercase tracking-widest text-foreground-muted">
        Legal Lens <span className="mx-1.5 text-foreground-muted/50">/</span>{' '}
        <span className="text-foreground-muted">{page}</span>
      </div>
      <div className="px-2 py-0.5 rounded border border-white/10 font-mono text-foreground-muted">
        DEMO_MODE = true
      </div>
    </div>
  );
}

export function PageHeader({ icon, label, page, code }) {
  return (
    <div className="space-y-4">
      <TopBar icon={icon} label={label} />
      <ActiveProductBar code={code} />
      <Breadcrumb page={page} />
    </div>
  );
}

export function Eyebrow({ color = 'blue', children }) {
  const dots = {
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
    violet: 'bg-violet-400',
    amber: 'bg-amber-400',
  };
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground-muted mb-3">
      <span className={`w-1.5 h-1.5 rounded-full ${dots[color] || dots.blue}`} />
      {children}
    </div>
  );
}

// ---- Content primitives ----

export function SectionTitle({ children, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-foreground">{children}</h2>
      {sub && <p className="text-sm text-foreground-muted mt-1">{sub}</p>}
    </div>
  );
}

// ---- Score gauge (hero visual) ----
// A single radial gauge used everywhere a compliance score appears.
// In its plain form (just `score`) it renders one animated arc — used
// by ProductHeader / Dashboard / Products where only the number is
// available. When also given `letterGrade` / `ocrConfidence` /
// `semanticAccuracy` (the Check Compliance results view), it grows
// extra concentric rings and folds those three metrics into one
// cohesive visual instead of separate stat cards.

export function scoreTone(pct) {
  if (pct >= 90) {
    return {
      stops: ['#059669', '#34d399'],
      solid: '#10b981',
      glow: 'rgba(16,185,129,0.5)',
      text: 'text-emerald-300',
      pill: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      track: 'rgba(16,185,129,0.13)',
    };
  }
  if (pct >= 70) {
    return {
      stops: ['#b45309', '#fbbf24'],
      solid: '#f59e0b',
      glow: 'rgba(245,158,11,0.5)',
      text: 'text-amber-300',
      pill: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      track: 'rgba(245,158,11,0.13)',
    };
  }
  return {
    stops: ['#b91c1c', '#f87171'],
    solid: '#ef4444',
    glow: 'rgba(239,68,68,0.55)',
    text: 'text-red-300',
    pill: 'bg-red-500/15 border-red-500/30 text-red-300',
    track: 'rgba(239,68,68,0.13)',
  };
}

// angle 0 = 3 o'clock in *unrotated* space — matches the native start
// point of an SVG <circle>'s dasharray. The whole <svg> is rotated
// -90deg with CSS so this ends up at 12 o'clock for both the rings
// and the tick marks drawn alongside them.
function polarPoint(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Eases the big centered number up from 0 on mount / whenever the
// score changes, instead of popping in statically.
function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const to = Math.max(0, Math.min(100, target ?? 0));
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);
  return value;
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function ScoreBadge({ score = 100, size = 'md', letterGrade, ocrConfidence, semanticAccuracy, glow = false }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const isLg = size === 'lg';
  const hasExtra = letterGrade != null || ocrConfidence != null || semanticAccuracy != null;
  const box = isLg ? (hasExtra ? 168 : 132) : 84;
  const cx = box / 2;
  const cy = box / 2;
  const margin = isLg ? 11 : 7;

  const pct = Math.max(0, Math.min(100, score));
  const tone = scoreTone(pct);
  const displayScore = useCountUp(pct);
  // Part 2 (Beauty & Color Pass): reuses Part 1's status-colored glow
  // utilities rather than inventing a new drop-shadow value — picks
  // the glow class matching the same pct thresholds as scoreTone()
  // above, so the ambient halo always agrees with the ring's own
  // color.
  const glowClass = glow ? (pct >= 90 ? 'glow-success' : pct >= 70 ? 'glow-warning' : 'glow-danger') : '';

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [pct, ocrConfidence, semanticAccuracy]);

  // Ring definitions, outer to inner. Score is always present; OCR /
  // semantic rings only appear when that data is actually passed in.
  const ringDefs = [{ key: 'score', value: pct, stroke: isLg ? (hasExtra ? 11 : 9) : 7, stops: tone.stops, track: tone.track, delay: 0 }];
  if (ocrConfidence != null) {
    ringDefs.push({ key: 'ocr', value: ocrConfidence, stroke: 5, stops: ['#6a5cf0', '#9c92f5'], track: 'rgba(124,111,238,0.16)', delay: 160 });
  }
  if (semanticAccuracy != null) {
    ringDefs.push({ key: 'sem', value: semanticAccuracy, stroke: 4, stops: ['#7c3aed', '#a78bfa'], track: 'rgba(124,58,237,0.16)', delay: 300 });
  }
  const ringGap = 6;
  let cursor = box / 2 - margin;
  const rings = ringDefs.map((rd) => {
    const radius = cursor - rd.stroke / 2;
    cursor = radius - rd.stroke / 2 - ringGap;
    return { ...rd, radius };
  });
  const outer = rings[0];

  return (
    <div className="flex flex-col items-center">
      <div className={`relative inline-flex items-center justify-center rounded-full ${glowClass}`} style={{ width: box, height: box }}>
        <svg width={box} height={box} className="-rotate-90" style={{ overflow: 'visible' }}>
          <defs>
            {rings.map((rg) => (
              <linearGradient key={rg.key} id={`sbGrad-${uid}-${rg.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={rg.stops[0]} />
                <stop offset="100%" stopColor={rg.stops[1]} />
              </linearGradient>
            ))}
          </defs>

          {/* tick marks at 0/25/50/75 around the outer track */}
          {[0, 25, 50, 75].map((t) => {
            const outerR = outer.radius + outer.stroke / 2 + 4;
            const innerR = outerR - 4;
            const angle = (t / 100) * 360;
            const p1 = polarPoint(cx, cy, outerR, angle);
            const p2 = polarPoint(cx, cy, innerR, angle);
            return (
              <line
                key={t}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="currentColor"
                className="text-foreground-muted/30"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          {rings.map((rg) => {
            const circumference = 2 * Math.PI * rg.radius;
            const val = Math.max(0, Math.min(100, rg.value ?? 0));
            const offset = ready ? circumference * (1 - val / 100) : circumference;
            return (
              <g key={rg.key}>
                <circle cx={cx} cy={cy} r={rg.radius} fill="none" stroke={rg.track} strokeWidth={rg.stroke} />
                <circle
                  cx={cx}
                  cy={cy}
                  r={rg.radius}
                  fill="none"
                  stroke={`url(#sbGrad-${uid}-${rg.key})`}
                  strokeWidth={rg.stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{
                    transition: `stroke-dashoffset 1.15s cubic-bezier(0.16,1,0.3,1) ${rg.delay}ms`,
                    filter: rg.key === 'score' ? `drop-shadow(0 0 5px ${ready ? tone.glow : 'transparent'})` : undefined,
                    transitionProperty: rg.key === 'score' ? 'stroke-dashoffset, filter' : 'stroke-dashoffset',
                    transitionDuration: rg.key === 'score' ? '1.15s, 900ms' : undefined,
                  }}
                />
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-foreground leading-none tabular-nums ${isLg ? (hasExtra ? 'text-4xl' : 'text-3xl') : 'text-lg'}`}>
            {displayScore}
          </span>
          {hasExtra ? (
            <>
              {letterGrade != null && (
                <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${tone.pill}`}>
                  Grade {letterGrade}
                </span>
              )}
              {(ocrConfidence != null || semanticAccuracy != null) && (
                <span className="mt-1.5 text-[9px] font-semibold tracking-wide text-foreground-muted">
                  {ocrConfidence != null ? `OCR ${ocrConfidence}` : ''}
                  {ocrConfidence != null && semanticAccuracy != null ? ' · ' : ''}
                  {semanticAccuracy != null ? `SEM ${semanticAccuracy}` : ''}
                </span>
              )}
            </>
          ) : (
            <span className={`text-[10px] font-medium tracking-widest -mt-0.5 ${tone.text}`}>SCORE</span>
          )}
        </div>
      </div>

      {hasExtra && (
        <div className="flex items-center gap-3 mt-3 text-[10px] font-medium text-foreground-muted">
          <LegendDot color={tone.solid} label="Score" />
          {ocrConfidence != null && <LegendDot color="#7C6FEE" label="OCR" />}
          {semanticAccuracy != null && <LegendDot color="#8b5cf6" label="Semantic" />}
        </div>
      )}
    </div>
  );
}

// ---- Aggregate compliance ring (Dashboard, Part 5) ----
// ScoreBadge's single accent-colored arc communicates "this one
// number, filled to this one number" — correct for a single
// product's score, but a catalog-wide overview is a composition of
// three categories (compliant / non-compliant / pending) that happen
// to sum to one whole. Re-using ScoreBadge as-is would fill the ring
// to the score value using the neutral score gradient and leave the
// non-compliant/pending share invisible until you read the rows below
// it. This is that same "communicate the whole before the detail"
// idea from Part 1, adapted into a segmented donut so the ring itself
// already shows the composition — the stat rows underneath become
// confirmation of numbers you can already see, not the first place
// you learn them.
// Part 4 (Dashboard richness pass): each arc can optionally render as
// a two-stop gradient (light->dark of its own status color) instead
// of a flat fill, echoing Part 1's bar-fill-gradient technique
// (app/globals.css's .bar-fill-category etc.) — but keyed to each
// segment's own status color rather than the category-color tokens,
// since compliant/non-compliant/pending are a status composition,
// not a category one. Purely additive: a segment with no `colorDark`
// still renders as the original flat `color` fill, so this stays
// backward compatible with any caller that doesn't pass it.
export function AggregateComplianceRing({ segments }) {
  const box = 152;
  const cx = box / 2;
  const cy = box / 2;
  const stroke = 14;
  const radius = box / 2 - stroke / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const gradientUid = useId();

  const headline = segments[0];
  const displayScore = useCountUp(headline?.pct ?? 0);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [segments]);

  let cumulativePct = 0;
  const arcs = segments.map((s) => {
    const startPct = cumulativePct;
    cumulativePct += s.pct;
    return { ...s, startPct };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center rounded-full glow-accent" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="-rotate-90" style={{ overflow: 'visible' }}>
          <defs>
            {arcs
              .filter((s) => s.pct > 0 && s.colorDark)
              .map((s) => (
                <linearGradient key={s.key} id={`${gradientUid}-${s.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={s.color} />
                  <stop offset="100%" stopColor={s.colorDark} />
                </linearGradient>
              ))}
          </defs>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={stroke} />
          {arcs
            .filter((s) => s.pct > 0)
            .map((s, i) => {
              // Tiny gap between adjacent segments so each category
              // reads as a distinct arc rather than one continuous
              // ring — invisible once a segment is the only one > 0.
              const gap = arcs.filter((a) => a.pct > 0).length > 1 ? 2 : 0;
              const segLen = Math.max((s.pct / 100) * circumference - gap, 0);
              return (
                <circle
                  key={s.key}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={s.colorDark ? `url(#${gradientUid}-${s.key})` : s.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${ready ? segLen : 0} ${circumference}`}
                  strokeDashoffset={-((s.startPct / 100) * circumference)}
                  style={{
                    transition: 'stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1)',
                    transitionDelay: `${i * 130}ms`,
                  }}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground leading-none tabular-nums">{displayScore}%</span>
          <span className="text-[10px] font-medium tracking-widest -mt-0.5 text-foreground-muted">
            {headline?.label?.toUpperCase() || 'SCORE'}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-4 text-[11px] font-medium">
        {segments.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-foreground-muted">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            {s.label} <span className="text-foreground font-semibold">{s.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Staged / animated analysis pipeline ----
// Generic stepper used by any flow that simulates multi-stage AI
// processing (Check Compliance's initial run AND the Re-check flow —
// both pass the same `stages` / `activeIndex` / `progressLabel`
// shape into this one component). `activeIndex` is the stage
// currently running; everything before it reads as done, everything
// after as pending. Presentation only — this owns none of the
// idle/running/done state machine or stage-advance timing.

// Per-stage iconography — keyed by the stage `key` values already in
// lib/demoData.js (upload/ai/ocr/analysis/reasoning/scoring). Falls
// back to a plain circle for any stage key it doesn't recognize, so
// this never breaks if stage data changes shape.
const PIPELINE_STAGE_ICONS = {
  upload: UploadCloud,
  ai: Cpu,
  ocr: ScanText,
  analysis: ClipboardCheck,
  reasoning: Scale,
  scoring: Gauge,
};

// Builds a smoothed cubic-bezier path through a list of points (the
// classic "symmetric horizontal control point" technique for a nice
// gentle curve with no overshoot). Used both as the visible SVG
// stroke and, verbatim, as the CSS motion-path for the traveling
// energy dot, so the two can never drift out of sync.
function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function PipelineStages({ stages, activeIndex, progressLabel }) {
  const n = stages.length;
  const pct = Math.round(((activeIndex + 1) / n) * 100);
  const currentStage = stages[Math.min(activeIndex, n - 1)];

  // Node layout: an evenly-spaced, gently undulating path rather than
  // a straight line or a plain vertical list.
  const width = 640;
  const height = 128;
  const padX = 48;
  const midY = height / 2;
  const amp = 16;
  const points = stages.map((_, i) => ({
    x: n === 1 ? width / 2 : padX + (i * (width - padX * 2)) / (n - 1),
    y: midY + Math.sin(i * 1.05) * amp,
  }));
  const pathD = buildSmoothPath(points);

  return (
    <DemoCard className="max-w-2xl mx-auto">
      {/* Overall progress — the thing that answers "how far along is
          this, not just which stage". */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-foreground-muted mb-2">
          <span>{progressLabel || 'Analyzing'}</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden relative">
          <div
            className="h-full rounded-full chart-fill-accent relative overflow-hidden transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          >
            <div className="pipeline-shimmer" />
          </div>
        </div>
      </div>

      {/* Node-flow: all 6 stages as points along one connected path.
          Done nodes collapse to a small filled checkmark, the active
          node is enlarged and glowing, pending nodes stay faint. */}
      {/* aspect-ratio (not a fixed px height) keeps horizontal and
          vertical scale identical at any container width — with a
          fixed height and preserveAspectRatio="none" the circular
          nodes would get squashed into ellipses on narrow (mobile)
          containers, since width and height would scale by different
          factors. Matching the wrapper's aspect ratio to the viewBox
          lets the default uniform "meet" scaling fill it exactly. */}
      <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="pipelineTraveledGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#9C8FFF" />
            </linearGradient>
          </defs>

          {/* faint full track */}
          <path d={pathD} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="3" strokeLinecap="round" />

          {/* portion already reached, in sync with the % above */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#pipelineTraveledGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - pct}
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)' }}
          />

          {/* small orb traveling the full path while this view is
              mounted (i.e. while the pipeline is running) — a
              continuous "system is working" cue layered over the
              per-stage progress. Lives inside the same SVG viewBox as
              the path so it always lines up, at any container width. */}
          <circle r="4" fill="#fff" className="pipeline-energy-dot" style={{ offsetPath: `path('${pathD}')` }} />

          {(() => {
            const outerR = 20;
            const innerR = 15;
            return points.map((p, i) => {
              const done = i < activeIndex;
              const current = i === activeIndex;
              const r = current ? outerR : innerR;
              return (
                <g key={stages[i].key}>
                  {current && (
                    <circle cx={p.x} cy={p.y} r={outerR + 7} fill="none" stroke="rgba(156,143,255,0.4)" strokeWidth="2" className="animate-ping" style={{ transformOrigin: `${p.x}px ${p.y}px` }} />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={done ? '#10b981' : current ? '#9C8FFF' : '#1D1B2E'}
                    stroke={done ? '#10b981' : current ? '#9C8FFF' : 'rgba(255,255,255,0.18)'}
                    strokeWidth={current ? 0 : 2}
                    style={{
                      filter: current ? 'drop-shadow(0 0 7px rgba(156,143,255,0.65))' : 'none',
                      transition: 'r 500ms cubic-bezier(0.16,1,0.3,1), fill 400ms ease-out',
                    }}
                  />
                </g>
              );
            });
          })()}
        </svg>

        {/* icon glyphs overlaid on each node (HTML, positioned by %
            so they track the SVG's own responsive scaling) */}
        {points.map((p, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          const Icon = PIPELINE_STAGE_ICONS[stages[i].key] || Circle;
          return (
            <div
              key={stages[i].key}
              className="absolute flex items-center justify-center pointer-events-none"
              style={{ left: `${(p.x / width) * 100}%`, top: `${(p.y / height) * 100}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`relative rounded-full flex items-center justify-center overflow-hidden ${current ? 'w-10 h-10' : 'w-[30px] h-[30px]'}`}>
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <Icon className={current ? 'w-5 h-5 text-white' : 'w-3.5 h-3.5 text-foreground-muted/40'} />
                )}
                {current && stages[i].key === 'ocr' && <span className="ocr-scan-sweep" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* single-focus current-stage callout — the completed stages
          have already collapsed into small checkmarks above */}
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-foreground">{currentStage.label}</p>
        <p className="text-xs text-foreground-muted mt-1">{currentStage.detail}</p>
      </div>
    </DemoCard>
  );
}

export function StatusPill({ status = 'Compliant' }) {
  const negative = /fail|non-?compliant|violation|high\s?risk|rejected/i.test(status);
  const warning = /pending|warning|review|medium\s?risk/i.test(status);
  const positive = !negative && !warning && /pass|compliant|active|verified|low\s?risk|in stock/i.test(status);

  const tone = negative
    ? 'bg-red-500/15 border-red-500/20 text-red-300'
    : warning
    ? 'bg-amber-500/15 border-amber-500/20 text-amber-300'
    : positive
    ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-300'
    : 'bg-white/5 border-white/5 text-foreground-muted';

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${tone}`}>
      {positive && <CheckCircle2 className="w-3.5 h-3.5" />}
      {status}
    </span>
  );
}

export function TabRow({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] pb-3">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            active === t ? 'bg-accent/10 border border-accent/20 text-foreground' : 'text-foreground-muted hover:text-foreground hover:bg-white/[0.03]'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function ProductHeader({ product }) {
  return (
    <DemoCard className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-1">Product details</p>
        <h1 className="text-xl font-bold text-foreground">{product.code}</h1>
        <p className="text-sm text-foreground-muted mt-1">
          {product.name} · {product.subtitle}
        </p>
      </div>
      <ScoreBadge score={product.score} />
    </DemoCard>
  );
}

export function KeyValue({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-1">{label}</p>
      <p className={`text-sm text-foreground whitespace-pre-line ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

// ---- OCR & Attribute Extraction display (Part 3) ----
// Groups the flat list of extracted OCR fields into a few
// conceptual zones — identity, quantity & price, manufacturer &
// address, regulatory IDs, dates, other — purely by matching each
// field's own label text. No new data is introduced: every field
// in `lines` still renders, just organized and revealed instead of
// dumped as one flat list. Because the grouping is derived from the
// label text itself (not a hardcoded field list), this works
// unmodified for both demo products even though their field sets
// differ (e.g. "Packer" vs "Imported By" / "Importer Address").
//
// Since there's no per-field confidence score anywhere in the data
// model (only a single overall `ocrConfidence` on the score
// summary), no per-field confidence visual is attempted here — that
// would mean inventing data that doesn't exist.

const OCR_CATEGORY_META = {
  identity: { label: 'Identity', icon: Tag },
  quantity: { label: 'Quantity & Price', icon: IndianRupee },
  manufacturer: { label: 'Manufacturer & Address', icon: Building2 },
  regulatory: { label: 'Regulatory IDs', icon: BadgeCheck },
  dates: { label: 'Dates', icon: CalendarDays },
  other: { label: 'Other Declarations', icon: Info },
};
const OCR_CATEGORY_ORDER = ['identity', 'quantity', 'manufacturer', 'regulatory', 'dates', 'other'];

// Checked most-specific-first so e.g. "Manufacturing Date" lands in
// `dates` rather than `manufacturer` (it contains both "manufactur"
// and "date" — date wins since it's more specific to that field).
function classifyOcrField(label) {
  const s = label.toLowerCase();
  if (/\bdate\b|best before|expiry/.test(s)) return 'dates';
  if (/fssai|country of origin|hsn/.test(s)) return 'regulatory';
  if (/net quantity|\bmrp\b/.test(s)) return 'quantity';
  if (/^brand$|product name|generic name|^category$|variant/.test(s)) return 'identity';
  if (/manufactur|packer|import|address/.test(s)) return 'manufacturer';
  return 'other';
}

function groupOcrLines(lines) {
  const buckets = {};
  lines.forEach((l) => {
    const cat = classifyOcrField(l.label);
    (buckets[cat] = buckets[cat] || []).push(l);
  });
  return OCR_CATEGORY_ORDER.filter((key) => buckets[key]?.length).map((key) => ({
    key,
    ...OCR_CATEGORY_META[key],
    fields: buckets[key],
  }));
}

// Decorative-only shapes suggesting each zone's kind of content on
// the abstract label diagram (no real product photo exists in this
// project). Purely geometric — never meant to resemble any real
// product's actual label layout.
function renderOcrBandShape(key, y0, bandH) {
  const cy = y0 + bandH / 2;
  switch (key) {
    case 'identity':
      return (
        <>
          <rect x="10" y={cy - 7} width="55" height="7" rx="3" fill="rgba(28,27,51,0.55)" />
          <rect x="10" y={cy + 3} width="35" height="5" rx="2.5" fill="rgba(28,27,51,0.3)" />
        </>
      );
    case 'quantity':
      return (
        <>
          <rect x="64" y={cy - 8} width="32" height="16" rx="3" fill="none" stroke="rgba(124,111,238,0.6)" strokeWidth="1.4" />
          <rect x="68" y={cy - 3} width="24" height="4" rx="2" fill="rgba(124,111,238,0.45)" />
        </>
      );
    case 'manufacturer':
      return (
        <>
          <rect x="10" y={cy - 10} width="60" height="3" rx="1.5" fill="rgba(28,27,51,0.25)" />
          <rect x="10" y={cy - 3} width="50" height="3" rx="1.5" fill="rgba(28,27,51,0.25)" />
          <rect x="10" y={cy + 4} width="40" height="3" rx="1.5" fill="rgba(28,27,51,0.25)" />
        </>
      );
    case 'regulatory':
      return (
        <>
          <circle cx="18" cy={cy} r="8" fill="none" stroke="rgba(16,185,129,0.6)" strokeWidth="1.6" />
          <path
            d={`M 14 ${cy} l 3 3 l 6 -6`}
            fill="none"
            stroke="rgba(16,185,129,0.8)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="32" y={cy - 5} width="45" height="3" rx="1.5" fill="rgba(28,27,51,0.25)" />
          <rect x="32" y={cy + 2} width="30" height="3" rx="1.5" fill="rgba(28,27,51,0.2)" />
        </>
      );
    case 'dates':
      return (
        <rect
          x="10"
          y={cy - 8}
          width="34"
          height="16"
          rx="2"
          fill="none"
          stroke="rgba(245,158,11,0.65)"
          strokeWidth="1.4"
          strokeDasharray="3 2"
        />
      );
    default:
      return (
        <>
          <path
            d={`M 15 ${cy + 6} L 10 ${cy - 6} L 20 ${cy - 6} Z`}
            fill="none"
            stroke="rgba(239,68,68,0.55)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <rect x="26" y={cy - 3} width="45" height="3" rx="1.5" fill="rgba(28,27,51,0.2)" />
        </>
      );
  }
}

export function OcrExtractionDisplay({ lines }) {
  const groups = groupOcrLines(lines);
  const n = groups.length;

  const containerRef = useRef(null);
  const pinRefs = useRef([]);
  const headerRefs = useRef([]);
  pinRefs.current = [];
  headerRefs.current = [];
  const [paths, setPaths] = useState([]);
  const [scanning, setScanning] = useState(true);

  // One-shot "AI is reading the label" cue — matches the timing of
  // the label-scan sweep beam below, then hands off to the callout
  // lines / field reveal.
  useEffect(() => {
    const t = setTimeout(() => setScanning(false), 1150);
    return () => clearTimeout(t);
  }, []);

  // Measures real on-screen positions of each zone's numbered pin
  // and each attribute panel's header so the connector lines are
  // drawn between where things actually render, not guessed
  // coordinates — this keeps them correct across field-count and
  // viewport differences between the two demo products.
  useEffect(() => {
    function measure() {
      const box = containerRef.current;
      if (!box) return;
      const boxRect = box.getBoundingClientRect();
      const next = groups
        .map((g, i) => {
          const pinEl = pinRefs.current[i];
          const headerEl = headerRefs.current[i];
          if (!pinEl || !headerEl) return null;
          const pr = pinEl.getBoundingClientRect();
          const hr = headerEl.getBoundingClientRect();
          const x1 = pr.left + pr.width / 2 - boxRect.left;
          const y1 = pr.top + pr.height / 2 - boxRect.top;
          const x2 = hr.left - boxRect.left;
          const y2 = hr.top + hr.height / 2 - boxRect.top;
          const midX = (x1 + x2) / 2;
          return { key: g.key, d: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`, delay: 1150 + i * 180 };
        })
        .filter(Boolean);
      setPaths(next);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  return (
    <div ref={containerRef} className="relative flex flex-col md:flex-row gap-8">
      {/* abstract label diagram — no real product photos exist in
          this project, so extraction is shown against a generic
          zoned layout instead of a real label image */}
      <div className="relative w-full md:w-[190px] shrink-0 mx-auto md:mx-0">
        <div className="relative rounded-2xl border border-white/10 bg-card" style={{ aspectRatio: '11 / 16' }}>
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <svg viewBox="0 0 110 160" className="w-full h-full">
              <rect x="4" y="4" width="102" height="152" rx="8" fill="#FBFAFF" stroke="rgba(0,0,0,0.08)" />
              {groups.map((g, i) => {
                const bandH = 152 / n;
                const y0 = 4 + i * bandH;
                return (
                  <g key={g.key}>
                    {i > 0 && <line x1="4" y1={y0} x2="106" y2={y0} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 2" />}
                    {renderOcrBandShape(g.key, y0, bandH)}
                  </g>
                );
              })}
            </svg>
            {scanning && <div className="ocr-label-scan-beam" />}
          </div>

          {groups.map((g, i) => {
            const bandH = 100 / n;
            const topPct = i * bandH + bandH / 2;
            return (
              <div
                key={g.key}
                ref={(el) => (pinRefs.current[i] = el)}
                className="ocr-pin absolute w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow shadow-accent/40"
                style={{ top: `${topPct}%`, right: '-8px', transform: 'translateY(-50%)', animationDelay: `${900 + i * 90}ms` }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
        <p className="text-center text-[11px] text-foreground-muted mt-2 uppercase tracking-widest">
          {scanning ? 'Scanning label…' : 'Extraction mapped'}
        </p>
      </div>

      {/* categorized attribute panels — every field from `lines`
          still renders, just grouped and revealed in sequence */}
      <div className="flex-1 space-y-4 min-w-0">
        {groups.map((g, i) => {
          const Icon = g.icon;
          return (
            <div
              key={g.key}
              ref={(el) => (headerRefs.current[i] = el)}
              className="ocr-category-reveal rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              style={{ animationDelay: `${1150 + i * 180}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
                <p className="text-[11px] uppercase tracking-widest text-foreground-muted font-semibold">{g.label}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {g.fields.map((f, fi) => (
                  <div
                    key={f.label}
                    className="ocr-field-reveal flex justify-between text-sm gap-3"
                    style={{ animationDelay: `${1150 + i * 180 + 150 + fi * 55}ms` }}
                  >
                    <span className="text-foreground-muted">{f.label}</span>
                    <span className="text-foreground text-right whitespace-pre-line">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* connector overlay — drawn last so the callout lines paint
          on top of the panels/diagram beneath them. Desktop only:
          on narrow layouts the diagram sits above a single stacked
          column instead of beside it, so a straight connector
          wouldn't map to anything meaningful; the shared numbering
          (and color) still ties each zone to its panel there. */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ overflow: 'visible' }}>
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            stroke="rgba(124,111,238,0.45)"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            className="ocr-callout-line"
            style={{ animationDelay: `${p.delay}ms` }}
          />
        ))}
      </svg>
    </div>
  );
}

const chipTones = {
  blue: 'bg-foreground-muted/10 border-foreground-muted/20 text-foreground-muted',
  emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  amber: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  red: 'bg-red-500/15 border-red-500/30 text-red-300',
  slate: 'bg-white/5 border-white/10 text-foreground-muted',
};

export function IconChip({ icon: Icon, tone = 'blue', size = 'md' }) {
  const dim = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-10 h-10' : 'w-11 h-11';
  const iconDim = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  return (
    <div className={`${dim} rounded-xl flex items-center justify-center border shrink-0 ${chipTones[tone] || chipTones.blue}`}>
      <Icon className={iconDim} />
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-semibold transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ---- Compliance Findings & Violations (Part 4) ----
// Findings/violations content and pass-fail logic are untouched —
// these components only change how `findings` and `violations`
// (already computed upstream, in lib/demoData.js) are presented.
// The state model in the real data is strictly binary (Passed /
// Failed) — `scoreSummary.warning` and `.notApplicable` are always
// zero in both demo datasets — so no third visual state is invented
// here; a warning/amber treatment would be presenting a state that
// doesn't occur.

// Ties a failed finding's ledger row to its violation card below by
// giving both the same number, in the order violations already come
// in (no reordering, no new data — just a shared index).
function buildViolationIndex(violations) {
  const map = {};
  violations.forEach((v, i) => {
    map[v.requirement] = i + 1;
  });
  return map;
}

// Finds the most relevant entry in the existing regulatoryReferences
// list for one violation, purely by matching the first significant
// word of the violation's requirement against the reference text
// (e.g. "Importer Details" -> "...Rule 6 (Importer Declaration)").
// Same spirit as OcrExtractionDisplay's classifyOcrField: presentation
// grouping derived from text that's already there, never new data. If
// nothing matches, callers fall back to pointing at the reference list
// below rather than showing a guessed citation.
function findRegulatoryCitation(requirement, regulatoryReferences = []) {
  const firstWord = requirement.split(/[\s(]+/)[0];
  if (!firstWord) return null;
  return regulatoryReferences.find((r) => r.toLowerCase().includes(firstWord.toLowerCase())) || null;
}

// Segmented summary bar — the "shape of the result" at a glance,
// before reading any individual line, echoing the score gauge's
// communicate-the-whole-first framing from Part 1.
export function ComplianceSummaryStrip({ findings }) {
  const total = findings.length || 1;
  const passed = findings.filter((f) => f.status === 'Passed').length;
  const failed = findings.length - passed;
  const passedPct = Math.round((passed / total) * 100);
  const failedPct = 100 - passedPct;

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [findings]);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between text-xs font-semibold mb-2">
        <span className="flex items-center gap-1.5 text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {passed} passed
        </span>
        {failed > 0 && (
          <span className="flex items-center gap-1.5 text-red-300">
            <AlertCircle className="w-3.5 h-3.5" />
            {failed} failed
          </span>
        )}
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: ready ? `${passedPct}%` : '0%' }}
        />
        {failed > 0 && (
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700 ease-out delay-100"
            style={{ width: ready ? `${failedPct}%` : '0%' }}
          />
        )}
      </div>
    </div>
  );
}

// Findings ledger — a checklist-style row per requirement, each with
// a distinct pass/fail icon treatment (filled emerald circle vs.
// outlined red circle) rather than colored text. Failed rows carry
// a small numbered badge that matches the corresponding violation
// card below, so the relationship reads at a glance.
export function FindingsLedger({ findings, violations }) {
  const violationIndex = buildViolationIndex(violations);
  return (
    <div className="divide-y divide-white/5">
      {findings.map((f, i) => {
        const passed = f.status === 'Passed';
        const num = violationIndex[f.requirement];
        return (
          <div
            key={f.requirement}
            className="finding-row flex items-center justify-between gap-3 py-3"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative shrink-0">
                {passed ? (
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full border-2 border-red-400 text-red-500 bg-card flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </span>
                )}
                {num != null && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                    {num}
                  </span>
                )}
              </span>
              <span className="text-sm text-foreground truncate">{f.requirement}</span>
            </div>
            <span className={`text-xs font-semibold shrink-0 ${passed ? 'text-emerald-300' : 'text-red-300'}`}>
              {f.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Violations reimagined as a structured issue / regulation / fix
// layout per card, instead of one stacked block — and numbered to
// match its finding row above. Content (whyItFailed, remediation) is
// unchanged; only the regulatory-citation column is derived (see
// findRegulatoryCitation) since violations don't carry their own
// per-item citation field in the data.
export function ViolationsPanel({ violations, regulatoryReferences }) {
  return (
    <div className="space-y-4">
      {violations.map((v, i) => {
        const citation = findRegulatoryCitation(v.requirement, regulatoryReferences);
        return (
          <DemoCard
            key={v.requirement}
            className="violation-card-reveal !p-0 overflow-hidden border-red-500/20"
            style={{ animationDelay: `${i * 130}ms` }}
          >
            <div className="flex items-center gap-3 px-5 py-3.5 bg-red-500/10/70 border-b border-red-500/20">
              <span className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-red-300 font-semibold">Failed Check</p>
                <p className="text-sm font-semibold text-foreground truncate">{v.requirement}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2 text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-widest font-semibold">Why it failed</span>
                </div>
                <p className="text-sm text-foreground-muted">{v.whyItFailed}</p>
              </div>
              <div className="p-5 bg-white/[0.015]">
                <div className="flex items-center gap-2 mb-2 text-foreground-muted">
                  <Scale className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-widest font-semibold">Regulatory basis</span>
                </div>
                <p className="text-sm text-foreground-muted">
                  {citation || 'See applicable regulatory references below.'}
                </p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2 text-accent">
                  <Wrench className="w-4 h-4" />
                  <span className="text-[11px] uppercase tracking-widest font-semibold">How to fix</span>
                </div>
                <p className="text-sm text-foreground">{v.remediation}</p>
              </div>
            </div>
          </DemoCard>
        );
      })}
    </div>
  );
}

// All-clear state — a deliberately calmer, positive treatment for
// the zero-violations case, instead of a plain recolored message.
export function AllClearPanel() {
  return (
    <DemoCard className="all-clear-panel flex items-center gap-4 border-emerald-500/20 bg-emerald-500/10/50 py-6">
      <span className="relative shrink-0 w-14 h-14 flex items-center justify-center">
        <span className="all-clear-ring absolute inset-0 rounded-full bg-emerald-400/40" />
        <span className="relative w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30">
          <ShieldCheck className="w-6 h-6" />
        </span>
      </span>
      <div>
        <p className="text-sm font-semibold text-emerald-300">No violations found</p>
        <p className="text-sm text-foreground-muted mt-0.5">
          Every check passed — this product&apos;s label meets all applicable requirements.
        </p>
      </div>
    </DemoCard>
  );
}
