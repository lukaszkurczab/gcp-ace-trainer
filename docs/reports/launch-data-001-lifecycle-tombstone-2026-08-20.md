# DATA-01 — Durable account lifecycle and tombstone authority

Date: 2026-08-20  
Scope: server lifecycle tombstone, deletion proof, and protected account routes

## Scope

The server keeps the UID-addressable lifecycle tombstone in
`accountLifecycles/{uid}`, outside the recursively deleted account dataset.
Deletion writes the tombstone before revocation/data/identity work, retries an
identical request idempotently, records only the bounded five-field proof after
all destructive steps and verification succeed, and retains bounded proof
cleanup with retryable failure semantics.

Every currently exposed protected account route now has explicit regression
coverage that a tombstoned UID is rejected before request-body parsing or
service/store access: sync, snapshot, and all six adoption operations.

## Repository changes

- Added snapshot-route tombstone-before-body coverage in
  `tests/serverAccountSnapshotHttp.test.ts`.
- Added all-adoption-route tombstone-before-body coverage in
  `tests/serverAccountAdoptionHttp.test.ts`.
- No new lifecycle owner, account-data fallback, or resurrection path was
  introduced.

This closes the server-side route-guard evidence slice. Full DATA-01 remains
`PARTIAL`: account creation/restore client integration, provider deployment,
session revocation evidence, and PITR tombstone reconciliation are not present
in the repository and cannot be inferred from these tests.

## Verification

- `npm run typecheck` — passed.
- `node --import tsx --test tests/serverAccountDeletion.test.ts tests/serverAccountSnapshotHttp.test.ts tests/serverAccountAdoptionHttp.test.ts tests/serverAccountHttp.test.ts` — 46/46 passed with a local listener.
- Existing sync tombstone test remains passing.

