# CSS Bundle Size Tracker

Tracks and reports CSS bundle size changes on every GitLab Merge Request.
No extra npm dependencies — built entirely on Node.js core modules.

---

## Quick Start

### 1. Copy files into your project

```
your-repo/
├── .gitlab-ci.yml          ← replace or merge with yours
└── scripts/
    └── measure-css.js
```

### 2. Configure your bundles

Edit the `CONFIG.bundles` array near the top of `scripts/measure-css.js`:

```js
bundles: [
  { name: "ui-core",   pattern: "packages/ui-core/dist/**/*.css"   },
  { name: "ui-forms",  pattern: "packages/ui-forms/dist/**/*.css"  },
  { name: "ui-charts", pattern: "packages/ui-charts/dist/**/*.css" },
],
```

Each entry needs:
| Field | Description |
|---|---|
| `name` | Human-readable label shown in reports |
| `pattern` | Glob pattern relative to project root |

### 3. Set the GitLab CI variable

In **Settings → CI/CD → Variables**, add:

| Variable | Value | Protected | Masked |
|---|---|---|---|
| `GITLAB_TOKEN` | A [Project Access Token](https://docs.gitlab.com/ee/user/project/settings/project_access_tokens.html) with `api` scope | ✅ | ✅ |

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  MR opened / updated                                    │
│                                                         │
│  install:deps ──────────────────────────────────────┐  │
│                                                     │  │
│  build:base  (checkout main, build, scan) ──────┐   │  │
│  build:current (feature branch, build, scan) ───┼───┤  │
│                                                 │   │  │
│  measure:css-diff (diff + generate reports) ────┘   │  │
│                                                     │  │
│  report:mr-comment (post markdown table to MR) ─────┘  │
└─────────────────────────────────────────────────────────┘
```

### Outputs

| File | Purpose |
|---|---|
| `gl-metrics-report.json` | GitLab Metrics Report — shows diff in MR widget |
| `css-size-report.md` | Markdown table posted as an MR comment |
| `css-sizes-base.json` | Raw sizes snapshot for target branch |
| `css-sizes-current.json` | Raw sizes snapshot for feature branch |

### GitLab MR Widget

The `gl-metrics-report.json` file is uploaded as a [GitLab Metrics Report artifact](https://docs.gitlab.com/ee/ci/testing/metrics_reports.html).
GitLab will automatically render the before/after diff directly in the MR widget — no extra setup needed.

### MR Comment

The pipeline also posts a Markdown comment that looks like this:

> ## 📦 CSS Bundle Size Report
>
> ⚠️ **CSS bundle size check WARNING** — one or more bundles exceeded the warning threshold.
>
> | Library Name | Base Size (gzip) | New Size (gzip) | Diff (+/−) | Status |
> |---|---|---|---|---|
> | ui-core | 24.50 KB | 36.20 KB | +11.70 KB (+47.76%) | ⚠️ WARN |
> | ui-forms | 12.00 KB | 11.80 KB | -200 B (-1.63%) | ✅ Smaller |
> | ui-charts | 8.50 KB | 8.50 KB | — | ✅ No change |

---

## Thresholds

Configured in `scripts/measure-css.js` → `CONFIG.thresholds`:

| Level | Default | Behaviour |
|---|---|---|
| **Warn** | +10 KB **or** +5% | Status shows ⚠️ WARN |
| **Fail** | +50 KB **or** +20% | Status shows 🔴 FAIL, exit code 1 |

The CI job uses `allow_failure: exit_codes: [1]` by default — change this to hard-block MRs:

```yaml
# In .gitlab-ci.yml, remove allow_failure from measure:css-diff
measure:css-diff:
  # allow_failure: ...   ← remove this block
```

---

## Change Detection

The CSS-related jobs only run when these paths change (configured in each job's `rules.changes`):

```
packages/**/*.css
packages/**/*.scss
packages/**/package.json
package.json
package-lock.json
scripts/measure-css.js
```

Unrelated changes (docs, tests, backend) skip the CSS jobs entirely.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `SIZES_FILE` | `css-sizes.json` | Output path for `--scan` |
| `BASE_SIZES_FILE` | `css-sizes-base.json` | Input for base branch sizes |
| `CURRENT_SIZES_FILE` | `css-sizes-current.json` | Input for current branch sizes |
| `METRICS_REPORT` | `gl-metrics-report.json` | GitLab metrics artifact path |
| `MARKDOWN_REPORT` | `css-size-report.md` | Markdown report output path |
| `GITLAB_TOKEN` | — | API token for posting MR comments |

All `CI_*` variables are provided automatically by GitLab CI.

---

## Local Usage

```bash
# Scan current branch
node scripts/measure-css.js --scan

# Build base, scan, then build current, scan, then compare:
SIZES_FILE=css-sizes-base.json node scripts/measure-css.js --scan
# ... switch branch, rebuild ...
SIZES_FILE=css-sizes-current.json node scripts/measure-css.js --scan
BASE_SIZES_FILE=css-sizes-base.json \
CURRENT_SIZES_FILE=css-sizes-current.json \
  node scripts/measure-css.js --compare
```
