'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  FileText,
  Eye,
  RotateCcw,
  Download,
  FileCheck,
  ShieldCheck,
  ShoppingCart,
  ExternalLink,
  Coins,
  Loader2,
  XCircle,
  X,
  Gift,
  UploadCloud,
  Link2,
  Scale,
  History,
  ChevronDown,
  ChevronUp,
  Trash2,
  Braces,
  Copy,
  Check,
} from 'lucide-react';
import Navbar from '../Navbar';
import {
  DemoPage,
  DemoCard,
  SectionTitle,
  ScoreBadge,
  TabRow,
  ProductHeader,
  KeyValue,
  OcrExtractionDisplay,
  PageHeader,
  Eyebrow,
  PrimaryButton,
  PipelineStages,
  IconChip,
  ComplianceSummaryStrip,
  FindingsLedger,
  ViolationsPanel,
  AllClearPanel,
} from '../demo/DemoUI';
import {
  CHECK_COMPLIANCE_DATA,
  CHECK_COMPLIANCE_DATA_VIOLATION,
  CHECK_COMPLIANCE_DATA_VIOLATION_FIXED,
  DEMO_PRODUCT,
  VIOLATION_PRODUCT,
  PRODUCTS_CATALOG,
} from '../../lib/demoData';
import { downloadComplianceReport } from '../../lib/reportGenerator';
import { CategoryIcon, EntityAvatar, ComplianceStatusChip } from '../demo/ItemIdentity';
import { truncateAtWord } from '../../lib/textUtils';

const TABS = ['Manufacturer Compliance', 'Product Image & OCR', 'Compliance Result'];

// Time each pipeline stage stays "active" before advancing, in ms.
const STAGE_DURATION_MS = 1400;

// Cached "products" the idle screen lets you pick between — a
// compliant reference product and one with real violations, so the
// demo can show both the pass case and the catch-a-problem case.
//
// These are the ONLY two PRODUCTS_CATALOG entries with a full
// check-compliance dataset (OCR fields, findings, pipeline stages —
// see CHECK_COMPLIANCE_DATA / CHECK_COMPLIANCE_DATA_VIOLATION in
// lib/demoData.js). The other 16 catalog products added in Part 2
// are summary-only (`full: false`) and were deliberately not given
// fabricated OCR/findings data — see that part's report. `categoryGroup`
// is read from the catalog rather than duplicated onto DEMO_PRODUCT /
// VIOLATION_PRODUCT so CategoryIcon always reflects the single source
// of truth for a product's category.
const PRODUCT_OPTIONS = [
  {
    key: 'maggi',
    product: DEMO_PRODUCT,
    tagline: 'Reference product — all checks pass',
    categoryGroup: PRODUCTS_CATALOG.find((p) => p.id === 1)?.categoryGroup,
    status: 'Compliant',
  },
  {
    key: 'almond',
    product: VIOLATION_PRODUCT,
    tagline: 'Imported product — 2 label issues found',
    categoryGroup: PRODUCTS_CATALOG.find((p) => p.id === 5)?.categoryGroup,
    status: 'Non-Compliant',
  },
];

// The remaining catalog entries — summary/browsing data only, no
// full AI pipeline behind them. Shown on the idle screen so the
// picker acknowledges the full 18-product catalog exists without
// pretending these run a real analysis (see Part 5 report).
//
// NOTE: this deliberately does NOT filter on PRODUCTS_CATALOG's own
// `full` flag. That flag is only `true` for id 1 (Maggi) — id 5
// (Sunrise Organic Almond Butter) is flagged `full: false` in the
// catalog even though CHECK_COMPLIANCE_DATA_VIOLATION shows it does
// have a complete dataset. Filtering on `full` would have wrongly
// listed the almond butter as "catalog browsing only" alongside the
// genuinely summary-only 16 (caught by verify_part5.cjs). Excluding
// by the two products actually wired into PRODUCT_OPTIONS is the
// correct, verified way to derive this list.
const FULL_DATASET_NAMES = new Set(PRODUCT_OPTIONS.map((opt) => opt.product.name));
const OTHER_CATALOG_PRODUCTS = PRODUCTS_CATALOG.filter((p) => !FULL_DATASET_NAMES.has(p.name));

// ------------------------------------------------------------
// Side-by-side comparison (Compliance Result view)
// ------------------------------------------------------------
// The comparison picker lets the user choose any of the 18
// PRODUCTS_CATALOG entries, but only Maggi and Sunrise Organic Almond
// Butter (the same two wired into PRODUCT_OPTIONS above) have a real
// CHECK_COMPLIANCE_DATA* dataset — OCR lines, findings, violations —
// behind them. For every other catalog entry this honestly falls
// back to that product's real catalog fields only (name, manufacturer,
// score, status) instead of fabricating OCR attributes or a
// violation count nothing ever computed for it, the same
// non-fabrication rule the "Full catalog" strip elsewhere on this
// page already follows for these 16 products.
function getFullDatasetForCatalogEntry(entry, fixedState) {
  if (!entry) return null;
  if (entry.name === DEMO_PRODUCT.name) return CHECK_COMPLIANCE_DATA;
  if (entry.name === VIOLATION_PRODUCT.name) {
    return fixedState ? CHECK_COMPLIANCE_DATA_VIOLATION_FIXED : CHECK_COMPLIANCE_DATA_VIOLATION;
  }
  return null;
}

// Manufacturing Date / Best Before only live inside `ocr.lines`, not
// on the richer `product` object — looked up by exact label, same as
// how the rest of this file already treats OCR fields.
function ocrValue(dataset, label) {
  return dataset?.ocr?.lines?.find((l) => l.label === label)?.value;
}

// Every row's value is read straight off a real dataset field
// (either the `product` object or its OCR lines) — nothing here is
// computed or invented for the comparison itself.
const COMPARE_FIELDS = [
  { key: 'manufacturer', label: 'Manufacturer', get: (ds) => ds?.product?.manufacturer },
  { key: 'countryOfOrigin', label: 'Country of Origin', get: (ds) => ds?.product?.countryOfOrigin },
  { key: 'netQuantity', label: 'Net Quantity', get: (ds) => ds?.product?.netQuantity },
  { key: 'mrp', label: 'MRP', get: (ds) => ds?.product?.mrpFull || ds?.product?.mrp },
  { key: 'mfgDate', label: 'Manufacturing Date', get: (ds) => ocrValue(ds, 'Manufacturing Date') },
  { key: 'bestBefore', label: 'Best Before / Expiry', get: (ds) => ocrValue(ds, 'Best Before') },
  { key: 'fssai', label: 'FSSAI Lic. No.', get: (ds) => ds?.product?.fssaiLicense },
];

