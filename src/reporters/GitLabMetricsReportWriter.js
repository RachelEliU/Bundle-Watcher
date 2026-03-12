'use strict';

/**
 * Generates a GitLab Metrics Report and writes it to a JSON file.
 *
 * Format: https://docs.gitlab.com/ee/ci/testing/metrics_reports.html
 * GitLab diffs these values between MR branches automatically.
 */

const ReportWriter = require('./ReportWriter');
const { save } = require('../infrastructure/SnapshotRepository');

class GitLabMetricsReportWriter extends ReportWriter {
  /**
   * @param {string} outputPath - File path to write the metrics JSON to
   */
  constructor(outputPath) {
    super();
    this.outputPath = outputPath;
  }

  /**
   * @param {Array} comparisons
   * @returns {Array<{name: string, value: number, unit: string}>}
   */
  generate(comparisons) {
    return comparisons.map((c) => ({
      name:  `CSS Bundle: ${c.name} (gzip, bytes)`,
      value: c.newSize,
      unit:  'bytes',
    }));
  }

  write(comparisons) {
    const metrics = this.generate(comparisons);
    save(this.outputPath, metrics);
    console.log(`✅ GitLab metrics report → ${this.outputPath}`);
  }
}

module.exports = GitLabMetricsReportWriter;
