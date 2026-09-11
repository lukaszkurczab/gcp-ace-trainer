# GATE-01 — release report without self-created dirty state

**Status:** `planned`  
**Owner repository:** `patternly`  
**Depends on:** `ACC-02` (`patternly-content` commit `5563cac`)  
**Report target:** `docs/qa/GATE-01-REPORT.md`

## Goal and user value

Make the launch-readiness report reproducible and truthful: producing the report must not create an application-worktree change that the same gate reports as a blocker, and the report must consume the active nine-track Candidate Readiness v2 evidence produced by ACC-02.

## Confirmed evidence

- `.github/workflows/launch-readiness.yml` redirects stdout to `app/launch-readiness-report.json`. The shell creates that untracked file before `scripts/releaseGate.mjs` inspects `git status`, so the report can create its own `application_worktree_dirty` blocker.
- `scripts/releaseGate.mjs` still reads `evidence/readiness/eight-track-launch-readiness.json` and schema `eight-track-launch-readiness-v1`; ACC-02 removed that active path and published `evidence/readiness/candidate-readiness.json` with schema `patternly-candidate-readiness-v2`.
- The current gate run therefore reports `contentReadiness: null` even though the content checkout is clean and ACC-02 evidence exists.
- The application and content repositories are clean at task start. No Graphify output was found; direct source and test evidence is sufficient.

## Scope

- Update the canonical report invocation so the durable CI artifact is written outside both Git worktrees, using an explicit output path under the runner temporary directory.
- Keep stdout mode read-only for local inspection.
- Update `releaseGate.mjs` to consume the active Candidate Readiness v2 path and field contract without reintroducing a compatibility fallback.
- Update the workflow contract and release-gate tests, including a regression proving report generation does not cause or report a self-created dirty state.
- Preserve fail-closed handling of genuinely dirty application/content worktrees and all existing release blockers.

## Non-goals

- No API contract expansion (`GATE-02`).
- No four-SHA portable evidence manifest (`GATE-03`).
- No four-repository CI completion (`GATE-04`).
- No creation or fabrication of external provider, signing, store, privacy, device, or Product Owner evidence.
- No content, release-lock, product behavior, question, or SIMP changes.
- No legacy readiness fallback or parallel active report format.

## Acceptance criteria

1. The CI invocation writes the uploaded report outside `app/` and `patternly-content/`; the application and content worktrees remain clean after report generation.
2. A clean application checkout is reported as `clean`; the report never emits `application_worktree_dirty` solely because it generated its own output.
3. A pre-existing application or content change still produces the corresponding dirty blocker.
4. The gate reads only `evidence/readiness/candidate-readiness.json`, requires schema `patternly-candidate-readiness-v2`, exact nine-track scope and a SHA-256 `candidateId`, and reports that identity.
5. Per-track readiness is evaluated from the v2 fields: `structuralValidation.result`, `humanApproval`, `artifact`, `publishingAdmission`, `runtimeAdmission`, and `blockers`. Any missing track, mismatched scope, invalid required state, or non-empty track blocker fails closed.
6. No active code, test, workflow, or package script consumes the retired `eight-track-launch-readiness` path/schema.
7. Report output remains valid deterministic JSON for identical repository/evidence state; `--enforce` preserves the gate exit status while still producing the report artifact.
8. Existing external-evidence blockers remain truthful and unchanged; GATE-01 does not turn missing evidence into success.

## Verification and required evidence

- Dedicated `scripts/releaseGate.test.mjs`, including clean-output, genuinely-dirty, Candidate Readiness v2, malformed/stale scope, and enforce-mode cases.
- `scripts/launchReadinessWorkflowContract.test.mjs`, proving the runner-temp output path and `if: always()` upload behavior.
- Search proving no active `eight-track-launch-readiness` consumer.
- Full repository gate required by `patternly` after the narrow tests.
- Before/after Git status evidence for both application and content checkouts.
- Independent Luna/max QA with no open findings.

## Risks and stop conditions

- Stop if the smallest correct change requires defining the GATE-02 API contract or GATE-03 four-SHA manifest.
- Stop if Candidate Readiness v2 cannot be consumed without duplicating or weakening its owning content validator.
- Do not ignore an output path to conceal the defect; the durable artifact belongs outside the inspected worktrees.
- Do not weaken genuine dirty-worktree blockers or external-evidence requirements.

## Definition of done

All acceptance criteria and required checks pass, replaced active paths are removed, `docs/qa/GATE-01-REPORT.md` records exact evidence and Luna/max validation/QA, the main working plan advances to `GATE-02`, the intentional diff is committed and pushed, and every repository is clean or any remaining change is precisely attributed.
