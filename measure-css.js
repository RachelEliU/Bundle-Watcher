#!/usr/bin/env node

/**
 * CSS Bundle Size Tracker
 * Measures CSS bundle sizes, compares branches, generates reports.
 *
 * Usage:
 *   node measure-css.js --scan           # Scan and save current sizes to sizes.json
 *   node measure-css.js --compare        # Compare current vs base sizes, generate reports
 *   node measure-css.js --help
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  // Glob patterns for CSS bundles to track (relative to project root)
  bundles: [
    { name: "ui-core", pattern: "packages/ui-core/dist/**/*.css" },
    { name: "ui-forms", pattern: "packages/ui-forms/dist/**/*.css" },
    { name: "ui-charts", pattern: "packages/ui-charts/dist/**/*.css" },
    { name: "ui-tokens", pattern: "packages/ui-tokens/dist/**/*.css" },
    // Add more libraries here
  ],

  // Thresholds
  thresholds: {
    warnBytes: 10 * 1024,       // 10 KB absolute increase triggers warning
    warnPercent: 5,             // 5% increase triggers warning
    failBytes: 50 * 1024,       // 50 KB absolute increase triggers failure
    failPercent: 20,            // 20% increase triggers failure
  },

  // Output paths
  output: {
    sizesFile: process.env.SIZES_FILE || "css-sizes.json",
    metricsReport: process.env.METRICS_REPORT || "gl-metrics-report.json",
    markdownReport: process.env.MARKDOWN_REPORT || "css-size-report.md",
  },

  // GitLab API (for MR comments)
  gitlab: {
    apiUrl: process.env.CI_API_V4_URL,
    token: process.env.GITLAB_TOKEN || process.env.CI_JOB_TOKEN,
    projectId: process.env.CI_PROJECT_ID,
    mrIid: process.env.CI_MERGE_REQUEST_IID,
  },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function findFiles(pattern) {
  // Simple glob implementation without external deps
  const { execSync } = require("child_process");
  try {
    const result = execSync(`find . -path "./${pattern}" -name "*.css" 2>/dev/null`, {
      encoding: "utf8",
    }).trim();
    return result ? result.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getFileSize(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

function getGzippedSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return zlib.gzipSync(content, { level: 9 }).length;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const sign = bytes < 0 ? "-" : "+";
  const abs = Math.abs(bytes);
  if (abs < 1024) return `${sign}${abs} B`;
  if (abs < 1024 * 1024) return `${sign}${(abs / 1024).toFixed(2)} KB`;
  return `${sign}${(abs / (1024 * 1024)).toFixed(2)} MB`;
}

function formatBytesAbs(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getStatus(diffBytes, diffPercent, thresholds) {
  if (
    Math.abs(diffBytes) >= thresholds.failBytes ||
    Math.abs(diffPercent) >= thresholds.failPercent
  ) {
    return diffBytes > 0 ? "🔴 FAIL" : "✅ OK";
  }
  if (
    diffBytes > thresholds.warnBytes ||
    diffPercent > thresholds.warnPercent
  ) {
    return "⚠️ WARN";
  }
  if (diffBytes < 0) return "✅ Smaller";
  if (diffBytes === 0) return "✅ No change";
  return "✅ OK";
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

function measureBundles() {
  const results = {};
  const projectRoot = process.cwd();

  for (const bundle of CONFIG.bundles) {
    const files = findFiles(bundle.pattern);

    if (files.length === 0) {
      console.warn(`  ⚠ No files found for bundle "${bundle.name}" (pattern: ${bundle.pattern})`);
      results[bundle.name] = { raw: 0, gzip: 0, files: [] };
      continue;
    }

    let totalRaw = 0;
    let totalGzip = 0;
    const fileList = [];

    for (const file of files) {
      const raw = getFileSize(file);
      const gzip = getGzippedSize(file);
      totalRaw += raw;
      totalGzip += gzip;
      fileList.push({ path: path.relative(projectRoot, file), raw, gzip });
    }

    console.log(
      `  ✓ ${bundle.name}: ${formatBytesAbs(totalRaw)} raw / ${formatBytesAbs(totalGzip)} gzip (${files.length} file${files.length !== 1 ? "s" : ""})`
    );

    results[bundle.name] = {
      raw: totalRaw,
      gzip: totalGzip,
      files: fileList,
    };
  }

  return results;
}

function compareSizes(base, current) {
  const comparisons = [];
  const allKeys = new Set([...Object.keys(base), ...Object.keys(current)]);

  for (const name of allKeys) {
    const baseSize = base[name]?.gzip ?? 0;
    const newSize = current[name]?.gzip ?? 0;
    const diffBytes = newSize - baseSize;
    const diffPercent =
      baseSize === 0 ? 100 : ((diffBytes / baseSize) * 100);

    comparisons.push({
      name,
      baseSize,
      newSize,
      diffBytes,
      diffPercent: parseFloat(diffPercent.toFixed(2)),
      status: getStatus(diffBytes, diffPercent, CONFIG.thresholds),
    });
  }

  return comparisons.sort((a, b) => b.diffBytes - a.diffBytes);
}

// ─── Report Generators ────────────────────────────────────────────────────────

function generateGitLabMetrics(comparisons) {
  /**
   * GitLab Metrics Report format:
   * https://docs.gitlab.com/ee/ci/testing/metrics_reports.html
   *
   * Each metric is a name/value pair. GitLab will diff them between MR branches.
   */
  const metrics = [];

  for (const c of comparisons) {
    metrics.push({
      name: `CSS Bundle: ${c.name} (gzip, bytes)`,
      value: c.newSize,
      unit: "bytes",
    });
  }

  return metrics;
}

function generateMarkdownTable(comparisons, baseBranch, headBranch) {
  const hasWarnings = comparisons.some((c) => c.status.includes("⚠️"));
  const hasFails = comparisons.some((c) => c.status.includes("🔴"));

  const summary = hasFails
    ? "🔴 **CSS bundle size check FAILED** — one or more bundles exceeded the failure threshold."
    : hasWarnings
    ? "⚠️ **CSS bundle size check WARNING** — one or more bundles exceeded the warning threshold."
    : "✅ **CSS bundle size check passed** — all bundles are within thresholds.";

  const rows = comparisons
    .map((c) => {
      const diffStr =
        c.diffBytes === 0
          ? "—"
          : `${formatBytes(c.diffBytes)} (${c.diffPercent > 0 ? "+" : ""}${c.diffPercent}%)`;
      return `| ${c.name} | ${formatBytesAbs(c.baseSize)} | ${formatBytesAbs(c.newSize)} | ${diffStr} | ${c.status} |`;
    })
    .join("\n");

  return `## 📦 CSS Bundle Size Report

${summary}

| Library Name | Base Size (gzip) | New Size (gzip) | Diff (+/−) | Status |
|---|---|---|---|---|
${rows}

> **Thresholds:** Warn at +${formatBytesAbs(CONFIG.thresholds.warnBytes)} or +${CONFIG.thresholds.warnPercent}% · Fail at +${formatBytesAbs(CONFIG.thresholds.failBytes)} or +${CONFIG.thresholds.failPercent}%
> **Branches:** \`${baseBranch}\` → \`${headBranch}\`
> _Sizes shown are gzip-compressed. Generated by CSS Bundle Tracker._
`;
}

// ─── GitLab API ───────────────────────────────────────────────────────────────

async function postMRComment(markdown) {
  const { apiUrl, token, projectId, mrIid } = CONFIG.gitlab;

  if (!apiUrl || !token || !projectId || !mrIid) {
    console.warn("  ⚠ GitLab API env vars not set — skipping MR comment.");
    console.warn(
      "    Required: CI_API_V4_URL, GITLAB_TOKEN (or CI_JOB_TOKEN), CI_PROJECT_ID, CI_MERGE_REQUEST_IID"
    );
    return;
  }

  const url = `${apiUrl}/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/notes`;

  // Use built-in https to avoid extra deps
  const https = require("https");
  const body = JSON.stringify({ body: markdown });
  const urlObj = new URL(url);

  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "PRIVATE-TOKEN": token,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("  ✓ MR comment posted successfully.");
          resolve();
        } else {
          console.error(`  ✗ Failed to post MR comment: HTTP ${res.statusCode}`);
          console.error("   ", data);
          resolve(); // Don't fail the pipeline just for comment failure
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdScan() {
  console.log("\n🔍 Scanning CSS bundles...");
  const sizes = measureBundles();

  fs.writeFileSync(CONFIG.output.sizesFile, JSON.stringify(sizes, null, 2));
  console.log(`\n✅ Saved sizes to ${CONFIG.output.sizesFile}`);
}

async function cmdCompare() {
  const baseBranch = process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || "main";
  const headBranch =
    process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME ||
    process.env.CI_COMMIT_REF_NAME ||
    "HEAD";

  const baseSizesFile =
    process.env.BASE_SIZES_FILE || "css-sizes-base.json";
  const currentSizesFile =
    process.env.CURRENT_SIZES_FILE || "css-sizes-current.json";

  if (!fs.existsSync(baseSizesFile)) {
    console.error(`✗ Base sizes file not found: ${baseSizesFile}`);
    console.error(
      "  Run the scan step on the target branch first and save as css-sizes-base.json"
    );
    process.exit(1);
  }
  if (!fs.existsSync(currentSizesFile)) {
    console.error(`✗ Current sizes file not found: ${currentSizesFile}`);
    process.exit(1);
  }

  const base = JSON.parse(fs.readFileSync(baseSizesFile, "utf8"));
  const current = JSON.parse(fs.readFileSync(currentSizesFile, "utf8"));

  console.log(`\n📊 Comparing sizes: ${baseBranch} → ${headBranch}\n`);

  const comparisons = compareSizes(base, current);

  // Print table to stdout
  console.log(
    "Library".padEnd(20),
    "Base (gzip)".padEnd(15),
    "New (gzip)".padEnd(15),
    "Diff".padEnd(20),
    "Status"
  );
  console.log("─".repeat(85));
  for (const c of comparisons) {
    const diff =
      c.diffBytes === 0
        ? "no change"
        : `${formatBytes(c.diffBytes)} (${c.diffPercent > 0 ? "+" : ""}${c.diffPercent}%)`;
    console.log(
      c.name.padEnd(20),
      formatBytesAbs(c.baseSize).padEnd(15),
      formatBytesAbs(c.newSize).padEnd(15),
      diff.padEnd(20),
      c.status
    );
  }

  // Generate GitLab Metrics Report
  const metrics = generateGitLabMetrics(comparisons);
  fs.writeFileSync(
    CONFIG.output.metricsReport,
    JSON.stringify(metrics, null, 2)
  );
  console.log(`\n✅ GitLab metrics report → ${CONFIG.output.metricsReport}`);

  // Generate Markdown Report
  const markdown = generateMarkdownTable(comparisons, baseBranch, headBranch);
  fs.writeFileSync(CONFIG.output.markdownReport, markdown);
  console.log(`✅ Markdown report        → ${CONFIG.output.markdownReport}`);

  // Post MR comment if in CI
  if (process.env.CI_MERGE_REQUEST_IID) {
    console.log("\n💬 Posting MR comment...");
    await postMRComment(markdown);
  }

  // Exit with error code if any bundle failed
  const hasFails = comparisons.some((c) => c.status.includes("🔴"));
  if (hasFails) {
    console.error("\n🔴 One or more bundles exceeded the failure threshold!");
    process.exit(1);
  }

  console.log("\n✅ All bundles within acceptable thresholds.");
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.length === 0) {
  console.log(`
CSS Bundle Size Tracker

Usage:
  node measure-css.js --scan      Scan current CSS bundles and save sizes
  node measure-css.js --compare   Compare base vs current, generate reports

Environment Variables:
  SIZES_FILE          Output path for scan results       (default: css-sizes.json)
  BASE_SIZES_FILE     Input path for base branch sizes   (default: css-sizes-base.json)
  CURRENT_SIZES_FILE  Input path for current sizes       (default: css-sizes-current.json)
  METRICS_REPORT      Output path for gl-metrics-report  (default: gl-metrics-report.json)
  MARKDOWN_REPORT     Output path for markdown report    (default: css-size-report.md)
  GITLAB_TOKEN        GitLab API token for MR comments
  CI_*                Automatically set by GitLab CI
`);
  process.exit(0);
}

if (args.includes("--scan")) {
  cmdScan();
} else if (args.includes("--compare")) {
  cmdCompare().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
} else {
  console.error("Unknown command. Use --scan, --compare, or --help.");
  process.exit(1);
}
