// ----------------------------------------------------------
// Compliance report generation — Phase 4
//
// Frontend-only, no new dependencies: builds a standalone,
// print-styled HTML document from a Check Compliance dataset
// (CHECK_COMPLIANCE_DATA / CHECK_COMPLIANCE_DATA_VIOLATION /
// CHECK_COMPLIANCE_DATA_VIOLATION_FIXED — same shape either way)
// and opens it in a new tab with the browser's print dialog
// ready to go, so "Save as PDF" is one click away. If the tab
// can't be opened (popup blocked), falls back to downloading
// the same document as a real .html file so the button always
// produces something real, never a no-op.
// ----------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'report';
}

function statusColor(status) {
  const s = String(status).toLowerCase();
  if (/fail/.test(s)) return '#b91c1c'; // red-700 (matches StatusPill/chipTones red)
  if (/pending|warning|review/.test(s)) return '#b45309'; // amber-700
  return '#047857'; // emerald-700
}

function buildComplianceReportHtml(d) {
  const p = d.product;
  const generatedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const reportId = `LL-${(p.code || slugify(p.name)).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const findingsRows = d.findings
    .map(
      (f) => `
        <tr>
          <td>${escapeHtml(f.requirement)}</td>
          <td style="color:${statusColor(f.status)}; font-weight:600;">${escapeHtml(f.status)}</td>
        </tr>`
    )
    .join('');

  const violationsBlock = d.violations.length
    ? `
      <h2>Violations &amp; Remediation</h2>
      ${d.violations
        .map(
          (v) => `
        <div class="violation">
          <p class="violation-title">${escapeHtml(v.requirement)}</p>
          <p><strong>Why it failed:</strong> ${escapeHtml(v.whyItFailed)}</p>
          <p><strong>Remediation:</strong> ${escapeHtml(v.remediation)}</p>
        </div>`
        )
        .join('')}
    `
    : `
      <h2>Violations &amp; Remediation</h2>
      <p class="muted">No open violations — this product currently passes every checked requirement.</p>
    `;

  const referencesList = d.regulatoryReferences
    .map((r) => `<li>${escapeHtml(r)}</li>`)
    .join('');

  const takeawaysList = d.keyTakeaways
    .map((k) => `<li>${escapeHtml(k)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(p.name)} — Compliance Report</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #1C1B33;
    background: #ffffff;
    max-width: 820px;
    margin: 0 auto;
    padding: 48px 40px 64px;
    line-height: 1.5;
  }
  .toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-bottom: 24px;
  }
  .toolbar button {
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #7C6FEE;
    background: #7C6FEE;
    color: #fff;
    cursor: pointer;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #7C6FEE;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .brand { font-size: 20px; font-weight: 800; color: #7C6FEE; letter-spacing: -0.02em; }
  .brand-sub { font-size: 11px; color: #6E6B85; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
  .meta { text-align: right; font-size: 12px; color: #6E6B85; }
  .meta strong { color: #1C1B33; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .subtitle { color: #6E6B85; font-size: 13px; margin: 0 0 24px; }
  h2 {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #7C6FEE;
    border-bottom: 1px solid rgba(28, 27, 51, 0.08);
    padding-bottom: 6px;
    margin: 32px 0 12px;
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; font-size: 13px; }
  .grid div span.label { display: block; color: #6E6B85; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  .grid div span.value { font-weight: 600; color: #1C1B33; }
  .score-row { display: flex; align-items: center; gap: 24px; margin: 8px 0 4px; }
  .score-badge {
    width: 88px; height: 88px; border-radius: 999px;
    border: 8px solid ${statusColor(d.scoreSummary.score >= 90 ? 'Passed' : d.scoreSummary.score >= 70 ? 'pending' : 'Failed')};
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 800;
    flex-shrink: 0;
  }
  .score-stats { display: flex; gap: 24px; font-size: 13px; }
  .score-stats div span.n { display: block; font-weight: 700; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  table td { padding: 8px 0; border-bottom: 1px solid rgba(28, 27, 51, 0.06); }
  table td:first-child { color: #1C1B33; }
  .violation {
    border: 1px solid #fecaca;
    background: #fee2e2;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 10px;
    font-size: 13px;
  }
  .violation-title { font-weight: 700; margin: 0 0 6px; color: #b91c1c; }
  .violation p { margin: 4px 0; }
  ul { margin: 4px 0; padding-left: 20px; font-size: 13px; }
  li { margin-bottom: 4px; }
  .muted { color: #6E6B85; font-size: 13px; }
  footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid rgba(28, 27, 51, 0.08);
    font-size: 11px;
    color: #6E6B85;
  }
  @media print {
    .toolbar { display: none; }
    body { padding: 0 8mm; }
  }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <header>
    <div>
      <div class="brand">Legal Lens</div>
      <div class="brand-sub">AI Compliance Report</div>
    </div>
    <div class="meta">
      <div><strong>Report ID:</strong> ${escapeHtml(reportId)}</div>
      <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
    </div>
  </header>

  <h1>${escapeHtml(p.name)}</h1>
  <p class="subtitle">${escapeHtml(p.subtitle || '')}</p>

  <h2>Product Information</h2>
  <div class="grid">
    <div><span class="label">Brand</span><span class="value">${escapeHtml(p.brand)}</span></div>
    <div><span class="label">Manufacturer</span><span class="value">${escapeHtml(p.manufacturer)}</span></div>
    <div><span class="label">Net Quantity</span><span class="value">${escapeHtml(p.netQuantity)}</span></div>
    <div><span class="label">MRP</span><span class="value">${escapeHtml(p.mrp)}</span></div>
    <div><span class="label">Country of Origin</span><span class="value">${escapeHtml(p.countryOfOrigin)}</span></div>
    <div><span class="label">FSSAI License No.</span><span class="value">${escapeHtml(p.fssaiLicense)}</span></div>
    <div><span class="label">Category</span><span class="value">${escapeHtml(p.category)}</span></div>
    <div><span class="label">HSN Code</span><span class="value">${escapeHtml(p.hsnCode)}</span></div>
  </div>

  <h2>Compliance Score</h2>
  <div class="score-row">
    <div class="score-badge">${escapeHtml(d.scoreSummary.score)}</div>
    <div class="score-stats">
      <div><span class="n">Grade ${escapeHtml(d.scoreSummary.letterGrade)}</span>Letter Grade</div>
      <div><span class="n">${escapeHtml(d.scoreSummary.passed.count)} (${escapeHtml(d.scoreSummary.passed.pct)}%)</span>Passed</div>
      <div><span class="n">${escapeHtml(d.scoreSummary.failed.count)} (${escapeHtml(d.scoreSummary.failed.pct)}%)</span>Failed</div>
      <div><span class="n">${escapeHtml(d.scoreSummary.ocrConfidence)}%</span>OCR Confidence</div>
      <div><span class="n">${escapeHtml(d.scoreSummary.semanticAccuracy)}%</span>Semantic Accuracy</div>
    </div>
  </div>

  <h2>Compliance Findings</h2>
  <table>
    <tbody>${findingsRows}</tbody>
  </table>

  ${violationsBlock}

  <h2>Applicable Regulatory References</h2>
  <ul>${referencesList}</ul>

  <h2>Key Takeaways</h2>
  <ul>${takeawaysList}</ul>

  <footer>
    Generated by Legal Lens — an AI-driven Legal Metrology compliance checker. This report is produced from a
    demo dataset for product-demonstration purposes and is not a legal or regulatory filing.
  </footer>
</body>
</html>`;
}

function downloadHtmlFile(name, html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(name)}-compliance-report.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Opens the report in a new tab with the print dialog ready to go
// (so "Save as PDF" is one click), or falls back to a direct .html
// file download if the tab couldn't be opened (e.g. popup blocked).
export function downloadComplianceReport(d) {
  const html = buildComplianceReportHtml(d);

  let win = null;
  try {
    win = window.open('', '_blank');
  } catch (e) {
    win = null;
  }

  if (!win) {
    downloadHtmlFile(d.product.name, html);
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Let the new document finish laying out before invoking print —
  // calling it synchronously right after document.write is unreliable
  // across browsers.
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (e) {
      downloadHtmlFile(d.product.name, html);
    }
  }, 300);
}
