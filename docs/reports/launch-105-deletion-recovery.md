# Launch 105 — recovery, sign-out and verified account deletion

**Date:** 2026-08-25  
**Repositories:** `patternly`, `patternly-backend`  
**Status:** implementation slice verified in deterministic tests and Firebase
sandbox fixtures; Task 5 is not marked complete because provider-side deletion,
public-mail, restore-drill, OAuth reauthentication and iOS destructive-state
evidence remain unverified.

## Objective and audit

The objective was to complete the account lifecycle after identity, adoption
and incremental sync without introducing a second persistence authority:
recent reauthentication, one-time recovery-code lifecycle, current/stale
session revocation, T4 sign-out preconditions, in-app deletion, a
possession-verified public deletion request, server proof/tombstone, local
account-owned cleanup and stale-session/restore anti-resurrection.

Confirmed repository facts before implementation:

- Firestore is the backend authority. The client has no direct Firestore path;
  the frontend uses the typed REST client and the backend uses Admin SDK.
- The canonical local authority is the existing MMKV repository boundary under
  `src/storage/repositories/*`, namespace `patternly:canonical:v1:`.
- T4 already owns the mutation journal, account outbox, CAS sync and sign-out
  precondition. Account lifecycle operations must call that path rather than
  bypass it.
- The previous backend had a direct `users.deleteAccount` store method, but no
  reauthentication timestamp gate, durable deletion operation, public
  possession flow, recovery-code store, session-revocation operation or local
  deletion checkpoint.
- Recovery previously meant only Firebase password reset. It did not implement
  the canonical eight one-time recovery credentials.
- The old sign-out path could clear local data and call Firebase sign-out, but
  did not durably record pending server revocation or retain a bound account
  after a remote failure.
- The previous tombstone check was backend-only. A stale authenticated app
  could not recover a completed remote deletion into a local anti-resurrection
  marker.
- The first local iOS build was blocked by RNFirebase SPM plus static
  linkage. Disabling SPM through the official Expo plugin and marking only
  GoogleUtilities/RecaptchaInterop as modular headers fixed the native build;
  this was a build-configuration root cause, not a deletion-flow fallback.

Assumptions kept explicit:

- Firebase Auth remains the credential/session provider; Patternly does not
  claim to delete provider-side Auth records or App Store/Google Play
  subscriptions in this change.
- The public deletion sender is an injected production boundary. The emulator
  uses an in-memory fixture sender only; no real mailbox or production sender
  was used.
- The public link origin is environment-driven and the test value is a local
  sandbox origin.

## Canonical path and duplicate-path audit

The canonical backend path is now `FirestoreAccountLifecycleStore` under
`src/modules/account-lifecycle/store.ts`, reached only through the versioned
API routes. It owns recovery-code hashes, revocation operations, deletion
operations, public requests, proofs and operation-status reconciliation.

The canonical frontend path is:

`AccountSessionProvider` → `accountDataService` → existing T4 sync/journal
repositories plus `accountLifecycleRepository` → typed
`PatternlyApiClientAdapter`.

The obsolete direct `FirestoreUserStore.deleteAccount` method was removed. No
second account-deletion service, direct client Firestore path, silent success
fallback, compatibility branch or alternate persistence authority was added.

## Security and red-team review

The `firebase-security-rules-auditor` review scored the current Firestore rules
**5/5**: both repositories keep client Firestore access denied (`allow read,
write: if false`), and all lifecycle writes are server-side Admin SDK writes.
The review also checked authority ownership, authenticated business logic,
storage/type boundaries and ownership checks.

The `thinking-red-team` review used the authorized scope of this task and
checked concrete exploit paths:

| Threat path | Result |
| --- | --- |
| Enumerate an account through public deletion | Known and unknown addresses both return the same generic `202 accepted`; no request ID is returned publicly. |
| Replay recovery or deletion credentials | Recovery code replay returns `409 recovery_code_used`; public deletion replay returns the same verified proof only after the token hash matches. |
| Reuse another user’s operation ID | Session-revocation operations check stored user ownership; deletion operations already checked ownership. |
| Use a stale bearer token for destructive deletion | Server checks verified Firebase `auth_time` and rejects tokens older than 300 seconds before creating an operation. |
| Recreate a deleted identity | `deletedIdentities` is checked before identity mapping creation; local UID-bound deletion state signs out the same UID on restore/startup. |
| Leak raw recovery codes or possession tokens | Only SHA-256 code/token hashes and bounded metadata are persisted; raw values are returned once to the caller/sender and are not logged. |
| Lose local data after remote failure | Durable pending markers keep the account bound and expose retry/failure states. |

