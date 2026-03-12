'use strict';

/**
 * Finds CSS files matching a glob pattern using the system `find` command.
 *
 * Note: requires a Unix-like shell (Linux, macOS, GitLab CI).
 * Not compatible with native Windows cmd/PowerShell.
 */

const { execSync } = require('child_process');

/**
 * @param {string} pattern - Glob pattern relative to cwd (e.g. "packages/ui-core/dist/**\/*.css")
 * @returns {string[]} Array of matched file paths
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

module.exports = { findFiles };
