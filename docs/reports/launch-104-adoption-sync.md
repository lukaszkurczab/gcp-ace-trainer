# Launch 104 — account adoption and incremental sync

**Date:** 2026-08-25  
**Repositories:** `patternly`, `patternly-backend`  
**Status:** implementation slice complete; iOS account-adoption runtime evidence remains unverified

## Objective and source audit

Task 4 moves one guest installation into one revisioned account dataset without
silently discarding local learning or allowing two competing persistence
authorities.

The audit confirmed that the canonical local authority is the existing MMKV
repository layer under `src/storage/repositories/*`, with the namespace
`patternly:canonical:v1:`. The existing learning mutation journal remains the
durability boundary. The backend already had per-record progress CAS and
idempotency, but it had no adoption preview/confirmation protocol, no account
revision CAS, no account outbox recovery path, and no sign-out precondition.
The account UI also had no visible preview, conflict, pending, or retry state.

The canonical product contract was treated as authoritative over stale
historical reports. In particular, the implementation follows the current
`ACCOUNT-DATA-AUTHORITY-001`, `ACCOUNT-DATA-ADOPTION-001`,
`ACCOUNT-SYNC-CONFLICT-001`, and `DEVICE-SESSION-SYNC-001` requirements. No
historical report was rewritten to hide the discrepancy.

## Plan validation

The first proposed approach was rejected: dumping all MMKV data into a new
account repository would have created a second schema, synced device-owned
state, and made conflict semantics implicit. A full automatic merge was also
rejected because it would make last-write-wins or silent overwrite possible.

The selected approach extends the existing progress/CAS path and the existing
canonical repositories:

| Dimension | Score |
| --- | ---: |
| Objective and canonical architecture | 0.90 |
| Clarity and simplicity | 0.86 |
| Implementation and operational risk | 0.82 |
| Maintainability and testability | 0.85 |
| **Minimum selected score** | **0.82** |

## Canonical data behavior

Only these compact terminal facts are eligible for account sync:

| Record type | Sync behavior |
| --- | --- |
| `active_track` | One revisioned account record keyed by stable `current` identity |
| `training_session_summary` | Completed or abandoned terminal session summary only |
| `training_session_result` | Immutable result keyed by stable session identity |
| `training_attempt` | Immutable terminal attempt keyed by stable item identity |
| `review_queue_entry` | Revisioned review evidence keyed by stable item identity |

The active session pointer, active session, draft, current position, foreground
timer, and mutation journal remain device-only. Goals, settings, notification
configuration, storage metadata, account binding, deletion intent, and derived
progress are not synced. There is no direct client Firestore path and no second
learning storage path.

## Adoption protocol

The client creates a deterministic snapshot and asks the backend for a preview.
Confirmation is explicit and persisted before the network call so a process
death can replay it. The backend recomputes the preview fingerprint and uses a
deterministic operation ID; a repeated confirmation returns the original result.

The deterministic preview cases are:

| Local / remote state | Result |
| --- | --- |
| both empty | no mutations |
| local only | explicit upload plan |
| remote only | explicit restore plan |
| both with equal immutable fingerprints | dedupe plan |
| both divergent | explicit per-record Keep this device / Keep account resolution |
| active local session | blocked before binding |
| pending local mutation journal | blocked before binding |

An immutable ID with a different fingerprint is an integrity conflict, not a
merge opportunity. A changed revision after the preview is stale and must be
re-previewed. No adoption path silently overwrites, merges, or discards data.

### Sanitized fixture transcript

All identifiers below are synthetic fixtures; no email, account, learner
response, or production identifier is used.

| Fixture | Remote before | Local snapshot | Preview / remote after |
| --- | --- | --- | --- |
| F1 empty | revision `0`, records `[]` | records `[]` | no-op; revision remains `0` |
| F2 local-only | revision `0`, records `[]` | one `active_track/current` record | explicit upload; revision `1`, one remote record |
| F3 identical | revision `1`, one `training_attempt/item-001` | same immutable ID and fingerprint | dedupe; no conflicting write |
| F4 divergent | revision `1`, `training_attempt/item-001` fingerprint `A` | same ID, fingerprint `B` | explicit conflict; no write before Keep this device / Keep account |
| F5 unsafe local state | any remote revision | `activeSession=true` or `pendingJournal=true` | blocked; no account binding |

The backend emulator asserts the F2 replay, F4 CAS behavior, and F5 blocking
responses. The frontend fixture suite asserts the device-only exclusion,
deterministic outbox IDs, and explicit tombstone creation.

## Incremental sync and silent-loss prevention

The local mutation order is:

`validate → persist local journal → materialize and verify local records → clear local journal → enqueue compact idempotent outbox operation → synchronize opportunistically`.

The implementation provides:

- FIFO account outbox operations with deterministic mutation IDs.
- SHA-256 fingerprints over the canonical serialized record.
- Account-level expected-revision CAS.
- Per-record expected-version CAS.
- Transactional duplicate replay and mutation-reuse rejection.
- Explicit tombstones when an acknowledged local record is removed.
- Remote failure behavior that retains the local commit and outbox entry as
  visible `offlinePending`/`failed` state.
- Conflict and stale-preview states that retain the last verified local and
  remote projections.
- Stable `active_track` document identity so switching tracks updates one
  account record instead of creating stale duplicate active-track records.

