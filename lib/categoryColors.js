// ============================================================
// LEGAL LENS — CATEGORY COLOR MAPPING
// ============================================================
// Part 1 (Color System Overhaul) deliverable: a single lookup for
// "what color does this category get" so every later part (cards,
// charts, badges) draws from one source instead of hardcoding hexes
// per page.
//
// Keys are the real category strings from
// lib/demoData.js -> DASHBOARD_DATA.categoryBreakdown[].category.
// Values point at the CSS custom properties defined in
// app/globals.css (never hardcode hexes in components — read the
// token, or use getCategoryColor() below to get resolved values for
// contexts that can't use CSS vars, e.g. inline SVG on the server).
//
// Deliberately NOT a hardcoded per-page switch: any category string
// not in this map (e.g. a 6th category added later) safely falls
// back to the neutral "Other" token set instead of throwing or
// rendering unstyled.
// ============================================================

export const CATEGORY_COLOR_TOKENS = {
  'Food & Beverages': {
    var: '--category-food-beverages',
    varLight: '--category-food-beverages-light',
    varDark: '--category-food-beverages-dark',
    // Dark-mode pass: base hue brightened to stay vivid against the dark
    // page/card background; `light` is now a dark tinted surface (not a
    // pale wash) and `dark` is the previous light-mode base, reused as a
    // readable mid-tone line/text color against dark cards.
    color: '#FF9166',
    light: '#3A2A22',
    dark: '#F2734A',
  },
  'Personal Care': {
    var: '--category-personal-care',
    varLight: '--category-personal-care-light',
    varDark: '--category-personal-care-dark',
    color: '#F088B3',
    light: '#3A2530',
    dark: '#E0679B',
  },
  Household: {
    var: '--category-household',
    varLight: '--category-household-light',
    varDark: '--category-household-dark',
    color: '#2DD4CB',
    light: '#1B3634',
    dark: '#17A6A0',
  },
  'Health & Wellness': {
    var: '--category-health-wellness',
    varLight: '--category-health-wellness-light',
    varDark: '--category-health-wellness-dark',
    color: '#7C9BFF',
    light: '#232B45',
    dark: '#5B7FE0',
  },
  Others: {
    var: '--category-other',
    varLight: '--category-other-light',
    varDark: '--category-other-dark',
    color: '#A6ACC2',
    light: '#2A2C38',
    dark: '#8B92A6',
  },
};

// Fallback for any category not in the map above — same shape as
// every other entry, styled as neutral/"Other" rather than the brand
// accent, so an unrecognized category never silently reads as
// "the primary purple thing" it isn't.
const FALLBACK_TOKEN = CATEGORY_COLOR_TOKENS.Others;

/**
 * Look up the color token set for a category name.
 * Always returns a full { var, varLight, varDark, color, light, dark }
 * object — falls back to the neutral "Other" set for unknown/missing
 * category strings, so callers never need their own null-handling.
 */
export function getCategoryColor(category) {
  return CATEGORY_COLOR_TOKENS[category] || FALLBACK_TOKEN;
}

/**
 * Convenience for inline styles: returns a style object pre-wired
 * with the `--category-color` / `--category-color-dark` custom
 * properties consumed by the `.bar-fill-category` / `.card-accent-tint`
 * utility classes in globals.css, e.g.
 *   <div className="card-accent-tint" style={categoryColorVars(cat)} />
 */
export function categoryColorVars(category) {
  const token = getCategoryColor(category);
  return {
    '--category-color': token.color,
    '--category-color-dark': token.dark,
    '--category-color-light': token.light,
  };
}

export const CATEGORY_NAMES = Object.keys(CATEGORY_COLOR_TOKENS);
