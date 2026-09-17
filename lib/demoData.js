// ============================================================
// LEGAL LENS — DEMO / CACHE DATA
// ============================================================
// Static, deterministic data reproducing the reference product
// analysis flow. Consumed directly by the Demo* components so
// that each tab renders instantly with no backend round trip.
//
// Source of truth: LEGAL_LENS_HACKATHON_DEMO_CACHE_SPEC_FINAL.md
// ============================================================

// ----------------------------------------------------------
// Global demo product (used throughout the main analysis flow)
// ----------------------------------------------------------
export const DEMO_PRODUCT = {
  code: 'B0192UNUGO',
  name: 'MAGGI 2-Minute Instant Noodles',
  subtitle: 'Masala Noodles With Goodness Of Iron',
  brand: 'Maggi',
  manufacturer: 'Nestlé India Limited',
  netQuantity: '70g (Pouch)',
  mrp: '₹14.00',
  mrpFull: '₹14.00 (incl. of all taxes)',
  countryOfOrigin: 'India',
  fssaiLicense: '10012064000053',
  category: 'Instant Noodles',
  hsnCode: '1902',
  score: 100,
  // Meta-Tokens simulated as earned once this product's compliance
  // report is generated and a (simulated) purchase is completed.
  tokensReward: 10,
};

// ----------------------------------------------------------
// TAB 1 — DASHBOARD
// ----------------------------------------------------------
export const DASHBOARD_DATA = {
  welcomeName: 'Dhruv',
  tagline: 'Scan. Verify. Stay Compliant.',
  searchPlaceholder: 'Enter product name, brand or scan code...',
  scanCta: 'Scan Product',

  // 18 total scanned products = the full PRODUCTS_CATALOG below (17
  // compliant, 1 non-compliant — Sunrise Organic Almond Butter).
  // See the Part 2 data-integrity script for the assertion that this
  // always matches PRODUCTS_CATALOG.length.
  metrics: {
    scanned: 18,
    compliant: 17,
    nonCompliant: 1,
    pendingReview: 0,
  },

  // Activity feed, not a full duplicate of the catalog — a realistic
  // "recent activity" list is shorter than the whole catalog. The
  // first 5 entries are unchanged from the original build (id 0-4);
  // ids 5-9 are new, pulled from the Part 2 catalog expansion, each
  // referencing an existing PRODUCTS_CATALOG entry by name/manufacturer.
  recentScans: [
    {
      id: 0,
      name: 'Sunrise Organic Almond Butter',
      manufacturer: 'Sunrise Organic Foods Inc.',
      status: 'Non-Compliant',
      time: 'Just now',
    },
    {
      id: 1,
      name: 'MAGGI 2-Minute Instant Noodles',
      manufacturer: 'Nestle India Limited',
      status: 'Compliant',
      time: '2 mins ago',
    },
    {
      id: 2,
      name: "Coca-Cola Original Taste",
      manufacturer: 'Coca-Cola India Pvt. Ltd.',
      status: 'Compliant',
      time: '15 mins ago',
    },
    {
      id: 3,
      name: "Lay's Classic Salted",
      manufacturer: 'PepsiCo India Holdings',
      status: 'Compliant',
      time: '1 hour ago',
    },
    {
      id: 4,
      name: 'Parle-G Biscuits',
      manufacturer: 'Parle Products Pvt. Ltd.',
      status: 'Compliant',
      time: '3 hours ago',
    },
    {
      id: 5,
      name: 'Amul Butter',
      manufacturer: 'Gujarat Cooperative Milk Marketing Federation Ltd.',
      status: 'Compliant',
      time: '5 hours ago',
    },
    {
      id: 6,
      name: 'Dove Nourishing Body Wash',
      manufacturer: 'Hindustan Unilever Limited',
      status: 'Compliant',
      time: '1 day ago',
    },
    {
      id: 7,
      name: 'Surf Excel Easy Wash Detergent',
      manufacturer: 'Hindustan Unilever Limited',
      status: 'Compliant',
      time: '2 days ago',
    },
    {
      id: 8,
      name: 'Dabur Chyawanprash',
      manufacturer: 'Dabur India Limited',
      status: 'Compliant',
      time: '3 days ago',
    },
    {
      id: 9,
      name: 'Cello Butterfly Storage Container Set',
      manufacturer: 'Cello World Limited',
      status: 'Compliant',
      time: '5 days ago',
    },
  ],

  quickActions: [
    { key: 'scan', title: 'Scan a Product', desc: 'Instant compliance check', path: 'check-compliance' },
    { key: 'seller', title: 'Verify a Seller', desc: 'Check seller credibility', path: 'seller-verification' },
    { key: 'products', title: 'Browse Products', desc: 'View past scans', path: 'products' },
    { key: 'entities', title: 'View Entities', desc: 'Explore manufacturers', path: 'entities' },
  ],

  // score / compliant.pct / nonCompliant.pct are round(count / 18 * 100)
  // against the real PRODUCTS_CATALOG totals — see the Part 2
  // data-integrity script for the exact assertion.
  complianceOverview: {
    score: 94,
    compliant: { count: 17, pct: 94 },
    nonCompliant: { count: 1, pct: 6 },
    pendingReview: { count: 0, pct: 0 },
  },

  // `count` = how many PRODUCTS_CATALOG entries carry this
  // categoryGroup; `pct` = % of that category's products that are
  // Compliant (matches CategoryBar's "N% compliant" pill in
  // DemoDashboard.jsx — NOT a share-of-total). Food & Beverages is
  // the only category carrying the one non-compliant product
  // (Sunrise Organic Almond Butter), so it's the only pct below 100.
  categoryBreakdown: [
    { category: 'Food & Beverages', count: 8, pct: 88 },
    { category: 'Personal Care', count: 4, pct: 100 },
    { category: 'Household', count: 3, pct: 100 },
    { category: 'Health & Wellness', count: 2, pct: 100 },
    { category: 'Others', count: 1, pct: 100 },
  ],

  // Ordered by product count across PRODUCTS_CATALOG, descending
  // (Hindustan Unilever Limited is the only manufacturer with more
  // than one product — Dove + Surf Excel); ties kept in catalog
  // order. See the Part 2 data-integrity script.
  topManufacturers: [
    'Hindustan Unilever Limited',
    'Nestle India Limited',
    'Coca-Cola India Pvt. Ltd.',
    'PepsiCo India Holdings',
    'Parle Products Pvt. Ltd.',
    'Britannia Industries Limited',
  ],
};

// ----------------------------------------------------------
// Shared staged-pipeline copy — drives the animated analysis
// sequence shown between "Analyze Product" and the tabbed
// result view. Reused by every product dataset (compliant or
// violation) so the pipeline visual stays identical regardless
// of which product is being analyzed / re-checked.
// ----------------------------------------------------------
const PIPELINE_STAGES = [
  {
    key: 'upload',
    label: 'Upload / Input',
    detail: 'Fetching product listing and reference label image...',
  },
  {
    key: 'ai',
    label: 'AI Processing',
    detail: 'Initializing Legal Lens compliance engine...',
  },
  {
    key: 'ocr',
    label: 'OCR & Attribute Extraction',
    detail: 'Reading label text and extracting structured attributes...',
  },
  {
    key: 'analysis',
    label: 'Compliance Analysis',
    detail: 'Cross-checking attributes against mandatory declarations...',
  },
  {
    key: 'reasoning',
    label: 'Regulatory Reasoning',
    detail: 'Applying Legal Metrology & FSSAI rule set...',
  },
  {
    key: 'scoring',
    label: 'Confidence & Scoring',
    detail: 'Computing OCR confidence, semantic accuracy and final grade...',
  },
];