// bAvailable=false (catalog-only secondary) always renders as
// "missing" rather than attempting a false match/diff verdict.
function compareTone(aVal, bVal, bAvailable) {
  if (!bAvailable || bVal == null || bVal === '') return { aTone: 'match', bTone: 'missing' };
  const differ = String(aVal ?? '').trim().toLowerCase() !== String(bVal).trim().toLowerCase();
  return differ ? { aTone: 'diff', bTone: 'diff' } : { aTone: 'match', bTone: 'match' };
}

const categoryGroupOf = (name) => PRODUCTS_CATALOG.find((p) => p.name === name)?.categoryGroup;

// idle -> running -> done
export default function DemoCheckCompliance() {
  const router = useRouter();
  const [status, setStatus] = useState('idle');
  const [stageIndex, setStageIndex] = useState(0);
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [productKey, setProductKey] = useState('maggi');
  const [fixed, setFixed] = useState(false); // has the almond product been re-checked into compliance?
  const [isRecheck, setIsRecheck] = useState(false); // is the current pipeline run a re-check?
  const timerRef = useRef(null);

  // Image upload input (new, idle-screen only). This is a frontend
  // demo with no real image recognition — the two upload slots just
  // capture a local preview (plain <input type="file"> + a
  // client-side object URL, no upload library). Once the user has
  // added at least one photo, a confirmation step asks them to pick
  // which of the 2 real cached demo products the photos are of, then
  // feeds that choice into the exact same startAnalysis()/state
  // machine the URL path and the demo-product picker already use —
  // see confirmUploadProduct below. No parallel pipeline is created.
  const [inputMode, setInputMode] = useState('url'); // 'url' | 'upload'
  const [uploadFront, setUploadFront] = useState(null); // { name, previewUrl } | null
  const [uploadBack, setUploadBack] = useState(null);

  // Simulated Compliance Report -> Affiliate -> Purchase -> Token loop.
  // Self-contained on this page only — it does not write to the
  // Rewards page's balance. See Phase 5 notes: nothing in this demo
  // shares state across pages, so this stays consistent with that.
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState('idle'); // idle | processing | success | fail
  const purchaseTimerRef = useRef(null);

  // Side-by-side comparison (Compliance Result view only). null
  // compareEntryId means "comparison open, still picking a product".
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareEntryId, setCompareEntryId] = useState(null);

  // Session audit trail — every completed compliance check run this
  // session, newest first. Plain in-memory React state (no
  // localStorage, no backend): it resets on page reload like the
  // rest of this demo's state, but persists across runs, tab
  // switches, and Scan Another Product within the same session.
  const [auditLog, setAuditLog] = useState([]);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [activeLogEntryId, setActiveLogEntryId] = useState(null);

  // "View as JSON" — shows the exact object driving the currently
  // visible result. No separate export shape: it's the same `d`
  // reference (CHECK_COMPLIANCE_DATA / _VIOLATION / _VIOLATION_FIXED)
  // that every tab on this page already renders from.
  const [jsonModalOpen, setJsonModalOpen] = useState(false);

  const datasetKey = productKey === 'almond' && fixed ? 'almondFixed' : productKey;
  const d = {
    maggi: CHECK_COMPLIANCE_DATA,
    almond: CHECK_COMPLIANCE_DATA_VIOLATION,
    almondFixed: CHECK_COMPLIANCE_DATA_VIOLATION_FIXED,
  }[datasetKey];
  const stages = d.pipeline;
  const selectedProduct = PRODUCT_OPTIONS.find((p) => p.key === productKey).product;

  // Pretty-printed straight off `d` itself — the same object every
  // tab already reads from — so this can never drift into a
  // hand-shaped summary of the data.
  const jsonString = useMemo(() => JSON.stringify(d, null, 2), [d]);

  // Resolved lazily from PRODUCTS_CATALOG each render — cheap, and
  // keeps this in sync if compareEntryId changes.
  const compareEntry = compareEntryId != null ? PRODUCTS_CATALOG.find((p) => p.id === compareEntryId) : null;
  const compareDataset = getFullDatasetForCatalogEntry(compareEntry, fixed);

  useEffect(() => {
    if (status !== 'running') return undefined;

    if (stageIndex >= stages.length - 1) {
      timerRef.current = setTimeout(() => {
        if (isRecheck) setFixed(true);
        setStatus('done');

        // Log this run in the session audit trail. A recheck always
        // resolves to the "fixed" almond dataset (the only recheck
        // path this demo has); any other run logs whatever dataset
        // was already selected before the pipeline started.
        const completedDatasetKey = isRecheck ? (productKey === 'almond' ? 'almondFixed' : productKey) : datasetKey;
        const completedDataset = {
          maggi: CHECK_COMPLIANCE_DATA,
          almond: CHECK_COMPLIANCE_DATA_VIOLATION,
          almondFixed: CHECK_COMPLIANCE_DATA_VIOLATION_FIXED,
        }[completedDatasetKey];
        const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        setAuditLog((prev) => [
          {
            id: entryId,
            timestamp: Date.now(),
            productName: completedDataset.product.name,
            productKey,
            datasetKey: completedDatasetKey,
            score: completedDataset.scoreSummary.score,
            grade: completedDataset.scoreSummary.letterGrade,
            violationCount: completedDataset.violations.length,
            passed: completedDataset.violations.length === 0,
            wasRecheck: isRecheck,
          },
          ...prev,
        ]);
        setActiveLogEntryId(entryId);
      }, STAGE_DURATION_MS);
    } else {
      timerRef.current = setTimeout(() => setStageIndex((i) => i + 1), STAGE_DURATION_MS);
    }

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stageIndex]);

  const startAnalysis = () => {
    setIsRecheck(false);
    setStageIndex(0);
    setStatus('running');
  };

  const startRecheck = () => {
    setIsRecheck(true);
    setStageIndex(0);
    setStatus('running');
    setPurchaseModalOpen(false);
    setPurchaseStatus('idle');
  };

  // Upload path -> confirmation -> same pipeline. Sets productKey
  // (exactly like clicking a demo-product card does) and then calls
  // the same startAnalysis() used by the URL/demo-picker path — no
  // separate state machine.
  const confirmUploadProduct = (key) => {
    setProductKey(key);
    startAnalysis();
  };

  const revokeUploads = () => {
    if (uploadFront?.previewUrl) URL.revokeObjectURL(uploadFront.previewUrl);
    if (uploadBack?.previewUrl) URL.revokeObjectURL(uploadBack.previewUrl);
  };

  const handleFileSelect = (slot, file) => {
    if (!file) return;
    const next = { name: file.name, previewUrl: URL.createObjectURL(file) };
    if (slot === 'front') {
      if (uploadFront?.previewUrl) URL.revokeObjectURL(uploadFront.previewUrl);
      setUploadFront(next);
    } else {
      if (uploadBack?.previewUrl) URL.revokeObjectURL(uploadBack.previewUrl);
      setUploadBack(next);
    }
  };

  const clearUpload = (slot) => {
    if (slot === 'front') {
      if (uploadFront?.previewUrl) URL.revokeObjectURL(uploadFront.previewUrl);
      setUploadFront(null);
    } else {
      if (uploadBack?.previewUrl) URL.revokeObjectURL(uploadBack.previewUrl);
      setUploadBack(null);
    }
  };

  const reset = () => {
    clearTimeout(timerRef.current);
    clearTimeout(purchaseTimerRef.current);
    revokeUploads();
    setStatus('idle');
    setStageIndex(0);
    setUrl('');
    setActiveTab(TABS[0]);
    setProductKey('maggi');
    setFixed(false);
    setIsRecheck(false);
    setPurchaseModalOpen(false);
    setPurchaseStatus('idle');
    setInputMode('url');
    setUploadFront(null);
    setUploadBack(null);
    setCompareOpen(false);
    setCompareEntryId(null);
    setActiveLogEntryId(null);
    setJsonModalOpen(false);
  };

  // Jump back to a past audit-log entry's result — restores the
  // exact product/fixed combination that entry recorded and drops
  // straight into its Compliance Result tab, done state.
  const viewLogEntry = (entry) => {
    clearTimeout(timerRef.current);
    setIsRecheck(false);
    setStatus('done');
    setProductKey(entry.productKey);
    setFixed(entry.datasetKey === 'almondFixed');
    setCompareOpen(false);
    setCompareEntryId(null);
    setActiveTab('Compliance Result');
    setActiveLogEntryId(entry.id);
  };

  const clearAuditLog = () => {
    setAuditLog([]);
    setActiveLogEntryId(null);
  };

  const openCompare = () => {
    setCompareOpen(true);
    setCompareEntryId(null);
  };

  const closeCompare = () => {
    setCompareOpen(false);
    setCompareEntryId(null);
  };

  const changeCompareProduct = () => setCompareEntryId(null);

  const openPurchaseModal = () => {
    setPurchaseStatus('idle');
    setPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    clearTimeout(purchaseTimerRef.current);
    setPurchaseModalOpen(false);
  };

  const simulatePurchase = (outcome) => {
    setPurchaseStatus('processing');
    purchaseTimerRef.current = setTimeout(() => setPurchaseStatus(outcome), 900);
  };

  if (status === 'idle') {
    const hasUpload = Boolean(uploadFront || uploadBack);

    return (
      <>
        <Navbar />
        <DemoPage>
          <PageHeader icon={FileCheck} label="Check Compliance" page="Check Compliance" code={selectedProduct.code} />

          {/* Bug fix #2 (wasted horizontal space): the previous
              layout wrapped everything in a single `max-w-xl
              mx-auto` card, leaving large empty margins on a full
              7xl-wide page (see Part 12's Dashboard report for the
              same class of issue). Replaced with a two-column
              arrangement — the input methods on the left, the demo
              product picker on the right — plus a full-width catalog
              strip below, so the page uses the available width
              instead of one narrow centered column. */}
          <div>
            <Eyebrow color="blue">AI Analysis</Eyebrow>
            <h1 className="text-2xl font-bold text-foreground">Check compliance</h1>
            <p className="text-sm text-foreground-muted mt-1">
              Paste a product URL, upload photos, or pick a cached demo product to run the full Legal Lens compliance pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: input methods — URL/name, or upload photos */}
            <DemoCard className="lg:col-span-7">
              <SectionTitle>Analyze a product</SectionTitle>

              <div className="inline-flex p-1 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
                <button
                  onClick={() => setInputMode('url')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    inputMode === 'url' ? 'bg-accent text-white' : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Enter URL/name
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    inputMode === 'upload' ? 'bg-accent text-white' : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload photos
                </button>
              </div>

              {inputMode === 'url' ? (
                <>
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                    <Search className="w-4 h-4 text-foreground-muted" />
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Enter product URL or name..."
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-foreground-muted"
                    />
                  </div>
                  <p className="text-xs text-foreground-muted mt-3">
                    This is a cached demo — pick one of the 2 fully-analyzed products on the right, then click Analyze Product.
                  </p>
                </>
              ) : (
                <>
                  {/* New Feature: Image Upload Input. Stacked below the
                      URL field's tab, not squeezed into the same row —
                      two full-size drag-and-drop slots so front/back
                      each stay usable. Plain HTML file inputs + native
                      drag-and-drop events, no upload library. */}
                  <div className="grid grid-cols-2 gap-3">
                    <UploadSlot
                      label="Front of pack"
                      file={uploadFront}
                      inputId="upload-front"
                      onSelect={(file) => handleFileSelect('front', file)}
                      onClear={() => clearUpload('front')}
                    />
                    <UploadSlot
                      label="Back of pack"
                      file={uploadBack}
                      inputId="upload-back"
                      onSelect={(file) => handleFileSelect('back', file)}
                      onClear={() => clearUpload('back')}
                    />
                  </div>

                  {hasUpload ? (
                    <div className="mt-5 pt-5 border-t border-white/[0.06]">
                      <p className="text-sm font-medium text-foreground mb-1">Which product are these photos of?</p>
                      <p className="text-xs text-foreground-muted mb-3">
                        This demo doesn&apos;t run real image recognition — pick the closest match and we&apos;ll run the
                        same cached compliance pipeline against it, same as the 2 demo products on the right.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {PRODUCT_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => confirmUploadProduct(opt.key)}
                            title={opt.product.name}
                            className="flex items-center gap-2 text-left px-3 py-2.5 rounded-lg border border-white/10 hover:border-accent/50 hover:bg-accent/5 transition"
                          >
                            <CategoryIcon category={opt.categoryGroup} size="sm" />
                            <span className="min-w-0 flex-1 text-sm font-medium text-foreground truncate">
                              {truncateAtWord(opt.product.name, 40)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground-muted mt-3">
                      Add at least one photo to match it against a cached demo product.
                    </p>
                  )}
                </>
              )}
            </DemoCard>

            {/* Right: demo product picker */}
            <DemoCard className="lg:col-span-5">
              <SectionTitle>Cached demo products</SectionTitle>
              <p className="text-[11px] uppercase tracking-widest text-foreground-muted mb-3">
                Full AI analysis — pick one, then Analyze
              </p>

              {/* Bug fix #1 (truncation): these two cards get the
                  whole card width now instead of being crammed two-
                  up inside a narrow max-w-xl container (that's what
                  produced "MAGGI 2..."). truncateAtWord is only a
                  fallback here — at this width both real names
                  (30 and 29 chars) render in full. */}
              <div className="space-y-3 mb-6">
                {PRODUCT_OPTIONS.map((opt) => (
                  <button key={opt.key} onClick={() => setProductKey(opt.key)} className="text-left block w-full">
                    <div
                      className={`px-4 py-3 rounded-xl border text-sm transition ${
                        productKey === opt.key
                          ? 'border-accent/50 bg-accent/10 text-foreground'
                          : 'border-white/10 text-foreground-muted hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <CategoryIcon category={opt.categoryGroup} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground truncate" title={opt.product.name}>
                              {truncateAtWord(opt.product.name, 50)}
                            </p>
                            <ComplianceStatusChip status={opt.status} size="sm" />
                          </div>
                          <p className="text-xs text-foreground-muted mt-1">{opt.tagline}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <PrimaryButton className="w-full py-3" onClick={startAnalysis}>
                Analyze Product
              </PrimaryButton>
            </DemoCard>
          </div>

          {/* Broader catalog — browsing context only. These 16
              products carry summary data (name, manufacturer, score,
              status) but no OCR/findings pipeline behind them, so
              they link out to Products rather than pretending to
              "Analyze" here. See Part 5 report.
              Bug fix #1 + #2: previously a single flex-wrap row of
              chips capped at `max-w-[9rem]`, which is what cut names
              like "Britannia Good Day Cas..." mid-word. Now a
              multi-column grid spanning the page's full width, so
              every real catalog name (longest is 37 chars) fits
              without truncating; truncateAtWord is kept as the
              fallback for anything that still overflows a cell. */}
          <DemoCard>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] uppercase tracking-widest text-foreground-muted">
                Full catalog ({PRODUCTS_CATALOG.length} products scanned)
              </p>
              <button
                onClick={() => router.push('/products')}
                className="text-xs text-accent hover:text-accent/80 transition font-medium"
              >
                Browse all →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {OTHER_CATALOG_PRODUCTS.map((p) => (
                <div
                  key={p.id}
                  title={`${p.name} — ${p.manufacturer}`}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]"
                >
                  <EntityAvatar name={p.manufacturer} size="sm" />
                  <span className="text-[11px] text-foreground-muted truncate">{truncateAtWord(p.name, 44)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-foreground-muted mt-3">
              These have catalog-level results only — full OCR &amp; findings analysis is available for the 2 products above.
            </p>
          </DemoCard>

          <AuditLogPanel
            entries={auditLog}
            onSelect={viewLogEntry}
            onClear={clearAuditLog}
            activeEntryId={activeLogEntryId}
            collapsed={logCollapsed}
            onToggleCollapse={() => setLogCollapsed((v) => !v)}
          />
        </DemoPage>
      </>
    );
  }

  if (status === 'running') {
    return (
      <>
        <Navbar />
        <DemoPage>
          <PageHeader icon={FileCheck} label="Check Compliance" page="Check Compliance" code={selectedProduct.code} />
          <div>
            <Eyebrow color="blue">{isRecheck ? 'Re-Verifying Product' : 'AI Analysis In Progress'}</Eyebrow>
            <h1 className="text-2xl font-bold text-foreground">{isRecheck ? 'Re-checking product...' : 'Analyzing product...'}</h1>
            <p className="text-sm text-foreground-muted mt-1">
              {selectedProduct.name} — running the full Legal Lens compliance pipeline
              {isRecheck ? ' against the updated label.' : '.'}
            </p>
          </div>
          <PipelineStages stages={stages} activeIndex={stageIndex} progressLabel="Compliance pipeline" />

          <AuditLogPanel
            entries={auditLog}
            onSelect={viewLogEntry}
            onClear={clearAuditLog}
            activeEntryId={activeLogEntryId}
            collapsed={logCollapsed}
            onToggleCollapse={() => setLogCollapsed((v) => !v)}
          />
        </DemoPage>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <DemoPage>
        <PageHeader icon={FileCheck} label="Check Compliance" page="Check Compliance" code={d.product.code} />

        <div>
          <Eyebrow color="blue">AI Analysis / Cached Result</Eyebrow>
          <h1 className="text-2xl font-bold text-foreground">Check compliance</h1>
          <p className="text-sm text-foreground-muted mt-1">A complete product analysis, ready instantly from the Legal Lens demo cache.</p>
        </div>

        <ProductHeader product={d.product} />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-sm text-foreground-muted">
              <span className="text-foreground font-medium">{d.product.name}</span> — {d.product.subtitle}
            </p>
            <ComplianceStatusChip status={d.violations.length === 0 ? 'Compliant' : 'Non-Compliant'} size="sm" />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={compareOpen ? closeCompare : openCompare}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                compareOpen
                  ? 'border-accent/40 bg-accent/10 text-foreground'
                  : 'border-white/10 text-foreground-muted hover:text-foreground hover:border-white/20'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              {compareOpen ? 'Exit Comparison' : 'Compare'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Scan Another Product
            </button>
          </div>
        </div>

        {compareOpen ? (
          <DemoCard>
            {!compareEntry ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <SectionTitle sub="Pick a second product to compare against the one you're currently viewing.">
                    Compare with…
                  </SectionTitle>
                  <button
                    onClick={closeCompare}
                    className="p-2 rounded-lg hover:bg-white/5 transition shrink-0"
                    aria-label="Close comparison"
                  >
                    <X className="w-4 h-4 text-foreground-muted" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {PRODUCTS_CATALOG.filter((p) => p.name !== d.product.name).map((p) => {
                    const hasFull = getFullDatasetForCatalogEntry(p, fixed) != null;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setCompareEntryId(p.id)}
                        className="text-left px-4 py-3 rounded-xl border border-white/10 hover:border-accent/50 hover:bg-accent/5 transition"
                      >
                        <div className="flex items-start gap-3">
                          <CategoryIcon category={p.categoryGroup} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm text-foreground truncate" title={p.name}>
                                {truncateAtWord(p.name, 42)}
                              </p>
                              <ComplianceStatusChip status={p.status} size="sm" />
                            </div>
                            <p className="text-xs text-foreground-muted mt-1 truncate">{p.manufacturer}</p>
                            <p className={`text-[10px] mt-1.5 font-medium ${hasFull ? 'text-accent' : 'text-foreground-muted'}`}>
                              {hasFull ? 'Full analysis available' : 'Catalog summary only'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <ComparisonView
                primary={d}
                secondaryEntry={compareEntry}
                secondaryDataset={compareDataset}
                onChangeProduct={changeCompareProduct}
                onExit={closeCompare}
              />
            )}
          </DemoCard>
        ) : (
        <DemoCard>
          <TabRow tabs={TABS} active={activeTab} onChange={setActiveTab} />

          <div className="pt-6">
            {activeTab === 'Manufacturer Compliance' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-6 h-6" />
                  {d.manufacturerCheck.headline}
                </div>
                <p className="text-sm text-foreground-muted max-w-2xl">{d.manufacturerCheck.description}</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <KeyValue label="Country of Origin" value={d.manufacturerCheck.countryOfOrigin} />
                  <KeyValue label="Manufacturer Location" value={d.manufacturerCheck.manufacturerLocation} />
                  <KeyValue label="Manufacturer Address" value={d.manufacturerCheck.manufacturerAddress} />
                  <KeyValue label="Verified Address" value={d.manufacturerCheck.verifiedAddress} />
                </div>
              </div>
            )}

            {activeTab === 'Product Image & OCR' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionTitle>Extracted Attributes (OCR)</SectionTitle>
                    <button
                      onClick={() => setShowRawOcr((v) => !v)}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Raw OCR
                    </button>
                  </div>
                  <DemoCard key={datasetKey} className="surface-tint-warm">
                    <OcrExtractionDisplay lines={d.ocr.lines} />
                    {showRawOcr && (
                      <pre className="mt-6 pt-4 border-t border-white/10 text-[11px] text-foreground-muted whitespace-pre-wrap font-mono">
{d.ocr.lines.map((l) => `${l.label}: ${l.value}`).join('\n')}
                      </pre>
                    )}
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
              </div>
            )}

            {activeTab === 'Compliance Result' && (
              <div className="space-y-8">
                {productKey === 'almond' && fixed && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-emerald-300">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                      Re-checked — both label issues have been resolved and this product now passes every check.
                    </p>
                  </div>
                )}

                {/* Part 11 structural redesign: the result used to be
                    one long single column — findings, then violations,
                    then a 2-up row, then key takeaways, then the
                    purchase card, then actions, six stacked sections
                    end to end. It's now a two-column layout: the score
                    and the "what to do about it" actions live in a
                    narrower right rail that stays visible while the
                    findings/violations/takeaways content reads down
                    the wider left column, the way an actual audit
                    report UI (score + actions pinned beside the
                    findings, not below them) would lay this out. Every
                    field/value below is identical to before. */}
                <div className="grid lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2 space-y-8">
                    <div key={datasetKey}>
                      <SectionTitle sub={`${d.scoreSummary.passed.count} / ${d.findings.length} Passed`}>
                        Compliance Findings
                      </SectionTitle>
                      <ComplianceSummaryStrip findings={d.findings} />
                      <FindingsLedger findings={d.findings} violations={d.violations} />
                    </div>

                    <div key={`${datasetKey}-violations`}>
                      {d.violations.length > 0 ? (
                        <>
                          <SectionTitle sub="Why each check failed, and how to fix it">Violations & Remediation</SectionTitle>
                          <ViolationsPanel violations={d.violations} regulatoryReferences={d.regulatoryReferences} />
                        </>
                      ) : (
                        <AllClearPanel />
                      )}
                    </div>

                    <DemoCard>
                      <SectionTitle>Key Takeaways</SectionTitle>
                      <ul className="space-y-2 text-sm text-foreground">
                        {d.keyTakeaways.map((k) => (
                          <li key={k} className="flex gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                            {k}
                          </li>
                        ))}
                      </ul>
                    </DemoCard>

                    <DemoCard>
                      <SectionTitle>Applicable / Regulatory References</SectionTitle>
                      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground-muted">
                        {d.regulatoryReferences.map((r) => (
                          <li key={r} className="flex gap-2">
                            <FileText className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </DemoCard>
                  </div>

                  <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
                    <DemoCard className="flex flex-col items-center justify-center text-center elevation-elevated">
                      <ScoreBadge
                        score={d.scoreSummary.score}
                        size="lg"
                        letterGrade={d.scoreSummary.letterGrade}
                        ocrConfidence={d.scoreSummary.ocrConfidence}
                        semanticAccuracy={d.scoreSummary.semanticAccuracy}
                        glow
                      />
                      <div className="grid grid-cols-2 gap-4 mt-6 w-full text-xs">
                        <Stat label="Passed" value={`${d.scoreSummary.passed.count} (${d.scoreSummary.passed.pct}%)`} color="text-emerald-300" />
                        <Stat label="Failed" value={`${d.scoreSummary.failed.count} (${d.scoreSummary.failed.pct}%)`} color="text-red-300" />
                        <Stat label="Warning" value={`${d.scoreSummary.warning.count} (${d.scoreSummary.warning.pct}%)`} color="text-amber-300" />
                        <Stat label="N/A" value={`${d.scoreSummary.notApplicable.count} (${d.scoreSummary.notApplicable.pct}%)`} color="text-foreground-muted" />
                      </div>
                    </DemoCard>

                    {d.violations.length === 0 ? (
                      <DemoCard className="border-accent/20 elevation-elevated">
                        <div className="flex flex-col items-start gap-4">
                          <IconChip icon={ShoppingCart} tone="emerald" size="lg" />
                          <div>
                            <SectionTitle sub={`Earn ${d.product.tokensReward} Meta-Tokens for this compliant product.`}>
                              Complete Purchase &amp; Earn Rewards
                            </SectionTitle>
                            <div className="flex items-center gap-2 mb-3">
                              <EntityAvatar name={d.product.manufacturer} size="sm" />
                              <span className="text-xs text-foreground-muted">{d.product.manufacturer}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <a
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                View affiliate listing
                              </a>
                              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-accent/30 bg-accent/10 text-accent">
                                <Coins className="w-3.5 h-3.5" />
                                {d.product.tokensReward} MT
                              </span>
                            </div>
                          </div>
                          <PrimaryButton className="flex items-center justify-center gap-2 w-full" onClick={openPurchaseModal}>
                            <ShoppingCart className="w-4 h-4" />
                            Buy Now
                          </PrimaryButton>
                        </div>
                      </DemoCard>
                    ) : (
                      <DemoCard className="flex items-start gap-3 text-foreground-muted border-white/[0.06] elevation-elevated">
                        <Coins className="w-5 h-5 shrink-0 text-foreground-muted" />
                        <p className="text-sm">
                          Resolve the violations above and re-check this product to unlock the purchase &amp; Meta-Token flow.
                        </p>
                      </DemoCard>
                    )}

                    <div className="flex flex-col gap-3">
                      {d.violations.length > 0 && (
                        <PrimaryButton className="flex items-center justify-center gap-2" onClick={startRecheck}>
                          <RotateCcw className="w-4 h-4" />
                          Re-check
                        </PrimaryButton>
                      )}
                      <button
                        onClick={() => downloadComplianceReport(d)}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${
                          d.violations.length > 0
                            ? 'border border-white/10 text-foreground hover:bg-white/[0.03]'
                            : 'bg-accent hover:bg-accent/90 text-white'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        Download Compliance Report
                      </button>
                      <button
                        onClick={() => setJsonModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-foreground hover:bg-white/[0.03] transition"
                      >
                        <Braces className="w-4 h-4" />
                        View as JSON
                      </button>
                      <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-foreground hover:bg-white/[0.03] transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Scan Another Product
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DemoCard>
        )}

        <AuditLogPanel
          entries={auditLog}
          onSelect={viewLogEntry}
          onClear={clearAuditLog}
          activeEntryId={activeLogEntryId}
          collapsed={logCollapsed}
          onToggleCollapse={() => setLogCollapsed((v) => !v)}
        />
      </DemoPage>

      {/* Simulated purchase modal — Compliance Report -> Affiliate -> Purchase -> Token */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-white/[0.06] shadow-xl shadow-black/50 rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={closePurchaseModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>

            {purchaseStatus === 'idle' && (
              <>
                <div className="text-center mb-6">
                  <IconChip icon={ShoppingCart} tone="emerald" size="lg" />
                  <h3 className="text-lg font-bold text-foreground mt-4">Simulate Purchase</h3>
                  <p className="text-sm text-foreground-muted">Choose an outcome to test the Meta-Token reward.</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 mb-6 space-y-2">
                  <div className="flex items-center gap-2 pb-2 mb-1 border-b border-white/[0.06]">
                    <EntityAvatar name={d.product.manufacturer} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{d.product.name}</p>
                      <p className="text-[11px] text-foreground-muted truncate">{d.product.manufacturer}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Product</span>
                    <span className="font-medium text-foreground">{d.product.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted">Tokens to Earn</span>
                    <span className="flex items-center gap-1.5 font-semibold text-accent">
                      <Coins className="w-4 h-4" />
                      {d.product.tokensReward} MT
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => simulatePurchase('success')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Success
                  </button>
                  <button
                    onClick={() => simulatePurchase('fail')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Fail
                  </button>
                </div>
              </>
            )}

            {purchaseStatus === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
                <p className="text-sm text-foreground-muted">Processing purchase...</p>
              </div>
            )}

            {purchaseStatus === 'success' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 success-icon-pop">
                  <Gift className="w-8 h-8 text-emerald-300" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Purchase Successful</h3>
                <p className="text-sm text-foreground-muted mb-4">Your Meta-Tokens have been credited.</p>
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-center justify-center gap-2">
                  <Coins className="w-5 h-5 text-accent" />
                  <span className="text-xl font-bold text-accent">+{d.product.tokensReward} MT</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closePurchaseModal}
                    className="flex-1 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-foreground hover:bg-white/[0.03] transition"
                  >
                    Close
                  </button>
                  <PrimaryButton className="flex-1" onClick={() => router.push('/rewards')}>
                    View Rewards
                  </PrimaryButton>
                </div>
              </div>
            )}

            {purchaseStatus === 'fail' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-300" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Purchase Failed</h3>
                <p className="text-sm text-foreground-muted mb-6">No tokens were awarded. You can try again.</p>
                <div className="flex gap-3">
                  <button
                    onClick={closePurchaseModal}
                    className="flex-1 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-foreground hover:bg-white/[0.03] transition"
                  >
                    Close
                  </button>
                  <PrimaryButton className="flex-1" onClick={() => setPurchaseStatus('idle')}>
                    Try Again
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {jsonModalOpen && (
        <JsonViewModal
          jsonString={jsonString}
          productName={d.product.name}
          productCode={d.product.code}
          onClose={() => setJsonModalOpen(false)}
        />
      )}
    </>
  );
}

// New Feature: Image Upload Input — a single front/back drag-and-drop
// slot. Plain HTML file input + native drag/drop events (no upload
// library). The file is never actually processed/analyzed — this is
// a frontend-only demo, so all this does is hold a local preview
// (an object URL) until the "which product is this" confirmation
// step picks one of the 2 real cached demo products.
function UploadSlot({ label, file, inputId, onSelect, onClear }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onSelect(dropped);
  };

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative flex flex-col items-center justify-center gap-1.5 h-36 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-accent/50 transition cursor-pointer overflow-hidden group"
    >
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />
      {file ? (
        <>
          <img src={file.previewUrl} alt={`${label} preview`} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span className="text-xs text-white font-medium">Change photo</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
          >
            <X className="w-3 h-3" />
          </button>
          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
            {label}
          </span>
        </>
      ) : (
        <>
          <UploadCloud className="w-6 h-6 text-foreground-muted" />
          <span className="text-xs font-medium text-foreground-muted">{label}</span>
          <span className="text-[10px] text-foreground-muted/70">Click or drag to upload</span>
        </>
      )}
    </label>
  );
}

// ------------------------------------------------------------
// Side-by-side comparison content
// ------------------------------------------------------------
// `primary` is always a full CHECK_COMPLIANCE_DATA* object (the
// Compliance Result view only renders this once analysis is done).
// `secondaryDataset` is the same kind of object when the picked
// product happens to be one of the 2 with a full dataset, or null
// when it's one of the other 16 catalog-only entries — in which case
// `secondaryEntry` (its PRODUCTS_CATALOG record) is used instead for
// whatever real fields it does carry (name, manufacturer, score,
// status). Nothing is fabricated for the missing side; those cells
// render as an explicit "not available" state instead.
function ComparisonView({ primary, secondaryEntry, secondaryDataset, onChangeProduct, onExit }) {
  const bAvailable = Boolean(secondaryDataset);
  const bProductLike = secondaryDataset ? secondaryDataset.product : secondaryEntry;

  const aScore = primary.scoreSummary.score;
  const aGrade = primary.scoreSummary.letterGrade;
  const bScore = bAvailable ? secondaryDataset.scoreSummary.score : secondaryEntry.score;
  const bGrade = bAvailable ? secondaryDataset.scoreSummary.letterGrade : null;
  const scoreDiffers = aScore !== bScore;

  const aViolationCount = primary.violations.length;
  const bViolationCount = bAvailable ? secondaryDataset.violations.length : null;
  const violationsDiffer = bAvailable && aViolationCount !== bViolationCount;

  const aStatus = aViolationCount === 0 ? 'Compliant' : 'Non-Compliant';
  const bStatus = bAvailable ? (bViolationCount === 0 ? 'Compliant' : 'Non-Compliant') : secondaryEntry.status;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <SectionTitle sub="Fields that differ or are missing on either side are highlighted.">
          Comparing Products
        </SectionTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onChangeProduct}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Change product
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition px-2.5 py-1.5 rounded-lg border border-white/10"
          >
            <X className="w-3.5 h-3.5" />
            Exit comparison
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] gap-x-3 sm:gap-x-4">
        <div />
        <CompareProductCard
          name={primary.product.name}
          subtitle={primary.product.subtitle}
          manufacturer={primary.product.manufacturer}
          category={categoryGroupOf(primary.product.name)}
          status={aStatus}
        />
        <CompareProductCard
          name={bProductLike.name}
          subtitle={bProductLike.subtitle}
          manufacturer={bProductLike.manufacturer}
          category={categoryGroupOf(bProductLike.name)}
          status={bStatus}
          catalogOnly={!bAvailable}
        />

        <CompareRow
          label="Compliance Score / Grade"
          aText={`${aScore}/100${aGrade ? ` · Grade ${aGrade}` : ''}`}
          bText={`${bScore}/100${bGrade ? ` · Grade ${bGrade}` : ' · Grade not available (catalog summary only)'}`}
          aTone={scoreDiffers ? 'diff' : 'match'}
          bTone={scoreDiffers ? 'diff' : 'match'}
        />

        <CompareRow
          label="Violations Found"
          aText={`${aViolationCount}`}
          bText={bAvailable ? `${bViolationCount}` : `Not tracked here — catalog status: ${secondaryEntry.status}`}
          aTone={bAvailable ? (violationsDiffer ? 'diff' : 'match') : 'match'}
          bTone={bAvailable ? (violationsDiffer ? 'diff' : 'match') : 'missing'}
        />

        {COMPARE_FIELDS.map((f) => {
          const aVal = f.get(primary);
          const bVal = f.get(secondaryDataset);
          const { aTone, bTone } = compareTone(aVal, bVal, bAvailable);
          return (
            <CompareRow
              key={f.key}
              label={f.label}
              aText={aVal || 'Not available'}
              bText={bAvailable ? bVal || 'Not available' : 'Not available — catalog summary only'}
              aTone={aTone}
              bTone={bTone}
            />
          );
        })}
      </div>
    </div>
  );
}

// Top row of the comparison grid — one compact identity card per
// side (icon, name, manufacturer, real compliance status chip).
function CompareProductCard({ name, subtitle, manufacturer, category, status, catalogOnly = false }) {
  return (
    <div className="pb-4 mb-2 border-b border-white/[0.08]">
      <div className="flex items-start gap-2.5">
        <CategoryIcon category={category} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate" title={name}>
            {truncateAtWord(name, 34)}
          </p>
          {subtitle && <p className="text-[11px] text-foreground-muted truncate">{subtitle}</p>}
          <p className="text-[11px] text-foreground-muted mt-0.5 truncate">{manufacturer}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <ComplianceStatusChip status={status} size="sm" />
            {catalogOnly && <span className="text-[10px] text-foreground-muted/80 italic">Catalog summary only</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// One label + two value cells, laid out as direct grid children (via
// a Fragment) so every row lines up under the same 3-column template
// as the header row above it.
function CompareRow({ label, aText, bText, aTone = 'match', bTone = 'match' }) {
  return (
    <>
      <div className="py-3 border-b border-white/[0.05] flex items-center">
        <p className="text-xs font-medium text-foreground-muted">{label}</p>
      </div>
      <CompareValueCell text={aText} tone={aTone} />
      <CompareValueCell text={bText} tone={bTone} />
    </>
  );
}

// tone: 'match' (neutral), 'diff' (amber — both sides have a value
// but they don't agree), or 'missing' (muted/dashed — the catalog-
// only side has no real data for this field).
function CompareValueCell({ text, tone = 'match' }) {
  const toneClasses =
    tone === 'missing'
      ? 'text-foreground-muted italic border-dashed border-white/10 bg-white/[0.02]'
      : tone === 'diff'
      ? 'text-amber-200 border-amber-500/30 bg-amber-500/10'
      : 'text-foreground border-white/[0.06] bg-white/[0.02]';

  return (
    <div className="py-3 border-b border-white/[0.05]">
      <div className={`text-sm rounded-lg px-3 py-2 border ${toneClasses}`}>{text}</div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white/[0.03] rounded-lg px-3.5 py-3">
      <p className={`font-semibold ${color}`}>{value}</p>
      <p className="text-foreground-muted mt-1">{label}</p>
    </div>
  );
}

// ------------------------------------------------------------
// Session Audit Trail
// ------------------------------------------------------------
// A persistent (session-only, in-memory — no localStorage, no
// backend) log of every compliance check run on this page. Each
// entry is logged once, right when its pipeline actually finishes
// (see the completion effect above) — never re-logged just from
// viewing it again. Timestamps are relative and tick forward live,
// same convention as the "Data as of" clock on the Dashboard page
// (see DemoDashboard.jsx's formatRelativeTime).
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

// Ticks once a second so relative labels ("2 minutes ago") advance
// on their own without the rest of the page re-rendering — isolated
// to this panel via its own interval, same pattern as
// DemoDashboard's DataHealthPanel.
function useTicker(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function AuditLogPanel({ entries, onSelect, onClear, activeEntryId, collapsed, onToggleCollapse }) {
  const now = useTicker(1000);

  return (
    <DemoCard>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2.5 text-left"
          aria-expanded={!collapsed}
        >
          <IconChip icon={History} tone="blue" size="sm" />
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Activity Log
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-foreground-muted" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-foreground-muted" />
              )}
            </p>
            <p className="text-xs text-foreground-muted">
              {entries.length === 0
                ? 'No compliance checks run yet this session'
                : `${entries.length} check${entries.length === 1 ? '' : 's'} run this session`}
            </p>
          </div>
        </button>

        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-red-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear log
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          {entries.length === 0 ? (
            <p className="text-sm text-foreground-muted text-center py-6">
              Run a compliance check above and it&apos;ll show up here, timestamped, for the rest of your session.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => onSelect(entry)}
                  className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border transition ${
                    activeEntryId === entry.id
                      ? 'border-accent/50 bg-accent/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                >
                  {entry.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-300 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate" title={entry.productName}>
                      {truncateAtWord(entry.productName, 44)}
                      {entry.wasRecheck && <span className="text-foreground-muted font-normal"> · re-check</span>}
                    </p>
                    <p className="text-[11px] text-foreground-muted mt-0.5">
                      {formatRelativeTime(now - entry.timestamp)} · Score {entry.score}/100
                      {entry.grade ? ` · Grade ${entry.grade}` : ''} · {entry.violationCount} violation
                      {entry.violationCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <ComplianceStatusChip status={entry.passed ? 'Compliant' : 'Non-Compliant'} size="sm" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </DemoCard>
  );
}

// ------------------------------------------------------------
// View as JSON
// ------------------------------------------------------------
// Renders the literal object driving the current result — the same
// `d` reference (CHECK_COMPLIANCE_DATA / _VIOLATION / _VIOLATION_FIXED
// from lib/demoData.js) that ProductHeader, the tabs, and every other
// piece of this page already read from. `jsonString` is
// JSON.stringify(d, null, 2) computed once in the parent (see the
// `jsonString` useMemo above) — this component only formats and
// displays it, it never re-derives or reshapes the data itself.

// A small dependency-free JSON syntax highlighter: tokenizes with one
// regex pass (matching quoted strings/keys, booleans, null, and
// numbers) and renders each token as a colored <span>, leaving
// structural characters (braces, brackets, commas, whitespace) as
// plain text in between. No HTML injection risk — every fragment is
// rendered as a literal React text node, never dangerouslySetInnerHTML.
const JSON_TOKEN_REGEX =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function highlightJson(jsonString) {
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  JSON_TOKEN_REGEX.lastIndex = 0;
  while ((match = JSON_TOKEN_REGEX.exec(jsonString)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={key++}>{jsonString.slice(lastIndex, match.index)}</span>);
    }
    const token = match[0];
    let cls = 'text-foreground';
    if (token.startsWith('"')) {
      cls = /:\s*$/.test(token) ? 'text-accent' : 'text-emerald-300';
    } else if (token === 'true' || token === 'false') {
      cls = 'text-amber-300';
    } else if (token === 'null') {
      cls = 'text-foreground-muted';
    } else {
      cls = 'text-sky-300';
    }
    nodes.push(
      <span key={key++} className={cls}>
        {token}
      </span>
    );
    lastIndex = JSON_TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < jsonString.length) {
    nodes.push(<span key={key++}>{jsonString.slice(lastIndex)}</span>);
  }
  return nodes;
}

function JsonViewModal({ jsonString, productName, productCode, onClose }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);
  const highlighted = useMemo(() => highlightJson(jsonString), [jsonString]);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permissions can be denied by the browser — the
      // button just won't flip to "Copied", nothing else to do here
      // without a backend or a fabricated success state.
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(productCode || 'compliance-result').toString().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-white/[0.06] shadow-xl shadow-black/50 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <IconChip icon={Braces} tone="blue" size="sm" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Compliance Result — Raw JSON</h3>
              <p className="text-xs text-foreground-muted truncate">
                {productName} — the exact data object driving this result
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition shrink-0" aria-label="Close">
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        <div className="overflow-auto p-5 flex-1 min-h-0">
          <pre className="text-[12px] leading-relaxed font-mono whitespace-pre-wrap break-words">
            <code>{highlighted}</code>
          </pre>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 border-t border-white/[0.06] shrink-0">
          <p className="text-[11px] text-foreground-muted">
            {jsonString.length.toLocaleString()} characters — read directly from lib/demoData.js
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border border-white/10 text-foreground hover:bg-white/[0.03] transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download as .json
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
