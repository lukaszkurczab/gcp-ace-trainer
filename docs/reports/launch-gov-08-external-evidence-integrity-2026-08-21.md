# GOV-08 — external release evidence integrity

Date: 2026-08-21

## Finding

Before this slice, `scripts/releaseGate.mjs` admitted an external evidence file when it contained the expected ID, `status: verified`, and any 64-character `evidenceSha256`. The gate did not calculate that hash, bind the record to the current application commit, or require a verifier, timestamp, or evidence reference. That envelope was too weak to protect the final launch claim from accidental or misleading records.

## Implemented contract

- Added `schemas/release/release-evidence.schema.json` for `patternly-release-evidence-v2`.
- External evidence now must be bound to the current application `HEAD` commit.
- The mandatory evidence set is `design-authority`, `security-and-privacy`,
  `provider-and-operations`, `signing-and-builds`, `store-readiness`, and
  `product-owner-go`.
- `physical-device-matrix` remains schema-valid and is reported as optional
  evidence; its absence never creates an enforced launch blocker under PO-063.
- The release report now records the actual `HEAD` of both the application and
  content checkouts; the workflow separately verifies those two exact inputs.
- The gate requires a non-empty verifier, UTC verification timestamp, at least one typed evidence reference, and a canonical SHA-256 over the envelope identity excluding `evidenceSha256`.
- Invalid, stale, or self-inconsistent envelopes remain blockers.
- No evidence files were created; missing real provider, store, signing, Figma, security, or Product Owner proof remains missing. Physical-device evidence is optional for this launch scope.

## Verification

- `node --test tests/releaseGate.test.mjs tests/launchReadinessWorkflowContract.test.mjs`: release-gate and workflow contract tests passed.
- `npm test`: 631/631 passed with loopback access for HTTP tests.
- `git diff --check`: passed.
- The regression test proves that a legacy/random-hash envelope is invalid, a correctly bound canonical envelope is recognized, and a tampered hash is invalid.
- The current gate remains `not_ready`; this slice changes only evidence integrity, not external facts.

## Boundary

Canonical hashing and commit binding prove envelope integrity and freshness. They do not authenticate a person, provider dashboard, store record, or Figma owner. Those real actions and approvals remain required before launch; a physical-device run is not required by the current launch scope.
