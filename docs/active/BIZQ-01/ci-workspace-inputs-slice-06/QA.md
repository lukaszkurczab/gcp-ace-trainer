# BIZQ-01 — CI workspace inputs06 independent QA

**Verdict: PASS WITH ISSUES** for restoring the backend input to the existing `qa-static` workflow.

The workflow diff is limited to `.github/workflows/qa.yml` and inserts the backend checkout, exact-HEAD recording, backend lockfile in the npm cache key, and backend `npm ci` into `qa-static` before `baseline:report`. The resolved sibling path matches the app's existing consumers (`../patternly-backend`). The current local backend is clean on `main`, and both `HEAD` and `origin/main` are `019e48e7d8e074c2e45d7f5ebb639a4ad394ae8f`. The SHA step validates the 40-character hexadecimal value before writing it to the step output. Inspection of the full workflow diff found no edits to the separate content-release job, native prebuild checks, candidate/content guards, or the baseline command.

Independent verification:

- `node --import tsx --test scripts/recoveryIntegrationRunnerConfig.test.mjs scripts/releaseManifest.test.mjs` — **16/16 passed** (the 3 recovery-runner configuration cases and 13 release-manifest cases). The manifest tests exercised the actual sibling backend/OpenAPI owner and its installed dependencies; no emulator was started.
- `node --import tsx --test scripts/candidateContentReleaseLock.test.mjs` — **23/23 passed**. The workflow assertion was narrowed to forbid `ref: main` on the actual content-producer checkout steps, so the required backend `main` input is permitted; required candidate/historical content pin assertions and whole-job schema/`continue-on-error` checks remain.
- Parsed `.github/workflows/qa.yml` with Ruby YAML and checked that backend checkout/install occur in `qa-static` before `Run recovery baseline (includes qa:static)`; both workflow jobs remain present.
- Confirmed the local backend checkout is clean and its `main` and `origin/main` resolve to the same full SHA above.

The initial broader app baseline run exposed the old whole-job `ref: main` test rejecting the new backend checkout. The test now scopes that prohibition to content checkout steps while preserving its other whole-job checks; the relevant 23-test owner suite and 16 requested backend-dependent tests both pass. The tests used the already-installed backend dependencies. I did not run a fresh backend `npm ci` or a hosted GitHub Actions run, so this is not evidence of post-change hosted CI success. The workflow explicitly installs from the checked-out backend lockfile; the actual hosted run remains the final workflow-level confirmation. No deployment, service, or emulator was started.
