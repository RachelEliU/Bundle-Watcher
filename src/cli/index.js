'use strict';

/**
 * CLI entry point — parses arguments and delegates to the pipeline.
 * No business logic lives here.
 */

const pipeline = require('../pipeline');

const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
CSS Bundle Size Tracker

Usage:
  node measure-css.js --scan      Scan current CSS bundles and save sizes
  node measure-css.js --compare   Compare base vs current, generate reports

Environment Variables:
  SIZES_FILE          Output path for scan results       (default: css-sizes.json)
  BASE_SIZES_FILE     Input path for base branch sizes   (default: css-sizes-base.json)
  CURRENT_SIZES_FILE  Input path for current sizes       (default: css-sizes-current.json)
  METRICS_REPORT      Output path for gl-metrics-report  (default: gl-metrics-report.json)
  MARKDOWN_REPORT     Output path for markdown report    (default: css-size-report.md)
  GITLAB_TOKEN        GitLab API token for MR comments
  CI_*                Automatically set by GitLab CI
`);
  process.exit(0);
}

if (args.includes('--scan')) {
  pipeline.scan();
} else if (args.includes('--compare')) {
  pipeline.compare().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
} else {
  console.error('Unknown command. Use --scan, --compare, or --help.');
  process.exit(1);
}
