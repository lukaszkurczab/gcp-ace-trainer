# Android sandbox release remediation plan — 2026-08-26

## Goal and scope

Deliver an Android sandbox APK that starts without Expo Go, Metro, or a
loopback emulator; presents the approved launcher icon and native splash; and
uses only the deployed sandbox HTTPS backend and sandbox Firebase services.

This plan covers `patternly/` mobile configuration and
`patternly-backend/` deployment preparation. It excludes store publication,
production Firebase, production signing, and secrets in source control.

## Evidence-based status

| Area | Status | Current evidence | Gap or consequence |
| --- | --- | --- | --- |
| Sandbox APK packaging | partial | `android/app/build/outputs/apk/sandbox/app-sandbox.apk` exists with SHA-256 `90e35f20d147aed5345e02779df680486cc49bdb3d5cf3102d0f5e1740aa3f6f`; it contains `assets/index.android.bundle`; the bundle has no `expo-development-client` or local API `:8080` marker. | A physical cold-start test is still required; static inspection cannot prove it. |
| Android native branding | partial | `app.json` declares the approved icon, adaptive foreground/monochrome assets, and `#0C1324` splash. Native resources contain adaptive launcher XML, five splash densities, and `splashscreen_background=#0C1324`. | The prior field failure was real; the regenerated artifact has not been visually accepted on a physical device. |
| Sandbox API configuration | blocking | The local mobile `.env` parses as `environment: sandbox`, but its public-environment object has no `apiOrigin` and does not satisfy the closed runtime schema. | `PatternlyAccountProvider` deliberately enters an unavailable state rather than constructing an API client. No sandbox API endpoint is available to the installed app. |
| Emulator isolation | blocking | The current APK bundle contains `http://127.0.0.1:9099`; `.env` has `EXPO_PUBLIC_PATTERNLY_BACKEND_E2E=false` but defines loopback API/Auth-emulator variables. `PatternlyAccountProvider` passes the Auth-emulator variable without restricting it to a development build. | A sandbox artifact can retain a device-local Firebase endpoint. This violates the target network boundary and can make authentication fail on a physical device. |
| Sandbox backend deployment | blocking | `patternly-backend` has a Cloud Run Dockerfile, immutable-image Cloud Build config, and documented required runtime configuration. The latest provider drill proves only the sandbox Firebase shell; it has no verified Cloud Run revision, service URL, IAM policy, or `/ready` result. | A real HTTPS backend deployment and readback are required before mobile can be configured. |
| Regression checks | done | Focused mobile checks passed: 9/9 for sandbox variant, icon bounds, splash declaration, embedded bundle configuration, startup surface, and release-signing guard. | They do not replace an APK/device/network acceptance test. |

## Root cause

The original three field symptoms are not one defect:

1. Branding was previously asserted only from source assets, not from the
   generated native resources and the installed APK. The current worktree now
   contains the native splash and adaptive-icon resources, but device evidence
   has not yet closed that gap.
2. The sandbox build type is configured to be non-debuggable and embeds JS, so
   it is designed to be independent of Expo Go/Metro. The prior report cannot
   be reproduced from static contents of the current APK, but only a cold
   physical launch can falsify the runtime claim.
3. The application cannot use a sandbox backend because the public runtime
   environment is intentionally invalid (missing `apiOrigin`), the backend is
   not evidenced as deployed, and local emulator wiring leaks into the mobile
   runtime configuration.

## Selected approach and plan gate

**Selected architecture:** retain one non-debuggable `sandbox` Android build
type that embeds the JS bundle; make runtime network selection an explicit,
validated sandbox deployment input; and keep all local emulator configuration
exclusive to development E2E execution.

**Plan-validation score: 0.90.** It is consistent with the existing
offline-first/mobile public-environment boundary, removes the local-emulator
leak instead of adding a fallback, has a direct device acceptance path, and
uses the backend's existing immutable Cloud Run contract. The residual 0.10
risk is provider authorization and the absence of a physical device in this
workspace.

## Implementation-ready tasks

### 1. Separate sandbox runtime inputs from development E2E inputs

- **Goal:** ensure an installed sandbox APK cannot select loopback Firebase or
  backend endpoints, while local emulator E2E remains explicit and development
  only.
