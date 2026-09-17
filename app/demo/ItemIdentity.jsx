'use client';

import {
  Utensils,
  Sparkles,
  SprayCan,
  HeartPulse,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { getCategoryColor } from '../../lib/categoryColors';

// ============================================================
// LEGAL LENS — PER-ITEM VISUAL IDENTITY SYSTEM
// ============================================================
// Part 3 of the "Way More" series. Builds on Part 1's color system
// (lib/categoryColors.js, app/globals.css tokens) to replace the
// "every card is a gray box with a package icon" pattern with
// components that actually vary by what they represent.
//
// ------------------------------------------------------------
// WHEN TO USE WHAT
// ------------------------------------------------------------
// CategoryIcon    — anything representing a PRODUCT'S CATEGORY
//                    (product cards/rows, category legends/filters,
//                    anywhere a product's categoryGroup needs a
//                    glanceable icon). Color + icon both vary by
//                    category, sourced from lib/categoryColors.js.
//
// EntityAvatar    — anything representing a COMPANY/ORGANIZATION
//                    (manufacturer, brand owner, importer,
//                    distributor rows in Entities/Products/Seller
//                    Verification). Letter-mark avatar, like a SaaS
//                    org avatar with no logo — color + initials both
//                    vary by company name, not by category, since
//                    an entity has no single category of its own
//                    (Hindustan Unilever alone spans two).
//
// ComplianceStatusChip — a DENSE pass/fail or risk-tier indicator
//                    for catalog/list rows (a products table, an
//                    entities list) where the full-page treatments
//                    already built (FindingsLedger's per-requirement
//                    rows, the Entities risk ladder's tier cards)
//                    would be too heavy. Same icon language as both
//                    of those — reuse this instead of re-deriving a
//                    third color/icon mapping for the same statuses.
//
// StatChip        — any small numeric or label/value fact that
//                    currently renders as bare text (a count, a
//                    score, a date, "X products", "Y% compliant").
//                    Not a status — no pass/fail meaning, just a
//                    slightly more visible container for a fact.
// ============================================================

// ------------------------------------------------------------
// CategoryIcon
// ------------------------------------------------------------
// One real icon per real category (not one icon re-tinted five
// ways) plus that category's color from getCategoryColor(). Falls
// back to the same neutral "Other" treatment as the color system
// itself for any unrecognized category string.
const CATEGORY_ICON_MAP = {
  'Food & Beverages': Utensils,
  'Personal Care': Sparkles,
  Household: SprayCan,
  'Health & Wellness': HeartPulse,
  Others: Package,
};

const ICON_CHIP_DIMENSIONS = {
  sm: { box: 'w-9 h-9', icon: 'w-4 h-4', text: 'text-[11px]' },
  md: { box: 'w-11 h-11', icon: 'w-5 h-5', text: 'text-sm' },
  lg: { box: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-base' },
};

/**
 * Colored icon chip for a product's category. Uses a genuinely
 * different icon per category (not just a re-tinted package box),
 * so a grid of mixed-category products is scannable by shape as
 * well as color.
 */
export function CategoryIcon({ category, size = 'md', className = '' }) {
  const token = getCategoryColor(category);
  const Icon = CATEGORY_ICON_MAP[category] || CATEGORY_ICON_MAP.Others;
  const dims = ICON_CHIP_DIMENSIONS[size] || ICON_CHIP_DIMENSIONS.md;

  return (
    <div
      className={`${dims.box} rounded-xl flex items-center justify-center border shrink-0 ${className}`}
      style={{
        backgroundColor: token.light,
        borderColor: token.color,
        color: token.dark,
      }}
      title={category}
    >
      <Icon className={dims.icon} strokeWidth={2} />
    </div>
  );
}

// ------------------------------------------------------------
// EntityAvatar
// ------------------------------------------------------------
// Deterministic letter-mark avatar: same name always yields the
// same initials and the same color (no randomness, so a company
// looks the same everywhere it appears).
//
// Color is a hue derived from the full name (hash % 360), rendered
// at a fixed saturation/lightness that matches the app's soft-but-
// vivid palette (the same S/L neighborhood as --accent, --secondary,
// --tertiary), rather than picked from a small fixed palette. With
// only ~8 fixed colors, two of the real 17 entities in this project
// land on the exact same color AND the same two-letter initials
// (Britannia Industries Limited / Beiersdorf India Pvt. Ltd. both
// hash to the same slot) — genuinely indistinguishable, which fails
// this component's whole purpose. A 360-value hue space instead of
// an 8-value palette index removes that collision for the real
// data (verified against all 17 entity names — see Verification in
// the Part 3 report) while keeping the same saturation/lightness
// character as the rest of the app's colors.
const AVATAR_SATURATION = 58;
const AVATAR_LIGHTNESS = 46;
// Muted variant (Products table enhancement): each row's avatar hue
// is independent of its category, so once row backgrounds carry a
// cohesive per-category tint (see .row-category-tint in
// globals.css), the avatar's own full-saturation random hue visually
// competes with it — two unrelated color statements on one row.
// Opt-in only (`muted` prop below), scoped to this one table context
// — the avatar system itself, and every other place it's used
// (Entities, product detail headers), is unchanged.
const AVATAR_SATURATION_MUTED = 26;
const AVATAR_LIGHTNESS_MUTED = 34;

const AVATAR_STOPWORDS = new Set(['the', 'of', 'and', '&']);

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // keep as 32-bit int
  }
  return Math.abs(hash);
}

