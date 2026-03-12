'use strict';

/**
 * Low-level file I/O helpers.
 * All filesystem and child_process access is isolated here.
 *
 * Note: findFiles uses the system `find` command and requires a Unix-like shell.
 * This works in GitLab CI (Linux) and macOS. Not compatible with plain Windows cmd.
 */

const fs = require('fs');
const zlib = require('zlib');
const { execSync } = require('child_process');

/**
 * Find files matching a glob pattern under the current working directory.
 * Returns an array of relative file paths (e.g. ["./packages/ui-core/dist/main.css"]).
 *
 * @param {string} pattern - Glob pattern relative to project root (e.g. "packages/ui-core/dist/**\/*.css")
 * @returns {string[]}
 */
function findFiles(pattern) {
  try {
    const result = execSync(`find . -path "./${pattern}" -name "*.css" 2>/dev/null`, {
      encoding: 'utf8',
    }).trim();
    return result ? result.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Get the raw (uncompressed) size of a file in bytes. Returns 0 on error.
 * @param {string} filePath
 * @returns {number}
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Get the gzip-compressed size of a file in bytes. Returns 0 on error.
 * @param {string} filePath
 * @returns {number}
 */
function getGzippedSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return zlib.gzipSync(content, { level: 9 }).length;
  } catch {
    return 0;
  }
}

module.exports = { findFiles, getFileSize, getGzippedSize };
