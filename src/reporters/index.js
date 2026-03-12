'use strict';

/**
 * Barrel re-export for all reporters.
 */

module.exports = {
  ReportWriter:                  require('./ReportWriter'),
  StdoutTableWriter:             require('./StdoutTableWriter'),
  MarkdownReportWriter:          require('./MarkdownReportWriter'),
  GitLabMetricsReportWriter:     require('./GitLabMetricsReportWriter'),
};
