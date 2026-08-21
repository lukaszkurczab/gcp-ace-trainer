# GOV-04 — release lock provenance integrity

Date: 2026-08-21

## Objective

Ensure the launch gate does not treat an application content lock as trustworthy merely because it contains a list of track IDs. The gate must fail closed when the lock is unreadable or its immutable provenance fields are malformed.

## Repo evidence

The canonical application lock is `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/integration/contracts/content-release/release.lock.json`.

The current lock is structurally valid:

- `schemaVersion` is `2`.
- `repository` is `lukaszkurczab/patternly-content`.
- `bundleId` is present.
- All three artifacts have non-empty release, track, and content-version identifiers.
- Each `producerCommit` and `sourceRepositoryCommit` is a 40-character lowercase commit SHA.
- Each `checksumSha256` is a 64-character lowercase SHA-256.
- Track IDs are unique.

This validates lock integrity only. It does not make the three-artifact historical lock sufficient for the eight-track launch scope; `application_release_lock_scope_mismatch` remains an active blocker.

## Change

`scripts/releaseGate.mjs` now:

- validates the lock schema and required immutable provenance fields;
- reports `contentReleaseLock.status`, path, bundle identity, track IDs, and validation errors;
- emits `invalid_content_release_lock` or `unreadable_content_release_lock` and avoids admitting scope from an invalid lock;
- keeps the canonical lock path as the production default, with an explicit path override only for isolated regression tests.

`tests/releaseGate.test.mjs` adds a malformed-lock regression test and asserts that the gate fails closed.

## Verification

- `node --test tests/releaseGate.test.mjs`: **4/4 passed**.
- `npm run launch:readiness`: **not_ready, 35 blockers**; the lock is reported `valid`, while the three-vs-eight scope mismatch remains explicit.
- Full app suite: **631/631 passed** after the sandbox HTTP-listener restriction was bypassed with approved escalation.

## Limits

This slice does not create or extend release artifacts, alter historical pins, verify package bytes, perform provider/store/signing actions, or grant any release admission. Those remain separate launch gates.
