'use strict';

/**
 * CSS bundle scanner.
 * Walks each configured bundle's glob pattern, sums raw and gzip sizes,
 * logs progress, and returns a sizes map keyed by bundle name.
 */

const path = require('path');
const config = require('./config');
const { findFiles, getFileSize, getGzippedSize } = require('./files');
const { formatBytesAbs } = require('./format');

/**
 * Measure all configured CSS bundles in the current working directory.
 *
 * @returns {Object.<string, {raw: number, gzip: number, files: Array}>}
 *   Keyed by bundle name. Each value has:
 *     - raw:   total uncompressed bytes
 *     - gzip:  total gzip-compressed bytes
 *     - files: array of { path, raw, gzip } per matched file
 */
function measureBundles() {
  const results = {};
  const projectRoot = process.cwd();

  for (const bundle of config.bundles) {
    const files = findFiles(bundle.pattern);

    if (files.length === 0) {
      console.warn(`  ⚠ No files found for bundle "${bundle.name}" (pattern: ${bundle.pattern})`);
      results[bundle.name] = { raw: 0, gzip: 0, files: [] };
      continue;
    }

    let totalRaw = 0;
    let totalGzip = 0;
    const fileList = [];

    for (const file of files) {
      const raw = getFileSize(file);
      const gzip = getGzippedSize(file);
      totalRaw += raw;
      totalGzip += gzip;
      fileList.push({ path: path.relative(projectRoot, file), raw, gzip });
    }

    console.log(
      `  ✓ ${bundle.name}: ${formatBytesAbs(totalRaw)} raw / ${formatBytesAbs(totalGzip)} gzip` +
      ` (${files.length} file${files.length !== 1 ? 's' : ''})`
    );

    results[bundle.name] = { raw: totalRaw, gzip: totalGzip, files: fileList };
  }

  return results;
}

module.exports = { measureBundles };
