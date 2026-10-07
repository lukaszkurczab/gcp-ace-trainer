# Resume 2026-10-07 design review

**Verdict: PASS WITH GAPS.** Recreating only the existing local Auth user when the exact fixture UID is absent is a coherent, bounded way to restore the saved account’s emulator identity. It preserves Firestore and avoids app-side account transitions. It does not prove that the installed app still holds a usable SDK refresh credential; the planned ordinary boot and exact profile/session comparison remain required before resuming Q1.

Scores: objective/architecture fit **0.94**, simplicity **0.90**, risk **0.84**, maintainability **0.88**; minimum **0.84**.

The fixture file was present with mode `0600`; its content was not read. The Firebase Admin SDK installed in `patternly-backend` supports `getUser(uid)` and `createUser({ uid, email, password })`. The helper must set and validate `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19099` and the exact project `patternly-app-sandbox` before initializing the Admin app or obtaining Auth. The SDK captures its emulator host when its Auth request handler is created. A missing or malformed environment guard must fail before any Auth request.

Use `getUser` on the receipt-bound fixture UID. Treat only the SDK’s `auth/user-not-found` code as absence; any network, permission, or other error stops. If found, require the returned email to match the fixture and the account to be enabled, then make no mutation. If absent, call `createUser` once with the exact receipt-bound UID, email, and password. Verify the returned UID/email and enabled state without printing them. UID/email conflicts, unexpected responses, or an uncertain create result stop; do not retry the create. A read-only reconciliation may be considered in a separate follow-up if the create outcome is ambiguous, but it must not silently continue.

The existing `provision-account-fixture.mjs` is not a restore path: it generates a new random email/password, lets Auth choose a new UID through REST sign-up, and calls backend account registration. Do not reuse it. The backend’s `createFirebaseAdminAuth` wrapper also does not expose `getUser` or `createUser`; keep the restoration as a narrowly scoped local helper using the installed Admin SDK, with safe stage-only errors and a receipt containing hashes/booleans only. Avoid the separate `dev:admin` environment, whose documented project and emulator ports differ.

The Firebase Auth Emulator source supports the intended identity restoration: a refresh token encodes the project ID and local ID, and validation checks the project then resolves the user by local ID. Restoring the same UID in the same project therefore supports the existing private SDK refresh without inspecting or replacing a token. This source contract does not prove a refresh token remains in the app or that it will refresh successfully. After services are ready, ordinary app boot must show the same active account and Q1 session identity, item/option order, pinned version/hash, index, and one-correct answer count before any dependent UI action. Any mismatch stops. Recheck the original Guest categories after a normal return to Guest. The local smoke entitlement reader is synthetic, not RevenueCat provider evidence.

The service recovery is appropriately scoped if it starts only Auth at the configured loopback endpoint and leaves the existing Firestore process/data untouched. Keep the Auth Admin operation separate from API registration, Firebase client sign-in, token revocation, and Guest repair. Do not import emulator data or restart/kill Firestore. Do not log or persist raw UID, email, password, ID token, or SDK token; compare the fixture UID and account identity to prior owned provision receipts in memory and record only hashes and result categories.

No Auth request, emulator/API/Metro startup, device operation, account mutation, fixture-content read, or application state read was performed for this review.

## Repository evidence

- `docs/active/BIZQ-01/premium-completion-33/RESUME-2026-10-07-BRIEFING.md` — requested exact-UID restore conditions and pre/post session/Guest checks.
- `/private/tmp/bizq33-account.json` — existence and file mode `0600` checked; contents intentionally not read.
- `../patternly-backend/node_modules/firebase-admin/lib/auth/base-auth.d.ts:142, 228` and `auth-config.d.ts:193-228` — Admin `getUser`, `createUser`, and explicit UID/email/password contract.
- `../patternly-backend/node_modules/firebase-admin/lib/auth/auth-api-request.js:564, 930-941, 968, 2050-2058` — missing-user mapping, emulator host capture, UID lookup, and emulator-mode selection.
- `../patternly-backend/src/infrastructure/firebase/adminAuth.ts` — production abstraction exposes custom-token/revoke/delete only; it intentionally does not offer this restore operation.
- `../patternly-backend/src/infrastructure/firebase/verifier.ts` — Admin app initialization uses the configured project ID; emulator routing depends on process environment.
- `../patternly-backend/firebase.json` and `scripts/localSmoke.ts` — Auth and Firestore loopback ports; smoke API requires the sandbox project and expected emulator hosts.
- `patternly/docs/active/BIZQ-01/premium-completion-33/provision-account-fixture.mjs` — generates a new Auth UID and performs backend registration, so it is unsuitable for exact restore.
- `../patternly-backend/node_modules/firebase-admin/lib/auth/base-auth.js:138-143, 314-323` — `getUser` reads the requested UID; `createUser` creates then reads back the user.
- Cached Firebase CLI `lib/emulator/auth/state.js:291-323` and `operations.js:1399-1404` — refresh-token project/UID validation and local-ID user lookup.
- `../patternly-backend/docs/local-admin.md` — `dev:admin` is a distinct `demo-patternly-admin` environment with different emulator ports and persistence behavior.
