# ODK-122 — explicit local authentication profiles

Date: 2026-09-13  
Status: `VERIFIED_CLOSED`

## Outcome

Local application startup no longer silently selects the smoke runtime. The generic `start`, `ios`, `android` and `web` commands stop with an explicit profile usage message. Developers must choose a named `*:smoke` or `*:sandbox` command backed by the corresponding isolated local environment file.

Smoke is a local E2E profile: it requires matching private/public runtime modes, local backend mode and exact loopback API/Auth Emulator origins. It probes the Auth Emulator before starting Expo and reports the profile, origin and corrective command when the dependency is unavailable. Sandbox is a remote profile: it rejects every emulator, local API and E2E credential override. Expo's automatic dotenv loading is disabled for both profiles, preventing a stale `.env` from changing the selected runtime.

## Contract changes

- Build configuration now requires matching `PATTERNLY_RUNTIME_MODE` and `EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE`; development no longer implies smoke.
- Added one import-safe launcher for `smoke` and `sandbox`, shared by native, Metro and web commands.
- Added separate tracked templates for `.env.smoke.local` and `.env.sandbox.local`; the generic example now points to the named profiles.
- Smoke validates loopback-only dependencies and performs a bounded Auth Emulator reachability probe before Expo.
- Sandbox rejects `BACKEND_E2E`, API/emulator origins and local E2E account values instead of silently ignoring them.
- `connectAuthEmulator` remains reachable only for development + explicit smoke + explicit backend E2E + canonical loopback origin.
- Hosting policy tests now verify the launcher actions retain localhost binding for Metro and web.

## Verification

| Gate | Result |
| --- | --- |
| Independent QA | **PASS**, no P0/P1/P2 after two P1 corrections |
| Typecheck | **PASS** |
| Focused profile/config/hosting/auth tests | **50/50 PASS** |
| Full app test suite | **1097/1097 PASS** |
| Diff check | **PASS** |
| Generic command | **PASS**: `npm start` exits before Expo with explicit profile usage |
| Smoke unavailable dependency | **PASS**: exits before Expo with profile, origin and `npm run start:smoke` corrective action |
| Smoke Auth Emulator | **PASS**: origin `127.0.0.1:19099` reachable; disposable register and sign-in succeeded |
| Remote sandbox Firebase Auth | **PASS**: disposable register, sign-in and cleanup succeeded against `identitytoolkit.googleapis.com`; no emulator origin was used |

The first full-suite run exposed a stale visual-shell allowlist left by ODK-121. The allowlist now explicitly recognizes the local Leave-session modal scroll as an exception rather than a competing page-shell owner; the full suite then passed.

## Profile commands

- `npm run start:smoke`, `ios:smoke`, `android:smoke`, `web:smoke`
- `npm run start:sandbox`, `ios:sandbox`, `android:sandbox`, `web:sandbox`

Generic commands intentionally do not choose a profile.

## Removed/replaced paths

- Removed the implicit smoke fallback from build-time and application runtime-mode readers.
- Replaced direct generic Expo start commands with the explicit-profile launcher.
- Replaced one mixed local environment example with named smoke and sandbox templates.
- No auth provider, account lifecycle or release/EAS path was removed.

## Remaining external boundary

The remote sandbox evidence verifies Firebase email/password identity creation and authentication, followed by cleanup. It does not claim production provider OIDC, App Check attestation, backend account registration or release-provider certification; those remain their existing independent gates.