// ----------------------------------------------------------
// TAB 2 — CHECK COMPLIANCE
// ----------------------------------------------------------
export const CHECK_COMPLIANCE_DATA = {
  product: DEMO_PRODUCT,

  manufacturerCheck: {
    passed: true,
    headline: 'MANUFACTURER COMPLIANCE CHECK PASSED',
    description:
      'This product passes the manufacturer compliance check. The manufacturer address is within India as expected for products with Indian origin.',
    countryOfOrigin: 'India',
    manufacturerLocation: 'India (IN)',
    manufacturerAddress: 'Nestlé India Limited, Ludhiana - Ferozepur Road\nMoga - 142001, Punjab',
    verifiedAddress: 'Ferozepur Rd, Moga, Punjab 142001, India',
  },

  ocr: {
    lines: [
      { label: 'Brand', value: 'Maggi' },
      { label: 'Product Name', value: '2-Minute Instant Noodles' },
      { label: 'Generic Name', value: 'Instant Noodles' },
      { label: 'Category', value: 'Instant Noodles' },
      { label: 'HSN Code', value: '1902' },
      { label: 'Variants', value: 'Masala Noodles' },
      { label: 'Net Quantity', value: '70g' },
      { label: 'MRP', value: '₹14.00 (incl. of all taxes)' },
      { label: 'Manufacturer', value: 'Nestlé India Limited' },
      { label: 'Packer', value: 'Nestlé India Limited, Moga, Punjab' },
      { label: 'Importer', value: 'Not Applicable (Domestically Manufactured)' },
      { label: 'Address', value: 'Ferozepur Road, Moga - 142001, Punjab' },
      { label: 'Country of Origin', value: 'India' },
      { label: 'FSSAI Lic. No.', value: '10012064000053' },
      { label: 'Manufacturing Date', value: 'See on pack (batch-coded)' },
      { label: 'Best Before', value: '9 Months From Manufacture' },
      { label: 'Language', value: 'English, Hindi' },
      { label: 'Other Info', value: 'Contains Wheat, May Contain Milk, Soy' },
    ],
  },

  nutrition: [
    { label: 'Energy', value: '431 kcal' },
    { label: 'Protein', value: '8.2 g' },
    { label: 'Carbohydrate', value: '60.1 g' },
    { label: 'Total Sugars', value: '2.9 g' },
    { label: 'Total Fat', value: '16.3 g' },
    { label: 'Sodium', value: '812 mg' },
  ],

  findings: [
    { requirement: 'Manufacturer Information', status: 'Passed' },
    { requirement: 'Country of Origin', status: 'Passed' },
    { requirement: 'Net Quantity', status: 'Passed' },
    { requirement: 'MRP (Maximum Retail Price)', status: 'Passed' },
    { requirement: 'Date Marking (Mfg. & Expiry)', status: 'Passed' },
    { requirement: 'Ingredients Declaration', status: 'Passed' },
    { requirement: 'Nutritional Information', status: 'Passed' },
  ],

  regulatoryReferences: [
    'FSSAI (Packaging & Labelling) Regulations, 2020',
    'FSSAI (Labelling) Regulations, 2020',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Consumer Protection Act, 2019',
    'Food Safety and Standards Act, 2006',
  ],

  scoreSummary: {
    score: 100,
    letterGrade: 'A+',
    ocrConfidence: 97,
    semanticAccuracy: 100,
    passed: { count: 7, pct: 100 },
    failed: { count: 0, pct: 0 },
    warning: { count: 0, pct: 0 },
    notApplicable: { count: 0, pct: 0 },
  },

  pipeline: PIPELINE_STAGES,

  // No violations on the reference product — kept as an empty array
  // (rather than omitted) so consuming components can treat every
  // dataset's `violations` field the same way.
  violations: [],

  keyTakeaways: [
    'Product is compliant with all applicable Indian regulations.',
    'All mandatory information is present and correctly labelled.',
    'No critical or major issues found.',
    'Ready for sale in the Indian market.',
  ],
};

// ----------------------------------------------------------
// TAB 2 — CHECK COMPLIANCE (VIOLATION CASE)
// ----------------------------------------------------------
// A second demo product, deliberately non-compliant, so the demo
// can show *how* Legal Lens catches problems — not just that
// everything passes. Two label declarations are incomplete:
// importer address, and the "inclusive of all taxes" MRP wording.
// `CHECK_COMPLIANCE_DATA_VIOLATION` is the as-scanned state;
// `CHECK_COMPLIANCE_DATA_VIOLATION_FIXED` is what "Re-check"
// simulates landing on once the issues are (notionally) corrected.
// ----------------------------------------------------------
export const VIOLATION_PRODUCT = {
  code: 'B0D7ALMNUT',
  name: 'Sunrise Organic Almond Butter',
  subtitle: 'Creamy Unsweetened Almond Butter, 340g',
  brand: 'Sunrise Organic',
  manufacturer: 'Sunrise Organic Foods Inc.',
  netQuantity: '340g (Jar)',
  mrp: '₹899.00',
  mrpFull: '₹899.00',
  countryOfOrigin: 'USA',
  fssaiLicense: '10019022004521',
  category: 'Spreads & Nut Butters',
  hsnCode: '2008',
  score: 62,
  // Higher MRP than the reference product, so a bigger simulated
  // token reward once it's compliant and (simulated) purchased.
  // Carried through to CHECK_COMPLIANCE_DATA_VIOLATION_FIXED via spread below.
  tokensReward: 90,
};

const VIOLATION_OCR_LINES = [
  { label: 'Brand', value: 'Sunrise Organic' },
  { label: 'Product Name', value: 'Organic Almond Butter' },
  { label: 'Generic Name', value: 'Almond Butter' },
  { label: 'Category', value: 'Spreads & Nut Butters' },
  { label: 'HSN Code', value: '2008' },
  { label: 'Variants', value: 'Creamy, Unsweetened' },
  { label: 'Net Quantity', value: '340g' },
  { label: 'MRP', value: '₹899.00' },
  { label: 'Manufacturer', value: 'Sunrise Organic Foods Inc., Portland, Oregon, USA' },
  { label: 'Imported By', value: 'Sunrise Organic Foods Inc.' },
  { label: 'Importer Address', value: 'Not printed on label' },
  { label: 'Country of Origin', value: 'USA' },
  { label: 'FSSAI Lic. No.', value: '10019022004521' },
  { label: 'Manufacturing Date', value: 'See on pack (batch-coded)' },
  { label: 'Best Before', value: '12 Months From Manufacture' },
  { label: 'Language', value: 'English' },
  { label: 'Other Info', value: 'Contains Almonds. May Contain Peanuts, Tree Nuts.' },
];

const VIOLATION_NUTRITION = [
  { label: 'Energy', value: '614 kcal' },
  { label: 'Protein', value: '21 g' },
  { label: 'Carbohydrate', value: '19 g' },
  { label: 'Total Sugars', value: '4 g' },
  { label: 'Total Fat', value: '53 g' },
  { label: 'Sodium', value: '12 mg' },
];

export const CHECK_COMPLIANCE_DATA_VIOLATION = {
  product: VIOLATION_PRODUCT,

  manufacturerCheck: {
    passed: true,
    headline: 'MANUFACTURER COMPLIANCE CHECK PASSED',
    description:
      'The manufacturer itself is correctly identified and verifiable. The issues on this product are in the label declarations checked elsewhere in this report — see Compliance Result.',
    countryOfOrigin: 'USA',
    manufacturerLocation: 'United States (US)',
    manufacturerAddress: 'Sunrise Organic Foods Inc., 4820 SE Belmont St\nPortland, OR 97215, USA',
    verifiedAddress: '4820 SE Belmont St, Portland, OR 97215, USA',
  },

  ocr: { lines: VIOLATION_OCR_LINES },

  nutrition: VIOLATION_NUTRITION,

  findings: [
    { requirement: 'Manufacturer Information', status: 'Passed' },
    { requirement: 'Country of Origin', status: 'Passed' },
    { requirement: 'Net Quantity', status: 'Passed' },
    { requirement: 'MRP (Maximum Retail Price)', status: 'Failed' },
    { requirement: 'Importer Details', status: 'Failed' },
    { requirement: 'Date Marking (Mfg. & Expiry)', status: 'Passed' },
    { requirement: 'Ingredients & Allergen Declaration', status: 'Passed' },
  ],

  regulatoryReferences: [
    'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6 (Importer Declaration)',
    'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6 (MRP Declaration)',
    'FSSAI (Packaging & Labelling) Regulations, 2020',
    'Consumer Protection Act, 2019',
    'Food Safety and Standards Act, 2006',
  ],

  scoreSummary: {
    score: 62,
    letterGrade: 'C',
    ocrConfidence: 93,
    semanticAccuracy: 85,
    passed: { count: 5, pct: 71 },
    failed: { count: 2, pct: 29 },
    warning: { count: 0, pct: 0 },
    notApplicable: { count: 0, pct: 0 },
  },

  pipeline: PIPELINE_STAGES,

  violations: [
    {
      requirement: 'Importer Details',
      whyItFailed:
        'The label shows "Imported by: Sunrise Organic Foods Inc." but no registered address. The Legal Metrology (Packaged Commodities) Rules, 2011 require the full name and address of the importer on every imported pre-packaged commodity sold in India.',
      remediation:
        "Add the importer's complete registered address (building/street, city, state, PIN code) to both the physical label and the online listing before relisting.",
    },
    {
      requirement: 'MRP (Maximum Retail Price)',
      whyItFailed:
        'The MRP is printed as "₹899.00" without the mandatory "inclusive of all taxes" qualifier required under the Legal Metrology (Packaged Commodities) Rules, 2011.',
      remediation:
        'Reprint the MRP as "₹899.00 (incl. of all taxes)" on the label and update the online listing to match exactly.',
    },
  ],

  keyTakeaways: [
    'Two mandatory label declarations are missing or incomplete on this imported product.',
    'Importer address is not printed in full — a common gap on cross-border listings.',
    'MRP declaration is missing the required "inclusive of all taxes" wording.',
    'Not yet ready for sale in the Indian market — remediate and re-check before listing.',
  ],
};

