'use strict';

/**
 * Generates a self-contained HTML bundle size report.
 * No external dependencies — all CSS and JS are inlined.
 */

const ReportWriter = require('./ReportWriter');
const config       = require('../config');
const { formatBytes, formatBytesAbs } = require('../services/Formatter');
const { writeText } = require('../infrastructure/FileSystemPort');

class HtmlReportWriter extends ReportWriter {
  constructor(outputPath) {
    super();
    this.outputPath = outputPath;
  }

  generate(comparisons, context) {
    const { baseBranch, headBranch } = context;
    const hasWarnings = comparisons.some((c) => c.status.includes('⚠️'));
    const hasFails    = comparisons.some((c) => c.status.includes('🔴'));

    const overallStatus = hasFails ? 'fail' : hasWarnings ? 'warn' : 'pass';

    const { warnBytes, warnPercent, failBytes, failPercent } = config.thresholds;

    // Find the largest size to normalise progress bars
    const maxSize = Math.max(...comparisons.map((c) => Math.max(c.baseSize, c.newSize)), 1);

    const bundleCards = comparisons.map((c) => {
      const basePct    = Math.round((c.baseSize / maxSize) * 100);
      const newPct     = Math.round((c.newSize  / maxSize) * 100);
      const noChange   = c.diffBytes === 0;
      const grew       = c.diffBytes > 0;
      const statusKey  = c.status.includes('🔴') ? 'fail'
                       : c.status.includes('⚠️') ? 'warn'
                       : c.status.includes('✅') && c.diffBytes < 0 ? 'improved'
                       : 'pass';

      const badgeLabel = statusKey === 'fail'     ? 'FAIL'
                       : statusKey === 'warn'     ? 'WARN'
                       : statusKey === 'improved' ? 'Smaller'
                       : noChange                 ? 'No change'
                       : 'OK';

      const diffText = noChange
        ? '—'
        : `${formatBytes(c.diffBytes)} (${c.diffPercent > 0 ? '+' : ''}${c.diffPercent}%)`;

      const filesHtml = (c.currentFiles || []).length > 0
        ? `<details class="files-detail">
            <summary class="files-summary">
              <span>${c.currentFiles.length} file${c.currentFiles.length !== 1 ? 's' : ''}</span>
              <svg class="chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </summary>
            <ul class="files-list">
              ${(c.currentFiles || []).map((f) => `
              <li class="file-row">
                <span class="file-path">${escHtml(f.path)}</span>
                <span class="file-size">${formatBytesAbs(f.gzip)} gzip</span>
              </li>`).join('')}
            </ul>
          </details>`
        : '';

      return `
      <div class="card card--${statusKey}">
        <div class="card-header">
          <div class="card-title-row">
            <h3 class="bundle-name">${escHtml(c.name)}</h3>
            <span class="badge badge--${statusKey}">${badgeLabel}</span>
          </div>
          ${!noChange ? `<p class="diff-summary diff-summary--${statusKey}">${diffText}</p>` : '<p class="diff-summary diff-summary--neutral">No change</p>'}
        </div>

        <div class="bars">
          <div class="bar-row">
            <span class="bar-label">Before</span>
            <div class="bar-track">
              <div class="bar-fill bar-fill--base" style="width:${basePct}%"></div>
            </div>
            <span class="bar-value">${formatBytesAbs(c.baseSize)}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">After</span>
            <div class="bar-track">
              <div class="bar-fill bar-fill--${statusKey}" style="width:${newPct}%"></div>
            </div>
            <span class="bar-value">${formatBytesAbs(c.newSize)}</span>
          </div>
        </div>

        ${filesHtml}
      </div>`;
    }).join('\n');

    const headerIcon  = hasFails ? '🔴' : hasWarnings ? '⚠️' : '✅';
    const headerTitle = hasFails ? 'Bundle size check FAILED'
                      : hasWarnings ? 'Bundle size check WARNING'
                      : 'Bundle size check passed';

    const generatedAt = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Bundle Size Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      background: #f8fafc;
      color: #0f172a;
      padding: 32px 16px 64px;
    }

    .page { max-width: 860px; margin: 0 auto; }

