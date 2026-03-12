'use strict';

/**
 * Thin abstraction over the Node.js `fs` module.
 * All direct filesystem access goes through here — makes it easy to stub in tests.
 */

const fs = require('fs');

/** @param {string} filePath @returns {string} */
function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

/** @param {string} filePath @param {string} content */
function writeText(filePath, content) {
  fs.writeFileSync(filePath, content);
}

/** @param {string} filePath @param {object|Array} data */
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/** @param {string} filePath @returns {boolean} */
function exists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = { readText, writeText, writeJson, exists };
