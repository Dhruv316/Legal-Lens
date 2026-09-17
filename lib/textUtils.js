// ============================================================
// LEGAL LENS — TEXT TRUNCATION HELPER
// ============================================================
// Plain word-boundary truncation, used as a defense-in-depth layer
// on top of CSS `truncate` for the Dashboard's real (often long)
// entity/product names — see Part 12 (Dashboard polish) report for
// the bug this fixes: cramped flex rows were leaving only ~1-2
// visible characters ("Hi…", "N…") before the CSS ellipsis kicked
// in. That was a layout-width bug (fixed at the call sites), but
// even with a fixed layout a long-enough real name (the dataset's
// worst case is 50 characters — "Gujarat Cooperative Milk Marketing
// Federation Ltd.") can still need truncating on a narrow card. This
// makes sure that *when* truncation is still needed, it lands on a
// word boundary instead of an arbitrary character, and never
// degenerates to a single leading character.
//
// This is intentionally NOT pixel-aware (it can't measure a
// container's actual rendered width) — callers pick a `maxChars`
// budget appropriate to the column they're rendering into. CSS
// `truncate` should still be applied alongside this at the call site
// as a fallback for viewport sizes narrower than assumed.
// ============================================================

/**
 * Truncates `text` to at most `maxChars` characters, breaking at the
 * last word boundary before that limit rather than cutting mid-word.
 * Falls back to a hard character cut only when the first word itself
 * is already longer than the budget (so a single pathologically long
 * word can't produce an empty/near-empty result).
 */
export function truncateAtWord(text, maxChars) {
  if (!text || text.length <= maxChars) return text || '';
  const slice = text.slice(0, maxChars + 1);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.35) {
    return text.slice(0, lastSpace).trimEnd() + '…';
  }
  return text.slice(0, maxChars).trimEnd() + '…';
}
