'use strict';

/**
 * Persistence helpers for sizes JSON snapshots.
 * Thin wrappers around fs so callers don't import fs directly.
 */

const fs = require('fs');

/**
 * Load a sizes snapshot from a JSON file.
 * @param {string} filePath
 * @returns {object}
 */
function loadSizes(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Save data to a JSON file (pretty-printed).
 * @param {string} filePath
 * @param {object|Array} data
 */
function saveSizes(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { loadSizes, saveSizes };
