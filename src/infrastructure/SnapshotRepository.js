'use strict';

/**
 * Loads and saves bundle size snapshots (JSON files).
 * Uses FileSystemPort so the I/O layer is swappable in tests.
 */

const { readText, writeJson } = require('./FileSystemPort');

/**
 * Load a sizes snapshot from a JSON file.
 * @param {string} filePath
 * @returns {object}
 */
function load(filePath) {
  return JSON.parse(readText(filePath));
}

/**
 * Save data to a JSON file (pretty-printed).
 * @param {string} filePath
 * @param {object|Array} data
 */
function save(filePath, data) {
  writeJson(filePath, data);
}

module.exports = { load, save };
