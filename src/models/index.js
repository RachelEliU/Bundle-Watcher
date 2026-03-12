'use strict';

/**
 * Value objects for bundle data.
 * Plain factory functions — no logic, just named structure.
 * Keeps the shape of each data type in one place.
 */

/**
 * Represents the measured size of a single CSS bundle after a scan.
 *
 * @param {string} name
 * @param {number} raw   - Total uncompressed bytes
 * @param {number} gzip  - Total gzip-compressed bytes
 * @param {Array<{path: string, raw: number, gzip: number}>} files
 * @returns {{ name, raw, gzip, files }}
 */
function BundleSize(name, raw, gzip, files) {
  return { name, raw, gzip, files };
}

/**
 * Represents the comparison result for a single CSS bundle.
 *
 * @param {string} name
 * @param {number} baseSize     - Gzip bytes on the base branch
 * @param {number} newSize      - Gzip bytes on the current branch
 * @param {number} diffBytes    - Signed byte difference (new − base)
 * @param {number} diffPercent  - Signed percentage difference
 * @param {string} status       - Status label with emoji (e.g. "✅ OK", "🔴 FAIL")
 * @returns {{ name, baseSize, newSize, diffBytes, diffPercent, status }}
 */
function BundleDiff(name, baseSize, newSize, diffBytes, diffPercent, status) {
  return { name, baseSize, newSize, diffBytes, diffPercent, status };
}

module.exports = { BundleSize, BundleDiff };