export const CHECK_COMPLIANCE_DATA_VIOLATION_FIXED = {
  ...CHECK_COMPLIANCE_DATA_VIOLATION,
  product: { ...VIOLATION_PRODUCT, score: 100 },

  ocr: {
    lines: VIOLATION_OCR_LINES.map((l) =>
      l.label === 'Importer Address'
        ? { ...l, value: '4820 SE Belmont St, Portland, OR 97215, USA' }
        : l.label === 'MRP'
        ? { ...l, value: '₹899.00 (incl. of all taxes)' }
        : l
    ),
  },

  findings: [
    { requirement: 'Manufacturer Information', status: 'Passed' },
    { requirement: 'Country of Origin', status: 'Passed' },
    { requirement: 'Net Quantity', status: 'Passed' },
    { requirement: 'MRP (Maximum Retail Price)', status: 'Passed' },
    { requirement: 'Importer Details', status: 'Passed' },
    { requirement: 'Date Marking (Mfg. & Expiry)', status: 'Passed' },
    { requirement: 'Ingredients & Allergen Declaration', status: 'Passed' },
  ],

  scoreSummary: {
    score: 100,
    letterGrade: 'A+',
    ocrConfidence: 96,
    semanticAccuracy: 100,
    passed: { count: 7, pct: 100 },
    failed: { count: 0, pct: 0 },
    warning: { count: 0, pct: 0 },
    notApplicable: { count: 0, pct: 0 },
  },

  violations: [],

  keyTakeaways: [
    'Product is now compliant with all applicable Indian regulations.',
    'Importer address has been added in full to the label and listing.',
    'MRP declaration now includes the required "inclusive of all taxes" wording.',
    'Ready for sale in the Indian market.',
  ],
};

// ----------------------------------------------------------
// TAB 3 — SELLER VERIFICATION
// (Seller consistent with the Entities network: Appario Retail)
// ----------------------------------------------------------
export const SELLER_VERIFICATION_DATA = {
  sellerInfo: {
    sellerName: 'Appario Retail Pvt Ltd',
    sellerType: 'Authorized Distributor / Seller',
    gstin: '07AAJCA6497P1ZP',
    registeredAddress: 'Plot No. 5, Sector 18, Udyog Vihar, Gurugram, Haryana 122015, India',
    marketplace: 'Amazon.in',
    sellerSince: '2015',
    verifications: [
      { label: 'Verified Seller', ok: true },
      { label: 'GST Verified', ok: true },
      { label: 'PAN Verified', ok: true },
    ],
    businessStatus: 'Active',
    riskLevel: 'Low',
  },

  businessRegistration: {
    legalName: 'Appario Retail Private Limited',
    entityType: 'Private Limited Company',
    cin: 'U51909DL2015PTC282583',
    gstin: '07AAJCA6497P1ZP',
    pan: 'AAJCA6497P',
    registrationDate: '12 Mar 2015',
    registeredAddress: 'Plot No. 5, Sector 18, Udyog Vihar, Gurugram, Haryana 122015, India',
    state: 'Haryana',
    complianceStatus: 'Active',
  },

  complianceHistory: {
    totalFilings: 12,
    violations: 0,
    complianceRate: 100,
    riskLevel: 'Low',
  },

  recentActivity: [
    { date: '12 Mar 2024', item: 'Consumer Protection Act', status: 'Compliant' },
    { date: '18 Jan 2024', item: 'Legal Metrology Rules', status: 'Compliant' },
    { date: '04 Aug 2023', item: 'FSSAI (if applicable)', status: 'Compliant' },
    { date: '21 Mar 2023', item: 'GST Compliance', status: 'Compliant' },
    { date: '10 Nov 2022', item: 'Marketplace Policy Review', status: 'Compliant' },
  ],

  riskAssessment: {
    overall: 'Low Risk',
    summary: 'No significant risk factors detected.',
    factors: [
      { label: 'Fake seller reports', value: 'None found' },
      { label: 'Customer complaints', value: 'Very low' },
      { label: 'Policy violations', value: 'None' },
      { label: 'Return rate', value: '2.1%' },
      { label: 'Product authenticity issues', value: 'None' },
      { label: 'Suspicious listing activity', value: 'None' },
    ],
    conclusion:
      'This seller is verified and considered low risk. You can safely purchase this product from this seller.',
  },
};

