// ============================================================
// LEGAL LENS — DEMO CHATBOT: LOCAL INTENT DETECTION + RESPONSES
// ============================================================
// This is the offline replacement for the real backend's
// `/api/chat` endpoint (Flask + Gemini + live DB). It never makes
// a network call — every "personal data" figure below is derived
// on the fly from PRODUCTS_CATALOG (the same 18-product catalog
// the Products/Dashboard demo pages already render), and every
// "general compliance" figure is authored regulatory content, not
// user data. This mirrors the real backend's own two-intent split
// (personal_data / general_compliance) closely enough that the
// UI's existing intent-based styling (see getIntentStyle in
// chatbot/page.jsx) keeps working unmodified.
// ============================================================

import { PRODUCTS_CATALOG } from './demoData';

// ----------------------------------------------------------
// Derived "your data" figures — computed once from the real
// catalog, never hand-typed, so they can't drift out of sync
// with the Products/Dashboard pages the way a hardcoded copy
// could. See verify_part10.cjs for the assertion that these
// match PRODUCTS_CATALOG exactly.
// ----------------------------------------------------------
export const PRODUCT_STATS = (() => {
  const total = PRODUCTS_CATALOG.length;
  const compliant = PRODUCTS_CATALOG.filter((p) => p.status === 'Compliant').length;
  const nonCompliant = total - compliant;
  const avgScore = Math.round(
    (PRODUCTS_CATALOG.reduce((sum, p) => sum + p.score, 0) / total) * 10
  ) / 10;

  return {
    total_products: total,
    compliant_products: compliant,
    non_compliant_products: nonCompliant,
    avg_compliance_score: avgScore,
  };
})();

export const CATEGORY_BREAKDOWN = (() => {
  const counts = {};
  PRODUCTS_CATALOG.forEach((p) => {
    counts[p.categoryGroup] = (counts[p.categoryGroup] || 0) + 1;
  });
  return counts;
})();

export const NON_COMPLIANT_PRODUCTS = PRODUCTS_CATALOG.filter((p) => p.status !== 'Compliant');

// ----------------------------------------------------------
// Authored general-compliance content. This is regulatory
// background, not user-specific data, so — unlike the section
// above — it's hand-written rather than derived from demoData.js.
// ----------------------------------------------------------
const COMPLIANCE_TOPICS = {
  overview: `The **Legal Metrology Act, 2009** (with the Legal Metrology (Packaged Commodities) Rules, 2011) is India's core law governing what must be declared on a pre-packaged product's label. It exists to protect consumers from short-weighting, hidden pricing, and misleading claims.\n\nThe main declarations it requires on every package are:\n\n• **Name and address** of the manufacturer, packer, or importer\n• **Net quantity** in standard units (weight, volume, or number)\n• **MRP** (Maximum Retail Price), inclusive of all taxes\n• **Month and year of manufacture/import**\n• **Country of origin** (for imported goods)\n• **Consumer care details** for complaints\n\nAsk me about any of these — MRP rules, net quantity, labeling, or country-of-origin — and I can go deeper on that one.`,

  mrp: `Under the **Legal Metrology (Packaged Commodities) Rules, 2011**, the MRP printed on a package must:\n\n• Be inclusive of all taxes (no "+ GST" fine print allowed)\n• Be printed in a font size proportionate to the package size\n• Not be altered by re-stickering over the original printed price\n• Be shown as "Maximum Retail Price ₹X, inclusive of all taxes"\n\nSelling above the declared MRP is a punishable offence under the Act.`,

  netQuantity: `**Net quantity** must be declared in standard metric units (grams/kilograms for weight, millilitres/litres for volume, or a plain count for number). Rules of note:\n\n• The declaration must be on the principal display panel, not hidden on a side panel\n• For most categories there's a minimum font size tied to the package's size\n• "Free" bonus quantity (e.g. "20% extra") must be shown separately from the base declared quantity, not merged into one number`,

  countryOfOrigin: `For imported pre-packaged goods, the **country of origin** (or manufacture/assembly) must be declared on the label, in addition to the standard declarations (net quantity, MRP, importer details, etc.). This is separate from — and in addition to — any Customs-level country-of-origin marking requirements.`,

  labeling: `Beyond MRP and net quantity, Legal Metrology labeling requirements also cover:\n\n• The manufacturer/packer/importer's **name and complete address**\n• **Month and year** of manufacture, packing, or import\n• A **consumer care / complaints** contact (phone, email, or address)\n• The **unit sale price** (e.g. price per 100g/100ml) for many categories, so consumers can compare across pack sizes\n\nGetting any of these wrong — missing, illegible, or in the wrong place on the pack — is what typically drives a product's compliance score down in this app's analysis.`,

  fssai: `**FSSAI licensing** (Food Safety and Standards Authority of India) is a separate regime from Legal Metrology, but both apply to packaged food products. FSSAI governs food safety, ingredient/allergen disclosure, and the license number printed on the pack; Legal Metrology governs the quantity/price/labeling declarations. A food product generally needs to satisfy both to be considered fully compliant.`,

  hsn: `**HSN (Harmonized System of Nomenclature) codes** are used for GST classification and customs purposes — they're not a Legal Metrology requirement themselves, but they're commonly captured alongside compliance data (as this app does) because they identify the product category for tax and trade reporting.`,
};