/**
 * Derives a 1-2 letter initials mark from a company name, skipping
 * filler words ("The", "of", "&") so e.g. "The Himalaya Drug
 * Company" reads as "HD" rather than "Th".
 */
function getInitials(name = '') {
  const words = name
    .replace(/[().,]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !AVATAR_STOPWORDS.has(w.toLowerCase()));
  const first = words[0]?.[0] || name[0] || '?';
  const second = words[1]?.[0] || '';
  return (first + second).toUpperCase();
}

const AVATAR_DIMENSIONS = {
  sm: { box: 'w-9 h-9', text: 'text-[11px]' },
  md: { box: 'w-11 h-11', text: 'text-sm' },
  lg: { box: 'w-14 h-14', text: 'text-base' },
};

/**
 * Letter-mark avatar for a company/organization — a colored circle
 * with the company's initials, in the style of a SaaS org avatar
 * rendered when there's no logo image (there are no logo assets in
 * this project). Color and initials are both derived from `name`,
 * so every distinct manufacturer/importer/distributor gets its own
 * stable, genuinely different look instead of the same building
 * icon.
 */
export function EntityAvatar({ name, size = 'md', className = '', muted = false }) {
  const dims = AVATAR_DIMENSIONS[size] || AVATAR_DIMENSIONS.md;
  const hue = hashString(name || '') % 360;
  const saturation = muted ? AVATAR_SATURATION_MUTED : AVATAR_SATURATION;
  const lightness = muted ? AVATAR_LIGHTNESS_MUTED : AVATAR_LIGHTNESS;
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const initials = getInitials(name);

  return (
    <div
      className={`${dims.box} rounded-full flex items-center justify-center shrink-0 font-bold text-white ${dims.text} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials}
    </div>
  );
}

// ------------------------------------------------------------
// ComplianceStatusChip
// ------------------------------------------------------------
// Same classification + icon language as FindingsLedger's per-row
// pass/fail treatment (filled emerald circle vs. outlined red
// circle) and the Entities risk ladder's tier icons (ShieldAlert /
// AlertTriangle / CheckCircle2), compressed into one dense chip for
// catalog/list contexts. Not a re-derivation of those — a smaller
// sibling that shares their exact color + icon meaning so a status
// reads the same whether it's in a full ledger row or a table cell.
// Beauty & Color Pass, Part 3: each tier also carries the exact
// box-shadow value its matching `.glow-danger` / `.glow-warning` /
// `.glow-success` utility class in globals.css already defines (same
// rgba figures, copied here rather than re-derived) so a chip's
// optional `glow`/`elevated` props below can combine an ambient glow
// with `var(--shadow-card)` in one inline box-shadow. Plain
// class-stacking can't do this: both a glow-* class and
// .elevation-card set the same `box-shadow` property, so applying
// both classes to one element would just let whichever is later in
// the stylesheet silently win instead of layering, and this chip is
// the one place (Seller Verification's verification badges) that
// needs both effects on the same element at once.
const COMPLIANCE_TIERS = [
  {
    test: /high\s?risk/i,
    icon: ShieldAlert,
    bg: 'bg-red-500/15',
    ring: 'ring-red-200',
    text: 'text-red-300',
    iconBg: 'bg-red-500',
    glowShadow: '0 0 0 1px rgba(239, 68, 68, 0.10), 0 0 28px 6px rgba(239, 68, 68, 0.38)',
  },
  {
    test: /fail|non-?compliant|violation|rejected/i,
    icon: AlertCircle,
    bg: 'bg-red-500/10',
    ring: 'ring-red-200',
    text: 'text-red-300',
    iconBg: 'bg-card',
    iconOutline: true,
    glowShadow: '0 0 0 1px rgba(239, 68, 68, 0.10), 0 0 28px 6px rgba(239, 68, 68, 0.38)',
  },
  {
    test: /medium\s?risk|pending|warning|review/i,
    icon: AlertTriangle,
    bg: 'bg-amber-500/15',
    ring: 'ring-amber-200',
    text: 'text-amber-300',
    iconBg: 'bg-amber-500',
    glowShadow: '0 0 0 1px rgba(245, 158, 11, 0.10), 0 0 28px 6px rgba(245, 158, 11, 0.35)',
  },
  {
    test: /pass|compliant|active|verified|low\s?risk|in stock/i,
    icon: CheckCircle2,
    bg: 'bg-emerald-500/15',
    ring: 'ring-emerald-200',
    text: 'text-emerald-300',
    iconBg: 'bg-emerald-500',
    glowShadow: '0 0 0 1px rgba(16, 185, 129, 0.10), 0 0 28px 6px rgba(16, 185, 129, 0.35)',
  },
];
const FALLBACK_TIER = {
  icon: CheckCircle2,
  bg: 'bg-white/5',
  ring: 'ring-card/10',
  text: 'text-foreground-muted',
  iconBg: 'bg-foreground-muted',
  glowShadow: null,
};

function classifyComplianceStatus(status = '') {
  return COMPLIANCE_TIERS.find((t) => t.test.test(status)) || FALLBACK_TIER;
}

/**
 * Dense pass/fail or risk-tier chip for catalog/list rows — a
 * products table, an entities list, a search results grid. Pairs a
 * small filled/outlined icon circle with the status label, using
 * the same color+icon meaning as the full-page FindingsLedger and
 * risk-ladder treatments, just compact.
 *
 * `glow` / `elevated` (Beauty & Color Pass, Part 3) are optional,
 * additive-only depth props — every existing call site (which passes
 * neither) renders exactly as before. `glow` adds this chip's own
 * status-colored ambient glow (the tier's `glowShadow` above, same
 * values as `.glow-success` / `.glow-warning` / `.glow-danger`);
 * `elevated` adds the standard `--shadow-card` resting depth. Combined
 * via inline `boxShadow` (not stacked utility classes) so the two
 * effects layer instead of one silently overriding the other.
 */
export function ComplianceStatusChip({ status = 'Compliant', size = 'sm', glow = false, elevated = false }) {
  const tier = classifyComplianceStatus(status);
  const Icon = tier.icon;
  const dense = size === 'sm';

  const shadowParts = [];
  if (elevated) shadowParts.push('var(--shadow-card)');
  if (glow && tier.glowShadow) shadowParts.push(tier.glowShadow);
  const style = shadowParts.length ? { boxShadow: shadowParts.join(', ') } : undefined;

  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1.5 ${dense ? 'px-2 py-0.5' : 'px-2.5 py-1'} rounded-full ${tier.bg} ring-1 ${tier.ring}`}
    >
      <span
        className={`${dense ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded-full flex items-center justify-center shrink-0 ${
          tier.iconOutline ? `border-2 border-red-400 ${tier.iconBg}` : `${tier.iconBg} text-white`
        }`}
      >
        <Icon className={`${dense ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${tier.iconOutline ? 'text-red-500' : ''}`} />
      </span>
      <span className={`${dense ? 'text-[10px]' : 'text-xs'} font-semibold tracking-wide ${tier.text}`}>
        {status}
      </span>
    </span>
  );
}

