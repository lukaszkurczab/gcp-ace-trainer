# GOV-05 — application source integrity

Date: 2026-08-21

## Objective

Prevent the launch gate from admitting a release-readiness result while the application checkout contains local changes. Exact-SHA evidence is meaningful only when the evaluated application source is a clean repository state.

## Root cause

`scripts/releaseGate.mjs` previously checked whether the adjacent content evidence checkout was dirty, but did not inspect the application repository that was executing the gate. A local application modification could therefore coexist with a readiness report whose other inputs appeared valid.

## Change

The gate now records the application repository status and emits:

- `application_repository_unavailable` when the application Git checkout cannot be inspected;
- `application_worktree_dirty` with the changed-path count when it is not clean.

The production path is the current application repository. `PATTERNLY_APPLICATION_ROOT` exists only to exercise the negative path against an isolated temporary Git checkout in the regression test.

## Verification

- `node --test tests/releaseGate.test.mjs`: **5/5 passed**.
- Current gate summary: `not_ready`, **35 blockers**; application repository `dirty` with 34 changed paths, content repository `dirty` with 24 changed paths, release lock structurally `valid`.
- `git diff --check`: passed.

## Limits

This does not fabricate or infer exact-SHA CI, approval, package, provider, store, signing, Figma, or physical-device evidence. It only prevents a dirty application checkout from being mistaken for an exact-source release candidate.