The review found and corrected two concrete issues during implementation: a
recovery custom token initially targeted the internal Patternly account ID
instead of the Firebase UID, and a stale/revoked `401 account_deleted` response
initially did not enter deletion-status reconciliation. Both now use the
canonical Firebase identity and the local operation marker respectively.

## Plan-validation gate

The first approach—wrapping the old direct deletion method with a few routes—was
rejected at **0.56 minimum score**. It would have preserved a competing delete
authority, lacked durable public/idempotent state and could not prove local
cleanup after a lost response.

The selected approach is one Firestore lifecycle store replacing the direct
delete path, with server `auth_time` validation, Firestore operation records,
hashed recovery codes, tombstones/proofs, T4 precondition reuse, a local
deletion checkpoint and explicit UI states:

| Dimension | Score |
| --- | ---: |
| Objective and canonical architecture | 0.92 |
| Clarity and simplicity | 0.86 |
| Implementation, regression, security and operational risk | 0.84 |
| Maintainability and testability | 0.88 |
| **Minimum selected score** | **0.84** |

The selected approach passed the required `0.80` threshold.

## Implemented behavior

### Reauthentication and recovery

- Protected destructive deletion and recovery-code issuance require a verified
  Firebase token with `auth_time` no older than five minutes and no more than
  thirty seconds in the future.
- Password reauthentication calls Firebase `reauthenticateWithCredential` and
  forces an ID-token refresh before the API request.
- Eight recovery codes use the canonical `XXXX-XXXX-XXXX-XXXX` alphabet,
  exclude ambiguous characters, are shown once and are held only in UI memory.
- Firestore stores only code hashes, generation ID, `usedAt`, user ID and
  bounded metadata. Regeneration deletes the prior generation transactionally.
- Consumption atomically marks one code used, resolves the single Firebase
  UID mapped to the Patternly account, revokes prior Firebase refresh tokens,
  and only then issues a custom token. Replay and invalid values are explicit.
- OAuth-provider in-app reauthentication remains an explicit
  `reauthenticationRequired` state; no OAuth deletion success is fabricated.

### Sign-out and revocation

Sign-out reuses the T4 sequence:

`recover journal → synchronize outbox/conflict check → revoke current/stale
Firebase sessions → clear account-owned local data and binding → Firebase
sign-out`.

The durable local sign-out record uses these states:

`pending → remoteRevoked → localCleanupPending → cleared/signedOut`.

Any journal, conflict, offline, revocation, local cleanup or provider failure
keeps the account bound and exposes a retryable state. Session revocation is
idempotent by operation ID and checks operation ownership.

### In-app deletion

Deletion requires explicit UI scope copy and recent reauthentication. It first
reuses the T4 journal/outbox path, then calls one backend operation ID. The
backend revokes Firebase refresh tokens, writes identity tombstones, removes
identity mappings, marks the user deleted, recursively removes the Firestore
user subtree, records remote deletion, and writes an opaque proof only after
the remote boundary is verified. Content-report account linkage is redacted
through the existing report store; report retention remains a separate
canonical policy.

The local deletion record persists an account ID, SHA-256 Firebase UID hash,
operation ID, proof ID and explicit status. Remote deletion is never shown as
success until the public proof endpoint returns the matching proof. Local
cleanup then clears account-owned active-track, terminal sessions, attempts,
reviews, sync projection, outbox and binding. The completed local deletion
marker is intentionally retained so the same UID cannot be rehydrated from a
stale auth session or restored local storage.

### Public deletion

The public flow is:

`request accepted (generic) → possession token sent → possession_verified →
remote deletion pending/remote_deleted → proof complete`.

The request endpoint hashes the email for lookup/rate limiting, returns the
same generic `202` for known and unknown addresses, and sends a custom opaque
token with exactly a thirty-minute expiry when a matching account exists.
Confirmation requires the token hash and request ID. It is not email-only,
does not enumerate accounts and is idempotent after completion. CORS is
enabled only for the configured public deletion origin and only on public
deletion routes.

## Deletion and sign-out state machines

