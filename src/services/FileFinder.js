'use strict';

/**
 * Finds CSS files matching a glob pattern using Node.js native fs.
 *
 * Supports patterns of the form: "some/path/**\/*.ext"
 * Works on Linux, macOS, and Windows.
 */

const fs   = require('fs');
const path = require('path');

/**
 * Recursively collect all files under a directory, filtered by extension.
 * @param {string} dir  - Absolute path to search
 * @param {string} ext  - Extension to match (e.g. '.css')
 * @returns {string[]}  - Relative paths from cwd, using forward slashes
 */
function walkDir(dir, ext) {
  if (!fs.existsSync(dir)) return [];

  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      // Return as a relative path from cwd with forward slashes and leading ./
      const rel = './' + path.relative(process.cwd(), full).replace(/\\/g, '/');
      results.push(rel);
    }
  }
  return results;
}

/**
 * Convert a glob pattern to a base directory and file extension.
 * Handles patterns like:
 *   "packages/ui-core/dist/**\/*.css"   → base: packages/ui-core/dist, ext: .css
 *   "packages/ui-core/dist/*.css"       → base: packages/ui-core/dist, ext: .css
 *   "dist/**\/*.min.css"                → base: dist, ext: .css
 *
 * @param {string} pattern
 * @returns {{ baseDir: string, ext: string }}
 */
function parsePattern(pattern) {
  // Normalise to forward slashes
  const norm = pattern.replace(/\\/g, '/');

  // Find the deepest directory segment before any glob wildcard
  const parts = norm.split('/');
  const baseSegments = [];
  for (const seg of parts) {
    if (seg.includes('*') || seg.includes('?') || seg.includes('[')) break;
    baseSegments.push(seg);
  }

  const baseDir = baseSegments.join('/') || '.';

  // Extract extension from the last segment (e.g. "*.css" → ".css")
  const lastSeg = parts[parts.length - 1];
  const dotIdx  = lastSeg.lastIndexOf('.');
  const ext     = dotIdx !== -1 ? lastSeg.slice(dotIdx) : '';

  return { baseDir, ext };
}

/**
 * @param {string} pattern - Glob pattern relative to cwd (e.g. "packages/ui-core/dist/**\/*.css")
 * @returns {string[]} Array of matched file paths (relative, forward-slash, prefixed with ./)
 */
function findFiles(pattern) {
  try {
    const { baseDir, ext } = parsePattern(pattern);
    const absBase = path.resolve(process.cwd(), baseDir);
    return walkDir(absBase, ext);
  } catch {
    return [];
  }
}

module.exports = { findFiles };
