# GOV-02 — Evidence-retention recheck

Date: 2026-08-21

## Result

The GOV-02 recheck found no additional proven-dead tracked artifact or
repository path that can be removed safely in this change set. The previously
identified cleanup is still effective, and the remaining evidence roots are
retained because they contain current-head, simulator, visual-audit, or
historical audit evidence that may be cited by the launch plan.

Physical-device testing is outside the mandatory launch scope. Simulator and
release-compatible evidence are retained where they support the current
release boundary; the absence of a physical-device matrix is not a retention
or admission blocker.

## Revalidated deletions

The following paths are absent from the filesystem and from the tracked file
set, with no live references found under `src`, `scripts`, `tests`, `.github`,
or the active launch plan:

- `docs/release-candidate-closure.md`
- `docs/launch-002-visual-shell.md`
- `docs/launch-003a2-account-lifecycle-design.md`
- `scripts/user-testing/runUserTestingReadinessEvidence.mjs`
- `scripts/user-testing/participantBuildIdentity.mjs`
- `tests/userTestingReadinessEvidence.test.mjs`
- `scripts/preflight/algorithms-independent-practice-preflight.mjs`
- `scripts/preflight/research-build-settings-preflight.mjs`

`docs/user-testing/` and `.maestro/user-testing/` exist only as empty local
directories; neither contains a tracked or runtime-consumed packet. No
tracked file depends on those empty directories.

The content repository's removed `scripts/review/record-owner-approvals.mjs`
also has no live references in `scripts`, `tests`, `src`, `docs`, `README.md`,
or `package.json`. Its deletion is already present in the current content
worktree and was not broadened by this recheck.

## Active-surface contract correction

The active testing strategy and risk register still described signed physical
phone smoke as part of the complete verification matrix. Those two statements
were corrected to require signed-artifact validation and release-compatible
smoke, with physical-device capture explicitly optional and non-blocking. The
dated `docs/launch-readiness-audit.md`, directives, and decision-history
references were not rewritten because they are explicitly retained as
historical evidence; the current Product Owner decision PO-063 supersedes the
older physical-device requirement.

## Retention decision

Retain:

- `.maestro/*.yaml` canonical flows and the current screenshot-capture roots;
- `artifacts/maestro-screen-capture/current-head/**` and cited visual/audit
  evidence;
- `docs/audits/**` historical audit records;
- immutable release, provenance, fixture, and content evidence in the content
  repository.

These roots are ignored or local evidence outputs rather than release source,
but deleting them would remove reproducibility or cited audit material without
proving that a canonical replacement exists. No broad artifact deletion was
performed.

## Verification boundary

- Exact-path existence checks: pass for all revalidated deleted paths.
- Live-reference scan on active source, scripts, tests, workflow, and plan
  surfaces: no matches.
- Content live-reference scan for the removed review script: no matches.
- `git ls-files` confirms the revalidated app paths are not tracked.
- Historical mentions remain only in the repository-hygiene report, where they
  document the completed cleanup; those mentions are not runtime dependencies.
- App full regression suite: 631/631 passed when loopback listeners were
  permitted; the sandbox-only run had 26 `listen EPERM` failures and 605/631
  passes, all in HTTP-listener tests. App typecheck passed.
- App focused regression contracts: 35/35 passed.
- Canonical contract and release-gate tests after the active-surface correction:
  33/33 passed.
- Content architecture suite: 143/143 passed; authoring validation: 10
  registrations and 838 source JSON files valid; AWS source audit: PASS with
  2,564 semantic identities.

This report records a retention decision, not a claim that the release gate is
ready. The enforced gate remains blocked by dirty worktrees, incomplete
eight-track admission, and missing real external evidence.
