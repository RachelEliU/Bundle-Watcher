'use strict';

/**
 * Evaluates a single bundle diff against threshold rules and returns a status label.
 * Pure function — no I/O, no side effects.
 */

/**
 * @param {number} diffBytes    - Signed byte difference (new − base)
 * @param {number} diffPercent  - Signed percentage difference
 * @param {object} thresholds   - { failBytes, failPercent, warnBytes, warnPercent }
 * @returns {string} Status string with emoji prefix
 */
function evaluate(diffBytes, diffPercent, thresholds) {
  const { failBytes, failPercent, warnBytes, warnPercent } = thresholds;

  if (Math.abs(diffBytes) >= failBytes || Math.abs(diffPercent) >= failPercent) {
    return diffBytes > 0 ? '🔴 FAIL' : '✅ OK';
  }
  if (diffBytes > warnBytes || diffPercent > warnPercent) {
    return '⚠️ WARN';
  }
  if (diffBytes < 0)   return '✅ Smaller';
  if (diffBytes === 0) return '✅ No change';
  return '✅ OK';
}

module.exports = { evaluate };
