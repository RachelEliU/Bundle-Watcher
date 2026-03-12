'use strict';

/**
 * Compares two size snapshots and produces a sorted list of BundleDiff results.
 * Pure logic — no I/O, no side effects.
 */

const config = require('../config');
const { evaluate } = require('./ThresholdEvaluator');
const { BundleDiff } = require('../models');

/**
 * Compare base and current size snapshots.
 * Bundles present in only one snapshot get 0 for the missing side.
 *
 * @param {Object.<string, {gzip: number}>} base    - Snapshot from the target branch
 * @param {Object.<string, {gzip: number}>} current - Snapshot from the source branch
 * @returns {BundleDiff[]} Sorted by diffBytes descending (biggest regressions first)
 */
function compareSizes(base, current) {
  const allKeys = new Set([...Object.keys(base), ...Object.keys(current)]);

  return [...allKeys]
    .map((name) => {
      const baseSize    = base[name]?.gzip ?? 0;
      const newSize     = current[name]?.gzip ?? 0;
      const diffBytes   = newSize - baseSize;
      const diffPercent = baseSize === 0 ? 100 : (diffBytes / baseSize) * 100;
      const status      = evaluate(diffBytes, diffPercent, config.thresholds);

      return BundleDiff(
        name,
        baseSize,
        newSize,
        diffBytes,
        parseFloat(diffPercent.toFixed(2)),
        status
      );
    })
    .sort((a, b) => b.diffBytes - a.diffBytes);
}

module.exports = { compareSizes };