// ----------------------------------------------------------
// SELLER DIRECTORY — multi-seller expansion
// ----------------------------------------------------------
// Investigation: SELLER_VERIFICATION_DATA above is a single hardcoded
// seller (Appario Retail Pvt Ltd), and DemoSellerVerification.jsx's
// search bar was a disabled stub because there was nothing else to
// search. Same gap as the Entities investigation that produced
// BRAND_OWNER_DIRECTORY / IMPORTER_DIRECTORY / DISTRIBUTOR_DIRECTORY
// above: a real directory was implied by the UI (a search bar) but
// never modeled as data. Fix follows the same rule those directories
// used — reuse the existing, already-detailed record instead of
// forking it. SELLER_DIRECTORY's first entry spreads
// SELLER_VERIFICATION_DATA directly (same object reference, plus a
// stable `id`) rather than re-typing an "Appario Retail Pvt Ltd v2"
// literal, so there is exactly one Appario record in this file, not
// two that can silently drift apart. SELLER_VERIFICATION_DATA itself
// is untouched — same export name, same shape, same values — since
// other code (DISTRIBUTOR_DIRECTORY, this file) already references it
// directly.
//
// The other 7 sellers are new, real-shaped entries — not clones with
// swapped names. Each varies independently across the fields that
// actually differ between real marketplace sellers: risk tier (3
// Low, 2 Medium, 2 High), marketplace (Amazon.in, Flipkart, Meesho,
// JioMart), registration era (2011–2022), filings/violations counts
// consistent with their own risk tier and complianceRate (a High
// Risk seller has real violations and a sub-100 rate; Low Risk
// sellers have zero), entity type (Private Limited / LLP /
// Proprietorship), state, and verification-badge completeness (a
// High Risk / newer seller is missing GST or PAN verification, which
// Low Risk incumbents are not). recentActivity per seller matches its
// own risk tier — Low Risk sellers show a clean compliant history,
// Medium/High Risk sellers carry at least one non-compliant or
// pending entry, and riskAssessment.factors/conclusion for each
// seller are written to agree with that same history rather than
// reusing Appario's all-clear boilerplate.
export const SELLER_DIRECTORY = [
  {
    id: 'seller-appario-retail',
    ...SELLER_VERIFICATION_DATA,
  },
  {
    id: 'seller-cloudtail-india',
    sellerInfo: {
      sellerName: 'Cloudtail India Pvt Ltd',
      sellerType: 'Authorized Distributor / Seller',
      gstin: '29AADCC7594R1ZX',
      registeredAddress: 'No. 24, Salarpuria Tower, Bannerghatta Road, Bengaluru, Karnataka 560076, India',
      marketplace: 'Amazon.in',
      sellerSince: '2011',
      verifications: [
        { label: 'Verified Seller', ok: true },
        { label: 'GST Verified', ok: true },
        { label: 'PAN Verified', ok: true },
      ],
      businessStatus: 'Active',
      riskLevel: 'Low',
    },
    businessRegistration: {
      legalName: 'Cloudtail India Private Limited',
      entityType: 'Private Limited Company',
      cin: 'U74999KA2011PTC061003',
      gstin: '29AADCC7594R1ZX',
      pan: 'AADCC7594R',
      registrationDate: '02 Jun 2011',
      registeredAddress: 'No. 24, Salarpuria Tower, Bannerghatta Road, Bengaluru, Karnataka 560076, India',
      state: 'Karnataka',
      complianceStatus: 'Active',
    },
    complianceHistory: {
      totalFilings: 21,
      violations: 0,
      complianceRate: 100,
      riskLevel: 'Low',
    },
    recentActivity: [
      { date: '02 Apr 2024', item: 'Consumer Protection Act', status: 'Compliant' },
      { date: '15 Feb 2024', item: 'Legal Metrology Rules', status: 'Compliant' },
      { date: '09 Sep 2023', item: 'GST Compliance', status: 'Compliant' },
      { date: '27 Apr 2023', item: 'Marketplace Policy Review', status: 'Compliant' },
      { date: '11 Dec 2022', item: 'Data Protection Self-Audit', status: 'Compliant' },
    ],
    riskAssessment: {
      overall: 'Low Risk',
      summary: 'Long-tenured seller with a fully clean compliance record.',
      factors: [
        { label: 'Fake seller reports', value: 'None found' },
        { label: 'Customer complaints', value: 'Very low' },
        { label: 'Policy violations', value: 'None' },
        { label: 'Return rate', value: '1.6%' },
        { label: 'Product authenticity issues', value: 'None' },
        { label: 'Suspicious listing activity', value: 'None' },
      ],
      conclusion:
        'This seller is verified and considered low risk, with over a decade of continuous compliant marketplace activity.',
    },
  },
  {
    id: 'seller-rurash-enterprises',
    sellerInfo: {
      sellerName: 'Rurash Enterprises Pvt Ltd',
      sellerType: 'Marketplace Seller',
      gstin: '27AAFCR2233K1ZM',
      registeredAddress: 'Unit 12, Kailash Industrial Estate, Vikhroli West, Mumbai, Maharashtra 400079, India',
      marketplace: 'Flipkart',
      sellerSince: '2018',
      verifications: [
        { label: 'Verified Seller', ok: true },
        { label: 'GST Verified', ok: true },
        { label: 'PAN Verified', ok: true },
      ],
      businessStatus: 'Active',
      riskLevel: 'Medium',
    },
    businessRegistration: {
      legalName: 'Rurash Enterprises Private Limited',
      entityType: 'Private Limited Company',
      cin: 'U52100MH2018PTC312744',
      gstin: '27AAFCR2233K1ZM',
      pan: 'AAFCR2233K',
      registrationDate: '19 Jul 2018',
      registeredAddress: 'Unit 12, Kailash Industrial Estate, Vikhroli West, Mumbai, Maharashtra 400079, India',
      state: 'Maharashtra',
      complianceStatus: 'Active',
    },
    complianceHistory: {
      totalFilings: 9,
      violations: 1,
      complianceRate: 89,
      riskLevel: 'Medium',
    },
    recentActivity: [
      { date: '06 May 2024', item: 'Legal Metrology Rules', status: 'Compliant' },
      { date: '22 Feb 2024', item: 'MRP Labeling Review', status: 'Non-Compliant' },
      { date: '14 Nov 2023', item: 'Consumer Protection Act', status: 'Compliant' },
      { date: '30 Jun 2023', item: 'GST Compliance', status: 'Compliant' },
      { date: '05 Jan 2023', item: 'Marketplace Policy Review', status: 'Pending Review' },
    ],
    riskAssessment: {
      overall: 'Medium Risk',
      summary: 'One resolved MRP labeling violation in the last 12 months; otherwise compliant.',
      factors: [
        { label: 'Fake seller reports', value: 'None found' },
        { label: 'Customer complaints', value: 'Moderate' },
        { label: 'Policy violations', value: '1 (resolved)' },
        { label: 'Return rate', value: '6.8%' },
        { label: 'Product authenticity issues', value: 'None' },
        { label: 'Suspicious listing activity', value: 'Low' },
      ],
      conclusion:
        'This seller carries a moderate risk profile due to a single past labeling violation. Purchases are generally safe but worth double-checking listing details.',
    },
  },
  {
    id: 'seller-om-sai-traders',
    sellerInfo: {
      sellerName: 'Om Sai Traders',
      sellerType: 'Marketplace Seller',
      gstin: '24ABQPS5566F1ZH',
      registeredAddress: 'Shop 7, APMC Market Yard, Vashi, Navi Mumbai, Maharashtra 400703, India',
      marketplace: 'Meesho',
      sellerSince: '2022',
      verifications: [
        { label: 'Verified Seller', ok: true },
        { label: 'GST Verified', ok: true },
        { label: 'PAN Verified', ok: false },
      ],
      businessStatus: 'Active',
      riskLevel: 'High',
    },
    businessRegistration: {
      legalName: 'Om Sai Traders',
      entityType: 'Proprietorship',
      cin: 'Not applicable (Proprietorship)',
      gstin: '24ABQPS5566F1ZH',
      pan: 'ABQPS5566F',
      registrationDate: '03 Feb 2022',
      registeredAddress: 'Shop 7, APMC Market Yard, Vashi, Navi Mumbai, Maharashtra 400703, India',
      state: 'Maharashtra',
      complianceStatus: 'Under Review',
    },
    complianceHistory: {
      totalFilings: 5,
      violations: 3,
      complianceRate: 40,
      riskLevel: 'High',
    },
    recentActivity: [
      { date: '11 Jun 2024', item: 'Product Authenticity Check', status: 'Non-Compliant' },
      { date: '28 Mar 2024', item: 'MRP Labeling Review', status: 'Non-Compliant' },
      { date: '19 Jan 2024', item: 'Consumer Protection Act', status: 'Non-Compliant' },
      { date: '02 Oct 2023', item: 'GST Compliance', status: 'Compliant' },
      { date: '14 Jul 2023', item: 'Marketplace Policy Review', status: 'Pending Review' },
    ],
    riskAssessment: {
      overall: 'High Risk',
      summary: 'Multiple recent violations including product authenticity and labeling concerns.',
      factors: [
        { label: 'Fake seller reports', value: '2 reported' },
        { label: 'Customer complaints', value: 'High' },
        { label: 'Policy violations', value: '3' },
        { label: 'Return rate', value: '18.4%' },
        { label: 'Product authenticity issues', value: 'Flagged' },
        { label: 'Suspicious listing activity', value: 'Elevated' },
      ],
      conclusion:
        'This seller shows multiple risk indicators, including an unresolved product authenticity flag. Buyers should exercise caution and verify product details closely before purchasing.',
    },
  },
  {
    id: 'seller-vishal-online-retail',
    sellerInfo: {
      sellerName: 'Vishal Online Retail LLP',
      sellerType: 'Marketplace Seller',
      gstin: '09AAOFV8890G1ZQ',
      registeredAddress: 'Plot 41, Sector 63, Noida, Uttar Pradesh 201301, India',
      marketplace: 'Meesho',
      sellerSince: '2020',
      verifications: [
        { label: 'Verified Seller', ok: true },
        { label: 'GST Verified', ok: false },
        { label: 'PAN Verified', ok: true },
      ],
      businessStatus: 'Active',
      riskLevel: 'High',
    },
    businessRegistration: {
      legalName: 'Vishal Online Retail LLP',
      entityType: 'Limited Liability Partnership',
      cin: 'AAO-8890 (LLPIN)',
      gstin: '09AAOFV8890G1ZQ',
      pan: 'AAOFV8890G',
      registrationDate: '27 Sep 2020',
      registeredAddress: 'Plot 41, Sector 63, Noida, Uttar Pradesh 201301, India',
      state: 'Uttar Pradesh',
      complianceStatus: 'Under Review',
    },
    complianceHistory: {
      totalFilings: 7,
      violations: 2,
      complianceRate: 57,
      riskLevel: 'High',
    },
    recentActivity: [
      { date: '20 May 2024', item: 'GST Compliance', status: 'Non-Compliant' },
      { date: '08 Feb 2024', item: 'Legal Metrology Rules', status: 'Compliant' },
      { date: '17 Nov 2023', item: 'Consumer Protection Act', status: 'Non-Compliant' },
      { date: '25 Jul 2023', item: 'Marketplace Policy Review', status: 'Compliant' },
      { date: '09 Mar 2023', item: 'FSSAI (if applicable)', status: 'Pending Review' },
    ],
    riskAssessment: {
      overall: 'High Risk',
      summary: 'Unresolved GST compliance gap flagged alongside a past consumer protection violation.',
      factors: [
        { label: 'Fake seller reports', value: 'None found' },
        { label: 'Customer complaints', value: 'Moderate to high' },
        { label: 'Policy violations', value: '2' },
        { label: 'Return rate', value: '12.9%' },
        { label: 'Product authenticity issues', value: 'None' },
        { label: 'Suspicious listing activity', value: 'Low' },
      ],
      conclusion:
        'This seller currently has an unresolved GST compliance gap. Recommended to proceed with caution until re-verification is complete.',
    },
  },
  {
    id: 'seller-retailnet-solutions',
    sellerInfo: {
      sellerName: 'RetailNet Solutions Pvt Ltd',
      sellerType: 'Authorized Distributor / Seller',
      gstin: '06AACCR4471L1ZP',
      registeredAddress: 'Tower B, DLF Cyber City, Sector 24, Gurugram, Haryana 122002, India',
      marketplace: 'Flipkart',
      sellerSince: '2016',
      verifications: [
        { label: 'Verified Seller', ok: true },
        { label: 'GST Verified', ok: true },
        { label: 'PAN Verified', ok: true },
      ],
      businessStatus: 'Active',
      riskLevel: 'Low',
    },
    businessRegistration: {
      legalName: 'RetailNet Solutions Private Limited',
      entityType: 'Private Limited Company',
      cin: 'U74140HR2016PTC062981',
      gstin: '06AACCR4471L1ZP',
      pan: 'AACCR4471L',
      registrationDate: '30 Jan 2016',
      registeredAddress: 'Tower B, DLF Cyber City, Sector 24, Gurugram, Haryana 122002, India',
      state: 'Haryana',
      complianceStatus: 'Active',
    },
    complianceHistory: {
      totalFilings: 16,
      violations: 0,
      complianceRate: 100,
      riskLevel: 'Low',
    },
    recentActivity: [
      { date: '29 Apr 2024', item: 'Consumer Protection Act', status: 'Compliant' },
      { date: '11 Jan 2024', item: 'Legal Metrology Rules', status: 'Compliant' },
      { date: '03 Aug 2023', item: 'GST Compliance', status: 'Compliant' },
      { date: '16 Apr 2023', item: 'Marketplace Policy Review', status: 'Compliant' },
      { date: '22 Dec 2022', item: 'Data Protection Self-Audit', status: 'Compliant' },
    ],
    riskAssessment: {
      overall: 'Low Risk',
      summary: 'Consistent compliance record with no violations on file.',
      factors: [
        { label: 'Fake seller reports', value: 'None found' },
        { label: 'Customer complaints', value: 'Low' },
        { label: 'Policy violations', value: 'None' },
        { label: 'Return rate', value: '3.4%' },
        { label: 'Product authenticity issues', value: 'None' },
        { label: 'Suspicious listing activity', value: 'None' },
      ],
      conclusion:
        'This seller is verified and considered low risk. You can safely purchase this product from this seller.',
    },
  },
  {
    id: 'seller-swastik-e-retail',
    sellerInfo: {
      sellerName: 'Swastik E-Retail Pvt Ltd',
      sellerType: 'Marketplace Seller',
      gstin: '23AAJCS9982M1ZD',
      registeredAddress: 'Plot 88, Industrial Area, Mandideep, Bhopal, Madhya Pradesh 462046, India',
      marketplace: 'JioMart',
      sellerSince: '2019',
      verifications: [
        { label: 'Verified Seller', ok: true },
        { label: 'GST Verified', ok: true },
        { label: 'PAN Verified', ok: true },
      ],
      businessStatus: 'Active',
      riskLevel: 'Medium',
    },
    businessRegistration: {
      legalName: 'Swastik E-Retail Private Limited',
      entityType: 'Private Limited Company',
      cin: 'U51909MP2019PTC048822',
      gstin: '23AAJCS9982M1ZD',
      pan: 'AAJCS9982M',
      registrationDate: '14 Oct 2019',
      registeredAddress: 'Plot 88, Industrial Area, Mandideep, Bhopal, Madhya Pradesh 462046, India',
      state: 'Madhya Pradesh',
      complianceStatus: 'Active',
    },
    complianceHistory: {
      totalFilings: 11,
      violations: 1,
      complianceRate: 91,
      riskLevel: 'Medium',
    },
    recentActivity: [
      { date: '18 May 2024', item: 'Marketplace Policy Review', status: 'Compliant' },
      { date: '02 Mar 2024', item: 'Legal Metrology Rules', status: 'Compliant' },
      { date: '25 Nov 2023', item: 'Net Quantity Declaration', status: 'Non-Compliant' },
      { date: '13 Jun 2023', item: 'GST Compliance', status: 'Compliant' },
      { date: '07 Feb 2023', item: 'Consumer Protection Act', status: 'Compliant' },
    ],
    riskAssessment: {
      overall: 'Medium Risk',
      summary: 'One past net-quantity declaration violation, since remediated.',
      factors: [
        { label: 'Fake seller reports', value: 'None found' },
        { label: 'Customer complaints', value: 'Low to moderate' },
        { label: 'Policy violations', value: '1 (remediated)' },
        { label: 'Return rate', value: '5.2%' },
        { label: 'Product authenticity issues', value: 'None' },
        { label: 'Suspicious listing activity', value: 'None' },
      ],
      conclusion:
        'This seller has a single remediated labeling violation on record and is otherwise in good standing.',
    },
  },
  {
    id: 'seller-prime-distributors-india',
    sellerInfo: {
      sellerName: 'Prime Distributors India LLP',
      sellerType: 'Authorized Distributor / Seller',
      gstin: '33AAOFP6654H1ZR',
      registeredAddress: '14/2, Industrial Estate, Guindy, Chennai, Tamil Nadu 600032, India',
      marketplace: 'Amazon.in',
      sellerSince: '2013',
      verifications: [
        { label: 'Verified Seller', ok: true },
        { label: 'GST Verified', ok: true },
        { label: 'PAN Verified', ok: true },
      ],
      businessStatus: 'Active',
      riskLevel: 'Low',
    },
    businessRegistration: {
      legalName: 'Prime Distributors India LLP',
      entityType: 'Limited Liability Partnership',
      cin: 'AAO-6654 (LLPIN)',
      gstin: '33AAOFP6654H1ZR',
      pan: 'AAOFP6654H',
      registrationDate: '05 Aug 2013',
      registeredAddress: '14/2, Industrial Estate, Guindy, Chennai, Tamil Nadu 600032, India',
      state: 'Tamil Nadu',
      complianceStatus: 'Active',
    },
    complianceHistory: {
      totalFilings: 18,
      violations: 0,
      complianceRate: 100,
      riskLevel: 'Low',
    },
    recentActivity: [
      { date: '25 Apr 2024', item: 'Consumer Protection Act', status: 'Compliant' },
      { date: '30 Jan 2024', item: 'Legal Metrology Rules', status: 'Compliant' },
      { date: '19 Sep 2023', item: 'GST Compliance', status: 'Compliant' },
      { date: '02 May 2023', item: 'Marketplace Policy Review', status: 'Compliant' },
      { date: '28 Nov 2022', item: 'FSSAI (if applicable)', status: 'Compliant' },
    ],
    riskAssessment: {
      overall: 'Low Risk',
      summary: 'Over a decade of consistent, violation-free marketplace activity.',
      factors: [
        { label: 'Fake seller reports', value: 'None found' },
        { label: 'Customer complaints', value: 'Very low' },
        { label: 'Policy violations', value: 'None' },
        { label: 'Return rate', value: '2.0%' },
        { label: 'Product authenticity issues', value: 'None' },
        { label: 'Suspicious listing activity', value: 'None' },
      ],
      conclusion:
        'This seller is verified and considered low risk. You can safely purchase this product from this seller.',
    },
  },
];