```text
SIGN-OUT
authenticated
  └─ request ─> signingOut
       ├─ journal/outbox/conflict/offline/revocation failure
       │    └─ signOutPending, account remains bound, retry available
       ├─ remoteRevoked
       │    └─ localCleanupPending on local failure
       └─ verified local cleanup + Firebase signOut ─> signedOut

IN-APP DELETION
authenticated
  ├─ stale auth_time ─> reauthenticationRequired
  └─ recent reauth ─> deleting
       ├─ journal/conflict/offline/remote failure
       │    └─ remoteDeletionPending, durable intent retained
       ├─ remote deletion + proof verified
       │    └─ localCleanupPending on local failure
       └─ local cleanup verified + deletion marker retained ─> deleted/signedOut

PUBLIC DELETION
generic request accepted
  └─ possession token ─> possession_verified
       ├─ invalid/expired token ─> explicit invalid request
       ├─ remote failure ─> remote deletion pending, retryable operation
       └─ remote deletion + proof ─> complete; replay returns the same proof
```

## Idempotency, tombstone and anti-resurrection proof

- Firestore `accountDeletionOperations/{operationId}` is the single remote
  deletion checkpoint. A repeated operation ID for the same user returns the
  recorded proof rather than creating a second deletion. A different user
  cannot reuse it.
- `sessionRevocationOperations/{operationId}` provides the same idempotent
  boundary for sign-out/session revocation.
- `deletionRequests/{requestId}` stores only the possession-token hash. A
  completed request replay returns its existing operation/proof after token
  hash verification; no second destructive transition is performed.
- `deletedIdentities/{sha256(provider:subject)}` survives deletion and is
  checked by `ensureUser` before identity creation. The stale Firebase token
  therefore receives `401` and cannot recreate the account mapping.
- The frontend retains `ACCOUNT_DELETION` with the irreversible UID hash after
  local cleanup. On startup/auth change, a matching UID is signed out before
  normal profile/adoption/reconciliation. A remote-deleted status plus proof
  resumes local cleanup after a lost response or revoked/stale session.
- The frontend fixture test proves `401 account_deleted` recovery through
  operation status, local cleanup, cleared binding, and a retained complete
  marker. The emulator proves Firestore user/progress/mapping removal, proof,
  tombstone and old-token rejection.

## Sanitized fixture transcript

All values below are deterministic/synthetic. No raw recovery code, token,
password, learner response or personal data is included.

| Fixture | Input / failure | Verified result |
| --- | --- | --- |
| R1 | Token `auth_time` older than 300 seconds | `401 recent_reauthentication_required`; no deletion operation written. |
| R2 | Recovery generation for one emulator UID | Eight `recoveryCodeIndex` docs; no `code`/`rawCode`; custom token subject equals the mapped Firebase UID; prior sessions revoked. |
| R3 | Recovery code consumed twice | First `200`; replay `409 recovery_code_used`. |
| R4 | Sign-out revocation fixture fails with `503` | `signOutPending`; account binding remains. Retry succeeds, then local account state and binding clear. |
| R5 | In-app deletion with deterministic operation ID | User subtree, progress and identity mappings absent; report account linkage absent; proof `200`; tombstone present; old `/v1/me` token `401`. |
| R6 | Known and unknown `.invalid` deletion addresses | Both generic `202 {status: accepted}`; only the matching fixture receives a sender record. |
| R7 | Public confirmation with wrong token, then correct token, then replay | Wrong token `400`; first valid confirmation `200 deleted`; replay returns byte-equivalent proof response. |
| R8 | Local delete request receives revoked-session `401` after remote completion | Public operation status returns `remote_deleted`; local account-owned cleanup completes; binding clears; UID-hash deletion marker remains `complete`. |

## Changed files

Frontend (`patternly`):

- `src/application/account/AccountSessionProvider.tsx`
- `src/application/account/accountDataService.ts`
- `src/features/account/AccountEntryScreen.tsx`
- `src/infrastructure/clients/PatternlyApiClientAdapter.ts`
- `src/infrastructure/firebase/firebaseAuthClient.ts`
- `app.json` — official RNFirebase SPM opt-out and scoped Firebase modular headers for iOS static linkage.
- `src/storage/keys.ts`
- `src/storage/repositories/index.ts`
- `src/storage/repositories/accountLifecycleRepository.ts` (new)
- `tests/accountLifecycle.test.ts` (new)
- `tests/platformConfig.test.ts`

Backend (`patternly-backend`):

- `.env.example`
- `openapi/patternly-v1.json`
- `src/api/app.ts`
- `src/api/openapi.ts`
- `src/config/environment.ts`
- `src/infrastructure/firebase/adminAuth.ts` (new)
- `src/infrastructure/firebase/verifier.ts`
- `src/infrastructure/firestore/paths.ts`
- `src/infrastructure/firestore/stores.ts`
- `src/modules/account-lifecycle/contracts.ts` (new)
- `src/modules/account-lifecycle/store.ts` (new)
- `src/modules/auth/contracts.ts`
- `src/modules/auth/request.ts`
- `src/modules/users/store.ts`
- `tests/firestore.emulator.test.ts`
- `tests/support.ts`