- **Scope:** `patternly/.env.example`, runtime-config readers, Firebase-auth
  composition, focused configuration tests, and build scripts/config that load
  public values.
- **Non-goals:** changing backend API contracts, adding a compatibility
  fallback, or placing credentials in `EXPO_PUBLIC_*` variables.
- **Inputs:** deployed sandbox origins from task 2; Firebase Android sandbox
  app registration/App Check choices from task 3.
- **Acceptance criteria:**
  - sandbox configuration has a complete closed-schema
    `EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT` with HTTPS `apiOrigin`;
  - a sandbox build rejects any loopback API/Auth-emulator origin at config or
    build validation time;
  - only development E2E can enable Firebase Auth Emulator, and it cannot be
    composed by a non-development bundle;
  - missing or invalid configuration remains visibly unavailable, not silently
    redirected;
  - the final APK has no `127.0.0.1`, `localhost`, Expo dev-client, or Metro
    endpoint markers.
- **Verification/evidence:** typecheck; focused unit tests for environment and
  Firebase composition; `npx expo config --json`; `assembleSandbox`; read-only
  APK string/resource inspection with a recorded SHA-256.
- **Risks:** embedding a wrong public HTTPS host bricks account features until
  a new APK; validate the endpoint before building.
- **Report target:** `patternly/docs/runbooks/android-sandbox-physical-device-handoff.md`
  and a dated execution report.

### 2. Deploy and read back the immutable sandbox backend

- **Goal:** establish the real HTTPS API that the sandbox build may call.
- **Scope:** `patternly-backend/` Cloud Build/Cloud Run deployment contract,
  service runtime configuration, IAM, and sanitized provider evidence.
- **Non-goals:** production deployment, changing Firestore data model, adding
  mobile secrets, or publishing mobile binaries.
- **Inputs:** authorized access to `patternly-app-sandbox`, a selected public
  HTTPS hostname/service URL, Secret Manager references, and approved budget
  boundary.
- **Acceptance criteria:**
  - `npm run ci` passes for the exact backend commit;
  - Cloud Build produces the documented immutable commit-SHA image;
  - Cloud Run runs that exact image with sandbox Firebase project/issuer,
    rate-limit secret, App Check, and required provider configuration;
  - authenticated `/ready` evidence shows database and authentication ready;
  - `/health`, `/ready`, and `/openapi.json` have a recorded HTTPS readback;
  - service IAM permits the intended mobile transport and no broader public
    data access than the API contract.
- **Verification/evidence:** Cloud Build ID/image digest, Cloud Run revision
  and effective service configuration (sanitized), IAM readback, endpoint
  responses, and rollback revision.
- **Risks:** this requires provider authority and may incur sandbox cloud cost;
  do not deploy or change billing without explicit authorization.
- **Report target:** a new dated backend deployment report under
  `patternly-backend/docs/` or the established operations-report location.

### 3. Finish sandbox Firebase mobile-provider readiness

- **Goal:** ensure the installed Android identity is registered and accepted by
  the same sandbox Firebase project used by the backend.
- **Scope:** sandbox Android app registration, SHA-256 signing certificate
  registration appropriate to the sandbox APK, Firebase Auth providers, and
  App Check configuration.
- **Non-goals:** production providers, debug tokens in release-like artifacts,
  or changing the application ID without a migration decision.
- **Inputs:** task 1's final sandbox signing/variant identity and task 2's
  backend deployment.
- **Acceptance criteria:** Android package/signing identity matches the
  sandbox Firebase app; selected Auth providers and App Check accept the
  sandbox artifact; backend validates the generated Firebase ID/App Check
  tokens; failures remain explicit.
- **Verification/evidence:** Firebase console/CLI readback, sanitized token
  verification from the deployed backend, and physical-device sign-in.
- **Risks:** debug-signed sandbox builds need an intentional provider policy;
  this must not be conflated with production signing.
- **Report target:** update the Android sandbox runbook and provider evidence.

### 4. Rebuild and independently accept the branded APK

- **Goal:** turn the corrected native resources and standalone bundle into one
  reproducible acceptance artifact.
- **Scope:** Android prebuild/resource regeneration only when task 1 changes
  configuration; `assembleSandbox`; independent artifact inspection.