// ----------------------------------------------------------
// TAB 4 — PRODUCTS
// ----------------------------------------------------------
// Part 2 (Data Volume Expansion): grown from 5 to 18 records so the
// catalog actually matches DASHBOARD_DATA.metrics.scanned (previously
// the dashboard claimed 13 scanned products while only 5 catalog
// records existed — that mismatch is fixed here by making the
// catalog itself the source of truth all the other counts derive
// from). The original 5 entries (id 1-5) are completely unchanged —
// same name/subtitle/manufacturer/status/score/full — since other
// code and other demo datasets (DEMO_PRODUCT, VIOLATION_PRODUCT,
// ENTITIES_DATA, recentScans) reference them by exact name. The only
// addition to every entry, old and new, is `categoryGroup`: one of
// the 5 real dashboard categories, used to keep
// DASHBOARD_DATA.categoryBreakdown's counts honest (see the Part 2
// data-integrity script).
//
// Scope note: this intentionally does NOT give the 13 new products
// full OCR-line / nutrition / variant / insights blobs like
// PRODUCTS_DATA or CHECK_COMPLIANCE_DATA carry for Maggi. Two
// reasons: (1) app/products/DemoProducts.jsx's detail view is
// hardcoded to always render PRODUCTS_DATA (the Maggi record)
// whenever `selected.full` is true, regardless of which product was
// actually clicked — every other catalog entry already falls
// through to the plain summary card, so per-product OCR/nutrition
// data has no code path that would ever read it right now; (2) OCR
// fields like `fssaiLicense` only apply to food products under
// Indian law — fabricating FSSAI numbers for personal care/household
// items would be factually wrong, not just unused. `categoryGroup`
// is the one addition that's both real and independently verifiable
// against categoryBreakdown, so that's the scope of this pass.
export const PRODUCTS_CATALOG = [
  {
    id: 1,
    name: 'MAGGI 2-Minute Instant Noodles',
    subtitle: 'Masala Noodles With Goodness Of Iron',
    manufacturer: 'Nestle India Limited',
    status: 'Compliant',
    score: 100,
    full: true,
    categoryGroup: 'Food & Beverages',
  },
  {
    id: 2,
    name: 'Coca-Cola Original Taste',
    subtitle: 'Carbonated Soft Drink',
    manufacturer: 'Coca-Cola India Pvt. Ltd.',
    status: 'Compliant',
    score: 100,
    full: false,
    categoryGroup: 'Food & Beverages',
  },
  {
    id: 3,
    name: "Lay's Classic Salted",
    subtitle: 'Potato Chips',
    manufacturer: 'PepsiCo India Holdings',
    status: 'Compliant',
    score: 100,
    full: false,
    categoryGroup: 'Food & Beverages',
  },
  {
    id: 4,
    name: 'Parle-G Biscuits',
    subtitle: 'Glucose Biscuits',
    manufacturer: 'Parle Products Pvt. Ltd.',
    status: 'Compliant',
    score: 100,
    full: false,
    categoryGroup: 'Food & Beverages',
  },
  {
    id: 5,
    name: 'Sunrise Organic Almond Butter',
    subtitle: 'Creamy Unsweetened Almond Butter, 340g',
    manufacturer: 'Sunrise Organic Foods Inc.',
    status: 'Non-Compliant',
    score: 62,
    // Corrected in Part 6 — previously `false` despite this product
    // having a complete real dataset (CHECK_COMPLIANCE_DATA_VIOLATION).
    // See lib/productDetailMap.js for how the Products page renders
    // this product's full detail (a different shape than Maggi's,
    // since no PRODUCTS_DATA-style record exists for it — not
    // fabricated to match).
    full: true,
    categoryGroup: 'Food & Beverages',
  },

  // ---- New in Part 2 (13 products) ----
  {
    id: 6,
    name: 'Amul Butter',
    subtitle: 'Pasteurised Table Butter, 500g',
    manufacturer: 'Gujarat Cooperative Milk Marketing Federation Ltd.',
    status: 'Compliant',
    score: 96,
    full: false,
    categoryGroup: 'Food & Beverages',
  },
  {
    id: 7,
    name: 'Britannia Good Day Cashew Cookies',
    subtitle: 'Cashew Butter Cookies, 200g',
    manufacturer: 'Britannia Industries Limited',
    status: 'Compliant',
    score: 98,
    full: false,
    categoryGroup: 'Food & Beverages',
  },
  {
    id: 8,
    name: 'Tata Tea Gold',
    subtitle: 'Rich, Aromatic Blended Tea, 1kg',
    manufacturer: 'Tata Consumer Products Limited',
    status: 'Compliant',
    score: 97,
    full: false,
    categoryGroup: 'Food & Beverages',
  },
  {
    id: 9,
    name: 'Dove Nourishing Body Wash',
    subtitle: 'Deep Moisture Body Wash, 250ml',
    manufacturer: 'Hindustan Unilever Limited',
    status: 'Compliant',
    score: 95,
    full: false,
    categoryGroup: 'Personal Care',
  },
  {
    id: 10,
    name: 'Colgate MaxFresh Toothpaste',
    subtitle: 'Cooling Crystals Toothpaste, 150g',
    manufacturer: 'Colgate-Palmolive (India) Ltd.',
    status: 'Compliant',
    score: 99,
    full: false,
    categoryGroup: 'Personal Care',
  },
  {
    id: 11,
    name: 'Patanjali Aloe Vera Gel',
    subtitle: 'Multipurpose Aloe Vera Gel, 150g',
    manufacturer: 'Patanjali Ayurved Limited',
    status: 'Compliant',
    score: 93,
    full: false,
    categoryGroup: 'Personal Care',
  },
  {
    id: 12,
    name: 'Nivea Soft Moisturizing Cream',
    subtitle: 'Light Moisturizer, Jar 100ml',
    manufacturer: 'Beiersdorf India Pvt. Ltd.',
    status: 'Compliant',
    score: 97,
    full: false,
    categoryGroup: 'Personal Care',
  },
  {
    id: 13,
    name: 'Surf Excel Easy Wash Detergent',
    subtitle: 'Detergent Powder, 1kg',
    manufacturer: 'Hindustan Unilever Limited',
    status: 'Compliant',
    score: 96,
    full: false,
    categoryGroup: 'Household',
  },
  {
    id: 14,
    name: 'Harpic Power Plus Toilet Cleaner',
    subtitle: 'Disinfectant Toilet Cleaner, 500ml',
    manufacturer: 'Reckitt Benckiser India Pvt. Ltd.',
    status: 'Compliant',
    score: 94,
    full: false,
    categoryGroup: 'Household',
  },
  {
    id: 15,
    name: 'Good Knight Mosquito Repellent',
    subtitle: 'Liquid Vaporizer Refill, 45ml',
    manufacturer: 'Godrej Consumer Products Limited',
    status: 'Compliant',
    score: 98,
    full: false,
    categoryGroup: 'Household',
  },
  {
    id: 16,
    name: 'Dabur Chyawanprash',
    subtitle: 'Immunity Booster Health Supplement, 500g',
    manufacturer: 'Dabur India Limited',
    status: 'Compliant',
    score: 95,
    full: false,
    categoryGroup: 'Health & Wellness',
  },
  {
    id: 17,
    name: 'Himalaya Liv.52 Tablets',
    subtitle: 'Liver Care Supplement, 100 Tablets',
    manufacturer: 'The Himalaya Drug Company',
    status: 'Compliant',
    score: 92,
    full: false,
    categoryGroup: 'Health & Wellness',
  },
  {
    id: 18,
    name: 'Cello Butterfly Storage Container Set',
    subtitle: 'Airtight Plastic Storage Containers, Set of 3',
    manufacturer: 'Cello World Limited',
    status: 'Compliant',
    score: 96,
    full: false,
    categoryGroup: 'Others',
  },
];

