# GOV-03 — launch-readiness source integrity — 2026-08-21

## Root cause

`scripts/releaseGate.mjs` consumed the adjacent content readiness JSON without
checking whether the content checkout was clean or whether the report's
`sourceCommit` existed in that Git repository. A locally modified readiness
report could therefore be read as evidence even though it was not a canonical
checkout.

## Change

The gate now:

- checks `git status --porcelain --untracked-files=all` in the configured
  content repository;
- emits `content_readiness_worktree_dirty` when any content checkout change is
  present;
- verifies the readiness report's 40-character `sourceCommit` with
  `git cat-file`;
- emits `content_readiness_source_commit_unavailable` for an invalid or
  unreachable source commit;
- includes repository and source-commit status in the machine-readable report.

This is fail-closed evidence hygiene. It does not infer a remote push, CI
success, publication admission, runtime admission, or human approval.

## Verification

- Focused release-gate tests: 3/3 passed.
- Full application suite outside the sandbox: 631/631 passed.
- `git diff --check`: passed.
- Current local readiness: `not_ready`; the dirty content checkout is now an
  explicit blocker (`content_readiness_worktree_dirty`, 24 changed paths).
- The readiness source commit is reachable, but the checkout containing the
  current GOV-01 edits is not clean.

## Files

- `scripts/releaseGate.mjs`
- `tests/releaseGate.test.mjs`

## Limits

The gate still requires the exact canonical eight-track package/admission
chain and all external release evidence. This slice only prevents local dirty
content evidence from being mistaken for canonical release evidence.