// ------------------------------------------------------------
// StatChip
// ------------------------------------------------------------
// A slightly-more-visible container for a scattered numeric fact
// (a count, a score, a date) that currently renders as bare text —
// not a status, so it deliberately does not borrow the
// pass/fail/risk color language above.
const STAT_CHIP_TONES = {
  blue: { bg: 'bg-foreground-muted/10', text: 'text-foreground-muted', iconText: 'text-foreground-muted' },
  accent: { bg: 'bg-accent/10', text: 'text-foreground', iconText: 'text-accent' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', iconText: 'text-emerald-300' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-300', iconText: 'text-amber-300' },
  teal: { bg: 'bg-teal-500/15', text: 'text-teal-300', iconText: 'text-teal-300' },
};

/**
 * Small labeled data point — icon + label/value pair with a soft
 * colored background, for scattered facts (product counts, scores,
 * dates) that would otherwise be plain text with no visual
 * treatment at all.
 */
export function StatChip({ icon: Icon, label, value, tone = 'blue', className = '' }) {
  const toneClasses = STAT_CHIP_TONES[tone] || STAT_CHIP_TONES.blue;

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${toneClasses.bg} ${className}`}>
      {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${toneClasses.iconText}`} />}
      <div className="leading-tight">
        {label && (
          <p className={`text-[9px] uppercase tracking-wide opacity-70 ${toneClasses.text}`}>{label}</p>
        )}
        <p className={`text-xs font-bold ${toneClasses.text}`}>{value}</p>
      </div>
    </div>
  );
}