There is no last-write-wins policy and no background-sync promise. Sync is
opportunistic on authenticated account loading and after a durable local
mutation, with explicit retry.

## Sign-out precondition

Sign-out first attempts journal recovery. A pending account outbox must either
be synchronized successfully or remain visibly bound when recovery fails. Only
after successful recovery and synchronization are account-owned local records,
binding, tokens, and outbox state removed. App metadata, settings, and
notifications remain local. A failure therefore cannot silently sign out while
leaving unverified account data behind.

## Changed implementation

Frontend:

- `src/storage/repositories/accountDataRepository.ts` — canonical MMKV sync
  snapshot, projection, outbox, tombstones, remote materialization, and
  account-owned cleanup.
- `src/application/account/accountDataService.ts` — adoption, incremental sync,
  recovery, failure mapping, and sign-out precondition.
- `src/application/account/AccountSessionProvider.tsx` — account lifecycle
  orchestration and explicit session states.
- `src/features/account/AccountEntryScreen.tsx` — preview confirmation,
  conflict resolution, pending, retry, failure, active-session, and journal
  states.
- `src/infrastructure/clients/PatternlyApiClientAdapter.ts` — typed adoption
  and revisioned sync transport.
- `src/storage/repositories/guestInstallationRepository.ts` and
  `src/storage/keys.ts` — explicit installation binding and one sync-state key.
- `src/application/learningMutations/commitMutation.ts` — outbox enqueue after
  verified local journal clear, with explicit pending-clear failure.
- `src/features/home/YourDataScreen.tsx` and
  `src/features/home/BackendDiagnosticsScreen.tsx` — truthful sync copy and
  updated diagnostics contract.

Backend:

- `src/modules/progress/contracts.ts` — typed allowlist, fingerprints, account
  snapshot, and expected account revision.
- `src/modules/progress/store.ts` — Firestore transaction implementation for
  preview, confirmation, account CAS, per-record CAS, idempotency, and
  materialization.
- `src/modules/users/merge.ts` — deterministic adoption preview and explicit
  resolution validation.
- `src/api/app.ts` and `src/api/openapi.ts` — adoption endpoints and bounded
  error mapping.
- `src/infrastructure/firestore/paths.ts` — stable record identity for
  revisioned progress documents.
- `openapi/patternly-v1.json` — generated API contract.

Tests and fixtures:

- `tests/accountDataSync.test.ts` — device-only exclusion, deterministic
  outbox, tombstone, and PII-free fixtures.
- `tests/firestore.emulator.test.ts` — concurrent retry, adoption preview and
  replay, CAS, active-session block, and active-track replacement.
- `tests/merge.test.ts` — all adoption cases and explicit conflict resolution.
- Updated repository/client contract tests for the new installation and sync
  schemas.

## Dead-code and competing-path check

The unused account-record helper `getAccountDataRecordForSync` was removed.
The diagnostics screen no longer imports a storage implementation directly;
its fingerprint helper is exposed through the application boundary. The stale
“there is no account sync” copy was replaced with the actual device-only and
pending behavior. Searches found no `AsyncStorage`, `localStorage`, direct
client Firestore, duplicate account sync repository, or legacy
`item_progress` authority. No compatibility branch, hidden fallback, mock
account state, or temporary metadata path was added.

## Verification

| Command / evidence | Result |
| --- | --- |
| `npm run qa:static` in `patternly` | PASS — recovery inventory, typecheck, 606/606 tests, content boundary, runtime privacy boundary |
| `GIT_INDEX_FILE=/private/tmp/patternly-task4-openapi-index-final npm run ci` in `patternly-backend` | PASS — lint, typecheck, Firebase emulator 16/16, OpenAPI, frontend client, build |
| `PATTERNLY_FRONTEND_ROOT=../patternly npm run frontend:client:check` | PASS — 11 versioned paths |
| `git diff --check` in both repositories | PASS |
| deterministic account fixtures | PASS — no personal data |
| Firebase Auth/Firestore emulator | PASS — 16/16 tests |

The temporary Git index was used because the generated OpenAPI artifact is an
intentional worktree change; it allowed `openapi:check` to compare the generated
artifact against the temporary index without staging user changes.

## iOS evidence and remaining risks

The iPhone 17 / iOS 26.4 Simulator was booted and the Patternly development
client was installed. The existing RC iOS smoke was attempted with the local
Metro contract, but it stopped in the preflight listener flow because
`patternly:content:audit-command-listener:ready` was not visible. Its output is
under `/private/tmp/patternly-task4-ios-rc/2026-08-25_145206`. This is not
claimed as Task 4 adoption evidence; no dedicated adoption Maestro flow was
invented solely to manufacture a pass.

Still unverified:

- Production Firebase/Cloud Run behavior and deployment configuration were not
  changed or exercised.
- The full account adoption UI interaction and screenshots on iOS remain
  unverified because the existing runtime preflight failed before reaching the
  account surface.
- The backend can enforce the client-declared active-session/journal adoption
  preconditions, but it cannot independently inspect device-local state; the
  local snapshot and server block are both required by the contract.
- Account deletion and recovery-code lifecycle remain Task 5 scope.

No production changes, Play Integrity work, Android simulator run, purchase
integration, or cross-device active-session resume was performed.
