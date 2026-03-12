'use strict';

/**
 * GitLab API integration.
 * Posts a comment to the current MR via the GitLab Notes API.
 * Reads credentials from config; logs warnings and soft-skips if not configured.
 */

const https = require('https');
const config = require('./config');

/**
 * Post a Markdown comment to the current GitLab MR.
 * Skips gracefully if required env vars are not set.
 * Does NOT throw on HTTP errors (logs and resolves) to avoid failing the pipeline.
 *
 * @param {string} markdown - The comment body
 * @returns {Promise<void>}
 */
async function postMRComment(markdown) {
  const { apiUrl, token, projectId, mrIid } = config.gitlab;

  if (!apiUrl || !token || !projectId || !mrIid) {
    console.warn('  ⚠ GitLab API env vars not set — skipping MR comment.');
    console.warn('    Required: CI_API_V4_URL, GITLAB_TOKEN (or CI_JOB_TOKEN), CI_PROJECT_ID, CI_MERGE_REQUEST_IID');
    return;
  }

  const url = `${apiUrl}/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/notes`;
  const body = JSON.stringify({ body: markdown });
  const urlObj = new URL(url);

  const options = {
    hostname: urlObj.hostname,
    path:     urlObj.pathname + urlObj.search,
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
      'PRIVATE-TOKEN':  token,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('  ✓ MR comment posted successfully.');
          resolve();
        } else {
          console.error(`  ✗ Failed to post MR comment: HTTP ${res.statusCode}`);
          console.error('   ', data);
          resolve(); // Don't fail the pipeline just for a comment failure
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { postMRComment };