## Removed dead/obsolete code

- Removed `FirestoreUserStore.deleteAccount`, which was a competing direct
  deletion authority with no reauthentication, proof, tombstone or idempotent
  public lifecycle.
- Replaced the old Firebase-only password-recovery boundary with the canonical
  recovery-code lifecycle while retaining the provider-controlled password
  reset flow for its separate purpose.
- Removed no active provider sign-in path, learning repository, report
  retention path or T4 journal path; each remains needed by the canonical
  product contract.
- Final searches found no second `users.deleteAccount` implementation, direct
  client Firestore lifecycle path, raw recovery-code persistence, token logging,
  hidden deletion fallback or fake success state.

## Exact verification

| Command / evidence | Result |
| --- | --- |
| `npm run qa:static` in `patternly` | **PASS** — recovery inventory, typecheck, 608/608 tests, content boundary and runtime privacy boundary. |
| `npm run ci` in `patternly-backend` | **PASS** — lint, typecheck, Firebase Emulator Suite 19/19, OpenAPI check, frontend client check and build. |
| `npm run openapi:check` with a temporary comparison index | **PASS** — generated artifact matches the intentional worktree change. |
| `PATTERNLY_FRONTEND_ROOT=../patternly npm run frontend:client:check` | **PASS** — 19 versioned paths. |
| `node --import tsx --test tests/accountLifecycle.test.ts` | **PASS** — 2/2 pending/retry/anti-resurrection tests. |
| `git diff --check` in both repositories | **PASS**. |
| Firebase Emulator Suite deletion/recovery fixtures | **PASS** — 19/19 backend tests; no production account or mailbox. |
| Firebase sandbox harness (`patternly-app-sandbox`, synthetic UIDs and `.invalid` public addresses) | **PASS** — recovery codes once-only, stale-token revocation, in-app deletion/proof, fresh-sign-in tombstone blocking, public non-enumeration, possession-verified public deletion, idempotent confirmation retry and public tombstone blocking. Two synthetic fixtures were cleaned up. |
| Deterministic fixture/privacy audit | **PASS** — new fixtures use synthetic IDs and `.invalid` addresses; raw codes/tokens are not in transcript or logs. |
| `npx expo prebuild --platform ios --no-install` | **PASS** — generated RNFirebase SPM opt-out and scoped extra pods from `app.json`. |
| `pod install --no-repo-update` in `patternly/ios` | **PASS** — 114 dependencies / 123 pods; no SPM/static or modular-header error. |
| `npx expo run:ios --configuration Release --device 'iPhone 17' --no-install` | **PASS** — Release bundle built, installed and launched on iOS 26.4 Simulator with 0 build errors. |
| iOS user-visible runtime | **PARTIAL / NOT COUNTED as Task 5 evidence** — clean simulator bootstrap and home screen passed; account route showed the explicit `account-unavailable` state because JS Firebase Auth initialization was not usable in this simulator build. No destructive-state screenshot or runtime pass is claimed. |

The temporary Git index was used only to compare the generated OpenAPI artifact
without staging or altering the user’s real index.

## Unverified areas and remaining risks

- Firebase Admin provider-side `revokeRefreshTokens` and real Firestore
  tombstone/proof behavior were exercised against the `patternly-app-sandbox`
  project with synthetic users. Patternly does not claim provider-side Auth
  record deletion; only refresh-token revocation and Patternly-owned data
  deletion are in scope.
- The public sender, verified HTTPS production deletion origin and real mailbox
  evidence are not configured or exercised. The test sender is in-memory only.
- Production Firestore backup/PITR restore and a signed deletion-tombstone drill
  were not run. Anti-resurrection is proven in code and emulator tests, not in a
  production restore environment.
- Apple/Google interactive reauthentication and the full destructive account UI
  flow on an iOS Simulator remain unverified. Non-password destructive
  operations expose `reauthenticationRequired` rather than bypassing the
  server gate. The simulator proved the explicit unavailable state, not
  deletion success.
- No production deployment, production configuration, real account deletion,
  App Store/Google Play cancellation/refund, provider-data deletion, Play
  Integrity work or Android simulator work was performed.

## Production boundary confirmation

No production deletion was executed. No production Firestore, Firebase Auth,
mailbox, App Store, Google Play, RevenueCat or Cloud Run data/configuration was
changed. All deletion, recovery, revocation and tombstone executions were
synthetic emulator fixtures or the explicitly selected `patternly-app-sandbox`;
no real user, production account or real mailbox was used.
