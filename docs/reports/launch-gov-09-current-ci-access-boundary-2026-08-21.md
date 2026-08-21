# GOV-09 — Current CI access boundary

Date: 2026-08-21

## Current read-only result

- `gh auth status` is authenticated as `lukaszkurczab` with repository access.
- Read-only `gh run list` confirms the baseline application and content runs
  for their exact current origin SHAs: app `32394452819` and content
  `32388398769`, both completed successfully.
- The new `launch-readiness.yml` is not present in the remote workflow list;
  it remains a local unpushed workflow, so no run exists for the local diff.
- No commit, push, workflow dispatch, or other GitHub mutation was performed.

## Read-only recheck — 2026-08-21

- Application `gh workflow list` still exposes only the remote `QA` workflow;
  the local `Launch readiness` workflow is not registered remotely.
- Content `gh workflow list` still exposes only `Content publishing
  architecture` and `Real content release gate`; no exact-SHA launch workflow
  is registered remotely.
- The latest listed application run remains successful QA run `32394452819`
  for the pushed EAS release-packet commit; the latest listed content run
  remains successful architecture run `32388398769` for content HEAD
  `12b99c7`. Neither is evidence for the local launch-readiness workflow or
  the current dirty worktrees.
- No commit, push, workflow dispatch, or other GitHub mutation was performed
  during this recheck.

## Interpretation

The [GOV-06 baseline revalidation](launch-gov-06-exact-ci-baseline-revalidation-2026-08-21.md)
is confirmed for the two already-pushed baseline commits only. It is not
evidence for the current local application/content changes, and it cannot be
used as the result of the new exact-SHA launch workflow.

The local workflow is ready to accept:

- the final clean application commit SHA;
- the final clean content commit SHA;
- a manual dispatch that checks out both exact SHAs and verifies both HEADs;
- the resulting enforced gate report and run URL.

## Required next action

An authorized operator must commit and push the reviewed application/content
changes, then dispatch
`.github/workflows/launch-readiness.yml` with the two resulting exact SHAs.
The run must remain red until the real eight-track and external launch evidence
is complete; a successful workflow cannot be manufactured locally.

## Boundary

This report records access failure and preserves the evidence boundary. It does
not claim CI failure, CI success, provider approval, store/signing approval,
Figma approval, or Product Owner GO. Physical-device testing is optional and is
not a CI admission requirement.