- **Non-goals:** `assembleRelease`, store signing, publishing, or changing
  visual identity beyond the approved assets.
- **Inputs:** validated sandbox runtime configuration and provider identity.
- **Acceptance criteria:** APK contains the new embedded bundle, dark native
  splash color/logo, adaptive launcher foreground and monochrome resources,
  expected sandbox package/Firebase identity, and no loopback/dev-client
  markers; SHA-256 and build provenance are recorded.
- **Verification/evidence:** focused tests, `npx expo config --json`,
  `./gradlew assembleSandbox`, APK manifest/resource/bundle inspection, and a
  second reviewer’s report.
- **Risks:** stale generated Android resources can make source configuration
  diverge from the artifact; verification must inspect the APK, not only
  `app.json`.
- **Report target:** Android device handoff runbook with the exact artifact
  hash.

### 5. Execute physical-device release-like E2E

- **Goal:** prove the user-visible contract that static checks cannot prove.
- **Scope:** one clean Android device, uninstall/reinstall, launcher display,
  cold starts with no Expo/Metro/ADB reverse, sign-in/account API handshake,
  and explicit offline/unavailable behavior.
- **Non-goals:** app-store submission or production backend validation.
- **Inputs:** accepted APK from task 4 and deployed HTTPS endpoint from task 2.
- **Acceptance criteria:**
  - icon visibly has the approved safe padding in the launcher;
  - cold launch displays the branded native splash before the branded in-app
    loading surface;
  - app reaches its local-first content without Expo Go, `expo start`, Metro,
    or `adb reverse`;
  - account sign-in and `/v1/me` handshake use the sandbox HTTPS endpoint;
  - disabled network produces the existing explicit unavailable/offline state.
- **Verification/evidence:** dated device model/Android version, screen
  recording or screenshots of launcher/splash/startup, sanitized API/backend
  logs, and the installed APK hash.
- **Risks:** this is owner/device dependent; no agent should claim success
  until owner evidence is attached.
- **Report target:** complete the physical-device handoff runbook and update
  release readiness from `partial` only if all acceptance evidence exists.

## Execution order and blockers

1. **Task 2 is first**: it resolves the missing endpoint; choosing a mobile
   host before a verified Cloud Run revision would encode a guess in a binary.
2. Perform **Task 3** once the sandbox deployment identity is known, in
   parallel only where provider authorization permits.
3. Execute **Task 1**, then **Task 4** against those real inputs.
4. Finish with **Task 5**; it is the only valid closure for the original field
   report.

The current blocker is external authorization and evidence for the deployed
sandbox backend, followed by access to an Android device. No code or provider
state was changed while preparing this plan.

## Evidence reviewed

- `patternly/app.json`, `eas.json`, Android Gradle/manifest/resources, and
  `plugins/withAndroidSandboxVariant.js`;
- current sandbox APK and output metadata;
- mobile configuration/runtime readers and backend diagnostics code;
- focused tests: 9 passed, 0 failed;
- `patternly-backend` Cloud Run, Cloud Build, runtime, and deployment docs;
- `coordination/release-readiness.md` and the current Android device handoff.

## Execution update — 2026-08-26

Completed in the local worktree:

- regenerated the ignored `android/` project with `npx expo prebuild --platform
  android --clean --no-install`;
- replaced the obsolete top-level splash declaration with the supported
  `expo-splash-screen` plugin; the generated Android 12+ style now references
  the branded logo and `#0C1324` background;
- removed loopback emulator values from the local mobile build environment and
  made Firebase Auth Emulator composition require both `__DEV__` and explicit
  development E2E mode;
- added a sandbox bundle guard and focused regression tests; and
- produced `android/app/build/outputs/apk/sandbox/app-sandbox.apk`, SHA-256
  `12b7c997c0c323d949bc9f83bb19f5f5a8d316061663e3b08aab1be4f18e0eb1`.

The generated bundle has no `127.0.0.1`, Expo development-client, or Metro
endpoint marker. A generic dependency string `http://localhost` remains in the
Hermes bytecode but is not an application runtime configuration or selected
network destination; the application no longer receives a loopback backend or
Auth Emulator origin in the sandbox build.

The backend deployment, real public sandbox `apiOrigin`, provider registration,
and physical-device cold-start/API evidence remain blocking external tasks.
