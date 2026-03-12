'use strict';

/**
 * Barrel re-export for all infrastructure adapters.
 */

module.exports = {
  FileSystemPort:     require('./FileSystemPort'),
  SnapshotRepository: require('./SnapshotRepository'),
  GitLabApiClient:    require('./GitLabApiClient'),
};
