# BIZQ-01 — CI admission input correction

## Cel
Restore the existing real cross-repository admission test in both content verification workflows. This bounded package completes post-push delivery verification of accepted N07/23; it does not close all BIZQ-01. Keep the one canonical status queue and all existing product/admission/release requirements.

## Ustalenia
Content CI run37243926952 at27b7b7c failed182/183: candidate-admission-v3.test.mjs:10 cannot read sibling patternly/integration/contracts/content-release/release.lock.json. Only content was checked out. Both app CI jobs at ea4f3d61 passed. POST-PUSH-CI.json and raw logs preserve actual results; later content build/readiness steps were skipped. The actual API missing-consumer probe reproduces ENOENT before any receipt write. The same missing prerequisite exists in the manually triggered real-content-release workflow. Both repositories are public; no new credentials or service configuration are needed.

The test calls the actual admission implementation and the actual app runtime test; the consumer is selected from committed admission.application.frontendCommit (currently50a6811cde15b662e8c45f777fcc9c447a482d3a). This is a test-input correction, not a change to admission rules. Current source, artifacts, candidate, locks, runtime tests and admission remain unchanged.

## Podejście — hypothesis for independent design review
Use sibling checkout directories inside GITHUB_WORKSPACE: patternly-content and patternly. Set job defaults.run.working-directory to patternly-content, retaining existing content commands/triggers/gates. Read committed evidence/admissions/candidate-admission-v3.json using Node22, validate a full40-hex frontendCommit, and expose it as a step output. Checkout lukaszkurczab/gcp-ace-trainer at exactly that output, path patternly; install its locked dependencies with npm ci in patternly. Install/run existing content commands as before. Adjust setup-node cache-dependency-path in the manual workflow to patternly-content/package-lock.json. Apply to both verification workflows; do not dispatch the manual workflow.

Acceptance: both workflows supply the exact admitted consumer and dependency prerequisites; original actual admission assertions remain intact; all existing verification steps/triggers retained; no production effects/new secret. Narrow actual admission test, workflow syntax/structural inspection and independent Luna High acceptance precede ordinary push. Observe automatic content CI after push, including183 tests and previously skipped build/readiness checks. Reuse unchanged producer/consumer/app static evidence; no extra mobile test for CI-only change. Determine whether source snapshot inventory includes workflows before claiming artifact preservation. A CI failure must remain explicit until resolved.

Ownership: implementation worker only the two workflow files; root owns canonical queue/state and evidence; reviewers own their reports. Preserve foreign edits, sources/admission/demo and stashes. No new competing status plan or content authoring while this correction is unresolved.

Scores (0–1): objective/architecture fit0.96; simplicity0.86; risk0.85; maintainability0.84; minimum0.84. Exact admission pin avoids latest-branch drift; sibling layout satisfies existing test without changing its contract; two short input sequences are proportionate, no new tooling abstraction.
