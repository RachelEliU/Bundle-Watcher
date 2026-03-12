'use strict';

/**
 * CssBundlePipeline — top-level orchestrator.
 *
 * Wires services, infrastructure, and reporters together for each command.
 * No business logic lives here — it only coordinates.
 */

const config = require('../config');
const { measureBundles }   = require('../services/BundleScanner');
const { compareSizes }     = require('../services/Comparator');
const { getBuildContext }  = require('../services/BuildService');
const { load, save }       = require('../infrastructure/SnapshotRepository');
const { exists }           = require('../infrastructure/FileSystemPort');
const { postMRComment }    = require('../infrastructure/GitLabApiClient');
const StdoutTableWriter            = require('../reporters/StdoutTableWriter');
const MarkdownReportWriter         = require('../reporters/MarkdownReportWriter');
const GitLabMetricsReportWriter    = require('../reporters/GitLabMetricsReportWriter');
const HtmlReportWriter             = require('../reporters/HtmlReportWriter');

class CssBundlePipeline {
  /**
   * --scan: measure all bundles and save a snapshot.
   */
  scan() {
    console.log('\n🔍 Scanning CSS bundles...');

    const sizes = measureBundles();
    save(config.output.sizesFile, sizes);

    console.log(`\n✅ Saved sizes to ${config.output.sizesFile}`);
  }

  /**
   * --compare: load snapshots, compare, write all reports, post MR comment, exit on failure.
   */
  async compare() {
    const ctx = getBuildContext();

    if (!exists(ctx.baseSizesFile)) {
      console.error(`✗ Base sizes file not found: ${ctx.baseSizesFile}`);
      console.error('  Run the scan step on the target branch first and save as css-sizes-base.json');
      process.exit(1);
    }
    if (!exists(ctx.currentSizesFile)) {
      console.error(`✗ Current sizes file not found: ${ctx.currentSizesFile}`);
      process.exit(1);
    }

    const base    = load(ctx.baseSizesFile);
    const current = load(ctx.currentSizesFile);

    console.log(`\n📊 Comparing sizes: ${ctx.baseBranch} → ${ctx.headBranch}\n`);

    const comparisons = compareSizes(base, current);

    new StdoutTableWriter().write(comparisons);

    new GitLabMetricsReportWriter(config.output.metricsReport).write(comparisons);

    const markdown = new MarkdownReportWriter(config.output.markdownReport)
      .write(comparisons, ctx);

    new HtmlReportWriter(config.output.htmlReport).write(comparisons, ctx);

    if (ctx.isMR) {
      console.log('\n💬 Posting MR comment...');
      await postMRComment(markdown);
    }

    const hasFails = comparisons.some((c) => c.status.includes('🔴'));
    if (hasFails) {
      console.error('\n🔴 One or more bundles exceeded the failure threshold!');
      process.exit(1);
    }

    console.log('\n✅ All bundles within acceptable thresholds.');
  }
}

module.exports = new CssBundlePipeline();
