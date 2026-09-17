'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  FileCheck2,
  Percent,
  Globe,
  Building2,
  Search,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Store,
  TrendingUp,
  TrendingDown,
  TrendingUpDown,
  Minus,
  ArrowLeftRight,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import Navbar from '../Navbar';
import { DemoPage, DemoCard, SectionTitle, TabRow, KeyValue, PageHeader, Eyebrow } from '../demo/DemoUI';
import { EntityAvatar, ComplianceStatusChip, StatChip } from '../demo/ItemIdentity';
import { SELLER_VERIFICATION_DATA, SELLER_DIRECTORY, DEMO_PRODUCT } from '../../lib/demoData';

const TABS = ['Business & Compliance History', 'Risk Assessment'];

// ------------------------------------------------------------
// Directory resolution (runtime, not assumed)
// ------------------------------------------------------------
// SELLER_DIRECTORY is the multi-seller expansion added to
// lib/demoData.js. It is resolved at runtime rather than trusted to
// exist: if that expansion isn't present (or is a single-entry
// array), this falls back to wrapping the original single
// SELLER_VERIFICATION_DATA record so the page still renders exactly
// as it did before — and the Compare entry point below disables
// itself off the same check instead of opening an empty comparison.
const DIRECTORY =
  Array.isArray(SELLER_DIRECTORY) && SELLER_DIRECTORY.length > 0
    ? SELLER_DIRECTORY
    : [{ id: 'seller-primary', ...SELLER_VERIFICATION_DATA }];

const CAN_COMPARE = DIRECTORY.length > 1;

// ============================================================
// Part 7 — Seller Verification richness pass
// ============================================================
// Investigation (see the Part 7 report for full detail): exactly one
// seller record exists in SELLER_VERIFICATION_DATA — this page is a
// single-seller lookup tool, the same shape as Check Compliance is a
// single-product tool, not a catalog with a hidden picker. Both
// "unseen" tabs (Business & Compliance History, Risk Assessment)
// already carried real content in code — business registration
// fields, three compliance-history stats, a 5-entry recent-activity
// list, and a six-factor risk breakdown — it just rendered as flat
// label/value text and plain pills. Nothing below adds a new seller,
// a new history entry, or a new risk factor; it reuses Part 3's
// identity/status/stat components and the visual-upgrade series'
// risk-spectrum and timeline patterns to present the same data with
// real hierarchy.

// Single-entity risk spectrum — echoes Entities' "Risk Spectrum"
// ladder (visual-upgrade series, Part 6) but reduced to exactly one
// marker. That page plots several entities across a tier spread;
// this seller has exactly one risk record with one tier (Low), so
// there is no multi-entity spread to visualize and no per-seller
// numeric score to place more precisely along the track — inventing
// one would fabricate data that doesn't exist. Reuses the same
// gradient track markup, zone labels, and `risk-pin-reveal` entrance
// animation as the Entities ladder rather than a new visual system.
const RISK_ZONE_PCT = { Low: 14, Medium: 50, High: 86 };
const RISK_ZONE_COLOR = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

function riskZoneKey(riskLevel = '') {
  if (/high/i.test(riskLevel)) return 'High';
  if (/medium/i.test(riskLevel)) return 'Medium';
  return 'Low';
}

