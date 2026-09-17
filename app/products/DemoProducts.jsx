'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  BellPlus,
  CheckCircle2,
  ShoppingBag,
  FileText,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Flag,
  Bookmark,
  Braces,
  Save,
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
  ScoreBadge,
  scoreTone,
  OcrExtractionDisplay,
  ComplianceSummaryStrip,
  FindingsLedger,
  ViolationsPanel,
  AllClearPanel,
} from '../demo/DemoUI';
import { PRODUCTS_CATALOG, DEMO_PRODUCT } from '../../lib/demoData';
import { getFullDetailFor } from '../../lib/productDetailMap';
import { CategoryIcon, EntityAvatar, ComplianceStatusChip, StatChip } from '../demo/ItemIdentity';
import { getCategoryColor, categoryColorVars } from '../../lib/categoryColors';

const DETAIL_TABS = ['Ingredients', 'Nutritional Information', 'Allergen Information', 'Other Details'];

// ------------------------------------------------------------
// Part 6 — bug fixes
// ------------------------------------------------------------
// Bug 1 (fixed): the detail view used to always render PRODUCTS_DATA
// (Maggi's record) whenever `selected.full` was true, regardless of
// which product was clicked. It now looks up the SELECTED product's
// own real data via getFullDetailFor(selected.name) and renders
// nothing hardcoded.
//
// Bug 2 (fixed at the source, lib/demoData.js): PRODUCTS_CATALOG's
// `full` flag is now `true` for both products that actually have a
// complete real dataset (Maggi, Sunrise Organic Almond Butter) and
// `false` for the other 16, which genuinely have summary data only.
//
// See lib/productDetailMap.js for why Maggi and the almond butter
// render through two different "full" templates (CatalogFullDetail
// vs. ComplianceFullDetail) rather than forcing both through one
// shape — their real datasets are different shapes, and forcing a
// match would mean either bug 1 again or fabricating data.
// ------------------------------------------------------------

// Categories/statuses derived from the real catalog itself (never a
// hand-typed list that could drift from what PRODUCTS_CATALOG
// actually contains).
const ALL_CATEGORIES = [...new Set(PRODUCTS_CATALOG.map((p) => p.categoryGroup))];
const SORT_OPTIONS = [
  { key: 'default', label: 'Catalog Order' },
  { key: 'score-desc', label: 'Score: High to Low' },
  { key: 'score-asc', label: 'Score: Low to High' },
  { key: 'name-asc', label: 'Name: A to Z' },
];

// ------------------------------------------------------------
// CSV / JSON export helpers
// ------------------------------------------------------------
// Pure, component-independent helpers so exportFilteredAsCsv/Json
// (defined inside DemoProducts, where `filtered` lives) stay small.
// The field list is exactly the real keys every PRODUCTS_CATALOG
// entry has (see lib/demoData.js) — nothing renamed or fabricated.
const EXPORT_FIELDS = ['id', 'name', 'subtitle', 'manufacturer', 'categoryGroup', 'status', 'score', 'full'];
const EXPORT_HEADERS = {
  id: 'ID',
  name: 'Name',
  subtitle: 'Subtitle',
  manufacturer: 'Manufacturer',
  categoryGroup: 'Category',
  status: 'Status',
  score: 'Score',
  full: 'Full Detail Available',
};

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function timestampForFilename() {
  // 2026-09-16T10-42-05 — sortable, filesystem-safe (no colons).
  return new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
}

