# GATE-01 — completion report

**Status:** `done`

**Owner repository:** `patternly`

**Depends on:** ACC-02 (`patternly-content` commit `5563cac`)

## Cause and outcome

The CI shell created `app/launch-readiness-report.json` before the gate inspected Git, so report generation could create its own `application_worktree_dirty` blocker. The gate also consumed the retired eight-track readiness format. The workflow now writes the durable report through an explicit path under `runner.temp`, while stdout remains read-only. Genuine application/content dirty state and external-evidence blockers remain fail-closed.

Candidate Readiness is read only from `evidence/readiness/candidate-readiness.json`. The gate dynamically imports the ACC-02 owning modules from the checked-out content repository, loads and validates the Candidate Manifest and human approval, and invokes the owning Candidate Readiness validator. No legacy fallback or parallel readiness validator remains. The validated `candidateId`, exact nine-track scope and artifacts are reported and compared with the application release lock.

`--output` requires one explicit path with an existing parent outside both physical worktrees. Canonical roots and the output parent use `realpath`; direct paths, directory symlink aliases, every final-component symlink including dangling links, duplicate/missing options and unknown arguments are rejected before writing. The report is still written before an enforced non-ready exit.

## Changed paths

- `.github/workflows/launch-readiness.yml` — runner-temp report and unconditional artifact upload.
- `scripts/releaseGate.mjs` — output contract and owning ACC-02 validation boundary.
- `scripts/releaseGate.test.mjs` — readiness, dirty-state, enforce and path-security regressions.
- `scripts/launchReadinessWorkflowContract.test.mjs` — CI output/upload contract.
- `docs/qa/GATE-01-ACCEPTANCE-PACKET.md` — implementation-ready contract and stop conditions.
- `docs/qa/GATE-01-REPORT.md` — durable implementation and verification evidence.
- `../docs/PATTERNLY-WORKING-PLAN.md` — program status and next-task pointer; this file is outside the `patternly` Git repository.

## Validation and QA

The pre-implementation Luna/max validation scored consistency `0.96`, simplicity `0.89`, risk `0.84`, maintainability `0.88`; minimum `0.84`, approved.

- Dedicated release/workflow tests: `13/13` passed.
- `npm run qa:static`: passed; `1078/1078` tests passed.
- Content-boundary and runtime-privacy-boundary checks: passed.
- Active code/workflow/package scan for `eight-track-launch-readiness`: no matches.
- `git diff --check`: passed.
- Real enforced temp-output run produced valid JSON identical to stdout, preserved exit `1`, reported the ACC-02 candidate and nine tracks, and retained only genuine current blockers.

Independent Luna/max QA first rejected a weaker local readiness validator and lexical-only containment. The first correction adopted the owning validator and physical containment. A final QA iteration identified the dangling final-symlink case; `lstat` rejection and a no-target-created regression resolved it. Final independent QA: **PASS**, no open findings.

## Limitations and non-goals

GATE-01 does not define the GATE-02 API contract, create the GATE-03 portable four-SHA manifest, complete GATE-04 four-repository CI, or fabricate provider, signing, store, privacy, device or Product Owner evidence. Existing external-evidence blockers therefore remain expected and truthful.
