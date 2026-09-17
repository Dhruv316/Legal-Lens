'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Coins,
  Gift,
  Award,
  Trophy,
  Sparkles,
  TrendingUp,
  Lock,
  ChevronRight,
  Check,
  Copy,
  X,
  FileCheck,
  ExternalLink,
  ShoppingCart,
  BarChart3,
  CalendarRange,
  Target,
  PartyPopper,
  Pencil,
  XCircle,
} from 'lucide-react';
import Navbar from '../Navbar';
import {
  DemoPage,
  DemoCard,
  SectionTitle,
  PageHeader,
  Eyebrow,
  IconChip,
  PrimaryButton,
} from '../demo/DemoUI';
import { REWARDS_DATA, DEMO_PRODUCT } from '../../lib/demoData';
import { EntityAvatar } from '../demo/ItemIdentity';

// Tier -> shared design-system chip tone + icon. Keeps every gift
// card inside the same accent/status vocabulary as the rest of the
// app instead of introducing new colors for this one page.
const TIER_STYLES = {
  starter: { tone: 'blue', icon: Gift },
  bronze: { tone: 'amber', icon: Award },
  gold: { tone: 'emerald', icon: Trophy },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMonthLabel(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
}

// ---- Redemption-by-month grouping ----
// There is no separate "tokens earned" event log in this data model —
// only redemptions, each carrying the tokensUsed it cost and a real
// redeemedAt timestamp. So the only honest month-by-month signal this
// data can produce is "tokens redeemed per month" (grouped by real
// redeemedAt values), not a fabricated "earned" curve. Returned oldest
// -> newest so the trend chart reads left-to-right chronologically.
function groupRedemptionsByMonth(redemptionHistory) {
  const byKey = new Map();
  for (const item of redemptionHistory) {
    const d = new Date(item.redeemedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.total += item.tokensUsed;
      existing.count += 1;
    } else {
      byKey.set(key, { key, label: formatMonthLabel(item.redeemedAt), total: item.tokensUsed, count: 1 });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => (a.key > b.key ? 1 : -1));
}

// Eases a number up from 0 on mount / whenever its target changes —
// same easing curve as ScoreBadge's count-up (Part 1), reused locally
// here since the balance is this page's "hero number" in the same
// sense the score gauge is on the compliance results view.
function useCountUpNumber(target, durationMs = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const to = Math.max(0, target ?? 0);
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

// Gates a width-based fill transition to a real "0 -> value" animation
// on mount, using the same two-frame RAF trick ComplianceSummaryStrip
// (Part 4) and the Dashboard bars (Part 5) use — without it, a CSS
// transition on a style that's already at its final value on first
// paint never actually animates.
function useMountReady(dep) {
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
  }, [dep]);
  return ready;
}

// ---- Token balance hero ----
// The balance is this page's equivalent of Part 1's score gauge: one
// number everything else on the page is measured against. It gets a
// count-up on load and a glowing coin badge instead of sitting as
// plain large text, plus a slim "progress to next tier" bar under the
// existing Tier Status stat — built from the same balance/threshold
// comparison the tier label itself already uses (>=90 Gold, >=20
// Bronze), not a new fabricated metric.
function TokenBalanceHero({ metaTokens, earnedTokens, redeemedTokens }) {
  const displayBalance = useCountUpNumber(metaTokens, 900);
  const tierReady = useMountReady(metaTokens);

  const tierLabel = metaTokens >= 90 ? 'Gold' : metaTokens >= 20 ? 'Bronze' : 'Starter';
  const nextThreshold = metaTokens >= 90 ? null : metaTokens >= 20 ? 90 : 20;
  const nextLabel = metaTokens >= 20 ? 'Gold' : 'Bronze';
  const tierPct = nextThreshold ? Math.min(100, Math.round((metaTokens / nextThreshold) * 100)) : 100;

  return (
    <DemoCard>
      <div className="flex items-center gap-5 mb-6">
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <span className="reward-coin-glow absolute inset-0 rounded-full bg-accent/30" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-accent to-[#7C6FEE] flex items-center justify-center shadow-lg shadow-accent/30">
            <Coins className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-1">Available Balance</p>
          {/* Beauty & Color Pass, Part 3: strong glow behind the
              balance number itself — this page's one hero figure,
              the same "key number" use case .glow-accent's own doc
              comment in globals.css calls out — via the shared
              utility class, not a new glow value. */}
          <h2 className="text-3xl font-bold text-foreground tabular-nums leading-none">
            <span className="glow-accent rounded-xl px-1.5 -mx-1.5">{displayBalance}</span>{' '}
            <span className="text-lg font-semibold text-foreground-muted">MT</span>
          </h2>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] rounded-xl px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-1">Total Earned</p>
          <p className="text-lg font-bold text-emerald-300">{earnedTokens} MT</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-1">Redeemed</p>
          <p className="text-lg font-bold text-accent">{redeemedTokens} MT</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-1">Tier Status</p>
          <p className="text-lg font-bold text-amber-300 mb-2">{tierLabel}</p>
          {nextThreshold ? (
            <>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  // Richer 3-stop amber gradient (chart-fill-warning,
                  // Part 1's expanded gradient set) in place of the
                  // old flat 2-stop fill, matching the same upgrade
                  // applied to the per-gift afford bars below.
                  className="h-full rounded-full chart-fill-warning reward-tier-fill"
                  style={{ width: tierReady ? `${tierPct}%` : '0%' }}
                />
              </div>
              <p className="flex items-center gap-1 text-[10px] text-foreground-muted mt-1.5">
                <TrendingUp className="w-3 h-3" />
                {nextThreshold - metaTokens} MT to {nextLabel}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-1 text-[10px] text-emerald-300 font-medium mt-1.5">
              <TrendingUp className="w-3 h-3" />
              Highest tier reached
            </p>
          )}
        </div>
      </div>
    </DemoCard>
  );
}

// ---- Gift tier afford-progress bar ----
// Every tier card already shows its own token cost; what it didn't
// show at a glance was how that cost relates to the user's actual
// balance. balance vs. cost is real, directly comparable data (unlike
// e.g. Part 6's productCount), so a slim fill bar communicates "how
// far along" for each tier the same way the pipeline's progress bar
// communicates "how far along" a running process is.
function TierAffordBar({ balance, cost }) {
  const ready = useMountReady(`${balance}-${cost}`);
  const canAfford = balance >= cost;
  const pct = Math.min(100, Math.round((balance / cost) * 100));
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[10px] text-foreground-muted mb-1">
        <span>{canAfford ? 'You have enough' : `${balance} / ${cost} MT`}</span>
        <span className={canAfford ? 'text-emerald-300 font-semibold' : 'text-foreground-muted font-medium'}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        {/* Richer 3-stop gradients (chart-fill-success / chart-fill-accent,
            Part 1's expanded gradient set) in place of the old flat
            2-stop Tailwind gradients — same afford/not-afford colors,
            just with the highlight-stop sheen the rest of the app's
            bar/gauge fills already use. */}
        <div
          className={`h-full rounded-full reward-tier-fill ${
            canAfford ? 'chart-fill-success' : 'chart-fill-accent'
          }`}
          style={{ width: ready ? `${pct}%` : '0%' }}
        />
      </div>
    </div>
  );
}

