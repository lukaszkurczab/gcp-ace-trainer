# Account record fingerprint contract

Profile: **record-fingerprint-json-utf8-v1**. Independent contract review: Luna high,
14.10.2026; raw historical APP bytes approved, with recursive NFC-key-collision
rejection. Fit 0.96 / simplicity 0.94 / risk 0.86 / maintainability 0.93 (min 0.86).

SHA-256 hashes UTF-8 of exactly `{recordId, recordType, state, trackId}`:

- Sort raw object keys by ECMAScript UTF-16 ordering; emit unchanged JSON strings.
- Finite ECMAScript JSON numbers, including `-0` → `0`; ordered dense arrays.
- Plain JSON objects; reject unsupported values, cycles, sparse arrays and keys
  colliding after NFC, recursively. NFC validation never changes emitted bytes.
- Exclude record version and fingerprint. No profile tag in preimage or wire.
  The name is a fixed protocol contract, preserving existing APP hashes.

Composed and decomposed Unicode are different payload bytes with their own valid
hashes. Changing either payload while retaining the other hash is invalid.
Envelope `canonical-json-v1`, logical keys, request digests, byte budgets and
learning mutation serializers retain their existing contracts.

## Data and retry policy

No migration, rehash, local reset or deletion. Ordinary existing local records,
outbox fingerprints, acknowledged hashes, snapshot versions and retry mutation
IDs remain unchanged. NFC-colliding local keys are preserved but fail validation;
they cannot pass the existing NFC envelope either. Unknown versions are not
inferred or accepted through a fallback.

Existing backend NFC-hashed records remain valid when those bytes match this
profile (ASCII/NFC). A non-NFC payload with its historical NFC hash is preserved
and fails `progress_fingerprint_mismatch`, including readback. Any concrete repair
needs a separate scoped decision; no alternate hash is accepted. Pending retry
payloads and operation IDs are never rewritten. Receipt binding and TTL remain
prompt 03, outside this change.

## Runtime ownership

| Producer / consumer | Fingerprint owner |
| --- | --- |
| APP snapshot, outbox, conflict resolution, tombstones, diagnostics | `accountDataRecordFingerprint` → domain `recordFingerprintPayload` |
| Backend merge, progress write/read, tombstones | `createMergeRecordFingerprint` → infrastructure `recordFingerprintPayload` |
| Backend one-shot adoption, staged upload/readback/materialization | same backend owner, including `adoptionRecordFingerprint` delegation |

The two repositories carry matching small implementations of this protocol,
without a new shared package. [vectors.json](vectors.json) is their common oracle;
its payloads and hashes also match the historical APP serializer. It covers ASCII,
NFC/NFD, escaping, supplementary/BMP key ordering and ECMAScript numbers.

Implementation and local acceptance are coordinated across APP and backend.
APP hashes are compatible with its baseline; backend acceptance changes to those
bytes. Merge the reviewed pair together. No deployment is authorized or performed;
before any deployment, resolve a concrete incompatible stored backend record if
one is encountered. Rollback restores source only and never rewrites user data.

## Reproduction and evidence

APP baseline `9e44d029`; backend baseline `b51b870`. Node 22.22.3. Run from each
repository with Node 22 on PATH. The cross-repo runner requires the APP checkout
beside backend, or `PATTERNLY_FRONTEND_ROOT`; it refuses a live Firestore endpoint
and uses the existing isolated runner with demo project and dedicated ports.

```sh
# APP
node --import tsx --test src/domain/identity/recordFingerprint.test.ts src/domain/identity/canonicalSerialization.test.ts src/storage/repositories/accountDataSync.test.ts src/application/account/accountDataContract.test.ts src/application/account/accountDataService.test.ts src/application/account/accountLifecycle.test.ts src/application/account/accountDataExportService.test.ts
npm run typecheck
# BACKEND
node --import tsx --test tests/recordFingerprint.test.ts tests/merge.test.ts tests/progressContracts.test.ts tests/adoptionTransfer.test.ts
npm run typecheck
npm run lint
node scripts/run-record-fingerprint-client.mjs
```

Local acceptance 14.10.2026: **PASS**. Independent Luna high QA reran the
5-case emulator integration, APP 99/99, backend 25/25, both typechecks and backend
lint. No behavioral blocker. Its two minor documentation notes (serializer caller
scope and pending acceptance wording) were corrected. Final independent closeout:
**PASS**, including links, source hashes and plan/state consistency. Controller also passed APP
recovery inventory, content boundary, runtime privacy boundary, both Git diff
checks and contract-link checks. No full test-suite or device rerun was required
for this pure byte-profile change.

Logs for this run: `/private/tmp/arch09-integration.log`,
`arch09-app-tests.log`, `arch09-backend-tests.log`, `arch09-app-typecheck.log`,
`arch09-backend-typecheck.log`, `arch09-backend-lint.log`, `arch09-recovery.log`,
`arch09-content-boundary.log`, `arch09-privacy-boundary.log` in the same directory.
These temporary logs supplement the versioned tests and commands above.

The initial test attempts exposed test-harness assumptions, not production
failures: the existing account-sync envelope revision increments on outbox
preparation; staged-upload replay expects sorted keys; APP tamper refusal uses
`account_data_record_invalid`. The corrected tests retain exact learning-data,
outbox payload/identity and post-consumer preservation assertions.

The integration script uses
the real Design runtime and APP repositories with memory storage, and the real
FirestoreProgressStore on an isolated emulator. It does not prove native MMKV,
live account/provider behavior, deployed services or release readiness. No device,
account reset, reinstall, new Guest, email, spending or publication is performed.

## Changed files and source receipt

APP: `src/domain/identity/recordFingerprint.ts`, its `.test.ts`,
`src/domain/identity/canonicalSerialization.ts` (comment only),
`src/storage/repositories/accountDataRepository.ts`, this README and `vectors.json`,
`docs/specs/engineering/architecture.md`, `.agent/WORKING_STATE.md`.
Backend: `src/infrastructure/identity/recordFingerprint.ts`,
`src/infrastructure/identity/canonicalJson.ts` (comment only),
`src/modules/users/merge.ts`, `tests/recordFingerprint.test.ts`,
`scripts/run-record-fingerprint-client.mjs`,
`scripts/qa/record-fingerprint-client.test.mjs`.
Workspace: `docs/04-data-model.md`, `docs/PATTERNLY-WORKING-PLAN.md`.
No removed files; other-purpose serializers remain necessary for their callers.
No QLE, content pin, WEB, provider or deployment changes. The pre-existing
prompt-01 working-state delta was preserved and updated, not included in a commit.
No commit/push was performed in this session.

Verified production bytes (SHA-256; documentation-only edits do not invalidate
matching runtime evidence):

| File | SHA-256 |
| --- | --- |
| `patternly/src/domain/identity/recordFingerprint.ts` | `ee949bb1d254aa1266fa8ce199c32a19284541d5cb1541d40b91f3ab2829fc28` |
| `patternly/src/storage/repositories/accountDataRepository.ts` | `da093fab814bb70a82b562aca5cfa272ee3bea458f158b021af14d4a5725a1a5` |
| `patternly-backend/src/infrastructure/identity/recordFingerprint.ts` | `ee949bb1d254aa1266fa8ce199c32a19284541d5cb1541d40b91f3ab2829fc28` |
| `patternly-backend/src/modules/users/merge.ts` | `3cd6c1597a8bb766118ea2922edbaa4c3cc4fe65ac93f9cd778320c83fd90897` |