export const PRODUCTS_DATA = {
  product: {
    name: 'MAGGI 2-Minute Instant Noodles',
    subtitle: 'Masala Noodles With Goodness Of Iron',
    brand: 'Maggi',
    manufacturer: 'Nestlé India Limited',
    netQuantity: '70g (Pouch)',
    mrp: '₹14.00 (incl. of all taxes)',
    category: 'Instant Noodles',
    hsnCode: '1902',
    countryOfOrigin: 'India',
    fssaiLicense: '10012064000053',
  },

  highlights: [
    'Goodness of Iron',
    'No added MSG',
    'Made with quality spices',
    'India\u2019s favourite taste',
  ],

  variants: [
    { size: '70g', price: '₹14.00', selected: true },
    { size: '140g', price: '₹28.00', selected: false },
    { size: '560g', price: '₹112.00', selected: false },
    { size: 'Mega Pack 1.2kg', price: '₹225.00', selected: false },
  ],

  variantComparison: [
    { size: '70g', price: '₹14.00', unitPrice: '₹20.00/100g', stock: 'In Stock' },
    { size: '140g', price: '₹28.00', unitPrice: '₹20.00/100g', stock: 'In Stock' },
    { size: '560g', price: '₹112.00', unitPrice: '₹20.00/100g', stock: 'In Stock' },
    { size: '1.2kg', price: '₹225.00', unitPrice: '₹18.75/100g', stock: 'In Stock' },
  ],

  detailTabs: {
    ingredients: {
      text:
        'Noodles: Wheat Flour (Maida), Edible Vegetable Oil (Palm Oil), Wheat Gluten, Salt, Guar Gum, Mineral (Iron), Acidity Regulators (INS 501i, INS 500i). Tastemaker: Salt, Sugar, Hydrolyzed Groundnut Protein, Onion Powder, Spices, Dried Garlic, Dried Coriander, Wheat Flour, Edible Vegetable Oil, Flavour Enhancer (INS 627, INS 631).',
      notice:
        'Ingredients information is extracted from the product label using OCR. Please refer to the actual packaging for the most accurate and up-to-date information.',
    },
    nutrition: [
      { label: 'Energy', value: '431 kcal' },
      { label: 'Protein', value: '8.2 g' },
      { label: 'Carbohydrate', value: '60.1 g' },
      { label: 'Total Fat', value: '16.3 g' },
    ],
    allergens: 'Contains Wheat. May Contain Milk, Soy.',
    other: {
      manufacturingDate: 'See on pack',
      batchNo: 'See on pack',
      storageInstructions: 'See on pack',
      packagingType: 'Pouch',
      bestBefore: '9 Months From Manufacture',
    },
  },

  insights: {
    priceAnalysis: {
      currentMrp: '₹14.00',
      marketAverage: '₹14.00',
      priceDeviation: '0%',
    },
    availability: {
      status: 'In Stock',
      note: 'Currently available on major platforms',
    },
    relatedProducts: [
      { name: 'Maggi Masala Noodles (140g)', price: '₹28.00' },
      { name: 'Maggi Masala Noodles (560g)', price: '₹112.00' },
      { name: 'Maggi Cup Noodles (70g)', price: '₹40.00' },
    ],
    keyInsights: [
      'Price is in line with market average.',
      'Multiple variants available.',
      'Product is widely available.',
      'No abnormal pricing detected.',
    ],
  },

  history: [
    { date: '12 Aug 2025', item: 'Full Compliance', status: 'Passed', score: 100 },
    { date: '28 Jul 2025', item: 'Labelling & Packaging', status: 'Passed', score: 100 },
    { date: '15 Jun 2025', item: 'FSSAI Compliance', status: 'Passed', score: 100 },
    { date: '03 May 2025', item: 'Legal Metrology', status: 'Passed', score: 98 },
    { date: '21 Mar 2025', item: 'Claims & Advertising', status: 'Passed', score: 100 },
  ],

  market: {
    averagePrice: '₹14.00',
    priceRange: '₹12.00 – ₹16.00',
    availability: 'High',
    lastUpdated: '12 Aug 2025',
  },
};