    /* ── Header ── */
    .report-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 24px 28px;
      border-radius: 12px;
      margin-bottom: 28px;
      border: 1px solid;
    }
    .report-header--pass    { background:#f0fdf4; border-color:#bbf7d0; }
    .report-header--warn    { background:#fffbeb; border-color:#fde68a; }
    .report-header--fail    { background:#fef2f2; border-color:#fecaca; }

    .header-icon { font-size: 36px; line-height: 1; flex-shrink: 0; }

    .header-body { flex: 1; }
    .header-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .report-header--pass .header-title { color: #15803d; }
    .report-header--warn .header-title { color: #b45309; }
    .report-header--fail .header-title { color: #b91c1c; }

    .header-meta {
      font-size: 13px;
      color: #64748b;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-meta-item { display: flex; align-items: center; gap: 5px; }
    .branch-tag {
      display: inline-block;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      background: rgba(0,0,0,0.06);
      padding: 1px 6px;
      border-radius: 4px;
    }

    /* ── Cards grid ── */
    .cards { display: grid; gap: 16px; }

    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      border-left: 4px solid #e2e8f0;
    }
    .card--pass     { border-left-color: #22c55e; }
    .card--improved { border-left-color: #3b82f6; }
    .card--warn     { border-left-color: #f59e0b; }
    .card--fail     { border-left-color: #ef4444; }

    .card-header { margin-bottom: 16px; }

    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
    }

    .bundle-name {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      font-family: ui-monospace, monospace;
    }

    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 999px;
      flex-shrink: 0;
    }
    .badge--pass     { background:#dcfce7; color:#15803d; }
    .badge--improved { background:#dbeafe; color:#1d4ed8; }
    .badge--warn     { background:#fef3c7; color:#b45309; }
    .badge--fail     { background:#fee2e2; color:#b91c1c; }

    .diff-summary {
      font-size: 13px;
      font-weight: 500;
    }
    .diff-summary--warn    { color: #b45309; }
    .diff-summary--fail    { color: #b91c1c; }
    .diff-summary--improved { color: #1d4ed8; }
    .diff-summary--pass    { color: #15803d; }
    .diff-summary--neutral { color: #94a3b8; }

    /* ── Progress bars ── */
    .bars { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }

    .bar-row {
      display: grid;
      grid-template-columns: 48px 1fr 72px;
      align-items: center;
      gap: 10px;
    }

    .bar-label {
      font-size: 12px;
      color: #94a3b8;
      text-align: right;
    }

    .bar-track {
      height: 8px;
      background: #f1f5f9;
      border-radius: 999px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 999px;
      min-width: 2px;
      transition: width 0.3s ease;
    }
    .bar-fill--base     { background: #94a3b8; }
    .bar-fill--pass     { background: #22c55e; }
    .bar-fill--improved { background: #3b82f6; }
    .bar-fill--warn     { background: #f59e0b; }
    .bar-fill--fail     { background: #ef4444; }

    .bar-value {
      font-size: 12px;
      font-family: ui-monospace, monospace;
      color: #475569;
      text-align: right;
    }

    /* ── File details ── */
    .files-detail { margin-top: 14px; }

    .files-summary {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      list-style: none;
      font-size: 12px;
      color: #64748b;
      user-select: none;
      width: fit-content;
    }
    .files-summary::-webkit-details-marker { display: none; }
    .files-summary:hover { color: #0f172a; }

    .chevron {
      width: 14px;
      height: 14px;
      transition: transform 0.15s ease;
    }
    details[open] .chevron { transform: rotate(180deg); }

    .files-list {
      list-style: none;
      margin-top: 8px;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      overflow: hidden;
    }

    .file-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 7px 12px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .file-row:last-child { border-bottom: none; }
    .file-row:nth-child(even) { background: #fafafa; }

    .file-path {
      font-family: ui-monospace, monospace;
      color: #475569;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      font-family: ui-monospace, monospace;
      color: #94a3b8;
      flex-shrink: 0;
    }

    /* ── Footer ── */
    .report-footer {
      margin-top: 28px;
      padding: 16px 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
    }

    .footer-thresholds { display: flex; gap: 20px; flex-wrap: wrap; }
    .footer-threshold-item { display: flex; flex-direction: column; gap: 1px; }
    .footer-threshold-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    .footer-threshold-value { font-weight: 600; color: #475569; }
    .footer-threshold-value--warn { color: #b45309; }
    .footer-threshold-value--fail { color: #b91c1c; }

    .footer-meta { display: flex; flex-direction: column; gap: 2px; text-align: right; }

    /* ── Section title ── */
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="page">

    <header class="report-header report-header--${overallStatus}">
      <div class="header-icon">${headerIcon}</div>
      <div class="header-body">
        <h1 class="header-title">${headerTitle}</h1>
        <div class="header-meta">
          <span class="header-meta-item">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v10H3z" stroke="currentColor" stroke-width="1.3" rx="2"/><path d="M3 6h10" stroke="currentColor" stroke-width="1.3"/></svg>
            <span class="branch-tag">${escHtml(baseBranch)}</span>
            <span>→</span>
            <span class="branch-tag">${escHtml(headBranch)}</span>
          </span>
          <span class="header-meta-item">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M8 5v3.5l2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            ${escHtml(generatedAt)}
          </span>
        </div>
      </div>
    </header>

    <p class="section-title">Bundles (${comparisons.length})</p>
    <div class="cards">
      ${bundleCards}
    </div>

    <footer class="report-footer">
      <div class="footer-thresholds">
        <div class="footer-threshold-item">
          <span class="footer-threshold-label">Warn threshold</span>
          <span class="footer-threshold-value footer-threshold-value--warn">+${formatBytesAbs(warnBytes)} or +${warnPercent}%</span>
        </div>
        <div class="footer-threshold-item">
          <span class="footer-threshold-label">Fail threshold</span>
          <span class="footer-threshold-value footer-threshold-value--fail">+${formatBytesAbs(failBytes)} or +${failPercent}%</span>
        </div>
      </div>
      <div class="footer-meta">
        <span>CSS Bundle Tracker</span>
        <span>Sizes shown are gzip-compressed</span>
      </div>
    </footer>

  </div>
</body>
</html>`;
  }

  write(comparisons, context) {
    const html = this.generate(comparisons, context);
    writeText(this.outputPath, html);
    console.log(`✅ HTML report            → ${this.outputPath}`);
    return html;
  }
}

/** Minimal HTML escaping to prevent XSS in branch names / file paths */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = HtmlReportWriter;
