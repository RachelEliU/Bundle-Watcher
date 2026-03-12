'use strict';

/**
 * Bundle size comparison logic. Pure functions — no I/O, no side effects.
 */

const config = require('./config');

/**
 * Determine the status label for a single bundle diff.
 *
 * @param {number} diffBytes   - Signed byte difference (new − base)
 * @param {number} diffPercent - Signed percentage difference
 * @param {object} thresholds  - { failBytes, failPercent, warnBytes, warnPercent }
 * @returns {string} Status string with emoji prefix
 */
function getStatus(diffBytes, diffPercent, thresholds) {
  const { failBytes, failPercent, warnBytes, warnPercent } = thresholds;

  if (Math.abs(diffBytes) >= failBytes || Math.abs(diffPercent) >= failPercent) {
    return diffBytes > 0 ? '🔴 FAIL' : '✅ OK';
  }
  if (diffBytes > warnBytes || diffPercent > warnPercent) {
    return '⚠️ WARN';
  }
  if (diffBytes < 0)  return '✅ Smaller';
  if (diffBytes === 0) return '✅ No change';
  return '✅ OK';
}

/**
 * Compare base and current sizes snapshots.
 * Bundles present in only one snapshot get a 0 for the missing side.
 *
 * @param {Object.<string, {gzip: number}>} base    - Sizes from the target branch
 * @param {Object.<string, {gzip: number}>} current - Sizes from the source branch
 * @returns {Array} Sorted by diffBytes descending (biggest regressions first)
 */
function compareSizes(base, current) {
  const allKeys = new Set([...Object.keys(base), ...Object.keys(current)]);

  return [...allKeys]
    .map((name) => {
      const baseSize = base[name]?.gzip ?? 0;
      const newSize  = current[name]?.gzip ?? 0;
      const diffBytes   = newSize - baseSize;
      const diffPercent = baseSize === 0 ? 100 : (diffBytes / baseSize) * 100;

      return {
        name,
        baseSize,
        newSize,
        diffBytes,
        diffPercent: parseFloat(diffPercent.toFixed(2)),
        status: getStatus(diffBytes, diffPercent, config.thresholds),
      };
    })
    .sort((a, b) => b.diffBytes - a.diffBytes);
}

module.exports = { compareSizes };