// ----------------------------------------------------------
// TAB 5 — ENTITIES
// ----------------------------------------------------------

// ============================================================
// Part 15 — Entities Data Expansion (Brand Owner / Importer /
// Distributor)
// ============================================================
// Investigation into Sunrise Organic Foods Inc.'s "Manufacturer /
// Importer" riskDirectory label, done BEFORE writing any of the new
// data below:
//
//   Finding: this is NOT a real bug where importer-specific fields
//   already exist somewhere and just aren't wired into the Importer
//   tab. It's confirmed the other way — the label is the imprecise
//   part. The only importer-adjacent field anywhere in the existing
//   data is VIOLATION_OCR_LINES' 'Imported By' line, and its value
//   is literally 'Sunrise Organic Foods Inc.' — the same company as
//   the manufacturer, with the accompanying 'Importer Address' line
//   reading 'Not printed on label'. That's not a structured importer
//   record (no distinct name, no address, nothing an Importer tab
//   could render); it's the label defect that IS the violation
//   (CHECK_COMPLIANCE_DATA_VIOLATION's 'Importer Details: Failed').
//   Even the remediated CHECK_COMPLIANCE_DATA_VIOLATION_FIXED variant
//   only fills in Sunrise's own Portland, OR address for that line —
//   it never introduces a separate importer entity either. So no
//   real, distinct importer record existed anywhere to surface; the
//   riskDirectory label was describing a role the data never actually
//   modeled.
//
//   Fix: added IMPORTER_DIRECTORY below with one real, distinct
//   Indian importer-of-record entity for Sunrise Organic Almond
//   Butter — separate from Sunrise itself, which is the real-world
//   correct shape (an importer bringing a foreign-manufactured good
//   into India is legally a different party than the foreign
//   manufacturer; Sunrise self-declaring as its own 'Imported By'
//   name with no address is precisely the labeling gap Check
//   Compliance already flags). This entity is understood as the
//   importer of record Legal Lens has on file via GST/customs data —
//   independent of what is or isn't printed on the product's own
//   label — which is exactly why the label can be simultaneously
//   non-compliant (no importer info on the physical packaging) and
//   the platform can still know who the real importer is. Sunrise's
//   own riskDirectory row, role label, failedChecks, and High Risk
//   status are untouched (non-negotiable) — this only adds the
//   missing distinct importer record alongside it, so the Importer
//   tab now resolves to real data instead of staying uniformly empty.
//
// Brand Owner / Distributor were investigated the same way: no
// hidden fields existed for either. BRAND_OWNER_DIRECTORY models the
// real-world fact that several of the 17 manufacturers are Indian
// subsidiaries manufacturing/marketing a brand owned by a
// multinational parent (Nestlé, Coca-Cola, PepsiCo, Unilever,
// Colgate-Palmolive, Beiersdorf, Reckitt Benckiser all use this
// structure) — 7 of 17, not all 17, since the other 10 (Parle, GCMMF/
// Amul, Tata Consumer, Patanjali, Godrej Consumer, Dabur, Himalaya,
// Cello World, plus Sunrise, which already carries a role label of
// its own) are domestically-owned companies that legitimately ARE
// their own brand owner — no separate row for them is correct, not a
// gap. DISTRIBUTOR_DIRECTORY reuses Appario Retail Pvt Ltd — already
// a fully-detailed real entity in SELLER_VERIFICATION_DATA as
// Maggi's Amazon.in seller — as the one Distributor on record,
// instead of inventing a new company; no other product in
// PRODUCTS_CATALOG has a marketplace-seller record anywhere in this
// dataset, so 1 of 17 is the real count, not an undercount.
//
// Every productCount below is the linked manufacturer's real
// PRODUCTS_CATALOG count (verified in the Part 15 script), and no
// field here invents a precision level (registration numbers,
// street addresses) that doesn't already exist for that same
// category of entity elsewhere in this file — see the Part 15 report
// for the full field-by-field justification.

export const BRAND_OWNER_DIRECTORY = [
  {
    name: 'Nestlé S.A.',
    role: 'Brand Owner',
    country: 'Switzerland',
    linkedManufacturer: 'Nestle India Limited',
    productCount: 1,
    note: 'Global parent and brand owner of Maggi. Nestle India Limited manufactures and markets the brand locally under license.',
  },
  {
    name: 'The Coca-Cola Company',
    role: 'Brand Owner',
    country: 'United States',
    linkedManufacturer: 'Coca-Cola India Pvt. Ltd.',
    productCount: 1,
    note: 'Global owner of the Coca-Cola trademark and brand. Coca-Cola India Pvt. Ltd. bottles and distributes it locally under license.',
  },
  {
    name: 'PepsiCo, Inc.',
    role: 'Brand Owner',
    country: 'United States',
    linkedManufacturer: 'PepsiCo India Holdings',
    productCount: 1,
    note: "Global brand owner of Lay's. PepsiCo India Holdings manufactures and markets it locally under license.",
  },
  {
    name: 'Unilever PLC',
    role: 'Brand Owner',
    country: 'United Kingdom',
    linkedManufacturer: 'Hindustan Unilever Limited',
    productCount: 2,
    note: 'Global brand owner of Dove and Surf Excel. Hindustan Unilever Limited manufactures both locally under license.',
  },
  {
    name: 'Colgate-Palmolive Company',
    role: 'Brand Owner',
    country: 'United States',
    linkedManufacturer: 'Colgate-Palmolive (India) Ltd.',
    productCount: 1,
    note: 'Global brand owner of Colgate. Colgate-Palmolive (India) Ltd. manufactures it locally under license.',
  },
  {
    name: 'Beiersdorf AG',
    role: 'Brand Owner',
    country: 'Germany',
    linkedManufacturer: 'Beiersdorf India Pvt. Ltd.',
    productCount: 1,
    note: 'Global brand owner of Nivea. Beiersdorf India Pvt. Ltd. manufactures it locally under license.',
  },
  {
    name: 'Reckitt Benckiser Group plc',
    role: 'Brand Owner',
    country: 'United Kingdom',
    linkedManufacturer: 'Reckitt Benckiser India Pvt. Ltd.',
    productCount: 1,
    note: 'Global brand owner of Harpic. Reckitt Benckiser India Pvt. Ltd. manufactures it locally under license.',
  },
];

export const IMPORTER_DIRECTORY = [
  {
    name: 'Meridian Organic Imports Pvt. Ltd.',
    role: 'Importer',
    country: 'India',
    linkedManufacturer: 'Sunrise Organic Foods Inc.',
    productCount: 1,
    note: 'Importer of record for Sunrise Organic Almond Butter (manufactured by Sunrise Organic Foods Inc., Portland, Oregon, USA). Not declared on the product label itself — see Check Compliance\u2019s "Importer Details" finding for the resulting labeling violation.',
  },
];

