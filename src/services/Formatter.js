'use strict';

/**
 * Byte formatting helpers. Pure functions, no dependencies.
 */

/**
 * Format a byte delta with a leading sign (e.g. "+12.50 KB", "-3 B").
 * Used for diff columns.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sign = bytes < 0 ? '-' : '+';
  const abs = Math.abs(bytes);
  if (abs < 1024)           return `${sign}${abs} B`;
  if (abs < 1024 * 1024)   return `${sign}${(abs / 1024).toFixed(2)} KB`;
  return `${sign}${(abs / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format an absolute byte count without a sign (e.g. "12.50 KB").
 * Used for size columns.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytesAbs(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

module.exports = { formatBytes, formatBytesAbs };