function SellerRiskSpectrum({ sellerName, riskLevel }) {
  const zone = riskZoneKey(riskLevel);
  const leftPct = RISK_ZONE_PCT[zone];
  const color = RISK_ZONE_COLOR[zone];

  return (
    <DemoCard>
      <SectionTitle sub="This seller's position on the same Low – Medium – High risk spectrum used elsewhere in Legal Lens. One seller, one recorded tier — there's no per-seller numeric score to plot more precisely.">
        Risk Spectrum
      </SectionTitle>
      {/* Bug 4 fix: the marker and zone labels previously used `top`
          offsets guessed against this block's own padding (which an
          absolutely-positioned child never actually sees, since its
          containing block starts at the padding edge, not after the
          padding). That guess was off — the marker rendered far above
          the bar, and the zone labels landed on top of it. The track
          now gets its own `relative` wrapper sized to exactly its own
          height, so the marker's `bottom: calc(100% + gap)` is always
          anchored to the bar's real top edge, and the zone labels are
          ordinary flow content placed below the bar instead of an
          absolutely-positioned overlay guessing where the bar is. */}
      <div className="pt-12 px-2">
        <div className="relative h-2.5">
          <div
            className="risk-ladder-track absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)' }}
          />
          <div
            className="risk-pin-reveal absolute flex flex-col items-center"
            style={{ left: `${leftPct}%`, bottom: 'calc(100% + 6px)', transform: 'translateX(-50%)' }}
          >
            <span
              className="relative w-6 h-6 rounded-full ring-2 ring-card shadow-sm flex items-center justify-center"
              style={{ background: color }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="mt-1.5 text-[11px] font-semibold text-foreground text-center leading-tight max-w-[140px]">
              {sellerName}
            </span>
          </div>
        </div>
        <div className="flex justify-between text-[11px] text-foreground-muted font-medium mt-3">
          <span>Low Risk</span>
          <span>Medium Risk</span>
          <span>High Risk</span>
        </div>
      </div>
    </DemoCard>
  );
}

// Compliance activity timeline — echoes DemoRewards' redemption
// history timeline (rail + circular icon node + card per entry)
// applied to the existing `recentActivity` list instead of the flat
// divided rows it rendered as before. Every entry, date and status
// already existed in `recentActivity`; only the presentation and the
// per-row icon/tone (derived from each entry's own status text, the
// same way ComplianceStatusChip classifies a status) are new.
function ComplianceActivityTimeline({ items }) {
  return (
    <div>
      {items.map((a, i) => {
        const isLast = i === items.length - 1;
        const negative = /fail|non-?compliant|violation|rejected/i.test(a.status);
        return (
          <div
            key={a.date + a.item}
            className="compliance-timeline-row relative flex gap-4"
            style={{ animationDelay: `${i * 90}ms`, paddingBottom: isLast ? 0 : '1.1rem' }}
          >
            {!isLast && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-white/10" aria-hidden="true" />}
            <span
              className={`relative z-10 w-10 h-10 rounded-full bg-card border-2 flex items-center justify-center shrink-0 shadow-sm ${
                negative ? 'border-red-500/40 shadow-red-500/10' : 'border-emerald-500/30 shadow-emerald-500/10'
              }`}
            >
              {negative ? (
                <AlertCircle className="w-4 h-4 text-red-300" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              )}
            </span>
            <DemoCard className="!py-3.5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{a.item}</p>
                <p className="text-xs text-foreground-muted">{a.date}</p>
              </div>
              <ComplianceStatusChip status={a.status} />
            </DemoCard>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Seller directory search + browse (multi-seller expansion)
// ------------------------------------------------------------
// Replaces the old disabled single-seller stub now that
// DIRECTORY (lib/demoData.js) actually holds multiple
// sellers. Two ways in: type-ahead search with a live dropdown, or
// "Browse all sellers" for a full grid. Both funnel into the same
// `onSelect(seller)` callback the parent uses to swap the detail
// panel's data — there's exactly one notion of "the selected
// seller", not a separate state per entry point.

function SellerSearchBar({ query, onQueryChange, results, onSelect, onClear }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <DemoCard className="!py-3.5 !px-4">
        <label className="flex items-center gap-3">
          <Search className="w-4 h-4 text-foreground-muted shrink-0" />
          <input
            type="text"
            placeholder="Search sellers by name…"
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
          />
          {query && (
            <button
              type="button"
              onClick={onClear}
              className="text-foreground-muted hover:text-foreground transition shrink-0"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] text-foreground-muted whitespace-nowrap hidden sm:inline">
            {DIRECTORY.length} sellers on file
          </span>
        </label>
      </DemoCard>

      {open && query && (
        <DemoCard className="!p-2 absolute z-20 left-0 right-0 mt-2 max-h-80 overflow-y-auto shadow-lg shadow-black/40">
          {results.length === 0 ? (
            <p className="text-sm text-foreground-muted px-3 py-4 text-center">
              No sellers match “{query}”.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelect(s);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition text-left"
                >
                  <EntityAvatar name={s.sellerInfo.sellerName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{s.sellerInfo.sellerName}</p>
                    <p className="text-xs text-foreground-muted flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {s.sellerInfo.marketplace}
                    </p>
                  </div>
                  <ComplianceStatusChip status={`${s.sellerInfo.riskLevel} Risk`} size="sm" />
                </button>
              ))}
            </div>
          )}
        </DemoCard>
      )}
    </div>
  );
}

function SellerDirectoryGrid({ sellers, selectedId, onSelect }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sellers.map((s) => {
        const active = s.id === selectedId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            className={`text-left rounded-2xl border p-4 flex items-start gap-3 transition ${
              active
                ? 'border-accent/40 bg-accent/[0.06]'
                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
            }`}
          >
            <EntityAvatar name={s.sellerInfo.sellerName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{s.sellerInfo.sellerName}</p>
              <p className="text-xs text-foreground-muted mt-0.5 truncate">{s.sellerInfo.sellerType}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <ComplianceStatusChip status={`${s.sellerInfo.riskLevel} Risk`} size="sm" />
                <span className="inline-flex items-center gap-1 text-[11px] text-foreground-muted">
                  <Globe className="w-3 h-3" /> {s.sellerInfo.marketplace}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Risk-trend sparkline (derived from real recentActivity dates)
// ------------------------------------------------------------
// No new data dimension is invented here: recentActivity already
// carries a real date and a real status string per entry (the same
// statuses ComplianceStatusChip / ComplianceActivityTimeline above
// already classify — Compliant / Non-Compliant / Pending Review
// across the directory). This just (1) sorts those entries
// chronologically instead of the newest-first order they're stored
// in, and (2) maps each entry's own status to a point on a 0-100
// axis using the same tier language as the rest of the page, so the
// polyline is a plot of real historical entries, not a fabricated
// curve. A seller with fewer than 2 entries has no line to draw —
// that's shown as an explicit empty state rather than a flat/fake
// line.
const ACTIVITY_SCORE_TIERS = [
  { test: /fail|non-?compliant|violation|rejected/i, score: 20, label: 'Non-Compliant', tone: '#ef4444' },
  { test: /pending|warning|review/i, score: 60, label: 'Pending Review', tone: '#f59e0b' },
  { test: /pass|compliant|active|verified/i, score: 100, label: 'Compliant', tone: '#10b981' },
];
const ACTIVITY_SCORE_FALLBACK = { score: 50, tone: '#8b8b9a' };

function activityScore(status = '') {
  return ACTIVITY_SCORE_TIERS.find((t) => t.test.test(status)) || { ...ACTIVITY_SCORE_FALLBACK, label: status };
}

function parseActivityDate(dateStr) {
  const t = Date.parse(dateStr);
  return Number.isNaN(t) ? 0 : t;
}

function RiskTrendSparkline({ activity = [], sellerName }) {
  const points = useMemo(() => {
    return [...activity]
      .map((a) => ({ ...a, ts: parseActivityDate(a.date), ...activityScore(a.status) }))
      .sort((a, b) => a.ts - b.ts);
  }, [activity]);

  const [hoverIdx, setHoverIdx] = useState(null);

  if (points.length < 2) {
    return (
      <DemoCard>
        <SectionTitle sub="Needs at least two dated compliance-activity entries to plot a trend.">
          Risk Trend
        </SectionTitle>
        <p className="text-sm text-foreground-muted flex items-center gap-2">
          <TrendingUpDown className="w-4 h-4 text-foreground-muted shrink-0" />
          Not enough history for a trend — only {points.length} recorded activity {points.length === 1 ? 'entry' : 'entries'} for {sellerName}.
        </p>
      </DemoCard>
    );
  }

  const width = 560;
  const height = 96;
  const padX = 16;
  const padY = 14;
  const n = points.length;
  const xAt = (i) => (n === 1 ? width / 2 : padX + (i * (width - padX * 2)) / (n - 1));
  const yAt = (score) => padY + (1 - score / 100) * (height - padY * 2);

  const coords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.score), ...p }));
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');

  const first = points[0];
  const last = points[points.length - 1];
  const direction = last.score - first.score;
  const DirIcon = direction > 0 ? TrendingUp : direction < 0 ? TrendingDown : Minus;
  const dirTone = direction > 0 ? 'text-emerald-300' : direction < 0 ? 'text-red-300' : 'text-foreground-muted';
  const dirLabel = direction > 0 ? 'Improving' : direction < 0 ? 'Declining' : 'Flat';

  const active = hoverIdx != null ? coords[hoverIdx] : null;

  return (
    <DemoCard>
      <SectionTitle sub={`Compliance status of each recorded activity entry, oldest (${first.date}) to most recent (${last.date}).`}>
        Risk Trend
      </SectionTitle>

      <div className="flex items-center gap-2 mb-3 text-xs font-semibold">
        <span className={`inline-flex items-center gap-1.5 ${dirTone}`}>
          <DirIcon className="w-3.5 h-3.5" />
          {dirLabel}
        </span>
        <span className="text-foreground-muted font-normal">
          since {first.date}
        </span>
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* faint reference bands so a viewer can eyeball where a
              point sits without reading the tooltip */}
          <line x1={padX} y1={yAt(100)} x2={width - padX} y2={yAt(100)} stroke="rgba(16,185,129,0.12)" strokeWidth="1" />
          <line x1={padX} y1={yAt(60)} x2={width - padX} y2={yAt(60)} stroke="rgba(245,158,11,0.12)" strokeWidth="1" />
          <line x1={padX} y1={yAt(20)} x2={width - padX} y2={yAt(20)} stroke="rgba(239,68,68,0.12)" strokeWidth="1" />

          <polyline points={polyline} fill="none" stroke="rgba(156,143,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {coords.map((c, i) => (
            <g key={c.date + c.item} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx((v) => (v === i ? null : v))}>
              {/* generous invisible hit target — the visible dot is
                  small, this makes it easy to actually hover */}
              <circle cx={c.x} cy={c.y} r="10" fill="transparent" style={{ cursor: 'pointer' }} />
              <circle cx={c.x} cy={c.y} r={hoverIdx === i ? 5 : 3.5} fill={c.tone} stroke="var(--card)" strokeWidth="1.5" style={{ transition: 'r 150ms ease-out' }} />
            </g>
          ))}
        </svg>

        {active && (
          <div
            className="absolute z-10 px-3 py-2 rounded-lg bg-card border border-white/10 shadow-lg shadow-black/40 text-xs pointer-events-none"
            style={{
              left: `${(active.x / width) * 100}%`,
              top: `${(active.y / height) * 100}%`,
              transform: `translate(-50%, ${active.y < height / 2 ? '12px' : 'calc(-100% - 12px)'})`,
              minWidth: '150px',
            }}
          >
            <p className="font-semibold text-foreground">{active.date}</p>
            <p className="text-foreground-muted mt-0.5">{active.item}</p>
            <p className="mt-1 font-medium" style={{ color: active.tone }}>{active.label}</p>
          </div>
        )}
      </div>
    </DemoCard>
  );
}


// ============================================================
// Seller-to-seller comparison
// ============================================================
// Every value rendered below is read off the two real seller objects
// in DIRECTORY — nothing is derived, averaged or invented. The only
// computed things are (a) whether the two sides differ and (b) which
// side is stronger on the fields where "stronger" is actually
// meaningful (risk tier, violations, compliance rate, verification
// coverage). Fields where neither side is objectively better —
// registration date, total filings — are marked as *different* but
// never as better/worse, since a longer-tenured seller with more
// filings isn't automatically the safer one.

const RISK_RANK = { Low: 0, Medium: 1, High: 2 };

function verifiedCount(seller) {
  return (seller?.sellerInfo?.verifications || []).filter((v) => v.ok).length;
}

function parseRegDate(dateStr = '') {
  const t = Date.parse(dateStr);
  return Number.isNaN(t) ? null : t;
}

// direction: 'lower' = a smaller number is the stronger side,
// 'higher' = a larger number is, 'none' = different but not ranked.
// notable = the gap is big enough to call out loudly rather than
// just mark as "differs".
function buildComparisonRows(a, b) {
  const aRisk = RISK_RANK[riskZoneKey(a.sellerInfo.riskLevel)];
  const bRisk = RISK_RANK[riskZoneKey(b.sellerInfo.riskLevel)];
  const aVer = verifiedCount(a);
  const bVer = verifiedCount(b);
  const aReg = parseRegDate(a.businessRegistration.registrationDate);
  const bReg = parseRegDate(b.businessRegistration.registrationDate);

  return [
    {
      key: 'risk',
      label: 'Risk Level',
      icon: ShieldCheck,
      direction: 'lower',
      aNum: aRisk,
      bNum: bRisk,
      differs: a.sellerInfo.riskLevel !== b.sellerInfo.riskLevel,
      // a Low-vs-High jump is two tiers apart — that's the loud case
      notable: Math.abs(aRisk - bRisk) >= 2,
      note:
        a.sellerInfo.riskLevel !== b.sellerInfo.riskLevel
          ? `Different risk tiers — ${a.sellerInfo.riskLevel} vs ${b.sellerInfo.riskLevel}`
          : null,
      render: (s) => <ComplianceStatusChip status={`${s.sellerInfo.riskLevel} Risk`} size="md" glow elevated />,
    },
    {
      key: 'filings',
      label: 'Total Filings',
      icon: FileCheck2,
      direction: 'none',
      aNum: a.complianceHistory.totalFilings,
      bNum: b.complianceHistory.totalFilings,
      differs: a.complianceHistory.totalFilings !== b.complianceHistory.totalFilings,
      notable: false,
      note: null,
      render: (s) => (
        <span className="text-2xl font-bold text-foreground">{s.complianceHistory.totalFilings}</span>
      ),
    },
    {
      key: 'violations',
      label: 'Violations',
      icon: AlertCircle,
      direction: 'lower',
      aNum: a.complianceHistory.violations,
      bNum: b.complianceHistory.violations,
      differs: a.complianceHistory.violations !== b.complianceHistory.violations,
      // 2+ violations of separation, or one side clean and the other
      // not, is a material difference for a buyer
      notable:
        Math.abs(a.complianceHistory.violations - b.complianceHistory.violations) >= 2 ||
        (a.complianceHistory.violations === 0) !== (b.complianceHistory.violations === 0),
      note:
        a.complianceHistory.violations !== b.complianceHistory.violations
          ? `${Math.abs(a.complianceHistory.violations - b.complianceHistory.violations)} more violation${
              Math.abs(a.complianceHistory.violations - b.complianceHistory.violations) === 1 ? '' : 's'
            } on one side`
          : null,
      render: (s) => (
        <span
          className={`text-2xl font-bold ${
            s.complianceHistory.violations > 0 ? 'text-red-300' : 'text-emerald-300'
          }`}
        >
          {s.complianceHistory.violations}
        </span>
      ),
    },
    {
      key: 'rate',
      label: 'Compliance Rate',
      icon: Percent,
      direction: 'higher',
      aNum: a.complianceHistory.complianceRate,
      bNum: b.complianceHistory.complianceRate,
      differs: a.complianceHistory.complianceRate !== b.complianceHistory.complianceRate,
      notable: Math.abs(a.complianceHistory.complianceRate - b.complianceHistory.complianceRate) >= 10,
      note:
        a.complianceHistory.complianceRate !== b.complianceHistory.complianceRate
          ? `${Math.abs(a.complianceHistory.complianceRate - b.complianceHistory.complianceRate)} point gap`
          : null,
      render: (s) => {
        const r = s.complianceHistory.complianceRate;
        const tone = r >= 90 ? 'text-emerald-300' : r >= 60 ? 'text-amber-300' : 'text-red-300';
        return <span className={`text-2xl font-bold ${tone}`}>{r}%</span>;
      },
    },
    {
      key: 'registered',
      label: 'Registration Date',
      icon: CalendarDays,
      direction: 'none',
      aNum: aReg,
      bNum: bReg,
      differs: a.businessRegistration.registrationDate !== b.businessRegistration.registrationDate,
      notable: false,
      note:
        aReg != null && bReg != null && aReg !== bReg
          ? `${Math.abs(Math.round((aReg - bReg) / (1000 * 60 * 60 * 24 * 365.25)))} year gap in tenure`
          : null,
      render: (s) => (
        <div>
          <p className="text-sm font-semibold text-foreground">{s.businessRegistration.registrationDate}</p>
          <p className="text-xs text-foreground-muted mt-0.5">Seller since {s.sellerInfo.sellerSince}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Business Status',
      icon: Building2,
      direction: 'higher',
      // 'Active' outranks anything else on file (e.g. Under Review)
      aNum: /active/i.test(a.businessRegistration.complianceStatus) ? 1 : 0,
      bNum: /active/i.test(b.businessRegistration.complianceStatus) ? 1 : 0,
      differs:
        a.sellerInfo.businessStatus !== b.sellerInfo.businessStatus ||
        a.businessRegistration.complianceStatus !== b.businessRegistration.complianceStatus,
      notable:
        /active/i.test(a.businessRegistration.complianceStatus) !==
        /active/i.test(b.businessRegistration.complianceStatus),
      note:
        a.businessRegistration.complianceStatus !== b.businessRegistration.complianceStatus
          ? `Registration standing differs — ${a.businessRegistration.complianceStatus} vs ${b.businessRegistration.complianceStatus}`
          : null,
      render: (s) => (
        <div className="flex flex-wrap gap-1.5">
          <ComplianceStatusChip status={`Business: ${s.sellerInfo.businessStatus}`} size="sm" glow />
          <ComplianceStatusChip status={s.businessRegistration.complianceStatus} size="sm" />
        </div>
      ),
    },
    {
      key: 'verifications',
      label: 'Verification Checks',
      icon: CheckCircle2,
      direction: 'higher',
      aNum: aVer,
      bNum: bVer,
      differs: aVer !== bVer,
      notable: aVer !== bVer,
      note: aVer !== bVer ? `${Math.abs(aVer - bVer)} check difference` : null,
      render: (s) => (
        <div className="flex flex-col gap-1.5">
          {(s.sellerInfo.verifications || []).map((v) => (
            <span
              key={v.label}
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                v.ok ? 'text-emerald-300' : 'text-red-300'
              }`}
            >
              {v.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
              {v.label}
            </span>
          ))}
          <span className="text-[11px] text-foreground-muted mt-0.5">
            {verifiedCount(s)} of {(s.sellerInfo.verifications || []).length} verified
          </span>
        </div>
      ),
    },
  ];
}

// Which side (if either) is the stronger one on this row.
// Returns 'a', 'b', or null.
function strongerSide(row) {
  if (row.direction === 'none' || row.aNum == null || row.bNum == null) return null;
  if (row.aNum === row.bNum) return null;
  if (row.direction === 'lower') return row.aNum < row.bNum ? 'a' : 'b';
  return row.aNum > row.bNum ? 'a' : 'b';
}

// Picker used both to open a comparison and to swap the second
// seller once one is open. Excludes whichever seller is already on
// the left so the two columns can never be the same record.
function CompareSellerPicker({ sellers, excludeId, selectedId, onSelect, onClose, align = 'left' }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) onClose();
    }
    function onEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  const options = sellers.filter((s) => s.id !== excludeId);

  return (
    <div
      ref={wrapRef}
      className={`absolute z-30 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] ${align === 'right' ? 'right-0' : 'left-0'}`}
    >
      <DemoCard className="!p-2 max-h-80 overflow-y-auto shadow-lg shadow-black/40">
        <p className="text-[11px] uppercase tracking-wide text-foreground-muted px-3 pt-2 pb-1.5 font-semibold">
          Compare against
        </p>
        {options.length === 0 ? (
          <p className="text-sm text-foreground-muted px-3 py-4 text-center">
            No other sellers on file to compare against.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {options.map((s) => {
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
                    active ? 'bg-accent/[0.08] border border-accent/30' : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <EntityAvatar name={s.sellerInfo.sellerName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{s.sellerInfo.sellerName}</p>
                    <p className="text-xs text-foreground-muted flex items-center gap-1 truncate">
                      <Globe className="w-3 h-3 shrink-0" /> {s.sellerInfo.marketplace}
                    </p>
                  </div>
                  <ComplianceStatusChip status={`${s.sellerInfo.riskLevel} Risk`} size="sm" />
                </button>
              );
            })}
          </div>
        )}
      </DemoCard>
    </div>
  );
}

// Column header for one side of the comparison. The right-hand side
// gets a "Change" affordance so the user can re-target the
// comparison without exiting it first.
function CompareColumnHeader({ seller, badge, onChange, changeOpen, picker }) {
  return (
    <div className="relative flex flex-col items-center text-center gap-2.5">
      <span className="text-[11px] uppercase tracking-wide text-foreground-muted font-semibold">{badge}</span>
      <EntityAvatar name={seller.sellerInfo.sellerName} size="md" />
      <div>
        <p className="text-sm font-bold text-foreground leading-tight">{seller.sellerInfo.sellerName}</p>
        <p className="text-xs text-foreground-muted mt-0.5">{seller.sellerInfo.marketplace}</p>
      </div>
      {onChange && (
        <>
          <button
            type="button"
            onClick={onChange}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition"
            aria-expanded={changeOpen}
          >
            Change
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {changeOpen && picker}
        </>
      )}
    </div>
  );
}

function SellerComparison({ left, right, sellers, onChangeRight, onExit }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const rows = useMemo(() => buildComparisonRows(left, right), [left, right]);
  const differingCount = rows.filter((r) => r.differs).length;
  const notableCount = rows.filter((r) => r.notable).length;

  return (
    <div className="space-y-4">
      {/* Exit affordance is duplicated at the top of the view (here)
          and at the bottom, so it's reachable without scrolling back
          up on a long comparison. */}
      <DemoCard className="surface-tint-accent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ArrowLeftRight className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">Seller comparison</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              {differingCount} of {rows.length} fields differ
              {notableCount > 0 ? ` · ${notableCount} flagged as a meaningful gap` : ' · no major gaps'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center justify-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-foreground-muted hover:text-foreground hover:bg-white/[0.06] transition shrink-0"
        >
          <X className="w-4 h-4" />
          Exit comparison
        </button>
      </DemoCard>

      <DemoCard>
        {/* Column headers */}
        <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,180px)_1fr_1fr] gap-4 pb-5 border-b border-white/[0.06]">
          <div className="hidden lg:block" />
          <CompareColumnHeader seller={left} badge="Currently viewing" />
          <CompareColumnHeader
            seller={right}
            badge="Compared with"
            onChange={() => setPickerOpen((v) => !v)}
            changeOpen={pickerOpen}
            picker={
              <CompareSellerPicker
                sellers={sellers}
                excludeId={left.id}
                selectedId={right.id}
                align="right"
                onSelect={(s) => {
                  onChangeRight(s);
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            }
          />
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.06]">
          {rows.map((row) => {
            const Icon = row.icon;
            const stronger = strongerSide(row);
            const cellTone = (side) => {
              if (!row.differs) return 'border-white/[0.06] bg-white/[0.02]';
              if (row.notable) {
                if (stronger === side) return 'border-emerald-500/30 bg-emerald-500/[0.07]';
                if (stronger && stronger !== side) return 'border-red-500/30 bg-red-500/[0.07]';
                return 'border-amber-500/25 bg-amber-500/[0.05]';
              }
              return 'border-amber-500/20 bg-amber-500/[0.03]';
            };

            return (
              <div key={row.key} className="py-4">
                <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,180px)_1fr_1fr] gap-3 lg:gap-4 items-stretch">
                  {/* Field label — its own column on large screens,
                      a full-width caption above the two cells on
                      small ones, so the pair always stays side by
                      side rather than collapsing into one column. */}
                  <div className="col-span-2 lg:col-span-1 flex items-center gap-2 lg:pt-1">
                    <Icon className="w-4 h-4 text-foreground-muted shrink-0" />
                    <span className="text-sm font-medium text-foreground">{row.label}</span>
                    {row.differs && (
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                          row.notable
                            ? 'bg-red-500/15 text-red-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {row.notable ? 'Key gap' : 'Differs'}
                      </span>
                    )}
                  </div>

                  <div className={`rounded-xl border px-4 py-3 flex flex-col items-center justify-center text-center gap-1 transition ${cellTone('a')}`}>
                    {row.render(left)}
                    {row.differs && stronger === 'a' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                        <TrendingUp className="w-3 h-3" /> Stronger
                      </span>
                    )}
                  </div>

                  <div className={`rounded-xl border px-4 py-3 flex flex-col items-center justify-center text-center gap-1 transition ${cellTone('b')}`}>
                    {row.render(right)}
                    {row.differs && stronger === 'b' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                        <TrendingUp className="w-3 h-3" /> Stronger
                      </span>
                    )}
                  </div>
                </div>

                {row.differs && row.note && (
                  <p
                    className={`text-xs mt-2.5 flex items-center gap-1.5 ${
                      row.notable ? 'text-red-300' : 'text-foreground-muted'
                    }`}
                  >
                    {row.notable ? (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {row.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </DemoCard>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-foreground-muted hover:text-foreground hover:bg-white/[0.06] transition"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to {left.sellerInfo.sellerName}
        </button>
      </div>
    </div>
  );
}

export default function DemoSellerVerification() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  // The directory's own Appario entry (spread from
  // SELLER_VERIFICATION_DATA in lib/demoData.js) is the default
  // selection, so the page opens exactly as it did before this
  // directory existed.
  const defaultSeller = useMemo(
    () => DIRECTORY.find((s) => s.sellerInfo.sellerName === SELLER_VERIFICATION_DATA.sellerInfo.sellerName) || DIRECTORY[0],
    []
  );
  const [selectedSellerId, setSelectedSellerId] = useState(defaultSeller.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);
  // Comparison state: `compareSellerId` is null whenever the page is
  // in its normal single-seller mode, so there's exactly one flag
  // driving the whole view swap.
  const [compareSellerId, setCompareSellerId] = useState(null);
  const [comparePickerOpen, setComparePickerOpen] = useState(false);

  const d = DIRECTORY.find((s) => s.id === selectedSellerId) || defaultSeller;
  const compareSeller = compareSellerId ? DIRECTORY.find((s) => s.id === compareSellerId) || null : null;
  // Guard against the compared seller and the viewed seller being the
  // same record (possible if the user picks a new primary seller
  // while a comparison is open).
  const comparing = Boolean(compareSeller) && compareSeller.id !== d.id;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return DIRECTORY.filter((s) => s.sellerInfo.sellerName.toLowerCase().includes(q));
  }, [searchQuery]);

  function handleSelectSeller(seller) {
    setSelectedSellerId(seller.id);
    setSearchQuery('');
    setActiveTab(TABS[0]);
    // Picking a new seller to view exits any open comparison rather
    // than leaving a stale second column pinned to the old pairing.
    setCompareSellerId(null);
    setComparePickerOpen(false);
  }

  function handleStartCompare(seller) {
    setCompareSellerId(seller.id);
    setComparePickerOpen(false);
    setBrowseOpen(false);
  }

  function handleExitCompare() {
    setCompareSellerId(null);
    setComparePickerOpen(false);
  }

  return (
    <>
      <Navbar />
      <DemoPage>
        <PageHeader icon={ShieldCheck} label="Seller Verification" page="Seller Verification" code={DEMO_PRODUCT.code} />

        <div>
          <Eyebrow color="blue">Trust Intelligence / Cached Result</Eyebrow>
          <h1 className="text-2xl font-bold text-foreground">Seller verification</h1>
          <p className="text-sm text-foreground-muted mt-1">Review registration, marketplace presence and risk signals without waiting for external services.</p>
        </div>

        {/* Multi-seller expansion: real, functional type-ahead search
            over DIRECTORY (8 sellers), plus a full browsable
            directory grid below it. Selecting a seller from either
            swaps `d` (below) and every downstream tab re-renders
            with that seller's own data. */}
        <SellerSearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          results={searchResults}
          onSelect={handleSelectSeller}
          onClear={() => setSearchQuery('')}
        />

        <div>
          <button
            type="button"
            onClick={() => setBrowseOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition"
          >
            <Users className="w-4 h-4" />
            Browse all sellers
            {browseOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {browseOpen && (
            <div className="mt-3">
              <SellerDirectoryGrid sellers={DIRECTORY} selectedId={d.id} onSelect={handleSelectSeller} />
            </div>
          )}
        </div>

        {/* Currently viewing indicator — reassures which of the 8
            directory sellers the tabs below now reflect, since the
            left-rail identity card sits below the fold on smaller
            screens. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Store className="w-3.5 h-3.5" />
            Viewing <span className="text-foreground font-medium">{d.sellerInfo.sellerName}</span>
            {comparing && (
              <>
                <ArrowLeftRight className="w-3.5 h-3.5 text-accent" />
                <span className="text-foreground font-medium">{compareSeller.sellerInfo.sellerName}</span>
              </>
            )}
          </div>

          {/* Compare entry point. CAN_COMPARE is computed at runtime
              from the resolved directory — if the multi-seller
              expansion isn't present, there's no second seller to
              compare against, so the control renders disabled with an
              explanation instead of opening an empty comparison. */}
          <div className="relative">
            {CAN_COMPARE ? (
              comparing ? (
                <button
                  type="button"
                  onClick={handleExitCompare}
                  className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-foreground-muted hover:text-foreground hover:bg-white/[0.06] transition"
                >
                  <X className="w-4 h-4" />
                  Exit comparison
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setComparePickerOpen((v) => !v)}
                  aria-expanded={comparePickerOpen}
                  className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border border-accent/30 bg-accent/[0.08] text-foreground hover:bg-accent/[0.14] transition"
                >
                  <ArrowLeftRight className="w-4 h-4 text-accent" />
                  Compare
                  <ChevronDown className="w-4 h-4 text-foreground-muted" />
                </button>
              )
            ) : (
              <button
                type="button"
                disabled
                title="Only one seller is on file — there's nothing to compare against yet."
                className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-foreground-muted opacity-50 cursor-not-allowed"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Compare
              </button>
            )}

            {CAN_COMPARE && !comparing && comparePickerOpen && (
              <CompareSellerPicker
                sellers={DIRECTORY}
                excludeId={d.id}
                selectedId={null}
                align="right"
                onSelect={handleStartCompare}
                onClose={() => setComparePickerOpen(false)}
              />
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------
            Part 11 structural redesign: this was the page the brief
            flagged as thinnest — one identity card, then a tab strip
            hiding all three tabs' content one at a time in a single
            column. It's now a persistent two-column profile layout
            (the way a real seller/account-detail page in a SaaS
            product is laid out — identity + key facts pinned on the
            left, deeper content on the right) instead of a page that
            forces every fact behind a click. The old "Seller
            Information" tab's content (verifications, seller-type/
            GSTIN/marketplace/since facts, registered address) now
            lives permanently in the left rail — visible regardless
            of which of the two remaining tabs is open — since those
            are exactly the facts that shouldn't require a click to
            see on a verification tool. Every field is identical to
            before; only where it renders has changed. ------------------------------------------------------------ */}
        {comparing ? (
          <SellerComparison
            left={d}
            right={compareSeller}
            sellers={DIRECTORY}
            onChangeRight={(s) => setCompareSellerId(s.id)}
            onExit={handleExitCompare}
          />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Bug 1 fix: the warm tertiary tint (surface-tint-warm) mixes
              a light peach token into the dark card surface at a low
              percentage, which reads as a muddy, unintentional brown
              on this dark palette rather than a warm accent — same
              root cause Check Compliance's use of the class doesn't
              show as badly since that surface is smaller/less central.
              Switched to surface-tint-accent (the app's own purple
              accent tint, already used the same way on Products) so
              the left rail reads as an intentional colored surface. */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-6">
            <DemoCard className="flex flex-col items-center text-center gap-3.5 surface-tint-accent">
              {/* Bug 3 fix: .glow-accent's 34px blur / 8px spread is
                  tuned for large surfaces (the Rewards balance, the
                  Dashboard's Compliance Overview ring at 152px) — at
                  this ~56px avatar size the same absolute glow reads
                  as a harsh, oversized halo. glow-accent-soft is the
                  same accent hue scaled down for a small circular
                  element instead. */}
              <div className="rounded-full glow-accent-soft">
                <EntityAvatar name={d.sellerInfo.sellerName} size="lg" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{d.sellerInfo.sellerName}</h2>
                <p className="text-sm text-foreground-muted mt-0.5">{d.sellerInfo.sellerType} · {d.sellerInfo.marketplace}</p>
              </div>
              {/* Enhancement: badge hierarchy. Risk is the headline
                  signal, so it's shown first and at the larger "md"
                  chip size instead of matching Business/verifications.
                  Also relabeled "Low Risk" (matching the "<level>
                  Risk" phrasing ComplianceStatusChip's own classifier
                  already keys off elsewhere in the app, e.g. Dashboard
                  and Entities) instead of "Risk: Low" — the old order
                  never matched the classifier's `low\s?risk` pattern,
                  so it silently rendered in the neutral fallback tone
                  no matter the actual tier. */}
              <div className="flex flex-wrap justify-center gap-2">
                <ComplianceStatusChip status={`${d.sellerInfo.riskLevel} Risk`} size="md" glow elevated />
                <ComplianceStatusChip status={`Business: ${d.sellerInfo.businessStatus}`} size="sm" glow />
              </div>
              {/* Verification badges: both glow (status color) and
                  elevated (--shadow-card) per the brief, layered via
                  the chip's combined boxShadow rather than stacking
                  utility classes. */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {d.sellerInfo.verifications.map((v) => (
                  <ComplianceStatusChip key={v.label} status={v.label} size="sm" glow elevated />
                ))}
              </div>
            </DemoCard>

            {/* Bug 2 fix: Total Filings, Compliance Rate and
                Registered Address used to appear here AND again in
                Business Registration Details / the 3 stat cards on
                the right. Left rail now keeps only the quick-glance
                identity facts (Seller Type, GSTIN, Marketplace,
                Seller Since); the formal registration fields and the
                filings/violations/rate stats live solely in the right
                panel below. */}
            <DemoCard className="flex flex-col gap-3.5 surface-tint-accent">
              <StatChip icon={Building2} label="Seller Type" value={d.sellerInfo.sellerType} tone="blue" />
              <StatChip icon={FileCheck2} label="GSTIN" value={d.sellerInfo.gstin} tone="blue" />
              <StatChip icon={Globe} label="Marketplace" value={d.sellerInfo.marketplace} tone="blue" />
              <StatChip icon={CalendarDays} label="Seller Since" value={d.sellerInfo.sellerSince} tone="blue" />
            </DemoCard>
          </div>

          <DemoCard>
          <TabRow tabs={TABS} active={activeTab} onChange={setActiveTab} />

          <div className="pt-6">
            {activeTab === 'Business & Compliance History' && (
              <div className="space-y-8">
                <div>
                  <SectionTitle>Business Registration Details</SectionTitle>
                  {/* Bug 2 fix: GSTIN dropped from this grid — it's
                      now shown once, in the left rail's quick-glance
                      facts, instead of appearing here too. */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <KeyValue label="Legal Name" value={d.businessRegistration.legalName} />
                    <KeyValue label="Type of Entity" value={d.businessRegistration.entityType} />
                    <KeyValue label="CIN" value={d.businessRegistration.cin} mono />
                    <KeyValue label="PAN" value={d.businessRegistration.pan} mono />
                    <KeyValue label="Registration Date" value={d.businessRegistration.registrationDate} />
                    <KeyValue label="Registered Address" value={d.businessRegistration.registeredAddress} />
                    <KeyValue label="State" value={d.businessRegistration.state} />
                  </div>
                  <div className="mt-4">
                    <ComplianceStatusChip status={`Compliance Status: ${d.businessRegistration.complianceStatus}`} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <DemoCard className="text-center py-4">
                    <FileCheck2 className="w-4 h-4 text-foreground-muted mx-auto mb-1.5" />
                    <p className="text-2xl font-bold text-foreground">{d.complianceHistory.totalFilings}</p>
                    <p className="text-xs text-foreground-muted mt-1">Total Filings</p>
                  </DemoCard>
                  {/* Directory expansion: violations is no longer
                      always zero (Medium/High risk sellers carry
                      real counts), so its icon/number tone now
                      reflects that instead of a hardcoded emerald
                      that would misrepresent a seller with
                      violations on file. */}
                  <DemoCard className="text-center py-4">
                    {d.complianceHistory.violations > 0 ? (
                      <AlertCircle className="w-4 h-4 text-red-300 mx-auto mb-1.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 mx-auto mb-1.5" />
                    )}
                    <p className={`text-2xl font-bold ${d.complianceHistory.violations > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                      {d.complianceHistory.violations}
                    </p>
                    <p className="text-xs text-foreground-muted mt-1">Violations</p>
                  </DemoCard>
                  <DemoCard className="text-center py-4">
                    <Percent className={`w-4 h-4 mx-auto mb-1.5 ${d.complianceHistory.complianceRate >= 90 ? 'text-emerald-300' : d.complianceHistory.complianceRate >= 60 ? 'text-amber-300' : 'text-red-300'}`} />
                    <p className={`text-2xl font-bold ${d.complianceHistory.complianceRate >= 90 ? 'text-emerald-300' : d.complianceHistory.complianceRate >= 60 ? 'text-amber-300' : 'text-red-300'}`}>
                      {d.complianceHistory.complianceRate}%
                    </p>
                    <p className="text-xs text-foreground-muted mt-1">Compliance Rate</p>
                  </DemoCard>
                </div>

                <div>
                  {/* Enhancement: the list is intentionally
                      newest-first — labeled explicitly so it reads as
                      a deliberate sort order, not a mistake. */}
                  <SectionTitle sub="Sorted most recent first">Recent Compliance Activity</SectionTitle>
                  <ComplianceActivityTimeline items={d.recentActivity} />
                </div>
              </div>
            )}

            {activeTab === 'Risk Assessment' && (
              <div className="space-y-6">
                {/* Directory expansion: overall risk is no longer
                    always Low, so this banner's color/icon now key
                    off the seller's own riskLevel instead of a
                    hardcoded emerald "all clear" treatment. */}
                <DemoCard
                  className={
                    d.sellerInfo.riskLevel === 'High'
                      ? 'bg-red-500/10 border-red-500/30'
                      : d.sellerInfo.riskLevel === 'Medium'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                  }
                >
                  <div
                    className={`flex items-center gap-3 font-semibold text-lg ${
                      d.sellerInfo.riskLevel === 'High'
                        ? 'text-red-300'
                        : d.sellerInfo.riskLevel === 'Medium'
                        ? 'text-amber-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {d.sellerInfo.riskLevel === 'High' ? (
                      <AlertCircle className="w-6 h-6" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6" />
                    )}
                    {d.riskAssessment.overall}
                  </div>
                  <p className="text-sm text-foreground-muted mt-2">{d.riskAssessment.summary}</p>
                </DemoCard>

                <SellerRiskSpectrum sellerName={d.sellerInfo.sellerName} riskLevel={d.sellerInfo.riskLevel} />

                <RiskTrendSparkline activity={d.recentActivity} sellerName={d.sellerInfo.sellerName} />

                <div>
                  <SectionTitle>Risk Factors</SectionTitle>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {d.riskAssessment.factors.map((f) => (
                      <div key={f.label} className="flex justify-between text-sm bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                        <span className="text-foreground-muted">{f.label}</span>
                        <span className="text-foreground font-medium">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <DemoCard>
                  <SectionTitle>Assessment Conclusion</SectionTitle>
                  <p className="text-sm text-foreground-muted flex gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    {d.riskAssessment.conclusion}
                  </p>
                </DemoCard>
              </div>
            )}
          </div>
          </DemoCard>
        </div>
        )}
      </DemoPage>
    </>
  );
}
