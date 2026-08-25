# Launch 103 — identity and account entry

**Date:** 2026-08-25  
**Status:** implementation slice and Firebase sandbox baseline complete; external provider and signed-build gates remain

## Objective and approach

Task 3 composes one guest-preserving Firebase Authentication path in the app:
email/password registration and sign-in, Apple and Google provider sign-in,
email verification, provider-controlled recovery/reset action codes, and a
backend `/v1/me` authority check. Local learning is not touched by provider
initialization, account entry, or authentication failure.

The selected design is one `PatternlyAccountProvider` around one
`FirebaseAuthClient`, backed by Firebase JS Auth and a SecureStore persistence
implementation. Firebase App Check remains an explicit native-provider
composition boundary; it never fabricates a token when native configuration is
absent. The backend accepts only verified Firebase ID tokens, maps the verified
Firebase UID to one Firestore account, and performs revocation-aware token
verification.

The pre-implementation plan gate passed with minimum score **0.82**:

| Dimension | Score |
| --- | ---: |
| Objective and canonical architecture alignment | 0.90 |
| Simplicity and ownership clarity | 0.84 |
| Implementation, security and operational risk | 0.82 |
| Maintainability and testability | 0.86 |

The rejected alternative scored **0.70**: separate provider adapters with an
implicit App Check fallback. It duplicated ownership, made provider readiness
unclear, and risked reporting success without a real native token.

## Root cause and architecture

Before this slice, the backend already had Firebase Admin verification and
Firestore identity mapping, but the app had no composed account provider,
account route, registration/sign-in surface, or secure Firebase Auth
persistence. App Check existed only as a token-provider boundary. Existing
public-origin validation was not consumed by an account surface, so no account
success could be shown safely.

The canonical path is now:

1. Validate the complete public environment and public Firebase client
   configuration. Missing or malformed values produce an explicit unavailable
   account state and do not block guest learning.
2. Initialize one Firebase JS Auth instance with a SecureStore-backed custom
   persistence. Passwords are never persisted; ID/access tokens are removed
   before persistence; only the Firebase refresh-token-shaped state is durable.
3. Resolve email/password, Apple, and Google credentials through that client.
   Email action links are constrained to the validated HTTPS auth-action origin.
4. Send the resulting Firebase ID token through the existing typed Patternly
   API client to `/v1/me`; the backend verifies issuer, audience, subject and
   revocation before Firestore identity mapping.
5. Map provider errors to bounded learner-visible states without exposing raw
   provider messages or account existence. Recovery accepts unknown-address and
   invalid-credential outcomes identically.

No app API contract changed, so OpenAPI was regenerated and checked without a
client diff. No direct mobile Firestore access, account merge, progress sync,
deletion, purchase, or report-outbox binding was introduced.

## Firebase sandbox baseline

The existing `patternly-app-sandbox` Firebase project was selected through the
authenticated Firebase CLI; no new project was created and the production alias
was not activated. The following sandbox baseline is now real and verified:

- registered Web, Android (`com.lkurczab.patternly`) and iOS
  (`com.lkurczab.patternly`) Firebase apps;
- enabled and deployed Firebase Authentication Email/Password and Google
  Sign-In, with the supplied support email configured;
- downloaded the matching `google-services.json` and
  `GoogleService-Info.plist` from the Firebase CLI;
- connected those files through Expo/RNFirebase config plugins and verified
  `npx expo prebuild --no-install` generates the Android and iOS bindings;
- added the Expo config-plugin dependency required by RNFirebase;
- added `.env.example` and ensured local `.env` files are ignored. The local
  `.env` contains only sandbox client configuration and remains untracked.
- confirmed the EAS project and existing production Android keystore; the
  current keystore fingerprint is recorded only in the Android release runbook
  and must be re-read if the keystore changes.

Apple Sign In, native App Check, public API/origin values and signed-device
evidence are intentionally not inferred from the Firebase app registration and
remain separate gates. Google client IDs now exist in the sandbox service files,
but a signed Android OAuth flow is still an external verification gate.

## Changed files

### App

- `App.tsx` — mounts `PatternlyAccountProvider` without changing local-first
  bootstrap ownership.
- `package.json`, `package-lock.json` — add the native App Check/Firebase app
  modules, Expo Apple/Auth Session modules, and the Expo config-plugin
  dependency required by the real provider composition.
