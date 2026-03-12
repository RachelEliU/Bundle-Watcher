'use strict';

/**
 * Base class for all report writers.
 *
 * Each subclass represents one output format and implements:
 *   - generate(comparisons, context) → returns the report content (string or object)
 *   - write(comparisons, context)    → generates and persists/outputs the report
 *
 * Adding a new output format = add a new file in reporters/, extend this class.
 */
class ReportWriter {
  /**
   * Generate report content without any I/O.
   * Override in subclass to make the generation step unit-testable in isolation.
   *
   * @param {Array}  comparisons - Output of Comparator.compareSizes()
   * @param {object} [context]   - Extra data (e.g. { baseBranch, headBranch })
   * @returns {string|object}
   */
  generate(comparisons, context) {
    throw new Error(`${this.constructor.name}.generate() is not implemented`);
  }

  /**
   * Generate and write/output the report.
   *
   * @param {Array}  comparisons
   * @param {object} [context]
   */
  write(comparisons, context) {
    throw new Error(`${this.constructor.name}.write() is not implemented`);
  }
}

module.exports = ReportWriter;
