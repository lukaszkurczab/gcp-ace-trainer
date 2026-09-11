# GATE-04 — exact-four-SHA CI

Status: `done`

## Outcome

- `launch-readiness.yml` accepts exactly four required lowercase commit SHAs and checks out the fixed application, backend, content and web repositories at those exact identities.
- The workflow runs each repository's owning gate, preserves every outcome, rechecks clean HEADs, creates and verifies the GATE-03 manifest outside the worktrees, and passes that same manifest to the enforced launch gate.
- Candidate manifest and launch-readiness report are validated and uploaded with `if: always()`; one final aggregation step fails closed for any skipped or failed prerequisite, gate, manifest, report or upload.
- Web CI now installs the pinned Playwright Chromium runtime and runs `verify:local` against an isolated Vite server with bounded readiness polling and guaranteed cleanup.
- The web local verifier was corrected to check the current admin/privacy/public title contract. No product behavior changed.

The final remote workflow run is dispatched only after both changed repositories have stable published commits. Missing provider/build/store/PO evidence remains an intentional launch blocker and is not converted into a false green release decision.

## Verification

- Pre-implementation validation: `gpt-5.6-luna`, reasoning `max`, PASS; scores `0.95 / 0.86 / 0.82 / 0.91`, minimum `0.82`.
- Independent QA: `gpt-5.6-luna`, reasoning `max`; initial FAIL found two web prerequisites, remediation QA PASS with no open code findings.
- Workflow contract tests: `10/10` passed, including negative mutations for every repository identity, owning gate, manifest/report path, web runtime prerequisite, unconditional upload and final outcome aggregation.
- Full application static gate: `1098/1098` tests passed.
- Web `verify:local`: passed against the isolated server; Playwright admin behavior `35/35`; admin config `3/3`.
- YAML parse, Node syntax checks and `git diff --check`: passed.

The exact remote run URL and its post-commit four-SHA identity are retained as external execution evidence because embedding them here would change the application SHA being evaluated.
