'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  Building2,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutGrid,
  Users,
  ArrowRight,
  Bell,
  Database,
} from 'lucide-react';
import Navbar from '../Navbar';
import {
  DemoPage,
  DemoCard,
  SectionTitle,
  AggregateComplianceRing,
  PageHeader,
  Eyebrow,
  PrimaryButton,
} from '../demo/DemoUI';
import { CategoryIcon, EntityAvatar, ComplianceStatusChip, StatChip } from '../demo/ItemIdentity';
import { getCategoryColor, categoryColorVars } from '../../lib/categoryColors';
import {
  DASHBOARD_DATA,
  ENTITIES_DATA,
  DEMO_PRODUCT,
  PRODUCTS_CATALOG,
  SELLER_VERIFICATION_DATA,
  BRAND_OWNER_DIRECTORY,
  IMPORTER_DIRECTORY,
  DISTRIBUTOR_DIRECTORY,
} from '../../lib/demoData';
import { DEMO_USER } from '../../lib/demoConfig';
import { truncateAtWord } from '../../lib/textUtils';

// ------------------------------------------------------------
// Notification Center — every alert here is derived live from the
// same static datasets the rest of the dashboard already reads
// (PRODUCTS_CATALOG, SELLER_VERIFICATION_DATA, DASHBOARD_DATA), never
// hardcoded copy or a fixed count. Re-running this against a
// different PRODUCTS_CATALOG / seller risk level would change both
// the list and the Bell's badge count automatically.
// ------------------------------------------------------------
function buildNotifications() {
  const alerts = [];

  // 1) Non-compliant products — sourced from PRODUCTS_CATALOG (the
  // catalog is the source of truth other dashboard numbers already
  // derive from), so this fires for any non-compliant product, not
  // just ones that happen to also appear in recentScans.
  const nonCompliantProducts = PRODUCTS_CATALOG.filter((p) => p.status === 'Non-Compliant');
  nonCompliantProducts.forEach((p) => {
    alerts.push({
      id: `product-${p.id}`,
      tone: 'critical',
      icon: XCircle,
      title: `${p.name} flagged non-compliant`,
      subtitle: `${p.manufacturer} · Compliance score ${p.score}`,
      path: 'products',
    });
  });

  // 2) High-risk sellers — reuses whichever risk field the seller
  // record already carries (sellerInfo.riskLevel, falling back to
  // riskAssessment.overall). With the current seller data (Low risk)
  // this correctly produces zero alerts rather than a fabricated one.
  const sellerInfo = SELLER_VERIFICATION_DATA?.sellerInfo;
  const overallRisk = SELLER_VERIFICATION_DATA?.riskAssessment?.overall || '';
  const isHighRiskSeller =
    (sellerInfo?.riskLevel || '').toLowerCase() === 'high' || overallRisk.toLowerCase().startsWith('high');
  if (sellerInfo && isHighRiskSeller) {
    alerts.push({
      id: 'seller-risk',
      tone: 'critical',
      icon: ShieldAlert,
      title: `${sellerInfo.sellerName} flagged as high risk`,
      subtitle: `${sellerInfo.sellerType} · ${sellerInfo.marketplace}`,
      path: 'seller-verification',
    });
  }

  // 3) Recent scan activity — informational, skipping anything already
  // surfaced above so the same product isn't listed twice.
  const flaggedNames = new Set(nonCompliantProducts.map((p) => p.name));
  DASHBOARD_DATA.recentScans
    .filter((s) => !flaggedNames.has(s.name))
    .slice(0, 4)
    .forEach((s) => {
      alerts.push({
        id: `scan-${s.id}`,
        tone: 'info',
        icon: Clock,
        title: `${s.name} scanned`,
        subtitle: `${s.manufacturer} · ${s.time}`,
        path: 'products',
      });
    });

  return alerts;
}