- `app.json`, `firebase.json` — connect RNFirebase/native service files and
  deployable Email/Password and Google Sign-In configuration for the sandbox
  project.
- `.gitignore`, `.env.example` — keep local environment values out of Git and
  document the public client, public-origin, App Check and local emulator
  inputs.
- `google-services.json`, `GoogleService-Info.plist` — Firebase sandbox client
  configuration downloaded through the Firebase CLI for the registered mobile
  apps. These contain public client identifiers, not backend credentials.
- `src/application/account/AccountSessionProvider.tsx` — canonical account
  session state, commands, bounded error mapping, non-enumerating recovery,
  backend `/v1/me` reconciliation, and explicit unavailable states.
- `src/features/account/AccountEntryScreen.tsx` — entry, register, sign-in,
  verification, recovery, reset, Apple, Google, backend-unavailable and
  revoked-session surfaces; Apple is omitted on Android until the iOS release
  path exists.
- `src/infrastructure/firebase/publicConfig.ts` — Firebase public client
  configuration parsing and runtime public-environment gate.
- `src/infrastructure/firebase/firebaseAuthClient.ts` — one Firebase JS Auth
  composition for all supported providers and action-code flows.
- `src/infrastructure/firebase/secureAuthPersistence.ts` — SecureStore-only
  refresh-token persistence with access-token redaction.
- `src/infrastructure/clients/patternlyAppCheckToken.ts` — native RNFirebase
  App Check provider composition, Android-only provider support and explicit
  unavailable boundary.
- `src/infrastructure/clients/publicEnvironment.ts` — invalid public-environment
  result is represented explicitly.
- `src/constants/routes.ts`, `src/navigation/types.ts`,
  `src/navigation/RootNavigator.tsx` — canonical account route.
- `src/features/home/HomeScreen.tsx`,
  `src/features/home/tabs/SettingsTab.tsx` — intentional account entry from
  Settings only; no account requirement was added to learning.
- `src/features/home/YourDataScreen.tsx` — removes stale “no composed
  provider” wording and states that account binding/sync remain explicit,
  separate surfaces.
- `src/application/contentReports/contentReportService.ts`,
  `src/features/reports/ContentReportSheet.tsx` — removes raw operational
  error propagation discovered by the required privacy gate; report privacy
  and outbox identity behavior remain unchanged.
- `tests/accountIdentityComposition.test.ts` — configuration, persistence,
  App Check unavailable, bounded failures and recovery non-enumeration tests.
- `tests/settingsPresentation.test.ts`, `tests/visualShell.test.ts` — update
  canonical route/settings expectations for the account entry surface.
- `docs/canonical-product-contract.yaml` — updates the Settings test mapping
  to the actual account-row test name.
- `docs/launch-completion-plan.md` — records the delivered Task 3 code slice
  and remaining external gates.

### Backend

- `src/infrastructure/firebase/verifier.ts` — invalid/revoked Firebase Admin
  verification failures are normalized to a 401-safe internal auth result;
  provider remains the verified Firebase UID authority.
- `tests/firestore.emulator.test.ts` — verifies Firebase UID identity mapping,
  invalid bearer rejection, and fail-closed revoked-verifier behavior in the
  backend boundary.

## Removed or retired paths

- Removed the unused `AccountRuntimeConfiguration` type introduced during
  composition; runtime configuration is represented by the existing validated
  public-environment result and Firebase configuration result.
- Removed raw `Error.message` persistence/display from the existing Task 2
  report flow. Report failures now use bounded operational diagnostics or
  typed Patternly API error codes.
- Removed no historical auth adapter because the old `server/src` and
  `AccountAuthClientAdapter` paths were already absent from the active source
  tree and are documented as superseded. They were not revived as compatibility
  paths.
- No duplicate provider adapter, feature flag, dual-write path, mock provider,
  fake Firebase configuration, or silent fallback was added.

## Guest-first and backend authority confirmation

- `PatternlyAccountProvider` is mounted around navigation but does not create
  Firebase anonymous users and does not alter local learning repositories,
  active sessions, drafts, attempts, review data, or the report outbox.
- Account entry is reachable from Settings and remains unavailable when its
  public/Firebase configuration gate is absent; the rest of the local product
  remains usable.
- The app never treats Firebase client-side user state as final account
  readiness. Authenticated readiness is shown only after `/v1/me` succeeds.
