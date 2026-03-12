'use strict';

/**
 * --scan command.
 * Measures all configured CSS bundles and saves the result to a JSON snapshot.
 */

const config = require('../config');
const { measureBundles } = require('../scanner');
const { saveSizes } = require('../snapshot');

function cmdScan() {
  console.log('\n🔍 Scanning CSS bundles...');

  const sizes = measureBundles();

  saveSizes(config.output.sizesFile, sizes);
  console.log(`\n✅ Saved sizes to ${config.output.sizesFile}`);
}

module.exports = { cmdScan };