// ------------------------------------------------------------
// Data Freshness & System Health
// ------------------------------------------------------------
// Every number in this panel is a live count over the same static
// arrays the rest of the dashboard already imports — PRODUCTS_CATALOG
// (Products tab), the three entity directories (Entities tab), and
// SELLER_VERIFICATION_DATA (Seller Verification tab) — recomputed on
// every render, so it can never drift from what those tabs actually
// show. Nothing here is fabricated: there's no invented latency
// figure and no claim of a live backend poll, because DEMO_MODE reads
// a bundled static file (see lib/demoConfig.js), not a network call.
// "Data as of" is the real wall-clock moment this page's data was
// loaded into the browser (captured once on mount via lazy useState
// init), and its relative label ticks forward every second off a
// plain setInterval — the same honest "instant cache / local data"
// framing already used by TopBar and ActiveProductBar in DemoUI.jsx.
function formatRelativeTime(diffMs) {
  if (diffMs < 5000) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function DataHealthPanel() {
  // Captured exactly once, on mount — the moment this static dataset
  // was actually loaded into the browser for this page view.
  const [loadedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const relativeLabel = formatRelativeTime(now - loadedAt);

  // Real counts, computed from the actual arrays every render.
  const totalProducts = PRODUCTS_CATALOG.length;
  const totalEntities =
    BRAND_OWNER_DIRECTORY.length + IMPORTER_DIRECTORY.length + DISTRIBUTOR_DIRECTORY.length;
  // SELLER_VERIFICATION_DATA holds one full seller record in this
  // dataset — counted as 1 only when that record is actually present,
  // rather than a hardcoded "1" regardless of the data.
  const totalSellers = SELLER_VERIFICATION_DATA?.sellerInfo ? 1 : 0;

  return (
    <DemoCard className="!py-4 !px-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-emerald-300" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Data as of {relativeLabel}
            </p>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Local data · synced — read from the bundled dataset, no live backend poll
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatChip icon={Package} label="Products indexed" value={totalProducts} tone="accent" />
          <StatChip icon={Building2} label="Entities indexed" value={totalEntities} tone="teal" />
          <StatChip icon={ShieldCheck} label="Sellers indexed" value={totalSellers} tone="emerald" />
        </div>
      </div>
    </DemoCard>
  );
}

const NOTIFICATION_TONE = {
  critical: { chip: 'text-red-300 bg-red-500/15 border-red-500/30' },
  warning: { chip: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
  info: { chip: 'text-foreground-muted bg-white/5 border-white/10' },
};

function NotificationBell({ alerts, onNavigate }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const count = alerts.length;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2.5 rounded-xl border border-white/[0.06] bg-card hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px] text-foreground-muted" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[90vw] bg-card border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <span className="text-[11px] text-foreground-muted">{count} alert{count === 1 ? '' : 's'}</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {count === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-foreground-muted">You're all caught up.</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const Icon = alert.icon;
                const tone = NOTIFICATION_TONE[alert.tone] || NOTIFICATION_TONE.info;
                return (
                  <button
                    key={alert.id}
                    onClick={() => {
                      setOpen(false);
                      onNavigate(alert.path);
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-white/[0.04] last:border-b-0 hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${tone.chip}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate" title={alert.title}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-foreground-muted truncate" title={alert.subtitle}>
                        {alert.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const quickActionIcons = {
  scan: ScanLine,
  seller: ShieldCheck,
  products: ShoppingBag,
  entities: Building2,
};

// useSearchParams() requires a Suspense boundary in the App Router,
// otherwise `next build` fails during static prerendering.
export default function DemoDashboard() {
  return (
    <Suspense fallback={null}>
      <DemoDashboardContent />
    </Suspense>
  );
}

function DemoDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || DEMO_USER.userId;
  const role = searchParams.get('role') || DEMO_USER.role;

  const goTo = (path) => router.push(`/${path}?userId=${userId}&role=${role}`);

  const d = DASHBOARD_DATA;

  // Entities-at-a-glance strip (new in Part 4) — every number here is
  // derived on the fly from ENTITIES_DATA.riskDirectory (Part 2's
  // finished data), never hardcoded, so it can't drift out of sync
  // with the Entities tab. See the Part 4 verification script for the
  // assertion that these counts match riskDirectory exactly.
  const riskDirectory = ENTITIES_DATA.riskDirectory;
  const entityRiskCounts = riskDirectory.reduce(
    (acc, e) => {
      acc[e.riskLevel] = (acc[e.riskLevel] || 0) + 1;
      return acc;
    },
    { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0 }
  );

  // Manufacturer -> real per-manufacturer facts (productCount,
  // riskLevel) looked up from the same riskDirectory, keyed by exact
  // name, so Top Manufacturers can show *why* each entity ranks where
  // it does instead of just a bare rank number.
  const manufacturerFacts = (name) => riskDirectory.find((e) => e.name === name);

  // Notification Center data — recomputed on every render straight
  // from PRODUCTS_CATALOG / SELLER_VERIFICATION_DATA / DASHBOARD_DATA,
  // so the Bell's badge count can never drift from what's in the list.
  const notifications = buildNotifications();

  return (
    <>
      <Navbar />
      <DemoPage>
        <div className="flex justify-end">
          <NotificationBell alerts={notifications} onNavigate={goTo} />
        </div>
        <PageHeader icon={LayoutGrid} label="Dashboard" page="Dashboard" code={DEMO_PRODUCT.code} />

        {/* Live/fresh feel (Part 12 polish pass) — a small pulse +
            "last updated" cue that reinforces the "Instant cache /
            zero latency" language already in the top bar (DemoUI's
            TopBar/ActiveProductBar). Not a fabricated live clock —
            reuses the real, most-recent recentScans[0].time value
            ("Just now") so the claim stays backed by actual data. */}
        <div className="flex items-center gap-2 text-xs text-foreground-muted -mt-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Last activity: {d.recentScans[0]?.time || 'Just now'}
        </div>

        {/* Data Freshness & System Health — see DataHealthPanel above
            for what each value is derived from and why. Placed right
            under the existing "last activity" pulse so freshness and
            system-health context sit together at the top of the page,
            before the bento hero. */}
        <DataHealthPanel />

        {/* ------------------------------------------------------------
            BENTO HERO — Part 11 structural redesign.
            Replaces the old "hero card, then a separate search card,
            then a uniform 4-up metric grid, then a separate 3-col
            row for the ring/category/manufacturers" stack (4 stacked
            sections that all read the same width) with one grid: a
            wide welcome+search tile, a tall dominant Compliance Ring
            tile beside it (spans both rows), and a borderless
            divided stat strip underneath the welcome tile so not
            every fact on the page lives inside its own white card.
            All values below are untouched — same d.metrics /
            d.complianceOverview fields as before, just laid out
            differently. ------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <DemoCard variant="hero" className="lg:col-span-7 flex flex-col justify-between gap-6 elevation-elevated">
            <div>
              <Eyebrow color="blue">Workspace / Dashboard</Eyebrow>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-[1.05]">
                Welcome back,<br className="hidden sm:block" /> {d.welcomeName}
              </h1>
              <p className="text-foreground-muted mt-2 text-sm max-w-md">{d.tagline}</p>
            </div>
            <div className="flex items-center gap-3 bg-black/30 backdrop-blur rounded-xl px-4 py-3 border border-white/[0.06]">
              <Search className="w-5 h-5 text-foreground-muted shrink-0" />
              <input
                readOnly
                onFocus={() => goTo('check-compliance')}
                placeholder={d.searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-foreground-muted cursor-pointer"
              />
              <PrimaryButton onClick={() => goTo('check-compliance')}>{d.scanCta}</PrimaryButton>
            </div>
          </DemoCard>

          {/* Dominant visual element — the same AggregateComplianceRing
              as before (identical segments/percentages/counts), just
              given the biggest, tallest tile on the page and scaled
              up visually (CSS transform only, the component itself is
              untouched so every other page that might reuse it is
              unaffected) instead of sharing equal billing with two
              other cards in a 3-up row. */}
          <DemoCard className="lg:col-span-5 lg:row-span-2 flex flex-col items-center justify-center text-center">
            <SectionTitle sub="Overall product compliance status">Compliance Overview</SectionTitle>
            <div className="scale-110 my-4">
              <AggregateComplianceRing
                segments={[
                  { key: 'compliant', label: 'Compliant', count: d.complianceOverview.compliant.count, pct: d.complianceOverview.compliant.pct, color: '#34d399', colorDark: '#059669' },
                  { key: 'nonCompliant', label: 'Non-Compliant', count: d.complianceOverview.nonCompliant.count, pct: d.complianceOverview.nonCompliant.pct, color: '#f87171', colorDark: '#dc2626' },
                  { key: 'pendingReview', label: 'Pending', count: d.complianceOverview.pendingReview.count, pct: d.complianceOverview.pendingReview.pct, color: '#fbbf24', colorDark: '#d97706' },
                ]}
              />
            </div>
          </DemoCard>

          {/* Summary metrics, restyled as one divided stat strip
              instead of 4 separate identically-sized white cards —
              same MetricCard math (ring math, colors, ringPct values
              all identical to before), just rendered "bare" (no card
              chrome per stat) since they now share one enclosing
              surface. */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/[0.06] rounded-2xl border border-white/[0.04] bg-card elevation-card overflow-hidden">
            <MetricCard bare icon={Package} label="Products Scanned" value={d.metrics.scanned} color="accent" ringPct={100} />
            <MetricCard bare icon={CheckCircle2} label="Compliant" value={d.metrics.compliant} color="emerald" ringPct={d.complianceOverview.compliant.pct} />
            <MetricCard bare icon={XCircle} label="Non-Compliant" value={d.metrics.nonCompliant} color="red" ringPct={d.complianceOverview.nonCompliant.pct} />
            <MetricCard bare icon={Clock} label="Pending Review" value={d.metrics.pendingReview} color="amber" ringPct={d.complianceOverview.pendingReview.pct} />
          </div>
        </div>

        {/* ------------------------------------------------------------
            Second bento row — Category Breakdown gets the narrow
            column (it's a short list), Recent Scans gets the wide
            column (it's 10 rows deep and was previously squeezed into
            a 2-of-3 column next to two other cards), and Top
            Manufacturers + Quick Actions share the remaining narrow
            column stacked on top of each other — three different
            tile shapes instead of one repeated card width. ------------------------------------------------------------ */}
        {/* items-stretch (Part 12 polish pass, bug fix #2) — the three
            top-level tiles in this row (Category Breakdown, Recent
            Scans, the right-hand stack) previously used items-start,
            so whichever tile had the least content just ended
            shorter than its neighbors, leaving a visibly uneven
            bottom edge / dead gap once the page had more than a
            screenful of content. items-stretch makes all three match
            the row's tallest tile; each tile below is then built as
            h-full flex flex-col with a small real (never fabricated)
            summary line pinned to the bottom via mt-auto, so any
            extra height reads as an intentional footer rather than
            empty whitespace, regardless of which tile ends up
            shortest at a given viewport width. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <DemoCard className="lg:col-span-3 h-full flex flex-col">
            <SectionTitle>Category Breakdown</SectionTitle>
            <div className="space-y-5 flex-1">
              {d.categoryBreakdown.map((c, i) => (
                <CategoryBar key={c.category} category={c} maxCount={Math.max(...d.categoryBreakdown.map((x) => x.count))} index={i} onClick={() => goTo('products')} />
              ))}
            </div>
            {/* Genuinely useful footer (not filler) — both numbers are
                a plain sum/count over the same categoryBreakdown data
                already rendered above, never invented. Also doubles
                as this tile's share of the column-balancing fix. */}
            <p className="mt-auto pt-4 text-[11px] text-foreground-muted border-t border-white/[0.06]">
              {d.categoryBreakdown.reduce((sum, c) => sum + c.count, 0)} products across{' '}
              {d.categoryBreakdown.length} categories
            </p>
          </DemoCard>

          {/* Recent Scans — Part 2 grew this from 5 to 10 real entries
              (all 10 render below, unsliced). Part 4 swaps the
              hand-rolled per-row circle + colored text for
              EntityAvatar (manufacturer identity) + ComplianceStatusChip
              (Part 3's dense status language, shared with FindingsLedger
              and the Entities risk ladder) instead of a second,
              slightly different pass/fail treatment invented just for
              this row. Now given a two-column internal layout on wide
              screens so 10 rows read as a dense grid rather than one
              long scrolling list. */}
          {/* Bug fix #1 (truncation): the previous sm:grid-cols-2 split
              packed two rows side-by-side inside this already-narrow
              (6-of-12) card, leaving each row so little width that
              real product names like "Cello Butterfly Storage
              Container Set" or "Sunrise Organic Almond Butter"
              rendered as "Cello Bu…" / "Sun…". Dropped to a single
              full-width column instead — every row now gets the
              card's whole inner width, and truncateAtWord (word-
              boundary cut, verified against the dataset's actual
              longest names) is a fallback for whatever's still too
              long at narrow viewports. This also makes the card
              taller, which is most of bug fix #2 (column balancing)
              since Recent Scans was one of the two shorter tiles. */}
          <DemoCard className="lg:col-span-6 h-full flex flex-col">
            <SectionTitle>Recent Scans</SectionTitle>
            <div className="flex-1">
              {d.recentScans.map((s, i) => (
                <div
                  key={s.id}
                  className="dashboard-scan-row py-3.5 flex items-center gap-3 border-b border-white/5 last:border-b-0"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <EntityAvatar name={s.manufacturer} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate" title={s.name}>
                      {truncateAtWord(s.name, 42)}
                    </p>
                    <p className="text-xs text-foreground-muted truncate" title={s.manufacturer}>
                      {truncateAtWord(s.manufacturer, 42)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1.5">
                    <ComplianceStatusChip status={s.status} size="sm" />
                    <p className="text-[11px] text-foreground-muted">{s.time}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* "View All" -> Products (enhancement #2), consistent
                with the existing Quick Actions "Browse Products"
                pattern. A per-row trend indicator was considered but
                dropped: there's no prior-period scan count anywhere
                in the demo data to compare against, so a trend arrow
                here would have to be invented rather than derived. */}
            <button
              onClick={() => goTo('products')}
              className="mt-auto pt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition border-t border-white/[0.06]"
            >
              View All Products
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </DemoCard>

          <div className="lg:col-span-3 h-full flex flex-col gap-6">
            {/* Entities at a Glance — moved up beside Top
                Manufacturers/Quick Actions instead of a full-width
                strip at the very bottom of the page, so the page ends
                with two balanced narrow tiles rather than trailing
                off into one lonely wide bar. Every value is still
                entityRiskCounts / riskDirectory.length, computed
                exactly as before.

                Enhancement #1: each risk-tier pill is now a real
                button. Entities' Risk Overview grouping is internal
                component state (activeTab/tier groups), not anything
                driven by a URL query param, and Entities is off-limits
                for this pass (no other-page changes) — so per the
                brief's own fallback ("otherwise just navigate"),
                these just take the user to Entities rather than
                inventing a query-param contract the destination page
                doesn't read. */}
            <DemoCard accentColor="var(--accent)">
              <SectionTitle sub="Real-time risk composition">Entities at a Glance</SectionTitle>
              <div className="flex flex-col gap-4">
                <StatChip icon={Users} label="Total Entities" value={riskDirectory.length} tone="accent" />
                <div className="grid grid-cols-3 gap-3 text-center">
                  <button
                    onClick={() => goTo('entities')}
                    className="flex flex-col items-center gap-1.5 rounded-xl py-1.5 -mx-1 hover:bg-white/[0.04] transition"
                  >
                    <ComplianceStatusChip status="High Risk" size="sm" />
                    <span className="text-lg font-bold text-foreground tabular-nums">{entityRiskCounts['High Risk']}</span>
                  </button>
                  <button
                    onClick={() => goTo('entities')}
                    className="flex flex-col items-center gap-1.5 rounded-xl py-1.5 -mx-1 hover:bg-white/[0.04] transition"
                  >
                    <ComplianceStatusChip status="Medium Risk" size="sm" />
                    <span className="text-lg font-bold text-foreground tabular-nums">{entityRiskCounts['Medium Risk']}</span>
                  </button>
                  <button
                    onClick={() => goTo('entities')}
                    className="flex flex-col items-center gap-1.5 rounded-xl py-1.5 -mx-1 hover:bg-white/[0.04] transition"
                  >
                    <ComplianceStatusChip status="Low Risk" size="sm" />
                    <span className="text-lg font-bold text-foreground tabular-nums">{entityRiskCounts['Low Risk']}</span>
                  </button>
                </div>
              </div>
            </DemoCard>

            {/* Bug fix #1 (truncation), worst offender: this list used
                to put rank + avatar + name + risk chip all on one
                line inside a lg:col-span-3 (~1/4-width) card. Once
                the fixed-width neighbors (rank badge, avatar, risk
                chip) were accounted for, real names like "Hindustan
                Unilever Limited" and "Nestle India Limited" were left
                with roughly 15-20px of actual rendered width — hence
                "Hi…" / "N…" in the screenshots. Splitting each row
                into two lines (name alone on row 1, with the full
                remaining card width; product-count + risk chip on
                row 2, indented to sit under the name) removes the
                risk chip from the name's row entirely, which is most
                of the fix — truncateAtWord is the remaining
                word-boundary-safe fallback for names still too long
                at very narrow widths (verified against the dataset's
                actual longest name, 50 characters). */}
            <DemoCard>
              <SectionTitle sub="Ranked by product count">Top Manufacturers</SectionTitle>
              <ul className="space-y-3.5">
                {d.topManufacturers.map((m, i) => {
                  const facts = manufacturerFacts(m);
                  return (
                    <li key={m} className="text-sm text-foreground">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-lg bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <EntityAvatar name={m} size="sm" />
                        <p className="min-w-0 flex-1 truncate" title={m}>
                          {truncateAtWord(m, 30)}
                        </p>
                      </div>
                      {facts && (
                        <div className="flex items-center justify-between gap-2 pl-[68px] mt-1">
                          <p className="text-[11px] text-foreground-muted">
                            {facts.productCount} product{facts.productCount === 1 ? '' : 's'}
                          </p>
                          <ComplianceStatusChip status={facts.riskLevel} size="sm" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </DemoCard>

            <DemoCard>
              <SectionTitle>Quick Actions</SectionTitle>
              <div className="space-y-3">
                {d.quickActions.map((a) => {
                  const Icon = quickActionIcons[a.key];
                  return (
                    <button
                      key={a.key}
                      onClick={() => goTo(a.path)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] hover:border-accent/40 hover:bg-accent/5 transition text-left"
                    >
                      <Icon className="w-5 h-5 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-foreground-muted">{a.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </DemoCard>
          </div>
        </div>
      </DemoPage>
    </>
  );
}

// Icon chip color + its matching ring stroke color, kept in one map
// so the ring around a chip is always the same hue as the chip
// itself rather than two independently-chosen colors.
const METRIC_COLOR_MAP = {
  accent: { chip: 'text-accent bg-accent/10 border-accent/20', ring: '#7C6FEE', glow: 'glow-accent' },
  emerald: { chip: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30', ring: '#10b981', glow: 'glow-success' },
  red: { chip: 'text-red-300 bg-red-500/15 border-red-500/30', ring: '#ef4444', glow: 'glow-danger' },
  amber: { chip: 'text-amber-300 bg-amber-500/15 border-amber-500/30', ring: '#f59e0b', glow: 'glow-warning' },
};

// MetricCard now carries a small radial fill behind its icon chip,
// set to that metric's real share of products scanned (ringPct is
// passed in from the same complianceOverview percentages the
// Compliance Overview ring below already uses — no new numbers
// computed here). "Products Scanned" itself has no meaningful
// fraction to show — it *is* the whole — so its ring is drawn full.
function MetricCard({ icon: Icon, label, value, color, ringPct = 0, bare = false }) {
  const tone = METRIC_COLOR_MAP[color] || METRIC_COLOR_MAP.accent;

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
  }, [ringPct]);

  const size = 44;
  const strokeW = 3;
  const r = size / 2 - strokeW;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, ringPct));
  const offset = ready ? circumference * (1 - pct / 100) : circumference;

  const content = (
    <>
      <div className={`relative w-11 h-11 shrink-0 rounded-xl ${tone.glow}`}>
        <svg width={size} height={size} className="absolute inset-0 -rotate-90 dashboard-metric-ring">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeW} />
          <circle
            className="dashboard-metric-ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone.ring}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className={`absolute inset-0 m-[3px] rounded-xl flex items-center justify-center border ${tone.chip}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-foreground-muted mt-1">{label}</p>
      </div>
    </>
  );

  // `bare` (Part 11 bento redesign): same markup and ring math, just
  // without its own DemoCard wrapper — used when the parent already
  // supplies one shared card + dividers for a strip of these, so the
  // page isn't made of nothing but identical white rounded boxes.
  if (bare) {
    return <div className="flex items-center gap-4 px-5 py-5 sm:px-6">{content}</div>;
  }

  return <DemoCard className="flex items-center gap-4">{content}</DemoCard>;
}

// Category Breakdown bar — length compares `count` against the
// largest category's count (see comment above its call site); the
// category's own 100%-compliant figure is kept, just relabeled as a
// badge instead of driving width. Fill animates in on mount using the
// same two-frame RAF + CSS-transition technique as Part 4's
// ComplianceSummaryStrip, so bars grow into place instead of
// appearing at full width instantly.
//
// Part 4: the bar fill and the leading icon chip now both use
// getCategoryColor()/CategoryIcon (Part 3) so each of the 5 real
// categories reads as visually distinct here instead of five
// identical accent-purple bars — a different icon shape as well as a
// different hue per row.
// Bug fix #1 (truncation) + Enhancement #4 (hover/click-through).
// The label used to sit in its own nested flex div (icon + label)
// beside a sibling count span, both inside an outer justify-between
// row — two flex contexts deep, with only the *wrapper* div (not the
// label itself) marked min-w-0. That's what produced "Food & Be…":
// once the row ran out of room the browser had to guess how to
// distribute the squeeze across two nested flex layouts instead of
// shrinking one clearly-flexible element. Flattened to a single flex
// row (icon / label / count as direct siblings, label as the one
// flex-1 min-w-0 element) so the label always gets every pixel not
// claimed by the icon or the count — real category names (max 18
// characters, e.g. "Health & Wellness") now fit without truncating
// at any of this card's supported widths; truncateAtWord is kept as
// a safety net rather than the primary fix.
function CategoryBar({ category: c, maxCount, index, onClick }) {
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
  }, [c.count, maxCount]);

  const widthPct = maxCount > 0 ? (c.count / maxCount) * 100 : 0;
  const token = getCategoryColor(c.category);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl -mx-2 px-2 py-1.5 hover:bg-white/[0.04] transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <CategoryIcon category={c.category} size="sm" />
        <span className="text-foreground font-medium text-sm truncate min-w-0 flex-1" title={c.category}>
          {truncateAtWord(c.category, 22)}
        </span>
        <span className="text-foreground-muted text-xs shrink-0">{c.count} products</span>
      </div>
      <div className="h-2.5 rounded-full surface-tint-category overflow-hidden" style={categoryColorVars(c.category)}>
        <div
          className="dashboard-bar-fill h-full rounded-full"
          style={{
            width: ready ? `${widthPct}%` : '0%',
            transitionDelay: `${index * 70}ms`,
            backgroundImage: `linear-gradient(90deg, ${token.dark}, ${token.color})`,
          }}
        />
      </div>
      <span className="inline-block mt-1.5 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-1.5 py-0.5">
        {c.pct}% compliant
      </span>
    </button>
  );
}
