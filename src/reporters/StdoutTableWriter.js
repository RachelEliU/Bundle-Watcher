'use strict';

/**
 * Prints the comparison table to stdout.
 * No file I/O — output only goes to the terminal.
 */

const ReportWriter = require('./ReportWriter');
const { formatBytes, formatBytesAbs } = require('../services/Formatter');

class StdoutTableWriter extends ReportWriter {
  generate(comparisons) {
    const lines = [];
    lines.push(
      'Library'.padEnd(20) + ' ' +
      'Base (gzip)'.padEnd(15) + ' ' +
      'New (gzip)'.padEnd(15) + ' ' +
      'Diff'.padEnd(20) + ' ' +
      'Status'
    );
    lines.push('─'.repeat(85));

    for (const c of comparisons) {
      const diff =
        c.diffBytes === 0
          ? 'no change'
          : `${formatBytes(c.diffBytes)} (${c.diffPercent > 0 ? '+' : ''}${c.diffPercent}%)`;

      lines.push(
        c.name.padEnd(20) + ' ' +
        formatBytesAbs(c.baseSize).padEnd(15) + ' ' +
        formatBytesAbs(c.newSize).padEnd(15) + ' ' +
        diff.padEnd(20) + ' ' +
        c.status
      );
    }

    return lines.join('\n');
  }

  write(comparisons) {
    console.log(this.generate(comparisons));
  }
}

module.exports = StdoutTableWriter;
