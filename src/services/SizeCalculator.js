'use strict';

/**
 * Calculates raw and gzip-compressed sizes for individual files.
 * Returns 0 on any read/stat error so callers don't need to handle missing files.
 */

const fs = require('fs');
const zlib = require('zlib');

/**
 * @param {string} filePath
 * @returns {number} Uncompressed file size in bytes
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * @param {string} filePath
 * @returns {number} Gzip-compressed size in bytes (level 9)
 */
function getGzippedSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return zlib.gzipSync(content, { level: 9 }).length;
  } catch {
    return 0;
  }
}

module.exports = { getFileSize, getGzippedSize };
