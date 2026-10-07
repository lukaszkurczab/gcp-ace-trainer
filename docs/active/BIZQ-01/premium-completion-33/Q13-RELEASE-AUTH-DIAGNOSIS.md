# Q13 Release smoke auth diagnosis

## Finding

The sign-in-unavailable screen is explained by a source-backed runtime-mode mismatch in the Q13 test build. The isolated build driver validates `.env.smoke.local` as the `smoke` profile, then compiles Xcode's `Release` configuration (`q13-build-release.mjs`). In that app, the smoke runtime is active while React Native's `__DEV__` is false.

`readDevelopmentFirebaseAuthEmulatorOrigin()` intentionally returns no emulator origin unless both `__DEV__` is true and the runtime mode is `smoke`; the adjacent source comment says the Auth Emulator is for local development E2E and must not be passed to a normal installed build (`src/infrastructure/firebase/publicConfig.ts`). The provider nevertheless requires that origin whenever `runtimeMode === "smoke"`. With the API origin present but emulator origin suppressed, `AccountSessionProvider` takes its pre-auth-client `public_environment_unconfigured` branch at lines 918–928. `AccountEntryScreen` renders that reason with the generic “Sign-in unavailable” copy. This matches the reported screen.

This is not evidence of a Firebase Auth request failure, bad Firebase app configuration, or a profile-storage failure. The provider returns before calling `createFirebaseAuthClient` or registering its auth-state observer, so no Auth restore or sign-in attempt occurred. The signed app's fresh Q13 entry receipt proves the instrumented JS entry ran; it does not identify an auth SDK outcome. The host-side emulator/API readiness probes in `q13-build-release.mjs` cannot override the runtime `__DEV__` guard.

## Smallest compatible route

Use the existing same-app iOS simulator with the smoke profile in Xcode `Debug` and its single owned Metro process. Debug enables the already-required local smoke emulator path without changing product configuration or relaxing the release guard. Keep the admitted exact source ref and generated content lock; regenerate the test attestation with a fresh nonce and bind its source hashes before launching. The app's module-execution receipt should record only that nonce, the public OOD catalog version/hash, and the existing allowlisted stage/reason enum in the proven private cache. Confirm ordinary entry UI and the Q13 old-content resume there; then apply the already-reviewed fresh-nonce regeneration and same-bundle procedure for OOD24. Do not use Release smoke as an auth-capable Q13 run.

This route is a test-instrumented Debug/Metro acceptance run, not proof that the unmodified Release binary executed the same JavaScript. It also does not authorize creating an account or continuing as Guest; Q13 can stop at the existing unauthenticated entry surface unless the agreed acceptance flow independently needs a user action.

Scores for this route: objective/architecture fit **0.94**, simplicity **0.87**, risk **0.88**, maintainability **0.90**; minimum **0.87**. It uses the repository's explicit smoke-only emulator boundary and avoids changing auth, storage, or release policy. The remaining execution fact is whether the existing simulator's Debug/Metro launch reaches the ordinary entry UI with a fresh, source-bound receipt; no such run was performed for this diagnosis.

## Evidence limits

The installed Release smoke run, correct same-app signature, successful launch, fresh entry nonce, and displayed generic unavailable screen are run facts reported by the controller. I did not inspect private runtime output or perform another build, install, or UI action. The state mapping above follows the current source and Q13 build driver. No Firebase values, account identifiers, tokens, or raw storage were read.
