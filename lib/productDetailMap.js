// ============================================================
// LEGAL LENS — PRODUCT DETAIL DATA MAP
// ============================================================
// Part 6 of the "Way More" series. Extracted into its own plain-JS
// module (no JSX) so the routing logic that decides which detail
// data a given catalog product renders can be unit-verified from
// Node directly (see verify_part6.cjs), not just eyeballed in the
// browser.
//
// ------------------------------------------------------------
// WHY TWO "KINDS" OF FULL DETAIL EXIST
// ------------------------------------------------------------
// Part 6's brief asked to correct PRODUCTS_CATALOG's unreliable
// `full` flag so it accurately reflects which products have "a full
// detail dataset available" and named Maggi + Sunrise Organic Almond
// Butter as the two that should be `true`. That part is correct —
// both DO have a complete, real, hand-built dataset.
//
// But those two datasets are NOT the same shape:
//   - Maggi's is PRODUCTS_DATA — the original Products-page-detail
//     shape (variants, variant comparison, price analysis, market
//     history, related products...).
//   - Sunrise Organic Almond Butter's is CHECK_COMPLIANCE_DATA_VIOLATION
//     — the Check-Compliance-page shape (OCR fields, findings,
//     violations, regulatory references). No PRODUCTS_DATA-shaped
//     record (variants/price analysis/market history) exists for it
//     anywhere in this project.
//
// Fixing the `full` flag to `true` for the almond butter and then
// pointing its detail view at Maggi's PRODUCTS_DATA would just
// reproduce Bug 1 in a new form (a second product silently showing
// Maggi's data). Building a fake PRODUCTS_DATA-shaped record for it
// instead (invented variant sizes, invented market history, invented
// related products) would be fabrication — the exact thing Part 2
// and Part 5 both deliberately avoided for this project's other
// under-modeled products.
//
// So: both get `full: true` (both genuinely have a full, real
// dataset), but each renders through the detail template that
// matches the shape of data it actually has. `kind` below tells the
// component which template to use; `data` is the real, existing,
// already-verified export — nothing here is new or fabricated data.
// ------------------------------------------------------------

import { PRODUCTS_DATA, CHECK_COMPLIANCE_DATA_VIOLATION } from './demoData';

export const FULL_PRODUCT_DETAIL = {
  [PRODUCTS_DATA.product.name]: { kind: 'catalog', data: PRODUCTS_DATA },
  [CHECK_COMPLIANCE_DATA_VIOLATION.product.name]: { kind: 'compliance', data: CHECK_COMPLIANCE_DATA_VIOLATION },
};

/**
 * Returns the real detail dataset for a product, keyed by its exact
 * catalog name, or null if this product only has catalog-level
 * summary data (no full dataset of any kind exists for it).
 */
export function getFullDetailFor(productName) {
  return FULL_PRODUCT_DETAIL[productName] || null;
}
