'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileCheck2,
  ArrowRight,
  Package,
  Share2,
  Factory,
  Landmark,
  Ship,
  Truck,
  Unlink,
  ShieldCheck,
  Info,
  Search,
  X,
} from 'lucide-react';
import Navbar from '../Navbar';
import {
  DemoPage,
  DemoCard,
  SectionTitle,
  StatusPill,
  TabRow,
  KeyValue,
  PageHeader,
  Eyebrow,
  IconChip,
  ComplianceSummaryStrip,
  FindingsLedger,
  ViolationsPanel,
} from '../demo/DemoUI';
import { EntityAvatar, CategoryIcon, ComplianceStatusChip, StatChip } from '../demo/ItemIdentity';
import {
  ENTITIES_DATA,
  DEMO_PRODUCT,
  PRODUCTS_CATALOG,
  CHECK_COMPLIANCE_DATA_VIOLATION,
  BRAND_OWNER_DIRECTORY,
  IMPORTER_DIRECTORY,
  DISTRIBUTOR_DIRECTORY,
} from '../../lib/demoData';
import { getCategoryColor, categoryColorVars } from '../../lib/categoryColors';
import { truncateAtWord } from '../../lib/textUtils';

const TABS = ['Manufacturer', 'Supply Chain', 'Compliance Records', 'Risk Overview'];

// ============================================================
// Part 8 — Entities richness pass
// ============================================================
// Investigation (full detail in the Part 8 report): the Manufacturer
// and Compliance Records tabs each rendered exactly one hardcoded
// object — d.manufacturer and d.complianceRecord — both always
// Nestle India Limited, with no selection state anywhere that a
// click could feed. That's a different shape than Part 6's Products
// bug (a real `selected` product existed but the render path ignored
// it and re-showed Maggi); here there was no selection wiring to
// ignore — the tabs were simply never built past a single static
// card. Same visible symptom (always one entity), different root
// cause, so nothing below is a "bug fix" in the Part 6 sense — it's
// building the browsing/selection path that never existed, on top of
// the real 17-entity riskDirectory from Part 2.
//
// Data reality found on inspection, carried through honestly below:
//   - Full company-profile depth (CIN, registered address, industry,
//     website, tagline) exists for exactly ONE of the 17 entities:
//     Nestle India Limited (ENTITIES_DATA.manufacturer). The other 16
//     exist only as riskDirectory rows (name, role, productCount,
//     failedChecks, riskLevel, note) — the same "summary tier, not
//     fabricated full detail" honesty line Part 6 drew for its 16
//     catalog-summary-only products.
//   - Full per-check compliance detail exists for TWO entities:
//     Nestle (ENTITIES_DATA.complianceRecord, 5 always-compliant
//     records) and Sunrise Organic Foods Inc. (via
//     CHECK_COMPLIANCE_DATA_VIOLATION — the same 7-requirement
//     findings ledger and 2 violation write-ups already used on
//     Check Compliance, reused verbatim here rather than
//     re-described). The other 15 entities have no per-check
//     breakdown at all, only their riskDirectory summary.
//   - No Brand Owner / Importer / Distributor data exists for any of
//     the 17 entities — all confirmed manufacturer-only.
//
// Part 15 update: the three gaps noted directly above are now filled
// — see BRAND_OWNER_DIRECTORY / IMPORTER_DIRECTORY /
// DISTRIBUTOR_DIRECTORY in lib/demoData.js and the RoleDirectoryList
// component further down this file. Left the paragraph above as-is
// (it was an accurate finding at the time) rather than rewriting
// history.

// Every entity's product category, derived from PRODUCTS_CATALOG
// (each catalog row already carries manufacturer + categoryGroup —
// see Part 2). Most manufacturers make one category of product;
// Hindustan Unilever spans two (Dove = Personal Care, Surf Excel =
// Household), so its entry has length 2 and deliberately gets no
// single CategoryIcon below rather than being mislabeled as one
// category.
const ENTITY_CATEGORY_MAP = (() => {
  const map = {};
  PRODUCTS_CATALOG.forEach((p) => {
    if (!map[p.manufacturer]) map[p.manufacturer] = new Set();
    map[p.manufacturer].add(p.categoryGroup);
  });
  const out = {};
  Object.entries(map).forEach(([name, set]) => {
    out[name] = Array.from(set);
  });
  return out;
})();

// Worst-first ordering, matching Risk Overview's RISK_TIERS — so the
// one real flagged entity (Sunrise Organic Foods Inc., High Risk)
// surfaces at the top of both browsable lists below, the same as it
// does in the Risk Overview tab, rather than being buried
// alphabetically among 16 Low Risk rows.
const TIER_SORT_ORDER = { 'High Risk': 0, 'Medium Risk': 1, 'Low Risk': 2 };
function sortEntitiesByRisk(list) {
  return [...list].sort(
    (a, b) => (TIER_SORT_ORDER[a.riskLevel] ?? 9) - (TIER_SORT_ORDER[b.riskLevel] ?? 9) || a.name.localeCompare(b.name)
  );
}

// ------------------------------------------------------------
// Column-balance fix (Part 3, Spectrum Fix pass)
// ------------------------------------------------------------
// Investigation: Manufacturer and Compliance Records both pair the
// same 17-row EntityBrowserList (fixed height, ~1200px) against a
// detail panel on the right whose real content ranges from a full
// company profile or a 7-check findings breakdown (rare — Nestle and
// Sunrise only) down to a single summary card for the other 15
// entities. Both tabs used `items-start` on their two-column grid, so
// the right panel simply ended wherever its own content ended —
// often several hundred pixels above the list's bottom edge — while
// its card border stopped short too, leaving the two columns visibly
// unaligned at the bottom rather than reading as one balanced layout.
// Risk Overview was checked too: it's a single full-width stack
// (`space-y-6`), no side-by-side columns exist there, so there's
// nothing to balance on that tab.
//
// Fix, same approach as Dashboard's Part 12 polish pass:
//   1. `items-start` -> `items-stretch` on both grids, plus
//      `h-full flex flex-col` on every card in the row, so both
//      columns' card borders always end at the same edge instead of
//      whichever is shorter just stopping early.
//   2. The entity list itself is capped to a real scroll viewport
//      (`lg:max-h-[640px] lg:overflow-y-auto`) instead of forcing the
//      grid row to the full ~1200px of 17 rows — the same
//      master/detail pattern used by any list-plus-detail UI (Gmail,
//      Slack's channel list, etc.), so the row height the shorter
//      panel has to stretch to is close to real screen space, not an
//      artifact of how many entities happen to exist.
//   3. Where the detail panel is still shorter after that, it's
//      filled with real, derived (never fabricated) content instead
//      of blank space: a "Scanned Products" list built by filtering
//      the existing PRODUCTS_CATALOG for this manufacturer (below),
//      plus a real cross-tab link to the other tab's view of the same
//      entity, pinned to the bottom via `mt-auto` exactly like
//      Dashboard's "View All Products" footer — so any leftover
//      height reads as an intentional footer, not a gap.

// Every real scanned product for one manufacturer, straight from
// PRODUCTS_CATALOG (no invented rows) — most manufacturers have
// exactly one, Hindustan Unilever has two; both cases render
// correctly since this is a plain filter, not a fixed-size slice.
function productsForManufacturer(name) {
  return PRODUCTS_CATALOG.filter((p) => p.manufacturer === name);
}

