# ODK-120 — account entry legal acceptance and back navigation

Date: 2026-09-13  
Status: `VERIFIED_CLOSED`

## Outcome

Sign in no longer displays or requires registration acceptance. Create account uses one required Terms acceptance / Privacy acknowledgment control with separate local document links. Email, Apple and Google registration use the explicit backend registration boundary; ordinary sign-in can only resolve an existing Patternly account.

The native navigation sequence is Settings → Sign in → Create account, then Back returns Create account → Sign in → Settings. The same sequence passed with the iOS edge gesture and across three repeated mode cycles without duplicate routes. The register surface is one scrollable layout, including its footer action, and remains usable at accessibility-large text.

## Contract changes

- Added typed `POST /v1/account/registration` consumption with Terms and Privacy version/locale evidence.
- Removed implicit account creation from ordinary bearer and optional-bearer requests.
- Existing mappings are returned idempotently without changing legal acceptance; registration, identity mapping and evidence are atomic.
- `account_not_found` signs out an unrecognized Firebase identity, including cold-start reconciliation; failed sign-out is exposed as `signOutPending`.
- Email registration resumes safely after a partial Firebase create through credential verification and the idempotent registration endpoint.
- Provider sign-in and provider registration are separate commands; registration is single-flight and blocks the auth observer for the scoped UID/generation.
- The new acknowledgment does not store a separate age affirmation. The active Terms carry the 18+ condition; the historical `terms_and_minimum_age` contract remains unchanged and is not backfilled.

## Verification

| Gate | Result |
| --- | --- |
| Independent QA | **PASS**, no P0/P1/P2 |
| App typecheck | **PASS** |
| App focused account/client/navigation/presentation tests | **88/88 PASS**, final delta **74/74 PASS** |
| Backend lint and typecheck | **PASS** |
| OpenAPI generation/check and frontend consumer inventory | **PASS**, 54 operations / 47 mobile consumers |
| Backend OpenAPI/security contracts | **21/21 PASS** |
| Backend full isolated Auth + Firestore suite | **166/166 PASS** |
| Firestore focused suite on fresh emulators | **29/29 PASS**, including concurrent CAS/idempotency |
| Diff checks | **PASS** in both repositories |
| iOS runtime | **PASS** for EN/PL, light/dark, accessibility-large, validation, both local links, native Back and three cycles |

The earlier CAS failure on ports shared ports `18081/19099` was traced to a Firestore emulator process running for more than 36 hours; its log contained transaction lock timeouts. The same unchanged CAS assertions pass on fresh isolated emulators. No shared process was stopped.

## Runtime evidence

The local evidence pack is at `artifacts/maestro-screen-capture/odk120-account-entry/2026-09-13-1305/` and contains 18 SHA-256-indexed full-screen PNGs, a manifest, environment record, coverage matrix, run report and reusable capture flows.

Two runtime defects found during the retest were fixed before closure:

1. Native iOS edge Back bypassed the local `beforeRemove` listener. The screen now uses the native-stack-supported `usePreventRemove` contract.
2. The sticky register footer obscured the form at accessibility-large text. It now belongs to the same scroll surface as the registration form.

## Removed/replaced paths

- Removed registration acceptance and Privacy notice from Sign in.
- Replaced the native-stack `beforeRemove` listener with `usePreventRemove`.
- Removed the separate sticky register footer and the unused Privacy-notice styling.
- Replaced automatic account creation through authenticated requests with one explicit registration endpoint.

## Remaining external gate

Real Apple/Google OIDC and production Firebase were not exercised locally. Their provider runtime verification remains a separate release gate; no local fallback or simulated success is claimed.
