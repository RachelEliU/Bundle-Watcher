'use strict';

/**
 * GitLab Metrics Report reporter.
 * Transforms comparisons into the GitLab metrics format:
 * https://docs.gitlab.com/ee/ci/testing/metrics_reports.html
 *
 * Pure function — no I/O, no side effects.
 */

/**
 * @param {Array} comparisons - Output of compareSizes()
 * @returns {Array<{name: string, value: number, unit: string}>}
 */
function generateGitLabMetrics(comparisons) {
  return comparisons.map((c) => ({
    name:  `CSS Bundle: ${c.name} (gzip, bytes)`,
    value: c.newSize,
    unit:  'bytes',
  }));
}

module.exports = { generateGitLabMetrics };