- The backend verifies issuer, audience, subject and revocation with Firebase
  Admin, then maps `provider=firebase` and the verified UID through the
  Firestore identity mapping transaction. The client cannot submit a claimed
  provider or account ID.
- No learning data is sent during this slice, and no automatic email merge or
  account/data adoption occurs.

## Verification

### App

- `npm run qa:static` — **PASS**: recovery inventory, typecheck, all **604/604**
  tests, content boundary, and runtime privacy boundary.
- `npm run gate:contract-change` — **PASS**.
- `npm run recovery:check` — **PASS**.
- Focused account, architecture, visual-shell, settings and report-outbox
  tests — **PASS**.
- Secure persistence test confirms persisted JSON contains no `accessToken` and
  stores only the refresh-token-shaped Firebase state. Fixtures are synthetic;
  no real credential or provider token is present.
- Runtime privacy scan — **PASS**; no raw operational error messages or
  production console diagnostics remain in app source.
- `git diff --check` — **PASS**.
- `npx expo config --type public` — **PASS**; RNFirebase plugins and service
  file paths resolve.
- `npx expo prebuild --no-install` — **PASS**; generated Android Google
  Services, iOS Google Services and RNFirebase App Check initialization.
- EAS CLI — **PASS**; `@lkurczab/patternly` is linked and the production
  Android keystore exists. No signed build was submitted.
- Firebase CLI — **PASS**; sandbox alias active, three apps registered and
  Email/Password plus Google Sign-In deployed.
- There is no app `lint` script in `package.json`; no separate linter command
  was claimed as passed.

### Backend

- `npm run typecheck` — **PASS**.
- `npm run lint` — **PASS**.
- `npm run build` — **PASS**.
- `npm run test:emulator` — **PASS**, **13/13** tests, including identity
  mapping, invalid bearer rejection, Firestore CAS/idempotency, report
  privacy/rate-limit behavior, deletion tombstone behavior, and the
  fail-closed revoked-verifier boundary.
- `npm run openapi:check` — **PASS**; no API contract change.
- `PATTERNLY_FRONTEND_ROOT=../patternly npm run frontend:client:check` —
  **PASS**, client matches all 9 versioned API paths.
- `git diff --check` — **PASS**.

## Unverified areas and configuration gates

The sandbox mobile service files and Email/Password plus Google Sign-In
configuration now exist. The repository still intentionally contains no
production public environment values, Apple provider configuration, or native
App Check attestations. The following remain explicit
external gates, not local passes:

- Firebase Auth sandbox registration/sign-in with real email delivery.
- Apple sign-in on a signed iOS build with the registered bundle/service
  configuration.
- Google sign-in on a signed Android build with the generated client IDs and
  redirect configuration.
- Native App Check with real sandbox App Attest/DeviceCheck/Play Integrity
  providers. The provider boundary returns unavailable when the native module
  or configuration is absent; it does not fabricate a token.
- Real provider rate limits, expired/used action links, offline iOS flows,
  backend outage flows, and a real revoked Firebase session on a signed build.
- Maestro/iOS screenshots for guest, register, sign-in, verification, recovery,
  offline, provider-unavailable and revoked-session states.
- Production origin/domain/legal/sender configuration and deployment.
- The eight one-time recovery-code lifecycle required by the broader identity
  contract. Task 3 implements the email recovery/reset action-code surface;
  code generation, strong-hash storage, one-time display/revocation and
  recovery-session completion remain the planned Task 5 lifecycle scope.

The Firebase Auth Emulator run also showed that its `revokeRefreshTokens`
operation did not invalidate an already issued ID token during this run. The
backend still calls Firebase Admin verification with revocation checking, and
the application boundary test covers the resulting revoked-verifier failure;
real provider revocation remains an external signed-sandbox gate.

## Remaining risks

- Account UI can only become fully operational after the owner supplies
  verified public origins and App Check registrations through the secure build
  channel, then verifies the signed Android provider flows. The Firebase
  project/client IDs and native service files are now present for the sandbox
  baseline.
- Native Firebase App Check integration is deliberately not claimed as signed
  device evidence. Shipping a build without those registrations must keep the
  provider unavailable rather than silently accepting reports or account
  success.
- Task 4 must add explicit adoption preview/confirmation before any learning
  record binding or remote sync. This slice must not be extended with an
  automatic merge.
- Task 5 must add recent reauthentication, recovery codes, session revocation
  evidence and verified deletion before account lifecycle completion can be
  claimed.
