'use strict';

/**
 * Central configuration. All env-var reads happen here.
 * Bundles list is the only thing most projects need to change.
 */
const config = {
  // CSS bundles to track (relative glob patterns from project root)
  bundles: [
    { name: 'ui-core',   pattern: 'packages/ui-core/dist/**/*.css' },
    { name: 'ui-forms',  pattern: 'packages/ui-forms/dist/**/*.css' },
    { name: 'ui-charts', pattern: 'packages/ui-charts/dist/**/*.css' },
    { name: 'ui-tokens', pattern: 'packages/ui-tokens/dist/**/*.css' },
    // Add more libraries here
  ],

  thresholds: {
    warnBytes:   10 * 1024, // 10 KB absolute increase → warning
    warnPercent: 5,         // 5% increase → warning
    failBytes:   50 * 1024, // 50 KB absolute increase → failure
    failPercent: 20,        // 20% increase → failure
  },

  output: {
    sizesFile:     process.env.SIZES_FILE      || 'css-sizes.json',
    metricsReport: process.env.METRICS_REPORT  || 'gl-metrics-report.json',
    markdownReport: process.env.MARKDOWN_REPORT || 'css-size-report.md',
  },

  gitlab: {
    apiUrl:    process.env.CI_API_V4_URL,
    token:     process.env.GITLAB_TOKEN || process.env.CI_JOB_TOKEN,
    projectId: process.env.CI_PROJECT_ID,
    mrIid:     process.env.CI_MERGE_REQUEST_IID,
  },
};

module.exports = config;
