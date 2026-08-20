# Launch current-head verification — 2026-08-20

## Scope

Verify the exact pushed application baseline after the launch-plan reconciliation
commits. This report covers repository tests only; it does not grant content,
runtime, publishing, provider, store, signing, or device admission.

## Evidence

- Repository: `Patternly/patternly`
- Canonical branch: `main`
- Tested commit: `00784ef` (`docs: align launch plan with current app head`)
- Command: `npm test`
- Result: **passed**, 619/619 tests, 0 failures
- Execution note: the first sandboxed run could not bind localhost and reported
  `EPERM`; the same command was rerun with the approved local-network
  permission required by the server HTTP tests and passed in full.
- Visual/path evidence remains the capture-only Maestro pack at
  `artifacts/maestro-screen-capture/fui-visual-confirmation/2026-08-20-1742/`:
  1/1 flow passed with 13 dark-theme checkpoints.

## Boundary

This verification confirms the pushed application test suite and the already
captured first-use → practice → session → summary → Progress → Settings path.
It does not change the release gate, whose remaining blockers are recorded in
`docs/launch-completion-plan.md` and the current content readiness report.
