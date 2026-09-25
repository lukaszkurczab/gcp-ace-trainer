# AUD-08/B1c — Firebase generation readiness and iPhone verification

**Date:** 2026-09-25<br>
**App baseline:** `main` at `17628a4b` plus the B1c working-tree change<br>
**Backend result:** `main` at `2a8c035` (`test: cover authorization generation rotation race`)<br>
**Device:** existing iPhone 17, iOS 26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`<br>
**Scope:** local only; no deployment or release-candidate claim<br>
**Independent QA:** **PASS WITH ISSUES**, `gpt-6-luna` / `high`

## Result

B1c is locally accepted. The app force-refreshes Firebase claims before deciding whether a persisted identity has an exchanged Patternly session, rejects a UID change across that refresh, and maps backend `authorization_generation_stale` to the typed `account-reauthentication-required` state. The backend race test proves that a token pinned to generation 1 is rejected after the account advances to generation 2.

This is not a deployment result. Older installed clients that have not exchanged their session can receive `401` when generation enforcement is enabled. Distribution sequencing and compatibility therefore remain a future release gate.

## Device flow

1. Preflight confirmed local Auth `127.0.0.1:19099`, Firestore `127.0.0.1:18081`, API `/ready` with `database/authentication/providerReader=true`, Metro `packager-status:running`, and the single existing iPhone 17. No second device, reinstall, or `clearState` was used.
2. A new isolated Auth and Firestore account was created through the existing backend emulator fixture, not through the unreliable registration form. The fixture began with Auth claim `authorizationGeneration=1` and an active account document at generation 1.
3. The existing sign-in screen was used. Before submission, the complete e-mail value and the complete password were checked in `maestro hierarchy` and in a private screenshot. Earlier suffix/caret errors were detected and corrected before submit.
4. Sign-in and account bootstrap completed. The app entered the authenticated track-selection screen without deleting, resetting, or taking over the saved Guest profile.
5. The isolated account document was advanced from generation 1 to 2 while the Auth claim remained 1. Relaunch without `clearState` drove the real bootstrap and `/me` guard.
6. Maestro observed `account-reauthentication-required` and `account-reauthentication-sign-out`. The final screenshot was visually inspected and shows the password-confirmation-required state.

Private hierarchy files, screenshots, and fixture credentials are not versioned. The earlier startup-only evidence remains historical and contains no login data.

## Automated evidence

| Check | Result | What it establishes |
| --- | --- | --- |
| Targeted app tests | 44/44 PASS | Force refresh, UID race rejection, missing/malformed claim rejection, stale-generation classification and typed state wiring |
| App typecheck | PASS | Changed TypeScript compiles |
| Firebase JS SDK Auth emulator harness | Inner test 1/1 PASS | Claim after custom-token sign-in and force refresh; missing and malformed claim cases |
| Backend generation-rotation race | Inner test 1/1 PASS | Generation pinned at 1, Firestore rotated to 2 before mint completion, stale session rejected by `/v1/me` with `401 authorization_generation_stale` |
| Backend typecheck | PASS | Backend test and production contracts compile |
| OpenAPI and route matrix | PASS, 57/57 | Runtime/OpenAPI has 57 operations; methods, paths, and security profiles match the matrix |
| `git diff --check` | PASS in both repos | No whitespace errors in the intended diff |

Both Firebase CLI wrapper commands returned exit code 2 only after their child tests passed, during the CLI's final update/MOTD configuration check. The inner tests are recorded as passing; the wrapper commands are not reported as PASS.

The Firebase Auth harness demonstrates SDK claim propagation in the emulator. It does not prove production signature validation, because the Auth emulator accepts the local synthetic token used by the harness.

## Route and durable-case boundary

The revalidated matrix contains all 57 OpenAPI operations and profiles. Authenticated account-dependent writes recheck the active account and expected generation in the write transaction. `legalRequests.confirmationStatus` is a continuation of delivery for a durable case already accepted and created behind the generation fence, not a new session-authorized account action. The unresolved B1b4c SMTP ambiguity remains separate: retry may duplicate or delay mail, while no retry may omit confirmation.

## Scope scores and QA

The required pre-execution briefing was approved with consistency/architecture `0.92`, simplicity `0.88`, risk `0.82`, and maintainability `0.90`; minimum `0.82`.

Independent QA (`gpt-6-luna`, `high`) issued **PASS WITH ISSUES**. The functional and local acceptance criteria passed. Non-blocking issues are the future distribution gate for older installations and the intentionally local-only evidence. No deployment was performed. Recovery takeover and provider revoke were not changed by B1c.

## Historical startup evidence

- Startup flow: `.maestro/aud08-b1c-device-startup.yaml` (local ignored flow)
- Startup-only screenshot and Maestro metadata: `docs/active/AUD-08/evidence/B1C-device-20260925/`

These startup artifacts do not contain the fixture credentials and are not the generation-rotation proof; the accepted device observation is documented above from private evidence inspected by the controller and independent QA.
