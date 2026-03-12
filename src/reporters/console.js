'use strict';

/**
 * Console reporter — prints the comparison table to stdout.
 */

const { formatBytes, formatBytesAbs } = require('../format');

/**
 * Print a formatted comparison table to stdout.
 * @param {Array} comparisons - Output of compareSizes()
 */
function printComparisonTable(comparisons) {
  console.log(
    'Library'.padEnd(20),
    'Base (gzip)'.padEnd(15),
    'New (gzip)'.padEnd(15),
    'Diff'.padEnd(20),
    'Status'
  );
  console.log('─'.repeat(85));

  for (const c of comparisons) {
    const diff =
      c.diffBytes === 0
        ? 'no change'
        : `${formatBytes(c.diffBytes)} (${c.diffPercent > 0 ? '+' : ''}${c.diffPercent}%)`;

    console.log(
      c.name.padEnd(20),
      formatBytesAbs(c.baseSize).padEnd(15),
      formatBytesAbs(c.newSize).padEnd(15),
      diff.padEnd(20),
      c.status
    );
  }
}

module.exports = { printComparisonTable };