export const DISTRIBUTOR_DIRECTORY = [
  {
    name: SELLER_VERIFICATION_DATA.sellerInfo.sellerName,
    role: 'Distributor',
    country: 'India',
    linkedManufacturer: 'Nestle India Limited',
    productCount: 1,
    note: `Authorized marketplace distributor/seller for MAGGI 2-Minute Instant Noodles on ${SELLER_VERIFICATION_DATA.sellerInfo.marketplace}. Full registration and risk profile on Seller Verification.`,
  },
];

export const ENTITIES_DATA = {
  relatedEntityTabs: ['Manufacturer', 'Brand Owner', 'Importer (if any)', 'Distributor'],

  brandOwnerDirectory: BRAND_OWNER_DIRECTORY,
  importerDirectory: IMPORTER_DIRECTORY,
  distributorDirectory: DISTRIBUTOR_DIRECTORY,

  manufacturer: {
    name: 'Nestle India Limited',
    tagline: 'Good Food, Good Life',
    companyName: 'Nestle India Limited',
    cin: 'L15202DL1959PLC003786',
    registeredAddress: '100 / 101, World Trade Centre,\nBarakhamba Lane, New Delhi - 110001, India',
    industry: 'Food & Beverages',
    website: 'www.nestle.in',
    status: 'Verified Entity',
  },

  complianceRecord: {
    entity: 'Nestle India Limited',
    role: 'Manufacturer',
    status: 'Compliant',
    summary: 'This entity is compliant with applicable regulations.',
    records: [
      { name: 'FSSAI Registration', status: 'Compliant', note: 'Valid FSSAI License' },
      { name: 'Legal Metrology', status: 'Compliant', note: 'Compliant with packaging rules' },
      { name: 'GST Registration', status: 'Compliant', note: 'Active GSTIN' },
      { name: 'Companies Act', status: 'Compliant', note: 'Active and in good standing' },
      { name: 'Environmental Compliance', status: 'Compliant', note: 'No major issues found' },
    ],
  },

  // Platform-level risk directory — one row per manufacturer/importer
  // seen across scanned products (derived from PRODUCTS_CATALOG).
  // Sunrise Organic Foods Inc. carries the two failed checks from
  // the Phase 3 violation case (VIOLATION_PRODUCT / CHECK_COMPLIANCE_DATA_VIOLATION),
  // so it's the one entity surfaced at High Risk here.
  //
  // Part 2 (Data Volume Expansion): grown from 5 to 17 rows — one
  // per *distinct* manufacturer across the now-18-product
  // PRODUCTS_CATALOG (Hindustan Unilever Limited makes two products —
  // Dove + Surf Excel — so it gets one row with productCount: 2, not
  // two rows). The original 5 rows are unchanged; Sunrise Organic
  // Foods Inc. remains the sole High Risk entity, matching the
  // existing violation narrative — every new entity below has 0
  // failed checks, same as the pre-existing Low Risk entries. See
  // the Part 2 data-integrity script for the productCount /
  // failedChecks derivation check against PRODUCTS_CATALOG.
  riskDirectory: [
    {
      name: 'Nestle India Limited',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Coca-Cola India Pvt. Ltd.',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'PepsiCo India Holdings',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Parle Products Pvt. Ltd.',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Sunrise Organic Foods Inc.',
      role: 'Manufacturer / Importer',
      productCount: 1,
      failedChecks: 2,
      riskLevel: 'High Risk',
      note: 'Sunrise Organic Almond Butter failed 2 checks — missing importer address and an incomplete MRP declaration. See Check Compliance for remediation steps.',
    },
    {
      name: 'Gujarat Cooperative Milk Marketing Federation Ltd.',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Britannia Industries Limited',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Tata Consumer Products Limited',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Hindustan Unilever Limited',
      role: 'Manufacturer',
      productCount: 2,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Colgate-Palmolive (India) Ltd.',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Patanjali Ayurved Limited',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Beiersdorf India Pvt. Ltd.',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Reckitt Benckiser India Pvt. Ltd.',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Godrej Consumer Products Limited',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Dabur India Limited',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'The Himalaya Drug Company',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
    {
      name: 'Cello World Limited',
      role: 'Manufacturer',
      productCount: 1,
      failedChecks: 0,
      riskLevel: 'Low Risk',
      note: 'All scanned products fully compliant.',
    },
  ],

  riskInsight:
    'Risk level reflects failed Legal Metrology / FSSAI checks on each entity\u2019s scanned products. Sunrise Organic Foods Inc. is the only entity with open violations on the platform right now.',
};

// ----------------------------------------------------------
// REWARDS — Meta-Token loop (Phase 5)
// ----------------------------------------------------------
// Static, self-contained reward state for the demo. Nothing here
// is synced with the "earn tokens" moment simulated at the end of
// the Check Compliance flow — that's a self-contained animation on
// its own page, consistent with how every other Demo* page keeps
// its state local rather than sharing a store across pages.
// Tiers (10 / 20 / 90 MT) match the slabs described in the project
// README's Meta-Token Reward System section.
// ----------------------------------------------------------
export const REWARDS_DATA = {
  metaTokens: 45,

  gifts: [
    {
      id: 1,
      tier: 'starter',
      name: 'Starter Reward',
      tokens: 10,
      value: 100,
      partner: 'Amazon Pay',
      description: 'Amazon Pay Gift Card',
    },
    {
      id: 2,
      tier: 'bronze',
      name: 'Bronze Reward',
      tokens: 20,
      value: 250,
      partner: 'Flipkart',
      description: 'Flipkart Gift Card',
    },
    {
      id: 3,
      tier: 'gold',
      name: 'Gold Reward',
      tokens: 90,
      value: 1000,
      partner: 'Amazon Pay',
      description: 'Amazon Pay Gift Card',
    },
  ],

  // Part 2 (Data Volume Expansion): grown from 1 to 5 entries. The
  // original entry (id 1) is unchanged. `metaTokens` (current
  // balance) is untouched too — DemoRewards.jsx already derives
  // `earnedTokens` at render time as
  // `redemptionHistory.reduce(sum tokensUsed) + metaTokens`, so the
  // token math is self-consistent by construction as long as every
  // `tokensUsed` here matches one of the real `gifts[].tokens`
  // values (10 / 20 / 90) it claims to redeem — see the Part 2
  // data-integrity script for that check.
  redemptionHistory: [
    {
      id: 1,
      rewardName: 'Starter Reward',
      partner: 'Amazon Pay',
      value: 100,
      tokensUsed: 10,
      code: 'AMZN-7F2K-91QX',
      pin: '4821',
      redeemedAt: '2025-08-02T10:15:00Z',
      status: 'Completed',
    },
    {
      id: 2,
      rewardName: 'Bronze Reward',
      partner: 'Flipkart',
      value: 250,
      tokensUsed: 20,
      code: 'FLPK-3B7M-22LT',
      pin: '5620',
      redeemedAt: '2025-08-20T14:32:00Z',
      status: 'Completed',
    },
    {
      id: 3,
      rewardName: 'Starter Reward',
      partner: 'Amazon Pay',
      value: 100,
      tokensUsed: 10,
      code: 'AMZN-9K4P-77YZ',
      pin: '1195',
      redeemedAt: '2025-09-05T09:10:00Z',
      status: 'Completed',
    },
    {
      id: 4,
      rewardName: 'Starter Reward',
      partner: 'Amazon Pay',
      value: 100,
      tokensUsed: 10,
      code: 'AMZN-2X8D-56QR',
      pin: '3384',
      redeemedAt: '2025-09-18T16:45:00Z',
      status: 'Completed',
    },
    {
      id: 5,
      rewardName: 'Bronze Reward',
      partner: 'Flipkart',
      value: 250,
      tokensUsed: 20,
      code: 'FLPK-6H1N-90WE',
      pin: '7742',
      redeemedAt: '2025-10-02T11:20:00Z',
      status: 'Completed',
    },
  ],

  // Mirrors the Meta-Token loop described in the project README:
  // Compliance Report -> Affiliate -> Purchase -> Token.
  earnRules: [
    {
      title: 'Generate a Compliance Report',
      description: 'Run a product through Check Compliance to generate a report.',
    },
    {
      title: 'Follow the Affiliate Listing',
      description: 'Open the product\u2019s marketplace listing from its compliance report.',
    },
    {
      title: 'Complete the Purchase',
      description: 'Earn Meta-Tokens proportional to the product\u2019s value once the purchase completes.',
    },
  ],
};