// RFC 4180-style escaping: wrap in quotes (doubling any embedded
// quotes) whenever the value contains a comma, quote, or newline —
// the three characters that would otherwise break column alignment
// or terminate the field early when the CSV is reopened.
function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows) {
  const headerLine = EXPORT_FIELDS.map((field) => csvEscape(EXPORT_HEADERS[field])).join(',');
  const dataLines = rows.map((row) => EXPORT_FIELDS.map((field) => csvEscape(row[field])).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}

function downloadTextFile(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------
// Saved filter views
// ------------------------------------------------------------
// `filterProducts` is the exact same predicate the `filtered` useMemo
// below already used inline — pulled out to module scope so a saved
// view's live count can run the identical logic against
// PRODUCTS_CATALOG instead of a second, hand-duplicated copy of it
// that could quietly drift out of sync.
function filterProducts(rows, { query, categoryFilter, statusFilter }) {
  return rows.filter((p) => {
    const matchesQuery =
      query.trim() === '' ||
      p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(query.trim().toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.categoryGroup === categoryFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Compliant' ? !/non-?compliant/i.test(p.status) : /non-?compliant/i.test(p.status));
    return matchesQuery && matchesCategory && matchesStatus;
  });
}

function sortProducts(rows, sortKey) {
  if (sortKey === 'score-desc') return [...rows].sort((a, b) => b.score - a.score);
  if (sortKey === 'score-asc') return [...rows].sort((a, b) => a.score - b.score);
  if (sortKey === 'name-asc') return [...rows].sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

// Auto-generated name for a not-yet-named view, e.g. "Non-Compliant
// Food & Beverages" or `"almond"`. Built purely from the real
// status/category labels and the raw search text — never a
// fabricated product-line name like "Snacks" that isn't one of this
// catalog's actual categories.
function autoNameForView({ query, categoryFilter, statusFilter, sortKey }) {
  const parts = [];
  if (statusFilter !== 'All') parts.push(statusFilter);
  if (categoryFilter !== 'All') parts.push(categoryFilter);
  if (query.trim() !== '') parts.push(`"${query.trim()}"`);
  if (parts.length > 0) return parts.join(' ');

  const sortOption = SORT_OPTIONS.find((o) => o.key === sortKey);
  return sortKey !== 'default' && sortOption ? sortOption.label : 'All Products';
}

export default function DemoProducts() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState('default');

  // Every filter/sort operates purely over PRODUCTS_CATALOG — no new
  // rows invented, no fields renamed, just narrowing/reordering the
  // same 18 real catalog entries used everywhere else in the app.
  // Filtering/sorting themselves live in the module-level
  // filterProducts/sortProducts helpers above, so saved views can
  // reuse the identical logic for their live counts.
  const filtered = useMemo(() => {
    const rows = filterProducts(PRODUCTS_CATALOG, { query, categoryFilter, statusFilter });
    return sortProducts(rows, sortKey);
  }, [query, categoryFilter, statusFilter, sortKey]);

  const compliantCount = PRODUCTS_CATALOG.filter((p) => !/non-?compliant/i.test(p.status)).length;

  // ------------------------------------------------------------
  // Export filtered products (CSV / JSON)
  // ------------------------------------------------------------
  // Both formats are built from `filtered` — the exact same array
  // the list below renders — never PRODUCTS_CATALOG. Narrow the
  // search/category/status filters down to 3 rows and the export
  // contains exactly those 3, in whatever order `sortKey` currently
  // has them in.
  // Filenames encode what's actually in the export — the active
  // category/status filter (when set) plus a timestamp — so two
  // exports taken minutes apart, or under different filters, never
  // silently overwrite each other on disk.
  const exportFilenameBase = () => {
    const parts = ['products'];
    if (categoryFilter !== 'All') parts.push(slugify(categoryFilter));
    if (statusFilter !== 'All') parts.push(slugify(statusFilter));
    if (query.trim() !== '') parts.push('search');
    parts.push(timestampForFilename());
    return parts.join('_');
  };

  const exportFilteredAsCsv = () => {
    downloadTextFile(buildCsv(filtered), 'text/csv;charset=utf-8;', `${exportFilenameBase()}.csv`);
  };

  const exportFilteredAsJson = () => {
    // A clean array of the real filtered product objects — no
    // reshaping, renaming, or added/dropped fields. `filtered` items
    // are the same object references PRODUCTS_CATALOG holds (the
    // filter/sort above never clones or mutates a product's fields),
    // so this is literally what's on screen, stringified.
    downloadTextFile(JSON.stringify(filtered, null, 2), 'application/json', `${exportFilenameBase()}.json`);
  };

  // ------------------------------------------------------------
  // Saved filter views
  // ------------------------------------------------------------
  // In-memory only (no backend, no localStorage) — a session-scoped
  // list of named query/category/status/sort combinations the user
  // can jump back to instantly.
  const [savedViews, setSavedViews] = useState([]);

  // Saving captures the CURRENT live filter/sort state as a plain
  // snapshot (four primitive values) — not a reference to anything
  // that could keep changing after the view is saved.
  const saveCurrentView = () => {
    const suggestedName = autoNameForView({ query, categoryFilter, statusFilter, sortKey });
    const typed = typeof window !== 'undefined' ? window.prompt('Name this saved view:', suggestedName) : suggestedName;
    if (typed === null) return; // user cancelled the prompt — save nothing
    const name = typed.trim() === '' ? suggestedName : typed.trim();
    setSavedViews((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        query,
        categoryFilter,
        statusFilter,
        sortKey,
      },
    ]);
  };

  // Re-applies the exact saved combination — all four filter/sort
  // state setters, so the URL of controls (search box, category/status
  // chips, sort dropdown) all snap back to match what was saved.
  const applySavedView = (view) => {
    setQuery(view.query);
    setCategoryFilter(view.categoryFilter);
    setStatusFilter(view.statusFilter);
    setSortKey(view.sortKey);
  };

  const deleteSavedView = (id) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
  };

  // Live result count per saved view — actually runs each view's own
  // filterProducts against the real PRODUCTS_CATALOG (the same
  // function `filtered` above uses), never a fabricated or stale
  // number. Recomputed only when the saved-views list itself changes,
  // not on every keystroke in the current (unrelated) search box.
  const savedViewCounts = useMemo(() => {
    const counts = {};
    savedViews.forEach((view) => {
      counts[view.id] = filterProducts(PRODUCTS_CATALOG, view).length;
    });
    return counts;
  }, [savedViews]);

  // ------------------------------------------------------------
  // Multi-select + bulk actions
  // ------------------------------------------------------------
  // Selection is a Set of product IDs — never product objects — so
  // it stays cheap to check/toggle and never goes stale if `filtered`
  // re-sorts. It's tracked independently of `filtered`: selecting
  // rows, then changing a filter/search/sort, keeps whatever was
  // already selected (including rows now scrolled out of view),
  // exactly like the audit log and other session state elsewhere in
  // this app persists across UI changes within the same session.
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  // Per-product UI-only state the bulk actions write to — plain
  // demo toggles, no backend, no persistence beyond this session.
  const [flaggedForRecheck, setFlaggedForRecheck] = useState(() => new Set());
  const [watchlisted, setWatchlisted] = useState(() => new Set());
  const selectAllRef = useRef(null);

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  // Native checkboxes only expose checked/unchecked via props —
  // "some but not all" (indeterminate) has to be set imperatively on
  // the DOM node itself.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected && !allFilteredSelected;
    }
  }, [someFilteredSelected, allFilteredSelected]);

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Selects/deselects every row CURRENTLY in `filtered` — respecting
  // whatever search/category/status filter is active. Rows already
  // selected from before a filter narrowed the list are left alone
  // (they're simply not in `filteredIds` right now), so this never
  // silently drops a selection the user made under a different filter.
  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk actions genuinely loop over every selected ID and update
  // state for each one — not just selectedIds.values().next(), and
  // not a single shared placeholder flag. Both mark the whole
  // current selection as flagged/watchlisted (rather than toggling
  // each product's individual prior state), so running the same bulk
  // action twice over a mixed selection has one predictable result:
  // everything selected ends up flagged/watchlisted.
  const bulkFlagForRecheck = () => {
    setFlaggedForRecheck((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const bulkAddToWatchlist = () => {
    setWatchlisted((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Enhancement: stat pills intentionally always reflect the FULL
  // catalog (never re-derived from `filtered`), so a "(N shown)"
  // note is added instead of making the pills themselves reactive —
  // see the Products report for why. `hasActiveFilters` also drives
  // the "Clear filters" action and the result-count summary below.
  const hasActiveFilters = query.trim() !== '' || categoryFilter !== 'All' || statusFilter !== 'All';
  const clearFilters = () => {
    setQuery('');
    setCategoryFilter('All');
    setStatusFilter('All');
  };

  // Enhancement: column-header sorting, layered onto the *existing*
  // sortKey options (no new sort logic/keys) so "Product" and
  // "Score" headers become clickable toggles instead of only being
  // reachable via the separate dropdown — addresses the flagged
  // redundant-control inconsistency without touching how sorting
  // itself is computed above.
  const toggleProductSort = () => setSortKey((k) => (k === 'name-asc' ? 'default' : 'name-asc'));
  const toggleScoreSort = () => setSortKey((k) => (k === 'score-desc' ? 'score-asc' : 'score-desc'));

  if (!selected) {
    return (
      <>
        <Navbar />
        <DemoPage>
          <PageHeader icon={ShoppingBag} label="Products" page="Products" code={DEMO_PRODUCT.code} />

          {/* Part 11 structural redesign: replaces the plain heading
              + uniform 2-up card grid (the "generic catalog grid" the
              brief called out) with a real browsing surface — a
              summary strip of the catalog's own real composition, a
              working search + category/status filter + sort toolbar,
              and a denser table-meets-card row layout below instead
              of big square cards. Nothing here is new data: every
              filter operates over PRODUCTS_CATALOG itself. */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow color="blue">Catalog / Cached Result</Eyebrow>
              <h1 className="text-2xl font-bold text-foreground">Products</h1>
              <p className="text-sm text-foreground-muted mt-1">Browse verified products, packaging details and market insights.</p>
            </div>
            <div className="flex items-center gap-4">
              <StatChip label="Catalog" value={PRODUCTS_CATALOG.length} tone="blue" />
              <StatChip label="Compliant" value={compliantCount} tone="emerald" />
              <StatChip label="Categories" value={ALL_CATEGORIES.length} tone="accent" />
              {/* These three always reflect the full catalog by
                  design (see hasActiveFilters comment above) — this
                  note is the "confirm it's intentional" signal from
                  the brief rather than making the pills themselves
                  filter-reactive. */}
              {hasActiveFilters && (
                <span className="text-[11px] text-foreground-muted whitespace-nowrap">
                  ({filtered.length} shown)
                </span>
              )}
            </div>
          </div>

          {/* Beauty & Color Pass, Part 3: elevated toolbar, tinted a
              couple shades warmer than the plain list below it, so
              the two surfaces read as distinct layers (search/filter
              controls above, results below) instead of matching
              white cards stacked back to back. */}
          <DemoCard className="flex flex-col gap-4 elevation-elevated surface-tint-accent">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2.5">
                <Search className="w-4 h-4 text-foreground-muted shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by product name or manufacturer…"
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-foreground-muted"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2.5 shrink-0">
                <ArrowUpDown className="w-4 h-4 text-foreground-muted shrink-0" />
                {/* Bug 1 fix: `products-sort-select` (globals.css) gives
                    both the closed control AND its native option popup
                    an explicit dark background + light text, so options
                    stay readable in the open state instead of only the
                    hovered one. */}
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="products-sort-select bg-transparent outline-none text-sm text-foreground"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Export operates on `filtered` (see exportFilteredAsCsv/
                  Json above) — whatever's currently narrowed down by
                  search/category/status is exactly what downloads. */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={exportFilteredAsCsv}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-xl border border-white/[0.08] text-foreground-muted hover:text-foreground hover:border-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Export the currently filtered products as CSV"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  onClick={exportFilteredAsJson}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-xl border border-white/[0.08] text-foreground-muted hover:text-foreground hover:border-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Export the currently filtered products as JSON"
                >
                  <Braces className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              </div>
            </div>

            {/* Enhancement: "Category" / "Status" are now two visibly
                distinct labeled groups instead of one row split only
                by a thin divider. */}
            <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/70 mr-0.5">
                  <SlidersHorizontal className="w-3 h-3" />
                  Category
                </span>
                <FilterChip active={categoryFilter === 'All'} onClick={() => setCategoryFilter('All')}>All Categories</FilterChip>
                {ALL_CATEGORIES.map((c) => (
                  <FilterChip key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>{c}</FilterChip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/70 mr-0.5">Status</span>
                <FilterChip active={statusFilter === 'All'} onClick={() => setStatusFilter('All')}>All Statuses</FilterChip>
                <FilterChip active={statusFilter === 'Compliant'} onClick={() => setStatusFilter('Compliant')}>Compliant</FilterChip>
                <FilterChip active={statusFilter === 'Non-Compliant'} onClick={() => setStatusFilter('Non-Compliant')}>Non-Compliant</FilterChip>
              </div>
            </div>

            {/* Saved filter views — session-only (see savedViews state
                above). Sits in its own row so it reads as a distinct
                "your saved combinations" shelf rather than one more
                category/status chip group. Always visible (not gated
                behind hasActiveFilters) since "Save current view" is
                meaningful even for the default All/All view. */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.06]">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/70 mr-0.5">
                <Save className="w-3 h-3" />
                Saved Views
              </span>
              <button
                onClick={saveCurrentView}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-white/20 text-foreground-muted hover:border-accent/40 hover:text-foreground transition"
              >
                <Save className="w-3.5 h-3.5" />
                Save current view
              </button>
              {savedViews.length === 0 ? (
                <span className="text-xs text-foreground-muted">No saved views yet this session.</span>
              ) : (
                savedViews.map((view) => {
                  // "Active" means the live filter/sort state currently
                  // matches this view exactly — not just that it was the
                  // last one clicked (so it stays accurate even if the
                  // user tweaks a filter afterward, or clicks a chip
                  // then edits the search box).
                  const isActive =
                    query === view.query &&
                    categoryFilter === view.categoryFilter &&
                    statusFilter === view.statusFilter &&
                    sortKey === view.sortKey;
                  return (
                    <span
                      key={view.id}
                      className={`flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full border text-xs font-medium transition ${
                        isActive
                          ? 'bg-accent text-white border-accent'
                          : 'border-white/10 text-foreground-muted hover:border-accent/40 hover:text-foreground'
                      }`}
                    >
                      <button onClick={() => applySavedView(view)} className="flex items-center gap-1.5">
                        {view.name}
                        <span className={isActive ? 'text-white/70' : 'text-foreground-muted/70'}>
                          ({savedViewCounts[view.id] ?? 0})
                        </span>
                      </button>
                      <button
                        onClick={() => deleteSavedView(view.id)}
                        aria-label={`Delete saved view "${view.name}"`}
                        className={`p-0.5 rounded-full transition ${isActive ? 'hover:bg-white/20' : 'hover:bg-white/10'}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Enhancement: active-filter visibility + clear action —
                only appears once a non-default filter is applied. */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                <p className="text-xs text-foreground-muted">
                  Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {PRODUCTS_CATALOG.length} products
                </p>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-light transition"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              </div>
            )}
          </DemoCard>

          {/* Bulk action bar — only rendered once 1+ rows are
              selected, sticky just under the toolbar so it stays
              reachable while scrolling a long filtered list. */}
          {selectedIds.size > 0 && (
            <div className="sticky top-4 z-30">
              <DemoCard className="!py-3 !px-5 border-accent/30 bg-accent/10 elevation-elevated flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-xs font-bold shrink-0">
                    {selectedIds.size}
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {selectedIds.size} product{selectedIds.size === 1 ? '' : 's'} selected
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={bulkFlagForRecheck}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 text-foreground hover:bg-white/[0.05] transition"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Flag for re-check
                  </button>
                  <button
                    onClick={bulkAddToWatchlist}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 text-foreground hover:bg-white/[0.05] transition"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Add to watchlist
                  </button>
                  <button
                    onClick={clearSelection}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-foreground-muted hover:text-foreground transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear selection
                  </button>
                </div>
              </DemoCard>
            </div>
          )}

          {/* List stays the plain, lower resting tier (elevation-card)
              so the toolbar above visibly sits a layer above it. */}
          <DemoCard className="p-0 overflow-hidden elevation-card">
            <div className="hidden sm:grid grid-cols-[auto_2.5fr_1.2fr_1fr_0.8fr] gap-4 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted border-b border-white/[0.06]">
              <div className="flex items-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  disabled={filtered.length === 0}
                  aria-label="Select all filtered products"
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[var(--accent)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                />
              </div>
              {/* Enhancement: Product/Score headers are now clickable
                  sort toggles (reusing the existing sortKey values,
                  no new sort logic) instead of sorting living only in
                  the separate dropdown above. */}
              <button onClick={toggleProductSort} className="flex items-center gap-1 text-left hover:text-foreground transition">
                Product
                <SortIndicator active={sortKey === 'name-asc'} direction="asc" />
              </button>
              <span>Category</span>
              <span>Status</span>
              <button onClick={toggleScoreSort} className="flex items-center justify-end gap-1 text-right hover:text-foreground transition">
                Score
                <SortIndicator active={sortKey === 'score-desc' || sortKey === 'score-asc'} direction={sortKey === 'score-asc' ? 'asc' : 'desc'} />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {filtered.map((p) => {
                const isNonCompliant = /non-?compliant/i.test(p.status);
                const isChecked = selectedIds.has(p.id);
                return (
                <div
                  key={p.id}
                  // Bug 2 fix: category rows use the new, deliberately
                  // subtle `.row-category-tint` (not `.card-accent-tint`,
                  // which stays as-is for Entities/other single-card
                  // uses) so 18 stacked rows read as one cohesive
                  // palette instead of a clashing rainbow.
                  // Bug 3 fix: the one non-compliant row instead gets
                  // `.row-status-alert` — a status-red treatment that
                  // overrides category tinting entirely, so it can't
                  // be scrolled past unnoticed.
                  // Multi-select: the row is now a plain `div` (not a
                  // `button`) so a real checkbox can live in it without
                  // nesting an <input> inside a <button>. Row navigation
                  // still works exactly as before via the inner
                  // `display: contents` button below — it's a real
                  // <button> wrapping the Product/Category/Status/Score
                  // cells, so it keeps native click + keyboard (Enter/
                  // Space) activation, it just doesn't own the grid box
                  // itself anymore. `pl-10 sm:pl-6` reserves a gutter
                  // for the checkbox on mobile, where it's absolutely
                  // positioned instead of taking its own grid column.
                  className={`group relative grid gap-2 sm:grid-cols-[auto_2.5fr_1.2fr_1fr_0.8fr] sm:gap-4 items-center pl-10 pr-6 sm:pl-6 py-5 transition hover:bg-accent/5 ${
                    isNonCompliant ? 'row-status-alert' : 'row-category-tint'
                  } ${isChecked ? 'bg-accent/[0.06]' : ''}`}
                  style={isNonCompliant ? undefined : categoryColorVars(p.categoryGroup)}
                >
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0 sm:flex sm:items-center z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectOne(p.id)}
                      aria-label={`Select ${p.name}`}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    // `contents`: this button renders no box of its
                    // own — its children become direct items of the
                    // row's grid above, exactly where the old row
                    // `<button>`'s children used to sit. Only the
                    // Product/Category/Status/Score cells + chevron
                    // are inside it, so clicking/tabbing into any of
                    // those (but not the checkbox, which is a sibling)
                    // opens the product detail view.
                    className="contents text-left cursor-pointer"
                  >
                    <ChevronRight className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted opacity-0 group-hover:opacity-100 transition pointer-events-none" />
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Enhancement: avatar hue muted in this table
                          context only, so it doesn't compete with the
                          row's own category tint (avatar system itself
                          is unchanged everywhere else it's used). */}
                      <EntityAvatar name={p.manufacturer} size="sm" muted />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                          {flaggedForRecheck.has(p.id) && (
                            <span title="Flagged for re-check">
                              <Flag className="w-3 h-3 text-amber-300 shrink-0" />
                            </span>
                          )}
                          {watchlisted.has(p.id) && (
                            <span title="On watchlist">
                              <Bookmark className="w-3 h-3 text-accent shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted truncate">{p.manufacturer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CategoryIcon category={p.categoryGroup} size="sm" />
                      <span className="text-xs text-foreground-muted truncate">{p.categoryGroup}</span>
                    </div>
                    <div>
                      <ComplianceStatusChip status={p.status} size="sm" glow />
                    </div>
                    {/* Enhancement: score gets real visual presence — a
                        colored pill, reusing ScoreBadge's own `scoreTone()`
                        thresholds/classes rather than inventing a new
                        score→color mapping. */}
                    <div className="flex justify-end">
                      <span className={`inline-flex items-center justify-center min-w-[2.75rem] px-2 py-1 rounded-lg border text-sm font-bold ${scoreTone(p.score).pill}`}>
                        {p.score}
                      </span>
                    </div>
                  </button>
                </div>
              );})}
              {filtered.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-foreground-muted">
                  No products match these filters.
                </div>
              )}
            </div>
          </DemoCard>
        </DemoPage>
      </>
    );
  }

  const fullDetail = selected.full ? getFullDetailFor(selected.name) : null;

  if (fullDetail?.kind === 'catalog') {
    return <CatalogFullDetail d={fullDetail.data} categoryGroup={selected.categoryGroup} onBack={() => setSelected(null)} />;
  }

  if (fullDetail?.kind === 'compliance') {
    return <ComplianceFullDetail d={fullDetail.data} categoryGroup={selected.categoryGroup} onBack={() => setSelected(null)} />;
  }

  return <SummaryDetail product={selected} onBack={() => setSelected(null)} />;
}

// ------------------------------------------------------------
// Summary detail — the other 16 catalog products. Richened with
// the Part 3 identity system for the fields that genuinely exist
// (name, manufacturer, category, score, status) — no fabricated
// sections, since no OCR/findings/variant data exists for these.
// ------------------------------------------------------------
function SummaryDetail({ product, onBack }) {
  return (
    <>
      <Navbar />
      <DemoPage>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </button>

        {/* Category-tinted card border/background (accentColor + tint,
            the same DemoCard mechanism the Dashboard already uses for
            category coloring), so this single-product view carries
            the same category identity as its row did in the list. */}
        <DemoCard
          className="text-center py-10"
          accentColor={getCategoryColor(product.categoryGroup).color}
          tint
        >
          <div className="flex justify-center mb-4">
            <CategoryIcon category={product.categoryGroup} size="lg" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
          <p className="text-sm text-foreground-muted mt-1">{product.subtitle}</p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <EntityAvatar name={product.manufacturer} size="sm" />
            <span className="text-sm text-foreground-muted">{product.manufacturer}</span>
          </div>

          <div className="mt-5 flex justify-center">
            <ComplianceStatusChip status={product.status} glow />
          </div>

          <p
            className={`text-3xl font-bold mt-6 ${
              /non-?compliant/i.test(product.status) ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {product.score}
          </p>
          <p className="text-xs text-foreground-muted">Compliance Score</p>

          <div className="flex justify-center mt-6">
            <StatChip label="Category" value={product.categoryGroup} tone="blue" />
          </div>

          <p className="text-xs text-foreground-muted mt-8 max-w-sm mx-auto">
            This product has catalog-level results only — full OCR &amp; findings
            analysis (like Maggi and Sunrise Organic Almond Butter) isn't
            available for it yet.
          </p>
        </DemoCard>
      </DemoPage>
    </>
  );
}

// ------------------------------------------------------------
// Catalog-shaped full detail — Maggi only (the one product with a
// real PRODUCTS_DATA record: variants, price analysis, market
// history...). Unchanged from the original build except for the
// EntityAvatar addition next to the manufacturer.
// ------------------------------------------------------------
function CatalogFullDetail({ d, categoryGroup, onBack }) {
  const [detailTab, setDetailTab] = useState(DETAIL_TABS[0]);

  return (
    <>
      <Navbar />
      <DemoPage>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition">
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </button>

        {/* Product info */}
        <DemoCard accentColor={getCategoryColor(categoryGroup).color} tint>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <EntityAvatar name={d.product.manufacturer} size="md" />
              <div>
                <h1 className="text-xl font-bold text-foreground">{d.product.name}</h1>
                <p className="text-sm text-foreground-muted mt-1">{d.product.subtitle}</p>
              </div>
            </div>
            <StatusPill status="Compliant" />
          </div>
          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            <KeyValue label="Brand" value={d.product.brand} />
            <KeyValue label="Manufacturer" value={d.product.manufacturer} />
            <KeyValue label="Net Quantity" value={d.product.netQuantity} />
            <KeyValue label="MRP" value={d.product.mrp} />
            <KeyValue label="Category" value={d.product.category} />
            <KeyValue label="HSN Code" value={d.product.hsnCode} />
            <KeyValue label="Country of Origin" value={d.product.countryOfOrigin} />
            <KeyValue label="FSSAI Lic. No." value={d.product.fssaiLicense} mono />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {d.highlights.map((h) => (
              <span key={h} className="px-3 py-1.5 rounded-full text-xs bg-accent/10 border border-accent/30 text-accent">
                {h}
              </span>
            ))}
          </div>
        </DemoCard>

        {/* Variants */}
        <DemoCard>
          <SectionTitle>Variants</SectionTitle>
          <div className="flex flex-wrap gap-3 mb-6">
            {d.variants.map((v) => (
              <div
                key={v.size}
                className={`px-4 py-2.5 rounded-xl border text-sm ${
                  v.selected ? 'border-accent/50 bg-accent/10 text-foreground' : 'border-white/10 text-foreground-muted'
                }`}
              >
                {v.size} · {v.price} {v.selected && <span className="text-accent ml-1">· Selected</span>}
              </div>
            ))}
          </div>

          <SectionTitle>Variant Comparison</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-foreground-muted text-xs uppercase tracking-wider">
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Unit Price</th>
                  <th className="py-2">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {d.variantComparison.map((v) => (
                  <tr key={v.size}>
                    <td className="py-2.5 pr-4 text-foreground">{v.size}</td>
                    <td className="py-2.5 pr-4 text-foreground">{v.price}</td>
                    <td className="py-2.5 pr-4 text-foreground-muted">{v.unitPrice}</td>
                    <td className="py-2.5 text-emerald-300">{v.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DemoCard>

        {/* Detailed product details */}
        <DemoCard>
          <TabRow tabs={DETAIL_TABS} active={detailTab} onChange={setDetailTab} />
          <div className="pt-6 text-sm text-foreground">
            {detailTab === 'Ingredients' && (
              <div className="space-y-4">
                <p>{d.detailTabs.ingredients.text}</p>
                <p className="text-xs text-foreground-muted italic border-t border-white/10 pt-3">
                  {d.detailTabs.ingredients.notice}
                </p>
              </div>
            )}
            {detailTab === 'Nutritional Information' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {d.detailTabs.nutrition.map((n) => (
                  <DemoCard key={n.label} className="text-center py-4">
                    <p className="text-lg font-bold text-foreground">{n.value}</p>
                    <p className="text-xs text-foreground-muted mt-1">{n.label}</p>
                  </DemoCard>
                ))}
              </div>
            )}
            {detailTab === 'Allergen Information' && <p>{d.detailTabs.allergens}</p>}
            {detailTab === 'Other Details' && (
              <div className="grid sm:grid-cols-2 gap-6">
                <KeyValue label="Manufacturing Date" value={d.detailTabs.other.manufacturingDate} />
                <KeyValue label="Batch No." value={d.detailTabs.other.batchNo} />
                <KeyValue label="Storage Instructions" value={d.detailTabs.other.storageInstructions} />
                <KeyValue label="Packaging Type" value={d.detailTabs.other.packagingType} />
                <KeyValue label="Best Before" value={d.detailTabs.other.bestBefore} />
              </div>
            )}
          </div>
        </DemoCard>

        {/* Insights */}
        <div className="grid lg:grid-cols-2 gap-6">
          <DemoCard>
            <SectionTitle>Price Analysis</SectionTitle>
            <div className="space-y-2 text-sm">
              <KeyValue label="Current MRP" value={d.insights.priceAnalysis.currentMrp} />
              <KeyValue label="Market Average" value={d.insights.priceAnalysis.marketAverage} />
              <KeyValue label="Price Deviation" value={d.insights.priceAnalysis.priceDeviation} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <StatusPill status={d.insights.availability.status} />
              <span className="text-xs text-foreground-muted">{d.insights.availability.note}</span>
            </div>
          </DemoCard>

          <DemoCard>
            <SectionTitle>Key Insights</SectionTitle>
            <ul className="space-y-2 text-sm text-foreground">
              {d.insights.keyInsights.map((k) => (
                <li key={k} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  {k}
                </li>
              ))}
            </ul>
          </DemoCard>
        </div>

        <DemoCard>
          <SectionTitle>Related Products</SectionTitle>
          <div className="grid sm:grid-cols-3 gap-4">
            {d.insights.relatedProducts.map((r) => (
              <div key={r.name} className="rounded-xl border border-white/10 px-4 py-3">
                <p className="text-sm text-foreground">{r.name}</p>
                <p className="text-sm font-semibold text-accent mt-1">{r.price}</p>
              </div>
            ))}
          </div>
        </DemoCard>

        {/* History */}
        <DemoCard>
          <SectionTitle>Compliance History</SectionTitle>
          <div className="divide-y divide-white/5">
            {d.history.map((h) => (
              <div key={h.date + h.item} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-xs text-foreground-muted w-24 shrink-0">{h.date}</span>
                <span className="text-sm text-foreground flex-1">{h.item}</span>
                <StatusPill status={h.status} />
                <span className="text-sm font-semibold text-emerald-300 w-10 text-right">{h.score}</span>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-4 gap-4 mt-6">
            <KeyValue label="Average Price (India)" value={d.market.averagePrice} />
            <KeyValue label="Price Range" value={d.market.priceRange} />
            <KeyValue label="Market Availability" value={d.market.availability} />
            <KeyValue label="Last Updated" value={d.market.lastUpdated} />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <ActionButton icon={ExternalLink} label="View on Marketplace" />
            <ActionButton icon={Download} label="Download Product Report" />
            <ActionButton icon={BellPlus} label="Track Product" />
          </div>
        </DemoCard>
      </DemoPage>
    </>
  );
}

// ------------------------------------------------------------
// Compliance-shaped full detail — Sunrise Organic Almond Butter
// only (the one other product with a real, full dataset —
// CHECK_COMPLIANCE_DATA_VIOLATION). Reuses the already-built
// OcrExtractionDisplay / ComplianceSummaryStrip / FindingsLedger /
// ViolationsPanel components from the Check Compliance page instead
// of rebuilding an equivalent — same real data, a Products-page
// framing around it (no pipeline/re-check controls, since this is a
// read-only catalog view, not the live-analysis flow).
// ------------------------------------------------------------
function ComplianceFullDetail({ d, categoryGroup, onBack }) {
  return (
    <>
      <Navbar />
      <DemoPage>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition">
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </button>

        <DemoCard
          className="flex items-center justify-between flex-wrap gap-4"
          accentColor={getCategoryColor(categoryGroup).color}
          tint
        >
          <div className="flex items-center gap-3">
            <EntityAvatar name={d.product.manufacturer} size="md" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{d.product.name}</h1>
              <p className="text-sm text-foreground-muted mt-1">{d.product.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ComplianceStatusChip status={d.violations.length === 0 ? 'Compliant' : 'Non-Compliant'} glow />
            <ScoreBadge score={d.scoreSummary.score} />
          </div>
        </DemoCard>

        <div className="grid sm:grid-cols-2 gap-6">
          <KeyValue label="Manufacturer" value={d.product.manufacturer} />
          <KeyValue label="Net Quantity" value={d.product.netQuantity} />
          <KeyValue label="MRP" value={d.product.mrp} />
          <KeyValue label="Category" value={d.product.category} />
          <KeyValue label="Country of Origin" value={d.product.countryOfOrigin} />
          <KeyValue label="FSSAI Lic. No." value={d.product.fssaiLicense} mono />
        </div>

        <div>
          <SectionTitle>Extracted Attributes (OCR)</SectionTitle>
          <DemoCard className="bg-white/[0.02]">
            <OcrExtractionDisplay lines={d.ocr.lines} />
          </DemoCard>
        </div>

        <div>
          <SectionTitle>Nutritional Information</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {d.nutrition.map((n) => (
              <DemoCard key={n.label} className="text-center py-4">
                <p className="text-lg font-bold text-foreground">{n.value}</p>
                <p className="text-xs text-foreground-muted mt-1">{n.label}</p>
              </DemoCard>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle sub={`${d.scoreSummary.passed.count} / ${d.findings.length} Passed`}>Compliance Findings</SectionTitle>
          <ComplianceSummaryStrip findings={d.findings} />
          <FindingsLedger findings={d.findings} violations={d.violations} />
        </div>

        <div>
          {d.violations.length > 0 ? (
            <>
              <SectionTitle sub="Why each check failed, and how to fix it">Violations &amp; Remediation</SectionTitle>
              <ViolationsPanel violations={d.violations} regulatoryReferences={d.regulatoryReferences} />
            </>
          ) : (
            <AllClearPanel />
          )}
        </div>

        <DemoCard>
          <SectionTitle>Applicable / Regulatory References</SectionTitle>
          <ul className="space-y-2 text-sm text-foreground-muted">
            {d.regulatoryReferences.map((r) => (
              <li key={r} className="flex gap-2">
                <FileText className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </DemoCard>

        <p className="text-xs text-foreground-muted text-center">
          Full analysis for this product runs through Check Compliance — this view mirrors that same real data for browsing here.
        </p>
      </DemoPage>
    </>
  );
}

// Small arrow indicator for the sortable column headers — neutral
// (both-direction) icon when this column isn't the active sort,
// a single directional arrow when it is.
function SortIndicator({ active, direction }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  return direction === 'asc' ? (
    <ArrowUp className="w-3 h-3 text-accent" />
  ) : (
    <ArrowDown className="w-3 h-3 text-accent" />
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? 'bg-accent text-white border-accent'
          : 'border-white/10 text-foreground-muted hover:border-accent/40 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function ActionButton({ icon: Icon, label }) {
  const [clicked, setClicked] = useState(false);
  return (
    <button
      onClick={() => setClicked(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-foreground hover:bg-white/[0.03] transition"
    >
      <Icon className="w-4 h-4" />
      {clicked ? 'Done' : label}
    </button>
  );
}
