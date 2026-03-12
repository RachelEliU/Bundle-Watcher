'use strict';

/**
 * BuildService — resolves CI/build environment context from env vars.
 *
 * Git-related helpers (e.g. falling back to `git rev-parse --abbrev-ref HEAD`
 * when CI vars are not set) would also live here.
 */

/**
 * Read all build context needed by the compare pipeline from environment variables.
 *
 * @returns {{
 *   baseBranch:      string,
 *   headBranch:      string,
 *   baseSizesFile:   string,
 *   currentSizesFile: string,
 *   isMR:            boolean,
 * }}
 */
function getBuildContext() {
  return {
    baseBranch: process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || 'main',
    headBranch:
      process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME ||
      process.env.CI_COMMIT_REF_NAME ||
      'HEAD',
    baseSizesFile:    process.env.BASE_SIZES_FILE    || 'css-sizes-base.json',
    currentSizesFile: process.env.CURRENT_SIZES_FILE || 'css-sizes-current.json',
    isMR: Boolean(process.env.CI_MERGE_REQUEST_IID),
  };
}

module.exports = { getBuildContext };
