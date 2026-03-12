'use strict';

/**
 * --compare command.
 * Loads base and current size snapshots, compares them, writes all reports,
 * optionally posts an MR comment, and exits non-zero on threshold failures.
 */

const fs = require('fs');
const config = require('../config');
const { compareSizes } = require('../comparator');
const { loadSizes, saveSizes } = require('../snapshot');
const { printComparisonTable } = require('../reporters/console');
const { generateGitLabMetrics } = require('../reporters/metrics');
const { generateMarkdownTable } = require('../reporters/markdown');
const { postMRComment } = require('../gitlab');

async function cmdCompare() {
  const baseBranch = process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || 'main';
  const headBranch =
    process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME ||
    process.env.CI_COMMIT_REF_NAME ||
    'HEAD';

  const baseSizesFile    = process.env.BASE_SIZES_FILE    || 'css-sizes-base.json';
  const currentSizesFile = process.env.CURRENT_SIZES_FILE || 'css-sizes-current.json';

  if (!fs.existsSync(baseSizesFile)) {
    console.error(`✗ Base sizes file not found: ${baseSizesFile}`);
    console.error('  Run the scan step on the target branch first and save as css-sizes-base.json');
    process.exit(1);
  }
  if (!fs.existsSync(currentSizesFile)) {
    console.error(`✗ Current sizes file not found: ${currentSizesFile}`);
    process.exit(1);
  }

  const base    = loadSizes(baseSizesFile);
  const current = loadSizes(currentSizesFile);

  console.log(`\n📊 Comparing sizes: ${baseBranch} → ${headBranch}\n`);

  const comparisons = compareSizes(base, current);

  printComparisonTable(comparisons);

  // GitLab Metrics Report
  const metrics = generateGitLabMetrics(comparisons);
  saveSizes(config.output.metricsReport, metrics);
  console.log(`\n✅ GitLab metrics report → ${config.output.metricsReport}`);

  // Markdown Report
  const markdown = generateMarkdownTable(comparisons, baseBranch, headBranch);
  fs.writeFileSync(config.output.markdownReport, markdown);
  console.log(`✅ Markdown report        → ${config.output.markdownReport}`);

  // Post MR comment when running inside a GitLab MR pipeline
  if (process.env.CI_MERGE_REQUEST_IID) {
    console.log('\n💬 Posting MR comment...');
    await postMRComment(markdown);
  }

  // Exit non-zero if any bundle exceeded the failure threshold
  const hasFails = comparisons.some((c) => c.status.includes('🔴'));
  if (hasFails) {
    console.error('\n🔴 One or more bundles exceeded the failure threshold!');
    process.exit(1);
  }

  console.log('\n✅ All bundles within acceptable thresholds.');
}

module.exports = { cmdCompare };