// ----------------------------------------------------------
// Intent classification — plain keyword/substring matching.
// This is intentionally not "real" NLP: it scores a message
// against two keyword sets and returns whichever intent scores
// higher, with a couple of small special cases (greetings,
// zero-score fallback) layered on top.
// ----------------------------------------------------------
const PERSONAL_DATA_KEYWORDS = [
  'my product', 'my products', 'products do i have', 'my catalog', 'my inventory',
  'my stat', 'my stats', 'my score', 'my compliance', 'my dashboard', 'my item',
  'compliance score', 'average score', 'avg score', 'how many product',
  'non-compliant product', 'non compliant product', 'compliant product',
  'total product', 'how many of my', 'which of my', 'my results', 'my scan',
  'my history', 'products i', 'products i have', 'products i own', 'i scanned',
];

const GENERAL_COMPLIANCE_KEYWORDS = [
  'legal metrology', 'metrology act', 'packaged commodities', 'what is compliance',
  'compliance mean', 'weights and measures', 'consumer protection act',
  'mrp rule', 'maximum retail price', 'net quantity', 'country of origin',
  'labeling requirement', 'label requirement', 'labelling requirement',
  'fssai', 'hsn code', 'what does the law say', 'what does the law require',
  'is it legal to', 'legal requirement', 'regulatory requirement',
  'unit sale price', 'date of manufacture', 'importer detail',
];

const GREETING_KEYWORDS = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'good morning', 'good evening'];

function scoreKeywords(message, keywords) {
  return keywords.reduce((count, kw) => (message.includes(kw) ? count + 1 : count), 0);
}

export function classifyIntent(rawMessage) {
  const message = rawMessage.trim().toLowerCase().replace(/[!?.]+$/g, '');

  if (!message) return 'fallback';

  const personalScore = scoreKeywords(message, PERSONAL_DATA_KEYWORDS);
  const complianceScore = scoreKeywords(message, GENERAL_COMPLIANCE_KEYWORDS);

  if (personalScore > 0 || complianceScore > 0) {
    return personalScore >= complianceScore ? 'personal_data' : 'general_compliance';
  }

  // Loose single-word fallbacks so common short phrasings ("products?",
  // "stats?", "score?") still land correctly even without a full
  // keyword-list phrase match above.
  if (/\bproduct/.test(message) || /\bcatalog/.test(message) || /\binventory/.test(message)) {
    return 'personal_data';
  }
  if (/\bstat|\bscore|\bcompliant\b/.test(message)) {
    return 'personal_data';
  }
  if (/\bregulat|\blaw\b|\bact\b|\brule/.test(message)) {
    return 'general_compliance';
  }

  if (GREETING_KEYWORDS.some((g) => message === g || message.startsWith(g + ' ') || message.startsWith(g + ','))) {
    return 'greeting';
  }

  return 'fallback';
}

function buildPersonalDataResponse(message) {
  const lower = message.toLowerCase();
  const s = PRODUCT_STATS;

  // "My stats" / score-flavored questions
  if (/\bstat|\bscore|\baverage|\bavg\b/.test(lower)) {
    return {
      content:
        `Here's a snapshot of your compliance stats, based on your ${s.total_products}-product catalog:\n\n` +
        `• **Total Products**: ${s.total_products}\n` +
        `• **Compliant**: ${s.compliant_products}\n` +
        `• **Non-Compliant**: ${s.non_compliant_products}\n` +
        `• **Average Compliance Score**: ${s.avg_compliance_score}\n\n` +
        `That average is pulled across every scanned product. Want the breakdown by category instead?`,
      user_context: { stats: s },
    };
  }

  // Non-compliant / "what's failing" questions
  if (/non-compliant|non compliant|\bfail|\bflag/.test(lower)) {
    const list = NON_COMPLIANT_PRODUCTS.map((p) => `• **${p.name}** (${p.manufacturer}) — score ${p.score}`).join('\n');
    return {
      content:
        `Out of your ${s.total_products} products, ${s.non_compliant_products} ${s.non_compliant_products === 1 ? 'is' : 'are'} currently non-compliant:\n\n${list || '(none right now — everything is compliant)'}\n\nWant me to pull up what specifically is flagged on that product?`,
      user_context: { stats: s },
    };
  }

  // Category breakdown questions
  if (/categor/.test(lower)) {
    const lines = Object.entries(CATEGORY_BREAKDOWN)
      .map(([cat, count]) => `• **${cat}**: ${count}`)
      .join('\n');
    return {
      content: `Your ${s.total_products} products break down by category as:\n\n${lines}\n\nLet me know if you'd like the compliance stats for a specific category.`,
      user_context: { stats: s },
    };
  }

  // Default "my products" overview
  const categoryLines = Object.entries(CATEGORY_BREAKDOWN)
    .map(([cat, count]) => `• **${cat}**: ${count}`)
    .join('\n');

  return {
    content:
      `You have **${s.total_products} products** on record, spanning these categories:\n\n${categoryLines}\n\n` +
      `Of those, **${s.compliant_products}** are compliant and **${s.non_compliant_products}** ${s.non_compliant_products === 1 ? 'is' : 'are'} non-compliant, with an average compliance score of **${s.avg_compliance_score}**.\n\n` +
      `Ask me for "my stats" for just the numbers, or ask about a specific category.`,
    user_context: { stats: s },
  };
}