// Shared "Scanned Products" block — used by both the Manufacturer
// tab's full-profile and fallback detail cards, and by the
// Compliance Records tab's no-detail fallback card, so a short detail
// panel gets the same real supporting content regardless of which
// tab it's on.
function ScannedProductsList({ manufacturerName }) {
  const products = productsForManufacturer(manufacturerName);
  if (products.length === 0) return null;
  return (
    <div className="mt-6 pt-6 border-t border-white/[0.06]">
      <SectionTitle sub={`${products.length} scanned product${products.length === 1 ? '' : 's'} on record from this manufacturer`}>
        Scanned Products
      </SectionTitle>
      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-foreground-muted" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate" title={p.name}>
                  {truncateAtWord(p.name, 46)}
                </p>
                <p className="text-xs text-foreground-muted truncate" title={`${p.subtitle} · ${p.categoryGroup}`}>
                  {truncateAtWord(`${p.subtitle} · ${p.categoryGroup}`, 46)}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <StatusPill status={p.status} />
              <p className="text-[11px] text-foreground-muted mt-1">{p.score}/100</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full company-profile lookup — currently just the one real record.
// Kept as a map (not an if/else on a name string) so a second real
// profile can be added later without changing the render logic.
const FULL_PROFILE_BY_NAME = { [ENTITIES_DATA.manufacturer.name]: ENTITIES_DATA.manufacturer };

// Full per-check compliance detail lookup — Nestle's always-compliant
// checklist and Sunrise's real 2-failed-check findings/violations.
const COMPLIANCE_DETAIL_BY_NAME = {
  [ENTITIES_DATA.complianceRecord.entity]: { kind: 'checklist', data: ENTITIES_DATA.complianceRecord },
  [CHECK_COMPLIANCE_DATA_VIOLATION.product.manufacturer]: { kind: 'findings', data: CHECK_COMPLIANCE_DATA_VIOLATION },
};

// ------------------------------------------------------------
// Shared browsable entity list — used by both Manufacturer and
// Compliance Records tabs so the same 17 rows, in the same
// worst-first order, are selectable the same way in either place.
// ------------------------------------------------------------
function EntityBrowserList({ entities, selectedName, onSelect, secondaryLabel }) {
  return (
    <div className="space-y-1.5">
      {entities.map((e) => {
        const isSelected = e.name === selectedName;
        const isFlagged = e.riskLevel === 'High Risk';
        const categories = ENTITY_CATEGORY_MAP[e.name] || [];
        // Category tint: same card-accent-tint + categoryColorVars
        // convention Products' browsable list already uses (Part 3),
        // so this list is scannable by category color too. Entities
        // spanning 2+ categories (e.g. Hindustan Unilever) tint by
        // their first category rather than going untinted — a color
        // cue, not a textual claim, so it doesn't misrepresent the
        // "spans multiple categories" fact already shown in the label.
        const primaryCategory = categories[0];
        return (
          <button
            key={e.name}
            onClick={() => onSelect(e.name)}
            className={`card-accent-tint w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
              isSelected
                ? '!bg-accent/10 !border-accent/30'
                : 'border-transparent hover:bg-white/[0.03] hover:border-white/5'
            }`}
            style={primaryCategory ? categoryColorVars(primaryCategory) : undefined}
          >
            <span className={isFlagged ? 'rounded-full ring-2 ring-red-400 ring-offset-1 shrink-0' : 'shrink-0'}>
              <EntityAvatar name={e.name} size="sm" />
            </span>
            <div className="min-w-0 flex-1">
              {/* Name gets the row's full width on its own line — the
                  risk chip used to share this line and, combined with
                  the old 320px sidebar, left as little as ~100px for
                  the name itself (verified — see Part 1 report). It
                  now shares the shorter, less critical role line
                  instead. truncateAtWord is still applied as the
                  fallback for the one real name (Gujarat Cooperative
                  Milk Marketing Federation Ltd., 50 chars) too long
                  for even this widened layout. */}
              <p className="text-sm font-medium text-foreground truncate" title={e.name}>
                {truncateAtWord(e.name, 44)}
              </p>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-[11px] text-foreground-muted truncate" title={`${e.role}${categories.length === 1 ? ` · ${categories[0]}` : ''}${secondaryLabel ? ` · ${secondaryLabel(e)}` : ''}`}>
                  {truncateAtWord(
                    `${e.role}${categories.length === 1 ? ` · ${categories[0]}` : ''}${
                      secondaryLabel ? ` · ${secondaryLabel(e)}` : ''
                    }`,
                    30
                  )}
                </p>
                <ComplianceStatusChip status={e.riskLevel} glow />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Role entity card (extracted, Supply Chain pass)
// ------------------------------------------------------------
// The exact card RoleDirectoryList has always rendered for a brand
// owner / importer / distributor row, lifted into its own component
// so the Supply Chain graph can expand one of those nodes into the
// SAME card rather than a second, drifting copy of it.
function RoleEntityCard({ entity: r, onViewManufacturer }) {
  const products = productsForManufacturer(r.linkedManufacturer);
  return (
    <DemoCard className="!p-5">
      <div className="flex items-start gap-4">
        <EntityAvatar name={r.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate" title={r.name}>
              {truncateAtWord(r.name, 50)}
            </h3>
            <span className="text-[11px] uppercase tracking-wide text-foreground-muted shrink-0">
              {r.country}
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-1.5">{r.note}</p>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            <span className="text-[11px] text-foreground-muted">
              Linked to <span className="text-foreground font-medium">{r.linkedManufacturer}</span> ·{' '}
              {products.length} scanned product{products.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => onViewManufacturer(r.linkedManufacturer)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition shrink-0"
            >
              View Manufacturer
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

// ------------------------------------------------------------
// Brand Owner / Importer / Distributor sub-tabs (Part 15 — Entities
// Data Expansion)
// ------------------------------------------------------------
// Real, varied role data, not a fabricated even spread: 7 of 17
// manufacturers have a real multinational Brand Owner parent, the 1
// genuinely imported catalog product has a real distinct Indian
// Importer, and the 1 catalog product with a real marketplace-seller
// record on file elsewhere in this dataset (Appario Retail, already
// used on Seller Verification) is cross-listed here as its
// Distributor. Every other manufacturer legitimately has no extra
// role — that's realistic, not a leftover gap. Shares
// productsForManufacturer() with the Manufacturer/Compliance tabs'
// "Scanned Products" block above, so the product count shown here is
// the same real filter, not a separately-tracked number that could
// drift out of sync.
function RoleDirectoryList({ role, directory, onViewManufacturer }) {
  const roleLabel = role.replace(' (if any)', '');

  if (!directory || directory.length === 0) {
    return (
      <DemoCard className="text-center py-10 text-foreground-muted text-sm">
        No {roleLabel.toLowerCase()} data has been cached for any of the 17 entities on this platform
        yet — every entity here is on record only in the Manufacturer role.
      </DemoCard>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-foreground-muted px-1">
        {directory.length} {directory.length === 1 ? 'entity holds' : 'entities hold'} a{' '}
        {roleLabel.toLowerCase()} role on record, each linked to a real manufacturer below.
      </p>
      {directory.map((r) => (
        <RoleEntityCard key={r.name} entity={r} onViewManufacturer={onViewManufacturer} />
      ))}
    </div>
  );
}


// ------------------------------------------------------------
// Manufacturer detail card (extracted, Supply Chain pass)
// ------------------------------------------------------------
// This is the exact detail rendering the Manufacturer tab has always
// used — the full-profile card when one exists (Nestle only) and the
// riskDirectory-summary fallback otherwise — lifted verbatim into a
// component so the Supply Chain graph can expand a manufacturer node
// into the SAME card instead of duplicating it. Nothing about what it
// renders changed; only the two page-level setters it used to call
// inline are now an `onViewCompliance(name)` prop, and the wrapper
// classes are caller-supplied so the graph can render it inline at a
// different height than the tab's stretched two-column grid.
function ManufacturerDetailCard({ name, onViewCompliance, className = '' }) {
  const profile = FULL_PROFILE_BY_NAME[name];
  const row = ENTITIES_DATA.riskDirectory.find((e) => e.name === name);

  if (!profile && !row) return null;

  return (
    <>
      {profile ? (
        // Category-tinted detail card — same accentColor+tint
        // DemoCard mechanism Products' own detail view uses
        // (see SummaryDetail), so this single-entity profile
        // carries the same category identity its row did in
        // the list to the left, instead of a plain white card.
        <DemoCard
          accentColor={
            ENTITY_CATEGORY_MAP[profile.name]?.[0]
              ? getCategoryColor(ENTITY_CATEGORY_MAP[profile.name][0]).color
              : undefined
          }
          tint
          className={className}
        >
          <div className="flex items-center gap-4 mb-6">
            <EntityAvatar name={profile.name} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
              <p className="text-sm text-foreground-muted italic">"{profile.tagline}"</p>
            </div>
            <div className="ml-auto">
              <StatusPill status={profile.status} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <KeyValue label="Company Name" value={profile.companyName} />
            <KeyValue label="CIN" value={profile.cin} mono />
            <KeyValue label="Registered Address" value={profile.registeredAddress} />
            <KeyValue label="Industry" value={profile.industry} />
            <KeyValue
              label="Website"
              value={
                <span className="inline-flex items-center gap-1.5 text-accent">
                  <Globe className="w-3.5 h-3.5" />
                  {profile.website}
                </span>
              }
            />
          </div>
          <ScannedProductsList manufacturerName={profile.name} />
          <button
            onClick={() => onViewCompliance(profile.name)}
            className="mt-auto pt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition border-t border-white/[0.06]"
          >
            View Compliance Record
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </DemoCard>
      ) : (
        row && (
          <DemoCard
            accentColor={
              ENTITY_CATEGORY_MAP[row.name]?.[0]
                ? getCategoryColor(ENTITY_CATEGORY_MAP[row.name][0]).color
                : undefined
            }
            tint
            className={className}
          >
            <div className="flex items-center gap-4 mb-5">
              <span className={row.riskLevel === 'High Risk' ? 'rounded-full ring-2 ring-red-400 ring-offset-2' : ''}>
                <EntityAvatar name={row.name} size="lg" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">{row.name}</h2>
                <p className="text-sm text-foreground-muted">{row.role}</p>
              </div>
              <div className="ml-auto">
                <ComplianceStatusChip status={row.riskLevel} size="md" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              <StatChip
                icon={Building2}
                label="Scanned products"
                value={row.productCount}
                tone={row.riskLevel === 'High Risk' ? 'amber' : 'accent'}
              />
              <StatChip
                icon={ShieldAlert}
                label="Failed checks"
                value={row.failedChecks}
                tone={row.failedChecks > 0 ? 'amber' : 'emerald'}
              />
            </div>
            <p className="text-sm text-foreground-muted mb-4">{row.note}</p>
            <DemoCard className="!bg-white/[0.015] !shadow-none !border-white/5 !p-4">
              <p className="text-xs text-foreground-muted">
                A full company registration profile (CIN, registered address, industry, website) hasn't been
                captured for this entity — only its Entity Risk Directory summary above is available. Nestle
                India Limited is currently the only entity with a complete profile on record.
              </p>
            </DemoCard>
            <ScannedProductsList manufacturerName={row.name} />
            <button
              onClick={() => onViewCompliance(row.name)}
              className="mt-auto pt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition border-t border-white/[0.06]"
            >
              View Compliance Record
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </DemoCard>
        )
      )}
    </>
  );
}

// ============================================================
// Supply chain graph
// ============================================================
// The relationship data already exists in this codebase: every row in
// BRAND_OWNER_DIRECTORY / IMPORTER_DIRECTORY / DISTRIBUTOR_DIRECTORY
// carries a `linkedManufacturer` naming a manufacturer that also
// appears in ENTITIES_DATA.riskDirectory. buildEntityChains() below
// resolves those links and nothing else — no parallel relationship
// table is introduced, and no placeholder node is ever synthesized to
// pad a chain out to four roles.
//
// The real shape of that data (worth stating, because the layout has
// to survive it honestly): of the 17 manufacturers, 7 have a brand
// owner parent, exactly 1 (Sunrise Organic Foods Inc.) has an
// importer, exactly 1 (Nestle India Limited) has a distributor, and
// the majority have no downstream links at all. A chain is therefore
// usually 1-2 nodes, never 4 for most of them, and a manufacturer
// with no links renders as a single node with an explicit "nothing on
// record" note rather than three empty slots.

const CHAIN_STAGE_ORDER = ['Brand Owner', 'Importer', 'Distributor'];

const STAGE_ICON = {
  Manufacturer: Factory,
  'Brand Owner': Landmark,
  Importer: Ship,
  Distributor: Truck,
};

/**
 * Pure: resolves each manufacturer's real supply-chain links.
 *
 * Returns one entry per riskDirectory row, in the order given:
 *   {
 *     manufacturer,            // the riskDirectory row itself
 *     stages: [{ role, nodes }],  // Manufacturer first, then only
 *                                 // the downstream roles that
 *                                 // actually resolved to something
 *     downstreamCount,         // number of linked non-manufacturer nodes
 *   }
 *
 * Missing links are handled by omission: a role with no matching
 * `linkedManufacturer` row produces no stage at all, so a chain can be
 * 1, 2, 3 or 4 nodes long depending on what the data really holds.
 * Defaults are the real directories, but all four inputs are
 * parameters so the function stays pure and testable.
 */
function buildEntityChains(
  riskDirectory = ENTITIES_DATA.riskDirectory,
  brandOwners = BRAND_OWNER_DIRECTORY,
  importers = IMPORTER_DIRECTORY,
  distributors = DISTRIBUTOR_DIRECTORY
) {
  const directoryByRole = {
    'Brand Owner': brandOwners,
    Importer: importers,
    Distributor: distributors,
  };

  return (riskDirectory || []).map((m) => {
    const stages = [
      {
        role: 'Manufacturer',
        nodes: [
          {
            key: `manufacturer:${m.name}`,
            kind: 'manufacturer',
            name: m.name,
            // riskDirectory's own role string, which is not always
            // plain "Manufacturer" (Sunrise is "Manufacturer /
            // Importer") — shown as recorded rather than normalized.
            role: m.role,
            riskLevel: m.riskLevel,
            entity: m,
          },
        ],
      },
    ];

    CHAIN_STAGE_ORDER.forEach((role) => {
      const matches = (directoryByRole[role] || []).filter((r) => r.linkedManufacturer === m.name);
      if (matches.length === 0) return; // no link on record — no node, no placeholder
      stages.push({
        role,
        nodes: matches.map((r) => ({
          key: `${role}:${r.name}`,
          kind: 'role',
          name: r.name,
          role: r.role,
          country: r.country,
          entity: r,
        })),
      });
    });

    const downstreamCount = stages
      .slice(1)
      .reduce((sum, stage) => sum + stage.nodes.length, 0);

    return { manufacturer: m, stages, downstreamCount };
  });
}

// ============================================================
// Risk propagation over the resolved chains
// ============================================================
// What the real data supports, and what it does NOT:
//
//   - riskDirectory is the ONLY place in this dataset that carries a
//     riskLevel / failedChecks per entity, and every row in it is a
//     manufacturer (or, for Sunrise, "Manufacturer / Importer"). As of
//     the current data exactly one row is flagged — Sunrise Organic
//     Foods Inc., 2 failed checks — and the other 16 are Low Risk with
//     0 failed checks.
//   - BRAND_OWNER_DIRECTORY / IMPORTER_DIRECTORY / DISTRIBUTOR_DIRECTORY
//     rows carry NO compliance fields at all. There is no record
//     anywhere saying Meridian Organic Imports (Sunrise's importer of
//     record) failed anything. So a downstream node in a flagged chain
//     is exactly one thing and nothing more: an entity that sits
//     downstream of a flagged manufacturer. It is NOT "non-compliant",
//     NOT "at fault", NOT "implicated" — the data does not say that,
//     and neither does any string this file renders.
//
// So the flag is deliberately framed as *exposure / visibility*: which
// chains contain a flagged entity, and which entities are therefore
// worth looking at — never as a derived violation on the downstream
// entity itself.
//
// Both functions below are pure and take the directory as a parameter,
// so they re-derive from whatever the data actually holds. Nothing is
// hardcoded to Sunrise, and a dataset with zero flagged entities (or
// several) produces correct output rather than assuming a flag exists.

// Which riskLevel values count as an active flag. 'Medium Risk' is
// included because the tier exists in the app's own RISK_TIERS and
// could legitimately be populated later; it currently matches nothing.
const FLAGGED_RISK_LEVELS = ['High Risk', 'Medium Risk'];

function isFlaggedLevel(riskLevel) {
  return FLAGGED_RISK_LEVELS.includes(riskLevel);
}

/**
 * Pure: annotates chains from buildEntityChains() with risk-propagation
 * info, without mutating the input.
 *
 * Every node gains:
 *   riskRow            — that entity's own riskDirectory row, if one
 *                        exists (downstream role entities usually have
 *                        none — that's a real absence, not a zero)
 *   flaggedSelf        — this entity is itself flagged in riskDirectory
 *   downstreamOfFlagged— a flagged entity sits at an EARLIER stage of
 *                        this same chain
 *   ownFailedChecks    — number from its own row, or null when the
 *                        entity has no compliance record at all
 *
 * Every chain gains `riskFlag`: null when no node in it is flagged, or
 * { sources, downstreamExposedCount, failedChecks } when one is.
 */
function annotateChainRisk(chains, riskDirectory = ENTITIES_DATA.riskDirectory) {
  const rowByName = new Map((riskDirectory || []).map((r) => [r.name, r]));

  return (chains || []).map((chain) => {
    // Pass 1 — resolve each node's own record, stage by stage, so
    // "earlier in the chain" is a real position and not an assumption
    // about which role is upstream of which.
    const staged = chain.stages.map((stage) => ({
      role: stage.role,
      nodes: stage.nodes.map((node) => {
        const riskRow = rowByName.get(node.name) || null;
        return {
          ...node,
          riskRow,
          flaggedSelf: isFlaggedLevel(riskRow?.riskLevel ?? node.riskLevel),
          ownFailedChecks: riskRow ? riskRow.failedChecks ?? 0 : null,
        };
      }),
    }));

    // Pass 2 — propagate downstream only, never upstream. A flagged
    // node marks the nodes AFTER it, so a hypothetical flagged
    // distributor would not retro-tag its own manufacturer.
    const sources = [];
    let seenFlaggedUpstream = false;
    const stages = staged.map((stage) => {
      const nodes = stage.nodes.map((node) => ({
        ...node,
        downstreamOfFlagged: seenFlaggedUpstream,
      }));
      stage.nodes.forEach((node) => {
        if (node.flaggedSelf) {
          sources.push({
            name: node.name,
            role: node.role,
            riskLevel: node.riskRow?.riskLevel ?? node.riskLevel,
            failedChecks: node.ownFailedChecks ?? 0,
            note: node.riskRow?.note || '',
          });
        }
      });
      if (stage.nodes.some((n) => n.flaggedSelf)) seenFlaggedUpstream = true;
      return { role: stage.role, nodes };
    });

    const downstreamExposedCount = stages.reduce(
      (sum, stage) => sum + stage.nodes.filter((n) => n.downstreamOfFlagged).length,
      0
    );

    return {
      ...chain,
      stages,
      riskFlag:
        sources.length > 0
          ? {
              sources,
              downstreamExposedCount,
              failedChecks: sources.reduce((s, x) => s + (x.failedChecks || 0), 0),
            }
          : null,
    };
  });
}

/**
 * Pure: real counts over the annotated chains, for the summary panel.
 * Returns zeros (not a fabricated flag) when nothing is flagged.
 */
function summarizeChainRisk(chains) {
  const list = chains || [];
  const flaggedChains = list.filter((c) => c.riskFlag);

  // Distinct flagged entities — a single entity could in principle be
  // the source in more than one chain, so names are de-duplicated
  // before being counted or listed.
  const sourceNames = Array.from(
    new Set(flaggedChains.flatMap((c) => c.riskFlag.sources.map((s) => s.name)))
  );

  return {
    totalChains: list.length,
    flaggedChains: flaggedChains.length,
    sourceNames,
    failedChecks: Array.from(
      new Map(
        flaggedChains.flatMap((c) => c.riskFlag.sources.map((s) => [s.name, s]))
      ).values()
    ).reduce((sum, s) => sum + (s.failedChecks || 0), 0),
    exposedDownstreamEntities: flaggedChains.reduce(
      (sum, c) => sum + c.riskFlag.downstreamExposedCount,
      0
    ),
  };
}

// The one sentence that appears on every downstream node in a flagged
// chain. Written once, here, so the wording can't drift into an
// accusation in one place while staying careful in another. When the
// downstream entity *does* have its own failed checks on record, the
// caller says so from that entity's real row instead of using this.
const DOWNSTREAM_EXPOSURE_LABEL =
  'Downstream of a flagged manufacturer — no violations recorded against this entity directly.';

// One node in the chain. Clicking (or pressing Enter/Space on) it
// selects that entity: the whole chain it belongs to lights up and its
// detail panel opens below the chain — the EntityRecordPanel fields
// plus the page's existing ManufacturerDetailCard / RoleEntityCard —
// rather than re-describing the entity here.
//
// Three independent visual states, deliberately kept separate:
//   selected        — this exact node was clicked (accent, strongest)
//   inSelectedChain — a different node in the same chain was clicked,
//                     so this one is on the traced path (accent, faint)
//   flagged/exposed — the risk treatment from the previous pass, which
//                     still wins over the faint path tint so selecting
//                     a chain can never visually launder a flag away
function ChainNode({ node, selected, inSelectedChain, onToggle }) {
  const Icon = STAGE_ICON[node.kind === 'manufacturer' ? 'Manufacturer' : node.role] || Building2;
  // Flagged in riskDirectory in its own right (red), vs. merely sitting
  // downstream of one that is (amber). The two are visually distinct on
  // purpose — conflating them is exactly the false implication this
  // whole feature is trying not to make.
  const isFlagged = node.flaggedSelf ?? node.riskLevel === 'High Risk';
  const isExposed = !isFlagged && node.downstreamOfFlagged;
  // Only ever true if this entity has a real riskDirectory row of its
  // own showing failed checks — never inferred from the chain.
  const hasOwnFailures = (node.ownFailedChecks ?? 0) > 0;

  const tone = selected
    ? 'border-accent/60 bg-accent/[0.12] ring-1 ring-accent/30'
    : isFlagged
    ? `border-red-500/30 bg-red-500/[0.05] hover:bg-red-500/[0.09] ${
        inSelectedChain ? 'ring-1 ring-accent/20' : ''
      }`
    : isExposed
    ? `border-amber-500/25 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] ${
        inSelectedChain ? 'ring-1 ring-accent/20' : ''
      }`
    : inSelectedChain
    ? 'border-accent/25 bg-accent/[0.05] hover:bg-accent/[0.08]'
    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.16]';

  return (
    <button
      type="button"
      // A <button> is already focusable and already fires onClick for
      // Enter and Space. tabIndex and the explicit key handler are
      // stated anyway so the behaviour is guaranteed by this component
      // rather than inherited, and so Space can have its page-scroll
      // default suppressed inside a scrolling graph.
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={selected}
      aria-pressed={selected}
      aria-label={`${node.name} — ${node.role}. ${selected ? 'Selected' : 'Select'} to trace this chain and view details.`}
      title={isExposed ? DOWNSTREAM_EXPOSURE_LABEL : undefined}
      className={`w-[190px] shrink-0 text-left rounded-2xl border px-3.5 py-3 transition outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${tone}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
        <span className="text-[10px] uppercase tracking-wide text-foreground-muted font-semibold truncate">
          {node.role}
        </span>
      </div>
      <div className="flex items-start gap-2.5">
        <span className={isFlagged ? 'rounded-full ring-2 ring-red-400 shrink-0' : 'shrink-0'}>
          <EntityAvatar name={node.name} size="sm" />
        </span>
        <p className="text-xs font-semibold text-foreground leading-snug" title={node.name}>
          {truncateAtWord(node.name, 34)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2.5">
        {node.riskLevel ? (
          <ComplianceStatusChip status={node.riskLevel} />
        ) : (
          <span className="text-[10px] text-foreground-muted truncate">{node.country}</span>
        )}
        <span className="text-[10px] font-semibold text-accent shrink-0">
          {selected ? 'Hide' : 'Details'}
        </span>
      </div>

      {isExposed && (
        // Deliberately spelled out in full on the node rather than
        // reduced to a bare "At risk" chip: a two-word badge is exactly
        // how a viewer would come away believing this entity did
        // something wrong. The clause after the dash is the point.
        <p className="mt-2.5 pt-2.5 border-t border-amber-500/15 text-[10px] leading-relaxed text-amber-200/75 flex gap-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-px text-amber-400/80" />
          <span>
            {hasOwnFailures
              ? `Downstream of a flagged manufacturer. This entity also has ${node.ownFailedChecks} failed check${
                  node.ownFailedChecks === 1 ? '' : 's'
                } recorded against it directly.`
              : DOWNSTREAM_EXPOSURE_LABEL}
          </span>
        </p>
      )}
    </button>
  );
}

// Connector between two stages. Styled divs rather than an SVG
// overlay: at this scale (1-2 nodes per stage) a flow arrow between
// columns carries the relationship without needing measured
// coordinates, and it reflows correctly when the row scrolls
// horizontally on a narrow screen.
// `carriesRisk` is true only for connectors that lead AWAY from a
// flagged node — i.e. the segments along which exposure actually
// travels. Connectors in an unflagged chain, and any segment sitting
// before the flagged node, keep the neutral styling.
// `highlighted` is true for every connector in the currently selected
// chain, so the whole path a user clicked reads as one traced route.
// Risk styling wins where both apply: a highlighted segment that also
// carries risk stays amber rather than being repainted accent.
function ChainConnector({ fanOut, carriesRisk, highlighted }) {
  const lineTone = carriesRisk
    ? 'from-amber-500/20 to-amber-400/70'
    : highlighted
    ? 'from-accent/20 to-accent/70'
    : 'from-white/5 to-white/25';
  const arrowTone = carriesRisk
    ? 'text-amber-400/90'
    : highlighted
    ? 'text-accent'
    : 'text-foreground-muted/70';
  const bracketTone = carriesRisk
    ? 'border-amber-400/40'
    : highlighted
    ? 'border-accent/40'
    : 'border-white/15';

  return (
    <div className="flex items-center shrink-0 px-1.5" aria-hidden="true">
      <span className={`h-px w-5 bg-gradient-to-r ${lineTone}`} />
      <ArrowRight className={`w-4 h-4 -ml-0.5 ${arrowTone}`} />
      {fanOut && (
        // Two or more nodes on the far side of this connector — the
        // bracket makes the one-to-many link readable instead of the
        // arrow appearing to point at only the first node.
        <span className={`w-2 self-stretch border-y border-r rounded-r-md -ml-0.5 ${bracketTone}`} />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Selected-entity record panel
// ------------------------------------------------------------
// The raw fields the selected node's own record actually carries,
// listed above the page's existing detail card rather than instead of
// it. Every row below is conditional on the field really being present
// on that record: a manufacturer row has role/productCount/failedChecks/
// riskLevel/note but NO country or linkedManufacturer, and a brand
// owner / importer / distributor row has role/country/linkedManufacturer/
// productCount/note but no risk fields of its own. Rendering a dash or
// an "N/A" for the absent half would invent a field the data doesn't
// model; omitting it is the honest shape. `productCount` is shown as
// the record's own stated figure, labelled as such, because it is a
// field on the row — separate from the live PRODUCTS_CATALOG count the
// cards below derive.
function EntityRecordPanel({ node }) {
  const record = node.entity || {};
  const riskRow = node.riskRow || null;

  const rows = [];
  if (record.role) rows.push({ label: 'Role on record', value: record.role });
  if (record.country) rows.push({ label: 'Country', value: record.country });
  if (record.linkedManufacturer)
    rows.push({ label: 'Linked manufacturer', value: record.linkedManufacturer });
  if (typeof record.productCount === 'number')
    rows.push({
      label: 'Products on record',
      value: `${record.productCount} scanned product${record.productCount === 1 ? '' : 's'}`,
    });
  if (riskRow?.riskLevel) rows.push({ label: 'Risk level', value: riskRow.riskLevel });
  if (typeof riskRow?.failedChecks === 'number')
    rows.push({
      label: 'Failed checks',
      value: `${riskRow.failedChecks} failed check${riskRow.failedChecks === 1 ? '' : 's'}`,
    });

  return (
    <DemoCard className="!p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="text-sm font-bold text-foreground">Record for {truncateAtWord(node.name, 44)}</p>
        {riskRow?.riskLevel && <ComplianceStatusChip status={riskRow.riskLevel} />}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <KeyValue key={r.label} label={r.label} value={r.value} />
        ))}
      </div>

      {record.note && (
        <p className="text-xs text-foreground-muted leading-relaxed mt-4 pt-3 border-t border-white/[0.06]">
          {record.note}
        </p>
      )}

      {!riskRow && (
        // Stated rather than left blank: the absence of risk fields on
        // a brand owner / importer / distributor row is a real property
        // of this dataset, not a loading gap, and saying so is what
        // stops an empty space from reading as "clean" or "unknown".
        <p className="text-[11px] text-foreground-muted leading-relaxed mt-3 flex gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            No compliance record exists for this entity in the risk directory — checks are recorded
            per manufacturer, so there is no risk level or failed-check count to show here.
          </span>
        </p>
      )}
    </DemoCard>
  );
}

function EntityChainRow({
  chain,
  expandedNodeKey,
  chainSelected,
  dimmed,
  onToggleNode,
  onViewCompliance,
  onViewManufacturer,
}) {
  const { manufacturer, stages, downstreamCount, riskFlag } = chain;
  const expandedNode = stages
    .flatMap((stage) => stage.nodes)
    .find((n) => n.key === expandedNodeKey);

  // Index of the first stage containing a flagged node — every
  // connector after it is the path the exposure travels along.
  const flaggedStageIndex = stages.findIndex((s) => s.nodes.some((n) => n.flaggedSelf));

  return (
    <DemoCard
      className={`!p-4 transition ${
        chainSelected
          ? '!border-accent/40 ring-1 ring-accent/20'
          : riskFlag
          ? '!border-amber-500/25'
          : ''
      } ${
        // A light dim, not a hide: the other chains stay legible and
        // clickable so the graph can still be scanned while one path is
        // traced. Hover lifts it back to full opacity.
        dimmed ? 'opacity-50 hover:opacity-100' : ''
      }`}
    >
      {riskFlag && (
        <div className="flex items-start gap-2 mb-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-amber-100/85">
            <span className="font-semibold">Risk present upstream in this chain.</span>{' '}
            {riskFlag.sources
              .map(
                (s) =>
                  `${s.name} is ${s.riskLevel} with ${s.failedChecks} failed check${
                    s.failedChecks === 1 ? '' : 's'
                  } on record`
              )
              .join('; ')}
            .{' '}
            {riskFlag.downstreamExposedCount > 0
              ? `${riskFlag.downstreamExposedCount} linked ${
                  riskFlag.downstreamExposedCount === 1 ? 'entity is' : 'entities are'
                } downstream of it. Being downstream is exposure to review, not a finding against those entities.`
              : 'No entity is linked downstream of it, so nothing else in this chain is exposed.'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="text-xs text-foreground-muted">
          <span className="text-foreground font-medium">{truncateAtWord(manufacturer.name, 44)}</span>
          {downstreamCount > 0 ? (
            <>
              {' '}· {downstreamCount} linked {downstreamCount === 1 ? 'entity' : 'entities'} on record
            </>
          ) : (
            ' · no downstream links on record'
          )}
        </p>
        <span className="text-[11px] text-foreground-muted">
          {productsForManufacturer(manufacturer.name).length} scanned product
          {productsForManufacturer(manufacturer.name).length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex items-stretch overflow-x-auto pb-1 -mx-1 px-1">
        {stages.map((stage, i) => (
          <div key={stage.role} className="flex items-stretch">
            {i > 0 && (
              <ChainConnector
                fanOut={stage.nodes.length > 1}
                carriesRisk={flaggedStageIndex !== -1 && i > flaggedStageIndex}
                highlighted={chainSelected}
              />
            )}
            <div className="flex flex-col justify-center gap-2">
              {stage.nodes.map((node) => (
                <ChainNode
                  key={node.key}
                  node={node}
                  selected={node.key === expandedNodeKey}
                  inSelectedChain={chainSelected && node.key !== expandedNodeKey}
                  onToggle={() => onToggleNode(chain.manufacturer.name, node.key)}
                />
              ))}
            </div>
          </div>
        ))}

        {stages.length === 1 && (
          // Honest empty state: this manufacturer genuinely has no
          // brand owner, importer or distributor row pointing at it.
          // No greyed-out placeholder nodes — they would imply three
          // records exist that simply aren't loaded.
          <div className="flex items-center ml-3 text-[11px] text-foreground-muted max-w-[280px]">
            <Unlink className="w-3.5 h-3.5 mr-2 shrink-0" />
            No brand owner, importer or distributor is linked to this manufacturer in the directories.
          </div>
        )}
      </div>

      {expandedNode && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          {expandedNode.downstreamOfFlagged && (expandedNode.ownFailedChecks ?? 0) === 0 && (
            // Repeated here because the expanded card is where someone
            // stops to actually read about the entity — the point where
            // an unqualified amber highlight would be most likely to be
            // misread as a finding against it.
            <p className="mb-4 text-[11px] leading-relaxed text-amber-100/80 flex gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px text-amber-400/80" />
              <span>
                {DOWNSTREAM_EXPOSURE_LABEL} It is highlighted so the link is visible, not because any
                check has failed for {truncateAtWord(expandedNode.name, 44)}.
              </span>
            </p>
          )}
          <EntityRecordPanel node={expandedNode} />
          {expandedNode.kind === 'manufacturer' ? (
            <ManufacturerDetailCard name={expandedNode.name} onViewCompliance={onViewCompliance} />
          ) : (
            <RoleEntityCard entity={expandedNode.entity} onViewManufacturer={onViewManufacturer} />
          )}
        </div>
      )}
    </DemoCard>
  );
}

function SupplyChainGraph({ chains, onViewCompliance, onViewManufacturer }) {
  // 'all' (default) shows every chain in one scrollable column;
  // 'linked' narrows to the ones that actually have downstream nodes;
  // any other value is a single manufacturer name.
  const [scope, setScope] = useState('all');
  // One selection for the whole graph: which chain is traced, and which
  // node inside it is expanded. Held as a pair rather than a single
  // node key so the highlight survives chains that could one day share
  // a node, and so "is this chain selected" is a direct comparison.
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  const linkedChains = chains.filter((c) => c.downstreamCount > 0);
  const flaggedChains = chains.filter((c) => c.riskFlag);

  // Counted fresh off the same annotated chains the rows render from,
  // so the panel and the graph can never disagree.
  const riskSummary = summarizeChainRisk(chains);
  const hasFlags = riskSummary.flaggedChains > 0;

  const scoped =
    scope === 'all'
      ? chains
      : scope === 'linked'
      ? linkedChains
      : scope === 'flagged'
      ? flaggedChains
      : chains.filter((c) => c.manufacturer.name === scope);

  // Real substring match against the actual entity names in each
  // resolved chain — the manufacturer AND every linked brand owner,
  // importer and distributor node — so searching "Meridian" or
  // "Nestlé" finds the chain those entities really appear in, not just
  // chains whose manufacturer happens to be named that.
  const trimmedQuery = query.trim().toLowerCase();
  const visible = trimmedQuery
    ? scoped.filter((c) =>
        c.stages.some((s) => s.nodes.some((n) => n.name.toLowerCase().includes(trimmedQuery)))
      )
    : scoped;

  // Real totals, counted off the resolved chains rather than
  // hardcoded, so they stay correct if the directories change.
  const roleTotals = CHAIN_STAGE_ORDER.map((role) => ({
    role,
    count: chains.reduce(
      (sum, c) => sum + (c.stages.find((s) => s.role === role)?.nodes.length || 0),
      0
    ),
  }));

  return (
    <div className="space-y-4">
      {/* Risk propagation summary. Every number here comes from the
          pass over riskDirectory + the resolved chains above — there is
          no sentence in this block that survives the data changing. */}
      <DemoCard className={`!p-4 ${hasFlags ? '!border-amber-500/25' : ''}`}>
        <div className="flex items-start gap-3">
          {hasFlags ? (
            <IconChip icon={ShieldAlert} tone="amber" size="sm" />
          ) : (
            <IconChip icon={ShieldCheck} tone="emerald" size="sm" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              {hasFlags
                ? `${riskSummary.flaggedChains} of ${riskSummary.totalChains} supply chain${
                    riskSummary.totalChains === 1 ? '' : 's'
                  } ${riskSummary.flaggedChains === 1 ? 'has' : 'have'} an active risk flag`
                : `No active risk flags in current chains — all ${riskSummary.totalChains} clear`}
            </p>

            {hasFlags ? (
              <>
                <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                  Flagged by{' '}
                  <span className="text-foreground font-medium">
                    {riskSummary.sourceNames.join(', ')}
                  </span>{' '}
                  · {riskSummary.failedChecks} failed check
                  {riskSummary.failedChecks === 1 ? '' : 's'} on record ·{' '}
                  {riskSummary.exposedDownstreamEntities} downstream{' '}
                  {riskSummary.exposedDownstreamEntities === 1 ? 'entity' : 'entities'} in view
                </p>
                <p className="text-[11px] text-amber-100/70 mt-2 leading-relaxed max-w-3xl">
                  A flag marks the chain, not every company in it. The failed checks belong to the
                  flagged {riskSummary.sourceNames.length === 1 ? 'entity' : 'entities'} above;
                  brand owners, importers and distributors shown downstream have no violations
                  recorded against them in this data and are highlighted only so the connection is
                  visible.
                </p>
              </>
            ) : (
              <p className="text-xs text-foreground-muted mt-1 leading-relaxed max-w-3xl">
                No entity in any resolved chain carries a High or Medium Risk level in the risk
                directory right now, so nothing downstream is flagged for exposure either.
              </p>
            )}
          </div>
        </div>
      </DemoCard>

      <DemoCard className="!p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Share2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">Supply chain links</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              {linkedChains.length} of {chains.length} manufacturers have a linked entity on record ·{' '}
              {roleTotals.map((r) => `${r.count} ${r.role.toLowerCase()}${r.count === 1 ? '' : 's'}`).join(' · ')}
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-foreground-muted">Show</span>
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setSelected(null);
            }}
            className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40 transition max-w-[18rem]"
          >
            <option value="all">All chains ({chains.length})</option>
            <option value="linked">Only chains with links ({linkedChains.length})</option>
            {/* Offered only when there is something to filter to — an
                always-present "(0)" option would imply a flag exists. */}
            {flaggedChains.length > 0 && (
              <option value="flagged">Only flagged chains ({flaggedChains.length})</option>
            )}
            {chains.map((c) => (
              <option key={c.manufacturer.name} value={c.manufacturer.name}>
                {c.manufacturer.name}
                {c.downstreamCount > 0 ? ` (${c.downstreamCount} linked)` : ' (no links)'}
              </option>
            ))}
          </select>
        </label>
      </DemoCard>

      {/* Entity name search. Filters the chain list only — it never
          alters a chain's contents, so a matched chain still shows all
          of its nodes, including the ones that didn't match. */}
      <DemoCard className="!p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entity name — manufacturer, brand owner, importer or distributor"
              aria-label="Filter supply chains by entity name"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-foreground-muted/70 outline-none focus:border-accent/40 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-foreground-muted shrink-0">
            {trimmedQuery
              ? `${visible.length} of ${scoped.length} chain${scoped.length === 1 ? '' : 's'} contain a matching entity`
              : `Showing ${scoped.length} chain${scoped.length === 1 ? '' : 's'} · click any node to trace its chain`}
          </p>
        </div>
      </DemoCard>

      {visible.length === 0 ? (
        <DemoCard className="text-center py-10 text-foreground-muted text-sm">
          {trimmedQuery
            ? `No entity name in the current chains contains “${query.trim()}”.`
            : 'No chain matches that selection.'}
        </DemoCard>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 -mr-1">
          {visible.map((chain) => {
            const chainSelected = selected?.chainKey === chain.manufacturer.name;
            return (
              <EntityChainRow
                key={chain.manufacturer.name}
                chain={chain}
                expandedNodeKey={chainSelected ? selected.nodeKey : null}
                chainSelected={chainSelected}
                // Only ever dim while something is actually selected —
                // with no selection every chain renders at full strength.
                dimmed={Boolean(selected) && !chainSelected}
                onToggleNode={(chainKey, nodeKey) =>
                  setSelected((prev) =>
                    prev && prev.chainKey === chainKey && prev.nodeKey === nodeKey
                      ? null
                      : { chainKey, nodeKey }
                  )
                }
                onViewCompliance={onViewCompliance}
                onViewManufacturer={onViewManufacturer}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Risk tiers rendered in this fixed order, worst first, so the
// riskiest entities are never buried below a long "Low Risk" list.
const RISK_TIERS = ['High Risk', 'Medium Risk', 'Low Risk'];

const TIER_STYLES = {
  'High Risk': { border: 'border-red-500/40', chipTone: 'red', icon: ShieldAlert },
  'Medium Risk': { border: 'border-amber-500/30', chipTone: 'amber', icon: AlertTriangle },
  'Low Risk': { border: 'border-emerald-500/20', chipTone: 'emerald', icon: CheckCircle2 },
};

// Ladder zone centers, as a percentage along the gradient track. These
// are fixed positions for the three *tiers* — not a per-entity score.
// riskDirectory only carries a tier label per entity (Low/Medium/High),
// never a continuous risk number, so a marker's horizontal position
// reflects which tier it belongs to, not a fabricated in-tier ranking.
const TIER_POSITION_PCT = { 'Low Risk': 14, 'Medium Risk': 50, 'High Risk': 86 };
const TIER_DOT_COLOR = { 'Low Risk': '#10b981', 'Medium Risk': '#f59e0b', 'High Risk': '#ef4444' };

// ------------------------------------------------------------
// Risk Spectrum box-model constants (Part 2 overlap fix)
// ------------------------------------------------------------
// Real, derived numbers — not guessed pixel offsets — computed from
// the track's actual rendered height and each marker's actual
// rendered size, both fixed by Tailwind classes elsewhere in this
// file (`h-2.5` = 0.625rem = 10px, `w-2 h-2` = 8px, `w-4 h-4` = 16px;
// this project's Tailwind config doesn't override the default 16px
// root font-size or spacing scale — see Part 1's verification). Kept
// as one named source of truth so the track wrapper and every marker
// below reference the same numbers instead of restating them.
const TRACK_HEIGHT_PX = 10; // h-2.5
// Empty-zone dot (`w-2 h-2` = 8px) vertically centered on the track:
// top offset = (track height − dot height) / 2 = (10 − 8) / 2.
const EMPTY_DOT_TOP_PX = (TRACK_HEIGHT_PX - 8) / 2;
// Cluster dot (`w-4 h-4` = 16px) vertically centered on the track:
// top offset = (track height − dot height) / 2 = (10 − 16) / 2 — the
// dot is taller than the track, so this is legitimately negative.
const CLUSTER_DOT_TOP_PX = (TRACK_HEIGHT_PX - 16) / 2;
// Fixed visual gap between the High Risk pin's bottom edge and the
// track's top edge, applied via `bottom: calc(100% + this)` against
// the track wrapper — a real anchor to the track's own edge, not an
// offset guessed against an unrelated ancestor.
const MARKER_TRACK_GAP_PX = 10;

export default function DemoEntities() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [relatedTab, setRelatedTab] = useState(ENTITIES_DATA.relatedEntityTabs[0]);
  const d = ENTITIES_DATA;

  const sortedEntities = useMemo(() => sortEntitiesByRisk(d.riskDirectory), [d.riskDirectory]);

  // Resolved once per render from the real directories — the Supply
  // Chain tab renders this, nothing else recomputes links.
  // ...then annotated with risk propagation from the same directory,
  // so the graph's flags and its summary panel are derived from one
  // pass over the real data rather than described separately.
  const entityChains = useMemo(
    () => annotateChainRisk(buildEntityChains(d.riskDirectory), d.riskDirectory),
    [d.riskDirectory]
  );

  // Two independent selections — one per tab — each defaulting to
  // the flagged entity so Sunrise Organic Foods Inc. is the first
  // thing visible on either tab, not just findable after a click.
  const [selectedManufacturer, setSelectedManufacturer] = useState(sortedEntities[0]?.name);
  const [selectedComplianceEntity, setSelectedComplianceEntity] = useState(sortedEntities[0]?.name);

  // Single jump-to-compliance path, shared by the Manufacturer tab's
  // detail card and by the Supply Chain graph's expanded nodes.
  function handleViewCompliance(name) {
    setSelectedComplianceEntity(name);
    setActiveTab('Compliance Records');
  }

  // Jump from a Supply Chain node to that manufacturer on the
  // Manufacturer tab — the same selection the role directories'
  // "View Manufacturer" link already drives.
  function handleViewManufacturer(name) {
    setSelectedManufacturer(name);
    setRelatedTab('Manufacturer');
    setActiveTab('Manufacturer');
  }

  const complianceRow = d.riskDirectory.find((e) => e.name === selectedComplianceEntity);
  const complianceDetail = COMPLIANCE_DETAIL_BY_NAME[selectedComplianceEntity];

  return (
    <>
      <Navbar />
      <DemoPage>
        <PageHeader icon={Building2} label="Entities" page="Entities" code={DEMO_PRODUCT.code} />

        <div>
          <Eyebrow color="blue">Network / Cached Result</Eyebrow>
          <h1 className="text-2xl font-bold text-foreground">Entities</h1>
          <p className="text-sm text-foreground-muted mt-1">Organizations connected to your scanned products.</p>
        </div>

        <TabRow tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'Manufacturer' && (
          <div className="space-y-6">
            <TabRow tabs={d.relatedEntityTabs} active={relatedTab} onChange={setRelatedTab} />

            {relatedTab === 'Manufacturer' ? (
              <div className="grid lg:grid-cols-[384px_1fr] gap-6 items-stretch">
                <DemoCard className="h-full flex flex-col">
                  <SectionTitle sub={`${d.riskDirectory.length} manufacturers/importers across every scanned product`}>
                    All Entities
                  </SectionTitle>
                  <div className="flex-1 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1 -mr-1">
                    <EntityBrowserList
                      entities={sortedEntities}
                      selectedName={selectedManufacturer}
                      onSelect={setSelectedManufacturer}
                    />
                  </div>
                </DemoCard>

                <ManufacturerDetailCard
                  name={selectedManufacturer}
                  onViewCompliance={handleViewCompliance}
                  className="h-full flex flex-col"
                />
              </div>
            ) : (
              <RoleDirectoryList
                role={relatedTab}
                directory={
                  relatedTab === 'Brand Owner'
                    ? d.brandOwnerDirectory
                    : relatedTab === 'Importer (if any)'
                    ? d.importerDirectory
                    : relatedTab === 'Distributor'
                    ? d.distributorDirectory
                    : []
                }
                onViewManufacturer={(name) => {
                  setSelectedManufacturer(name);
                  setRelatedTab('Manufacturer');
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'Supply Chain' && (
          <SupplyChainGraph
            chains={entityChains}
            onViewCompliance={handleViewCompliance}
            onViewManufacturer={handleViewManufacturer}
          />
        )}

        {activeTab === 'Compliance Records' && (
          <div className="grid lg:grid-cols-[384px_1fr] gap-6 items-stretch">
            <DemoCard className="h-full flex flex-col">
              <SectionTitle sub="Select an entity to see its compliance record">All Entities</SectionTitle>
              <div className="flex-1 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1 -mr-1">
                <EntityBrowserList
                  entities={sortedEntities}
                  selectedName={selectedComplianceEntity}
                  onSelect={setSelectedComplianceEntity}
                />
              </div>
            </DemoCard>

            <div className="flex flex-col gap-6 h-full">
              {complianceRow && (
                // Same category-tinted treatment as the Manufacturer tab's
                // header for this entity, so the two tabs' "selected
                // entity" headers feel like the same visual language.
                <DemoCard
                  accentColor={
                    ENTITY_CATEGORY_MAP[complianceRow.name]?.[0]
                      ? getCategoryColor(ENTITY_CATEGORY_MAP[complianceRow.name][0]).color
                      : undefined
                  }
                  tint
                >
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={complianceRow.riskLevel === 'High Risk' ? 'rounded-full ring-2 ring-red-400 ring-offset-2' : ''}
                      >
                        <EntityAvatar name={complianceRow.name} size="md" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{complianceRow.name}</h2>
                        <p className="text-sm text-foreground-muted">{complianceRow.role}</p>
                      </div>
                    </div>
                    <StatusPill status={complianceDetail ? complianceDetail.data.status ?? complianceRow.riskLevel : complianceRow.riskLevel} />
                  </div>
                </DemoCard>
              )}

              {complianceDetail?.kind === 'checklist' && (
                <DemoCard className="flex-1 flex flex-col">
                  <SectionTitle sub={complianceDetail.data.summary}>Compliance Checklist</SectionTitle>
                  <ComplianceHistoryRail records={complianceDetail.data.records} />
                  <ScannedProductsList manufacturerName={complianceDetail.data.entity} />
                  <button
                    onClick={() => {
                      setSelectedManufacturer(complianceDetail.data.entity);
                      setActiveTab('Manufacturer');
                    }}
                    className="mt-auto pt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition border-t border-white/[0.06]"
                  >
                    View Manufacturer Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </DemoCard>
              )}

              {complianceDetail?.kind === 'findings' && (
                <div className="flex-1 flex flex-col gap-6">
                  <DemoCard>
                    <SectionTitle sub="Per-requirement outcome from this entity's scanned product — the same findings used on Check Compliance.">
                      Findings
                    </SectionTitle>
                    <ComplianceSummaryStrip findings={complianceDetail.data.findings} />
                    <FindingsLedger findings={complianceDetail.data.findings} violations={complianceDetail.data.violations} />
                  </DemoCard>
                  <div>
                    <SectionTitle sub="Why each check failed, the regulatory basis, and how to fix it.">Failed Checks</SectionTitle>
                    <div className="mt-3">
                      <ViolationsPanel
                        violations={complianceDetail.data.violations}
                        regulatoryReferences={complianceDetail.data.regulatoryReferences}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedManufacturer(complianceDetail.data.product.manufacturer);
                      setActiveTab('Manufacturer');
                    }}
                    className="mt-auto pt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition border-t border-white/[0.06]"
                  >
                    View Manufacturer Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {complianceRow && !complianceDetail && (
                <DemoCard className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <IconChip icon={FileCheck2} tone={complianceRow.failedChecks > 0 ? 'amber' : 'emerald'} />
                    <SectionTitle>Compliance Summary</SectionTitle>
                  </div>
                  <p className="text-sm text-foreground mb-3">{complianceRow.note}</p>
                  <p className="text-xs text-foreground-muted">
                    No detailed per-check compliance history has been digitized for this entity — this summary (
                    {complianceRow.productCount} scanned product{complianceRow.productCount === 1 ? '' : 's'},{' '}
                    {complianceRow.failedChecks} failed check{complianceRow.failedChecks === 1 ? '' : 's'}) is derived
                    directly from the Entity Risk Directory, the same source used on the Risk Overview tab.
                  </p>
                  <ScannedProductsList manufacturerName={complianceRow.name} />
                  <button
                    onClick={() => {
                      setSelectedManufacturer(complianceRow.name);
                      setActiveTab('Manufacturer');
                    }}
                    className="mt-auto pt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition border-t border-white/[0.06]"
                  >
                    View Manufacturer Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </DemoCard>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Risk Overview' && (
          <div className="space-y-6">
            {/* Directory summary — same elevation-elevated treatment
                Check Compliance's own tab-opening summary cards use, so
                this doesn't read as a flatter beat before the richly
                treated Risk Spectrum/High Risk cards right below it. */}
            <DemoCard className="elevation-elevated">
              <SectionTitle sub="Manufacturers and importers across every scanned product, plotted by risk level">
                Entity Risk Directory
              </SectionTitle>
              <div className="flex flex-wrap gap-3 mt-1">
                {RISK_TIERS.map((tier) => {
                  const count = d.riskDirectory.filter((e) => e.riskLevel === tier).length;
                  return (
                    <span key={tier} className="text-xs text-foreground-muted">
                      <span className="text-foreground font-semibold">{count}</span> {tier}
                    </span>
                  );
                })}
              </div>
            </DemoCard>

            {/* Risk Spectrum — a single gradient ladder (green → amber →
                red) replacing the three stacked card groups. Every
                entity's horizontal position is its *tier's* fixed zone
                (see TIER_POSITION_PCT) since riskDirectory only carries
                a tier label, never a per-entity numeric score — plotting
                anything more granular than tier would be inventing data.
                Within a tier, entities cluster at that same x position;
                the *visual weight* given to that cluster (small muted
                dot-stack for Low, one large alert pin for High) is what
                carries the real severity signal. */}
            <RiskLadder entities={d.riskDirectory} />

            {/* High Risk gets the distinct alert treatment: it's the
                only tier where the data itself is specific (named
                failed checks on a named entity, not a generic label),
                so this echoes Part 4's violation-card seriousness
                rather than reusing the same card shape as the calmer
                tiers below. */}
            {d.riskDirectory
              .filter((e) => e.riskLevel === 'High Risk')
              .map((e) => (
                <HighRiskAlertCard key={e.name} entity={e} />
              ))}

            {/* Medium Risk — none in the current data, but kept as a
                real conditional branch (not hidden) so a future entity
                landing in this tier gets a genuine mid-weight treatment
                instead of silently falling into the Low Risk group. */}
            {d.riskDirectory.some((e) => e.riskLevel === 'Medium Risk') && (
              <MidRiskGroup entities={d.riskDirectory.filter((e) => e.riskLevel === 'Medium Risk')} />
            )}

            {/* Low Risk — the majority (4 of 5) and, per-entity, the
                least noteworthy: 0 failed checks, an identical generic
                note. Giving each its own full card would imply there's
                something distinct to say about each; there isn't, so
                this is one compact, calm group instead of four repeated
                "nothing happened here" cards. */}
            {d.riskDirectory.some((e) => e.riskLevel === 'Low Risk') && (
              <LowRiskGroup entities={d.riskDirectory.filter((e) => e.riskLevel === 'Low Risk')} />
            )}

            <DemoCard>
              <SectionTitle>Risk Methodology</SectionTitle>
              <p className="text-sm text-foreground flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                {d.riskInsight}
              </p>
            </DemoCard>
          </div>
        )}
      </DemoPage>
    </>
  );
}

// ------------------------------------------------------------
// Compliance history rail — the same rail + circular icon node +
// card visual language as Seller Verification's
// ComplianceActivityTimeline (itself echoing Rewards' redemption
// history), applied to an entity's compliance checklist. Unlike
// those two, ENTITIES_DATA.complianceRecord.records carries no date
// field per entry — it's a snapshot checklist, not a dated history —
// so this deliberately omits a date line rather than inventing one.
// ------------------------------------------------------------
function ComplianceHistoryRail({ records }) {
  return (
    <div>
      {records.map((r, i) => {
        const isLast = i === records.length - 1;
        const negative = /fail|non-?compliant|violation|rejected/i.test(r.status);
        return (
          <div
            key={r.name}
            className="relative flex gap-4"
            style={{ paddingBottom: isLast ? 0 : '1.1rem' }}
          >
            {!isLast && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-white/10" aria-hidden="true" />}
            <span
              className={`relative z-10 w-10 h-10 rounded-full bg-card border-2 flex items-center justify-center shrink-0 shadow-sm ${
                negative ? 'border-red-500/40 shadow-red-500/10' : 'border-emerald-500/30 shadow-emerald-500/10'
              }`}
            >
              {negative ? <AlertTriangle className="w-4 h-4 text-red-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            </span>
            <DemoCard className="!py-3.5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{r.name}</p>
                <p className="text-xs text-foreground-muted">{r.note}</p>
              </div>
              <StatusPill status={r.status} />
            </DemoCard>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Risk Spectrum ladder
// ------------------------------------------------------------
// A horizontal gradient track standing in for the three stacked tier
// groups. Marker position = the entity's tier zone (TIER_POSITION_PCT),
// never a per-entity score — riskDirectory has no such field. Reveal
// animates in on mount so the ladder settles into place rather than
// appearing fully formed.
function RiskLadder({ entities }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <DemoCard className="elevation-elevated">
      <SectionTitle sub="Each entity's position reflects its risk tier, not a fabricated score — riskDirectory only records Low / Medium / High per entity.">
        Risk Spectrum
      </SectionTitle>

      {/* Bug fix (Part 2): the track (`h-2.5`, i.e. 10px tall) used to
          be plain in-flow content inside this `pt-12 px-2` div, while
          every marker and the zone-label row were absolutely
          positioned against *that outer div's* padding box — not
          against the track. `top: 0` on an absolutely-positioned
          child lands at the padding box's top edge, which `pt-12`
          does NOT shift; the track only appears 48px lower because
          it's normal-flow content pushed down by that padding. So
          every offset below (`top: -4px`, `top: 2px`, `top-[52px]`,
          etc.) was a guess at "48px plus or minus a few" against a
          reference point the track itself was never anchored to.
          `top-[52px]` for the zone labels landed only 4px below that
          guessed track position — inside the track's own 10px band,
          not below it — which is exactly why "High Risk" collided
          with the Sunrise Organic Foods Inc. marker sitting right
          above it.
          Fix: give the track its own `relative` wrapper sized to
          exactly TRACK_HEIGHT_PX (its real, known height — no other
          content shares this box), so every marker below anchors to
          the track's actual edges via calc()/explicit box-model math
          instead of a guess against an unrelated ancestor. The zone
          labels are no longer absolutely positioned at all — they're
          ordinary flow content in a row below the track wrapper, with
          a real margin, so they can never land inside the track's
          band regardless of any marker's height above it. */}
      {/* pt-24 (96px): real clearance for the tallest realistic High
          Risk marker above the track — circle (w-7 h-7 = 28px) + its
          mt-1.5 gap (6px) + a two-line wrapped name at text-[11px]
          leading-tight within max-w-[120px] (~28px for 2 lines) +
          the failed-checks line (~15px) + MARKER_TRACK_GAP_PX (10px)
          ≈ 87px, rounded up with margin. This is headroom for the
          marker's own content, separate from the track-overlap fix
          below — that fix (bottom-anchoring the marker to the track
          wrapper) holds regardless of this number. */}
      <div className="pt-24 pb-1 px-2">
        <div className="relative" style={{ height: TRACK_HEIGHT_PX }}>
          {/* Gradient track — richer dark→light→dark modulation within
              each zone (same multi-stop depth as the --gradient-status-*
              tokens in globals.css) instead of one flat stop per tier,
              so the track itself reads with the same gradient richness
              as the rest of the Part 1 depth system. */}
          <div
            className="risk-ladder-track absolute inset-0 rounded-full shadow-inner"
            style={{
              background:
                'linear-gradient(to right, #047857 0%, #10b981 14%, #6ee7b7 27%, #fde68a 40%, #f59e0b 50%, #fcd34d 60%, #fca5a5 75%, #ef4444 87%, #991b1b 100%)',
            }}
          />

          {RISK_TIERS.map((tier) => {
            const list = entities.filter((e) => e.riskLevel === tier);
            const leftPct = TIER_POSITION_PCT[tier];
            const color = TIER_DOT_COLOR[tier];

            if (list.length === 0) {
              // Honest empty zone, not just omitted — a zero is still a
              // real fact about this tier right now. Vertically centered
              // on the track via real box-model math (see EMPTY_DOT_PX
              // below), not a guessed pixel offset.
              return (
                <div
                  key={tier}
                  className="absolute -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${leftPct}%`, top: EMPTY_DOT_TOP_PX }}
                >
                  <span className="w-2 h-2 rounded-full border border-dashed border-white/20" />
                  <span className="text-[10px] text-foreground-muted mt-1 whitespace-nowrap">0 entities</span>
                </div>
              );
            }

            if (tier === 'High Risk') {
              // The one alert-worthy marker: bigger, pulsing, always
              // labeled with the entity name directly on the ladder so it
              // reads as the clear standout at a glance. Anchored by its
              // own `bottom` edge to the track wrapper's real bottom via
              // `calc(100% + gap)`, so it sits a fixed, guaranteed gap
              // above the track's top no matter how tall its two-line
              // label renders — it can never overlap the track.
              return list.map((e) => (
                <div
                  key={e.name}
                  className="risk-pin-reveal absolute -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${leftPct}%`, bottom: `calc(100% + ${MARKER_TRACK_GAP_PX}px)`, animationDelay: '260ms' }}
                >
                  <span className="relative flex items-center justify-center w-7 h-7">
                    <span className="risk-alert-pulse absolute inset-0 rounded-full" style={{ background: color }} />
                    <span
                      className="relative w-5 h-5 rounded-full ring-2 ring-card shadow-sm flex items-center justify-center"
                      style={{ background: color }}
                    >
                      <ShieldAlert className="w-3 h-3 text-white" />
                    </span>
                  </span>
                  <span className="mt-1.5 text-[11px] font-semibold text-red-300 text-center leading-tight max-w-[120px]">
                    {e.name}
                  </span>
                  <span className="text-[10px] text-foreground-muted">{e.failedChecks} failed checks</span>
                </div>
              ));
            }

            // Low / Medium clusters: overlapping small dots, one shared
            // count label — deliberately quieter than the High Risk pin.
            // The dot row is vertically centered on the track (real
            // box-model math via CLUSTER_DOT_TOP_PX below); the shared
            // count label hangs below it in normal flow within the
            // marker's own flex column, so it never competes with the
            // zone-label row underneath.
            return (
              <div
                key={tier}
                className="risk-pin-reveal absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${leftPct}%`, top: CLUSTER_DOT_TOP_PX, animationDelay: '80ms' }}
              >
                <div className="flex items-center" style={{ marginLeft: `${(list.length - 1) * 6}px` }}>
                  {list.map((e, i) => (
                    <span
                      key={e.name}
                      title={`${e.name} — ${e.riskLevel}`}
                      className="w-4 h-4 rounded-full ring-2 ring-card shadow-sm"
                      style={{ background: color, marginLeft: i === 0 ? 0 : '-6px', opacity: ready ? 1 : 0, transition: `opacity 300ms ease ${i * 60}ms` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-foreground-muted mt-1 whitespace-nowrap">
                  {list.length} {tier === 'Low Risk' ? 'compliant entities' : 'entities'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Zone tick labels — ordinary flow content below the track
            wrapper (real `mt-3` margin), not an absolutely-positioned
            overlay guessing where the track is. Can never land inside
            the track's own band. */}
        <div className="flex justify-between text-[11px] text-foreground-muted font-medium mt-3">
          <span>Low Risk</span>
          <span>Medium Risk</span>
          <span>High Risk</span>
        </div>
      </div>
    </DemoCard>
  );
}

// ------------------------------------------------------------
// High Risk — distinct alert card
// ------------------------------------------------------------
// Same structured-seriousness language as Part 4's ViolationsPanel
// (red header strip, icon, explicit specifics) instead of a card that
// merely has a red border like the other tiers used to.
function HighRiskAlertCard({ entity: e }) {
  // Strong glow + top-tier elevation, Part 1's most urgent depth/glow
  // pairing (glow-danger's ambient red glow + --shadow-floating's
  // deepest elevation) combined via inline boxShadow rather than
  // stacking both classes — .glow-danger and .elevation-floating both
  // set `box-shadow`, so class-stacking them would just let whichever
  // is later in the stylesheet silently win instead of layering (same
  // reasoning as ComplianceStatusChip's glow/elevated combo above).
  const urgentShadow = {
    boxShadow: 'var(--shadow-floating), 0 0 0 1px rgba(239, 68, 68, 0.10), 0 0 28px 6px rgba(239, 68, 68, 0.38)',
  };
  return (
    <DemoCard className="!p-0 overflow-hidden border-red-500/30" style={urgentShadow}>
      <div className="flex items-center gap-3 px-5 py-3.5 bg-red-500/10/70 border-b border-red-500/20">
        {/* No glow on this badge itself — the card around it is
            overflow-hidden (for the header strip's rounded corners),
            which would clip an ambient glow before it could show. */}
        <span className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 ring-4 ring-red-600/20">
          <ShieldAlert className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-red-300 font-semibold">High Risk Entity</p>
          <p className="text-sm font-semibold text-foreground truncate" title={e.name}>
            {truncateAtWord(e.name, 60)}
          </p>
        </div>
        <StatusPill status={e.riskLevel} />
      </div>
      <div className="p-5">
        <p className="text-xs text-foreground-muted mb-3">
          {e.role} · {e.productCount} scanned product{e.productCount === 1 ? '' : 's'} ·{' '}
          <span className="text-red-300 font-semibold">{e.failedChecks} failed checks</span>
        </p>
        <p className="text-sm text-red-300 font-medium">{e.note}</p>
      </div>
    </DemoCard>
  );
}

// ------------------------------------------------------------
// Medium Risk — mid-weight group (currently unused by real data, but
// a genuine branch, not a stub) — more detail than Low's chip row
// since Medium implies something worth a glance, less alarm than High.
function MidRiskGroup({ entities }) {
  return (
    <DemoCard className="border-amber-500/30">
      <SectionTitle sub="Entities with some flagged checks, short of the High Risk threshold.">Medium Risk</SectionTitle>
      <div className="space-y-3">
        {entities.map((e) => (
          <div key={e.name} className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10/40 px-4 py-3">
            <IconChip icon={AlertTriangle} tone="amber" size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-medium text-foreground truncate" title={e.name}>
                  {truncateAtWord(e.name, 60)}
                </p>
                <span className="text-[11px] text-amber-300 font-semibold shrink-0">{e.failedChecks} failed checks</span>
              </div>
              <p className="text-xs text-foreground-muted mt-0.5">{e.note}</p>
            </div>
          </div>
        ))}
      </div>
    </DemoCard>
  );
}

// ------------------------------------------------------------
// Low Risk — compact grouped presentation
// ------------------------------------------------------------
// 16 of the 17 entities, each with identical real data (0 failed
// checks, the same generic note) — a single calm chip row instead of
// sixteen full-weight cards that would only repeat "fully compliant"
// sixteen times.
function LowRiskGroup({ entities }) {
  return (
    <DemoCard>
      <SectionTitle sub={`${entities.length} entities · all scanned products fully compliant`}>Low Risk</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {entities.map((e) => (
          <span
            key={e.name}
            className="inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10/60 text-xs text-foreground"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            {e.name}
          </span>
        ))}
      </div>
    </DemoCard>
  );
}
