'use strict';

/**
 * Barrel re-export for all services.
 * Import individual files directly when you only need one thing.
 */

const { findFiles }                    = require('./FileFinder');
const { getFileSize, getGzippedSize }  = require('./SizeCalculator');
const { measureBundles }               = require('./BundleScanner');
const { compareSizes }                 = require('./Comparator');
const { evaluate }                     = require('./ThresholdEvaluator');
const { formatBytes, formatBytesAbs }  = require('./Formatter');
const { getBuildContext }              = require('./BuildService');

module.exports = {
  findFiles,
  getFileSize,
  getGzippedSize,
  measureBundles,
  compareSizes,
  evaluate,
  formatBytes,
  formatBytesAbs,
  getBuildContext,
};