function buildGeneralComplianceResponse(message) {
  const lower = message.toLowerCase();

  if (/mrp|maximum retail price/.test(lower)) return { content: COMPLIANCE_TOPICS.mrp };
  if (/net quantity/.test(lower)) return { content: COMPLIANCE_TOPICS.netQuantity };
  if (/country of origin|\borigin\b/.test(lower)) return { content: COMPLIANCE_TOPICS.countryOfOrigin };
  if (/label/.test(lower)) return { content: COMPLIANCE_TOPICS.labeling };
  if (/fssai/.test(lower)) return { content: COMPLIANCE_TOPICS.fssai };
  if (/hsn/.test(lower)) return { content: COMPLIANCE_TOPICS.hsn };

  return { content: COMPLIANCE_TOPICS.overview };
}

const GREETING_RESPONSE =
  `Hello! I'm your AI compliance assistant. I can help you with:\n\n` +
  `• **Personal Data Queries**: Ask about your products, compliance scores, and statistics\n` +
  `• **General Compliance**: Learn about regulations, rules, and requirements\n\n` +
  `How can I help you today?`;

const FALLBACK_RESPONSE =
  `I'm not quite sure what you're asking, but I can help with two kinds of questions:\n\n` +
  `• **Your data** — e.g. "What products do I have?", "What's my average compliance score?", "Which products are non-compliant?"\n` +
  `• **General compliance** — e.g. "What is the Legal Metrology Act?", "What are the MRP rules?", "What labeling is required?"\n\n` +
  `Try rephrasing your question along those lines.`;

// ----------------------------------------------------------
// Main entry point used by DemoChatbot — takes a raw typed
// message and returns the same shape the real backend's
// /api/chat response used to (message/intent/user_context/
// timestamp), so the rendering code in the UI doesn't need to
// know the difference.
// ----------------------------------------------------------
export function generateChatResponse(rawMessage) {
  const intent = classifyIntent(rawMessage);

  let payload;
  if (intent === 'personal_data') {
    payload = buildPersonalDataResponse(rawMessage);
  } else if (intent === 'general_compliance') {
    payload = buildGeneralComplianceResponse(rawMessage);
  } else if (intent === 'greeting') {
    payload = { content: GREETING_RESPONSE };
  } else {
    payload = { content: FALLBACK_RESPONSE };
  }

  return {
    message: payload.content,
    intent: intent === 'greeting' ? 'greeting' : intent,
    user_context: payload.user_context || null,
    timestamp: new Date().toISOString(),
  };
}

// ----------------------------------------------------------
// Example Q&A pairs — used both to seed confidence that the
// classifier generalizes beyond the 3 exact suggestion-chip
// strings, and directly imported by verify_part10.cjs so the
// verification script and the "real examples" shown to the
// user come from the same source instead of two hand-typed
// copies that could drift apart.
// ----------------------------------------------------------
export const EXAMPLE_QUERIES = [
  // The 3 existing suggested-prompt chips, verbatim
  { text: 'Show me my products with low compliance scores', expectedIntent: 'personal_data' },
  { text: 'What is the Legal Metrology Act?', expectedIntent: 'general_compliance' },
  { text: "What's my average compliance score?", expectedIntent: 'personal_data' },

  // Paraphrased personal-data questions
  { text: 'How many products do I have?', expectedIntent: 'personal_data' },
  { text: 'Which of my products are non-compliant?', expectedIntent: 'personal_data' },
  { text: 'Can you break my products down by category?', expectedIntent: 'personal_data' },
  { text: 'give me my stats', expectedIntent: 'personal_data' },

  // Paraphrased general-compliance questions
  { text: 'What are the rules around MRP?', expectedIntent: 'general_compliance' },
  { text: 'How should net quantity be declared on a package?', expectedIntent: 'general_compliance' },
  { text: 'What labeling requirements apply to packaged food?', expectedIntent: 'general_compliance' },
  { text: 'Do I need to show the country of origin?', expectedIntent: 'general_compliance' },

  // Off-script but should still route sensibly
  { text: 'What does FSSAI have to do with this?', expectedIntent: 'general_compliance' },
  { text: "what's an HSN code", expectedIntent: 'general_compliance' },
  { text: 'hi there', expectedIntent: 'greeting' },
  { text: 'tell me a joke', expectedIntent: 'fallback' },
];