// ---- Savings goal ----
// A goal is never an arbitrary number the user types in — it's always
// one of the real REWARDS_DATA.gifts entries, so "100% complete" can
// only ever mean "this exact real reward is now affordable". Progress
// is measured against `earnedTokens` (the same redemptionHistory-sum +
// metaTokens derivation TokenBalanceHero already uses above) rather
// than a second, differently-computed balance. Goal choice lives in
// plain component state — picking a new gift or clearing replaces/
// empties that state, nothing persists past this session.
function GoalRing({ pct, reached, size = 96, stroke = 8 }) {
  const ready = useMountReady(pct);
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (ready ? pct : 0) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={reached ? '#10b981' : '#6C5CE7'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold tabular-nums ${reached ? 'text-emerald-300' : 'text-foreground'}`}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

// Picker shown when no goal is active yet — every option is a real
// gift tier pulled straight from REWARDS_DATA.gifts, phrased as
// "Save up for the <gift name> — <tokens> tokens" so the target is
// always a redeemable reward, never a made-up number.
function GoalPicker({ gifts, onPick }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {gifts.map((gift) => {
        const style = TIER_STYLES[gift.tier] || TIER_STYLES.starter;
        return (
          <button
            key={gift.id}
            onClick={() => onPick(gift.id)}
            className="text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-accent/30 p-4 transition"
          >
            <IconChip icon={style.icon} tone={style.tone} size="sm" />
            <p className="text-sm font-semibold text-foreground mt-3">
              Save up for the {gift.name} — {gift.tokens} MT
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              {gift.partner} · ₹{gift.value} value
            </p>
          </button>
        );
      })}
    </div>
  );
}

function SavingsGoalCard({ earnedTokens, gifts, goalGiftId, onPickGoal, onClearGoal }) {
  const goalGift = gifts.find((g) => g.id === goalGiftId) || null;

  if (!goalGift) {
    return (
      <DemoCard>
        <div className="flex items-start gap-3 mb-4">
          <IconChip icon={Target} tone="violet" size="sm" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Savings Goal</h2>
            <p className="text-sm text-foreground-muted mt-1">
              Pick a real reward to save toward — progress tracks your actual earned tokens.
            </p>
          </div>
        </div>
        <GoalPicker gifts={gifts} onPick={onPickGoal} />
      </DemoCard>
    );
  }

  const pct = Math.min(100, Math.round((earnedTokens / goalGift.tokens) * 100));
  const reached = earnedTokens >= goalGift.tokens;
  const remaining = Math.max(0, goalGift.tokens - earnedTokens);
  const barReady = useMountReady(`${earnedTokens}-${goalGift.id}`);

  return (
    <DemoCard>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <IconChip icon={Target} tone="violet" size="sm" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Savings Goal</h2>
            <p className="text-sm text-foreground-muted mt-1 truncate">
              Saving toward the <span className="text-foreground font-medium">{goalGift.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onPickGoal(null)}
            className="flex items-center gap-1 text-[11px] font-semibold text-foreground-muted hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition"
          >
            <Pencil className="w-3 h-3" />
            Change
          </button>
          <button
            onClick={onClearGoal}
            className="flex items-center gap-1 text-[11px] font-semibold text-foreground-muted hover:text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition"
          >
            <XCircle className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
        <GoalRing pct={pct} reached={reached} />

        <div className="flex-1 min-w-0">
          {reached ? (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4">
              <PartyPopper className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Goal reached — you can redeem this now</p>
                <p className="text-xs text-foreground-muted mt-1">
                  You've earned {earnedTokens} MT, {earnedTokens - goalGift.tokens} MT past the {goalGift.tokens} MT
                  needed for the {goalGift.name}.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-foreground tabular-nums">{earnedTokens}</span>
                <span className="text-sm text-foreground-muted">/ {goalGift.tokens} MT earned</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full chart-fill-accent reward-tier-fill"
                  style={{ width: barReady ? `${pct}%` : '0%' }}
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <TrendingUp className="w-3.5 h-3.5" />
                {remaining} MT to go for the {goalGift.name}
              </p>
            </>
          )}
        </div>
      </div>
    </DemoCard>
  );
}

// ---- Redemption history timeline ----
// Echoes Part 2's node/path visual language, applied to a chronological
// list instead of a live process. Nodes connect with a rail line only
// where there's a next entry below them — with the seeded data at a
// single entry, that means no line renders and the section reads as
// one milestone, not a stretched-out empty-looking timeline. The rail
// grows naturally as real redemptions are added in this session.
function RedemptionTimeline({ items, onViewCode }) {
  if (items.length === 0) {
    return (
      <DemoCard className="text-center py-10">
        <Gift className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
        <p className="text-sm text-foreground-muted">No redemptions yet. Redeem a reward above to see it here.</p>
      </DemoCard>
    );
  }

  return (
    <div>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div
            key={item.id}
            className="reward-timeline-row relative flex gap-4"
            style={{ animationDelay: `${i * 90}ms`, paddingBottom: isLast ? 0 : '1.25rem' }}
          >
            {!isLast && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-white/10" aria-hidden="true" />}
            <span className="relative z-10 w-10 h-10 rounded-full bg-card border-2 border-accent/30 flex items-center justify-center shrink-0 shadow-sm shadow-accent/10">
              <Gift className="w-4 h-4 text-accent" />
            </span>
            <DemoCard className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.rewardName}</p>
                <div className="text-xs text-foreground-muted flex items-center gap-2 mt-1">
                  <EntityAvatar name={item.partner} size="sm" />
                  {item.partner} · Redeemed {formatDate(item.redeemedAt)}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                    Value ₹{item.value}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] border border-accent/30 bg-accent/10 text-accent">
                    {item.tokensUsed} MT
                  </span>
                </div>
              </div>
              <button
                onClick={() => onViewCode(item)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-foreground hover:bg-white/[0.03] transition shrink-0"
              >
                View Code &amp; PIN
                <ChevronRight className="w-4 h-4" />
              </button>
            </DemoCard>
          </div>
        );
      })}
      {items.length === 1 && (
        <p className="text-[11px] text-foreground-muted mt-3 ml-14">
          Your redemption history starts here — future redemptions will line up below it.
        </p>
      )}
    </div>
  );
}

// ---- Monthly token-redemption trend ----
// Derived entirely from real redemptionHistory entries (grouped by
// real redeemedAt month, summed by real tokensUsed) — same
// "derive, don't hardcode" pattern earnedTokens already uses above.
// Labeled as "redeemed" rather than "earned" because that's the only
// event this data model actually logs; the bars grow from 0 on mount
// the same way every other bar/fill in this file does.
function TokenTrendChart({ redemptionHistory }) {
  const months = groupRedemptionsByMonth(redemptionHistory);
  const ready = useMountReady(months.map((m) => m.key).join('|'));

  if (months.length === 0) {
    return (
      <DemoCard className="text-center py-10">
        <CalendarRange className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
        <p className="text-sm text-foreground-muted">No redemptions yet — a monthly trend will appear here once you redeem a reward.</p>
      </DemoCard>
    );
  }

  if (months.length === 1) {
    return (
      <DemoCard>
        <div className="flex items-start gap-3">
          <IconChip icon={CalendarRange} tone="blue" size="sm" />
          <div>
            <p className="text-sm font-semibold text-foreground">All activity is in {months[0].label} so far</p>
            <p className="text-xs text-foreground-muted mt-1">
              {months[0].count} redemption{months[0].count === 1 ? '' : 's'} totaling {months[0].total} MT redeemed.
              A month-by-month trend needs redemptions spread across more than one month — check back after your
              next redemption lands in a different month.
            </p>
          </div>
        </div>
      </DemoCard>
    );
  }

  const maxTotal = Math.max(...months.map((m) => m.total));
  const busiest = months.reduce((a, b) => (b.total > a.total ? b : a), months[0]);
  const average = months.reduce((sum, m) => sum + m.total, 0) / months.length;

  // Fixed-height SVG bar chart, columns sized to however many months
  // are actually present in the data (no padding to a fake fixed
  // count of bars).
  const chartHeight = 160;
  const barAreaHeight = 120;
  const gap = 18;
  const barWidth = 40;
  const svgWidth = months.length * (barWidth + gap) + gap;

  return (
    <DemoCard>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <IconChip icon={BarChart3} tone="blue" size="sm" />
          <div>
            <p className="text-sm font-semibold text-foreground">Tokens Redeemed per Month</p>
            <p className="text-[11px] text-foreground-muted">
              Grouped from real redemption timestamps — the closest real signal to an "earning" trend this data logs.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          width="100%"
          height={chartHeight}
          style={{ minWidth: `${svgWidth}px` }}
          role="img"
          aria-label={`Tokens redeemed per month: ${months.map((m) => `${m.label} ${m.total} MT`).join(', ')}`}
        >
          <defs>
            <linearGradient id="rewardsTrendBarFill" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="var(--accent-dark)" />
              <stop offset="100%" stopColor="var(--accent-light)" />
            </linearGradient>
          </defs>
          {/* Baseline */}
          <line
            x1="0"
            y1={barAreaHeight + 0.5}
            x2={svgWidth}
            y2={barAreaHeight + 0.5}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          {months.map((m, i) => {
            const targetHeight = maxTotal > 0 ? Math.max(4, (m.total / maxTotal) * (barAreaHeight - 16)) : 4;
            const h = ready ? targetHeight : 0;
            const x = gap + i * (barWidth + gap);
            const y = barAreaHeight - h;
            const isBusiest = m.key === busiest.key;
            return (
              <g key={m.key}>
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={isBusiest ? '#C3BAFF' : '#A6A2C0'}
                  style={{ transition: 'y 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  {m.total}
                </text>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx="6"
                  fill="url(#rewardsTrendBarFill)"
                  opacity={isBusiest ? 1 : 0.85}
                  style={{ transition: 'height 700ms cubic-bezier(0.16, 1, 0.3, 1), y 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                <text
                  x={x + barWidth / 2}
                  y={barAreaHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="500"
                  fill="#A6A2C0"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/10">
        <div className="bg-white/[0.03] rounded-xl px-4 py-3 flex items-center gap-3">
          <IconChip icon={Trophy} tone="amber" size="sm" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-0.5">Busiest Month</p>
            <p className="text-sm font-bold text-foreground">
              {busiest.label} <span className="text-amber-300">· {busiest.total} MT</span>
            </p>
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-xl px-4 py-3 flex items-center gap-3">
          <IconChip icon={TrendingUp} tone="emerald" size="sm" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-0.5">Average per Month</p>
            <p className="text-sm font-bold text-foreground">
              {average % 1 === 0 ? average : average.toFixed(1)} <span className="text-emerald-300">MT</span>
            </p>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

export default function DemoRewards() {
  const [metaTokens, setMetaTokens] = useState(REWARDS_DATA.metaTokens);
  const [redemptionHistory, setRedemptionHistory] = useState(REWARDS_DATA.redemptionHistory);

  const [selectedGift, setSelectedGift] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  // Savings goal: always a REWARDS_DATA.gifts id (or null), never a
  // typed-in number — in-memory only, resets on refresh/new session.
  const [goalGiftId, setGoalGiftId] = useState(null);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const earnedTokens = redemptionHistory.reduce((sum, item) => sum + item.tokensUsed, 0) + metaTokens;
  const redeemedTokens = redemptionHistory.reduce((sum, item) => sum + item.tokensUsed, 0);

  const openRedeem = (gift) => {
    if (metaTokens < gift.tokens) return;
    setSelectedGift(gift);
    setRedeemSuccess(false);
    setShowRedeemModal(true);
  };

  const confirmRedeem = () => {
    if (!selectedGift) return;
    setMetaTokens((t) => t - selectedGift.tokens);
    setRedemptionHistory((h) => [
      {
        id: h.length + 1,
        rewardName: selectedGift.name,
        partner: selectedGift.partner,
        value: selectedGift.value,
        tokensUsed: selectedGift.tokens,
        code: `${selectedGift.partner.split(' ')[0].toUpperCase()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        pin: String(Math.floor(1000 + Math.random() * 9000)),
        redeemedAt: new Date().toISOString(),
        status: 'Completed',
      },
      ...h,
    ]);
    setRedeemSuccess(true);
  };

  const closeRedeemModal = () => {
    setShowRedeemModal(false);
    setSelectedGift(null);
    setRedeemSuccess(false);
  };

  const openHistoryCode = (item) => {
    setSelectedHistoryItem(item);
    setShowCodeModal(true);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <>
      <Navbar />
      <DemoPage>
        <PageHeader icon={Coins} label="Rewards" page="Rewards" code={DEMO_PRODUCT.code} />

        <div>
          <Eyebrow color="blue">Meta-Token Loop / Cached Result</Eyebrow>
          <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Redeem Meta-Tokens earned from compliance reports and affiliate purchases.
          </p>
        </div>

        {/* Part 11 structural redesign: the balance hero and "How to
            Earn" used to be two full-width sections with the entire
            gifts grid and redemption history stacked between them —
            "How to Earn" ended up read last, after someone had
            already seen (and possibly been unable to afford) every
            reward. It now sits directly beside the balance hero in
            one bento row, so the "how do I get more tokens" answer
            is visible in the same glance as the balance itself.
            Same REWARDS_DATA.earnRules content, just a narrower
            stacked list instead of a 3-up grid to fit this column. */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-stretch">
          <TokenBalanceHero metaTokens={metaTokens} earnedTokens={earnedTokens} redeemedTokens={redeemedTokens} />

          <DemoCard>
            <SectionTitle sub="Compliance Report → Affiliate → Purchase → Token">How to Earn</SectionTitle>
            <div className="space-y-3.5">
              {REWARDS_DATA.earnRules.map((rule, i) => (
                <div key={rule.title} className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-4">
                  <IconChip
                    icon={i === 0 ? FileCheck : i === 1 ? ExternalLink : ShoppingCart}
                    tone={i === 0 ? 'blue' : i === 1 ? 'violet' : 'emerald'}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{rule.title}</p>
                    <p className="text-xs text-foreground-muted mt-0.5">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </DemoCard>
        </div>

        {/* Savings goal — always tied to a real REWARDS_DATA.gifts tier,
            progress measured against the same `earnedTokens` derivation
            the balance hero above already computes. */}
        <SavingsGoalCard
          earnedTokens={earnedTokens}
          gifts={REWARDS_DATA.gifts}
          goalGiftId={goalGiftId}
          onPickGoal={setGoalGiftId}
          onClearGoal={() => setGoalGiftId(null)}
        />

        {/* Earning trend — derived from real redemptionHistory, grouped
            by real redeemedAt month. See TokenTrendChart's own comment
            for why this is labeled "redeemed" rather than "earned". */}
        <div>
          <SectionTitle sub="Real activity from your redemption history, grouped by month">
            Earning Trend
          </SectionTitle>
          <TokenTrendChart redemptionHistory={redemptionHistory} />
        </div>

        {/* Rewards grid */}
        <div>
          <SectionTitle sub="Redeem tokens for partner gift cards">Available Rewards</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REWARDS_DATA.gifts.map((gift) => {
              const canAfford = metaTokens >= gift.tokens;
              const style = TIER_STYLES[gift.tier] || TIER_STYLES.starter;
              return (
                // Distinct elevation tiers so affordability reads as
                // depth, not just the existing opacity/lock text:
                // available cards sit "elevated" above the resting
                // "elevation-card" depth given to locked ones.
                <DemoCard
                  key={gift.id}
                  className={`relative flex flex-col ${canAfford ? 'elevation-elevated' : 'elevation-card opacity-90'}`}
                >
                  {!canAfford && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-white/5 text-foreground-muted">
                      <Lock className="w-3 h-3" />
                      Locked
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <IconChip icon={style.icon} tone={style.tone} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <EntityAvatar name={gift.partner} size="sm" />
                    <span className="text-xs font-semibold text-foreground-muted">{gift.partner}</span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{gift.name}</h3>
                  <p className="text-xs text-foreground-muted mb-4">{gift.description}</p>
                  <div className="mt-auto space-y-2 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-muted">Card Value</span>
                      <span className="font-semibold text-foreground">₹{gift.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-muted">Token Cost</span>
                      <span className="font-semibold text-accent">{gift.tokens} MT</span>
                    </div>
                  </div>
                  <TierAffordBar balance={metaTokens} cost={gift.tokens} />
                  {canAfford ? (
                    <button
                      onClick={() => openRedeem(gift)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-semibold transition"
                    >
                      Redeem Now
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-foreground-muted text-sm font-semibold cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Need {gift.tokens - metaTokens} more MT
                    </button>
                  )}
                </DemoCard>
              );
            })}
          </div>
        </div>

        {/* Redemption history */}
        <div>
          <SectionTitle>Redemption History</SectionTitle>
          <RedemptionTimeline items={redemptionHistory} onViewCode={openHistoryCode} />
        </div>
      </DemoPage>

      {/* Redeem modal */}
      {showRedeemModal && selectedGift && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-white/[0.06] shadow-xl shadow-black/50 rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={closeRedeemModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>

            {!redeemSuccess ? (
              <>
                <div className="text-center mb-6">
                  <IconChip icon={Sparkles} tone="blue" size="lg" />
                  <h3 className="text-lg font-bold text-foreground mt-4">{selectedGift.name}</h3>
                  <p className="text-sm text-foreground-muted">{selectedGift.description}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Gift Card Value</span>
                    <span className="font-semibold text-foreground">₹{selectedGift.value}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Token Cost</span>
                    <span className="font-semibold text-accent">{selectedGift.tokens} MT</span>
                  </div>
                  <div className="border-t border-white/10 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Balance After</span>
                    <span className="font-semibold text-emerald-300">{metaTokens - selectedGift.tokens} MT</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeRedeemModal}
                    className="flex-1 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-foreground hover:bg-white/[0.03] transition"
                  >
                    Cancel
                  </button>
                  <PrimaryButton className="flex-1" onClick={confirmRedeem}>
                    Confirm
                  </PrimaryButton>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="reward-confetti-burst absolute inset-0" aria-hidden="true">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span
                        key={i}
                        className="reward-confetti-dot"
                        style={{ '--angle': `${i * 45}deg`, animationDelay: `${i * 25}ms` }}
                      />
                    ))}
                  </div>
                  <div className="relative w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center success-icon-pop">
                    <Check className="w-8 h-8 text-emerald-300" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Redemption Successful</h3>
                <p className="text-sm text-foreground-muted mb-6">Your gift card has been added to your redemption history.</p>
                <button
                  onClick={closeRedeemModal}
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-semibold transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code / PIN modal */}
      {showCodeModal && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-white/[0.06] shadow-xl shadow-black/50 rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowCodeModal(false);
                setSelectedHistoryItem(null);
                setCopiedCode(false);
                setCopiedPin(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>

            <div className="text-center mb-6">
              <IconChip icon={Gift} tone="blue" size="lg" />
              <h3 className="text-lg font-bold text-foreground mt-4">{selectedHistoryItem.rewardName}</h3>
              <p className="text-xs text-foreground-muted">Redeemed {formatDate(selectedHistoryItem.redeemedAt)}</p>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-4 mb-3 reward-code-panel-reveal" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest text-foreground-muted">Gift Card Code</p>
                <button
                  onClick={() => copyToClipboard(selectedHistoryItem.code, 'code')}
                  className="text-accent hover:text-accent/80 transition"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="font-mono text-base font-semibold text-foreground break-all">{selectedHistoryItem.code}</p>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-4 mb-4 reward-code-panel-reveal" style={{ animationDelay: '90ms' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest text-foreground-muted">PIN</p>
                <button
                  onClick={() => copyToClipboard(selectedHistoryItem.pin, 'pin')}
                  className="text-accent hover:text-accent/80 transition"
                >
                  {copiedPin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="font-mono text-base font-semibold text-foreground">{selectedHistoryItem.pin}</p>
            </div>

            <div className="flex gap-2 bg-accent/10 border border-accent/20 rounded-xl p-3">
              <Gift className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-foreground-muted">
                Visit {selectedHistoryItem.partner}, go to "Gift Cards", click "Redeem a Gift Card", and enter the code above.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
