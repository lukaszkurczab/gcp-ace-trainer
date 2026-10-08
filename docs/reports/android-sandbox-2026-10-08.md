# Android sandbox — 8 October 2026

User objective: prepare a working EAS Android test APK independently of the active BIZQ work; publishing required test services is authorized. Device is the connected Xiaomi 2201117TY, Android 13. Update the existing installation; preserve its data. No production rollout or store submission.

## Source and artifacts

- App: `913fbc9ac781ab7c1cbd4fa9c61cfddce5153de3`; successful owning CI `37804831974`.
- EAS: profile `sandbox`, preview environment, internal APK, sandbox update channel; build [157c2f75-fdec-4e9e-b8c0-a6ee2d19c878](https://expo.dev/accounts/lkurczab/projects/patternly/builds/157c2f75-fdec-4e9e-b8c0-a6ee2d19c878), FINISHED at 18:43 CEST, after about 27 minutes in queue and 11 minutes compiling. [APK](https://expo.dev/artifacts/eas/IlvCGG1EcPWGgZvLQJQZXF_628v3Q1SE3w-NDR9N8G8.apk). APK SHA-256 `2206cf9b277b06e127b91d3c3ee6d2100462269dfbcae4799d287a34496ba8ae`. Uses existing remote signing credentials; archive excludes local env/credentials and generated native directories.
- Backend runtime source: `039f7f000e701c4fbc69e18a1fb66528cbc5cdcb`; Cloud Build `60e922c6-39e7-4492-8bff-f039ae6fcc16` SUCCESS. Image digest `sha256:fbe498540bcbcd7a847899b84aaafc9cab00e614214a1c9c7623b561f0b993d2`.
- Backend deployment tooling correction: `1c7716741ab303ec80f67b6842cc7df36adc15b0`, committed and pushed. Removes the stale duplicate TTL allowlist; apply imports the existing exact-policy checker. No runtime code changes.

## Test environment publication

Project `patternly-app-sandbox`, region `europe-central2`, service `patternly-backend-sandbox`. Replaced traffic revision `patternly-backend-sandbox-auth-0930` with `patternly-backend-sandbox-android-1008`, first tested as a tagged revision with zero traffic, then promoted to 100%.

- `/health` and `/ready` return 200; database, authentication and provider reader are ready. `/v1/admin/overview` returns 404 `admin_unavailable`.
- Added independent random AES-256 recovery-operation keyring through Secret Manager version 1; runtime SA granted secretAccessor on that secret only. No raw material in source, report or build logs. Kept existing runtime configuration and IAM.
- Published current Firestore rules/indexes; rules already identical. All three composite indexes are READY, including the new recovery index.
- Existing 31 TTL policies active before publication; added the three approved repository policies for accountRecoveryOperations, accountRecoveryOperationResults and rateLimitBuckets. Automatic approval initially rejected this destructive retention action; user explicitly approved it. All 34 policies are ACTIVE. PITR enabled.
- Firebase App Check already permits outside-Play APK (`allowUnrecognizedVersion=true`) and requires `MEETS_DEVICE_INTEGRITY`; no debug provider or security bypass introduced. Registered SHA-256: `a47747b54a80182ab507da638902a068cc2be79c2478b8da89c39ed27b924a2f`. Existing installed APK signature matches this SHA-256; new APK certificate matches the installed app and Firebase; official Android apksigner verification passed.

Rollback: route 100% traffic back to `patternly-backend-sandbox-auth-0930`. The old revision and image remain available. Do not rotate/remove recovery keys while recoverable results depend on them. TTL cleanup cannot be reversed by traffic rollback.

## Evidence

- Independent design review and narrow TTL correction acceptance: PASS after refinements. Fit / simplicity / risk / maintainability = 0.88 / 0.82 / 0.84 / 0.84; minimum 0.82. Decisive refinements: one validated TTL policy source, separate recovery key, verify sideload App Check and certificate, inspect retention delta before enabling it.
- Cloud Build ci:cloud: PASS; local ci:cloud: PASS.
- Isolated Auth/Firestore backend suite: 303 PASS, 0 FAIL, 10 SKIP; prior CI sync contention failure did not reproduce. Existing developer emulator ports were left untouched.
- Pinned mobile/backend recovery integration: 17/17 PASS. First attempt omitted the required mobile SHA and stopped before tests; rerun provided the exact app SHA.
- Operator emulator: 4/4 PASS; operator acceptance: 1/1 PASS.
- TTL deployment tests: 3/3 PASS, independently repeated by reviewer. Real subprocess argument capture checks all approved policies and immediate stop on cloud failure. Typecheck/lint/diff check PASS.
- Full ci invocation stopped because existing Auth emulator port was busy; reran emulator suites on repository-owned isolated ports.
- Frontend consumer check fails on 11 local web-admin operations. This is an existing cross-repository checker/consumer discrepancy outside mobile scope; no full multi-repository CI claim. GitHub run `37806827172` confirms its earlier emulator stages pass and fails on this same web-admin consumer check.

## Remaining verification and limitations

APK built and verified. First `adb install -r` failed before creating a session: `Requested internal only, but not enough space` (about 620 MiB free, APK 153 MiB). User authorized safe storage inspection/cleanup and specifically required retaining Spotify. Standard reclaimable-cache trim gained about 7 MiB. No large OTA download was found; accessible diagnostic logs were under 100 KiB. A real probe of Android's official `cmd package compile -m verify -f com.lkurczab.patternly` reclaimed approximately 312 MiB of reproducible optimized code, retaining app data and local optimization profiles. Available space increased to about 939 MiB; device storage monitor reported NORMAL with a 500 MiB low-space threshold. Retried the data-preserving APK update: SUCCESS. No apps, user documents, photos, offline Spotify music or app data were removed. Initial launches may be slower while Android rebuilds optimized code. Sources: https://source.android.com/docs/core/runtime/jit-compiler .

Still verify launch without Metro, native startup, a representative learning flow and real test-backend communication. USB disappeared immediately after successful installation. After the user confirmed reconnection, both adb and macOS IOUSB inventory still showed no phone; this prevents computer-driven startup verification. Asked the user to open Patternly and a lesson directly, or change the cable/port. Index readiness and all TTL policies ACTIVE confirmed.

Android Premium purchases are currently unavailable by source design (`PremiumPurchaseScreen` composes purchases only for iOS). Configured external privacy/terms/support links point to backend paths returning 404; in-app legal documents are the existing non-release fixture. No fabricated legal artifact or public website was published. These limitations are distinct from Android build/startup acceptance.

Current next action: verify device startup after successful installation. The EAS artifact and test backend are complete; the BIZQ working plan is unchanged.

## Startup defect reported at 20:01 CEST

User screenshot establishes native launch but shows a blocking `Recovery operation / operation_unavailable` screen, so functional startup acceptance FAILED. USB remains absent from both adb and macOS inventory. No vault/account data was cleared.

Confirmed an Android incompatibility in the recovery vault adapter: installed Expo SecureStore 57.0.2 Android native module exposes no `WHEN_UNLOCKED_THIS_DEVICE_ONLY` constant, but the adapter required it unconditionally. That constant and `keychainAccessible` option are iOS-specific; Android uses encrypted SharedPreferences backed by Keystore. The helper now branches on the real native platform, retains the exact service/alias and record key, keeps iOS accessibility unchanged, and still rejects unsupported platforms or missing native methods. Serialization, recovery coordinator, secure reads/writes and profile preparation guards are unchanged. [Expo source/documentation](https://docs.expo.dev/versions/latest/sdk/securestore/).

Commit `f889ab4a` contains only `recoveryOperationVault.ts` and its tests, based on the original APK source. Prepared in `/private/tmp/patternly-android-startup-fix`, then fast-forwarded the app repository while preserving all concurrent BIZQ edits. Independent design and actual diff acceptance PASS; fit/simplicity/risk/maintainability = 0.90/0.90/0.88/0.85, minimum 0.85. Vault/coordinator tests 38/38 PASS, independently repeated; full typecheck and diff check PASS. These establish adapter behavior, not device startup.

Preview public configuration passes its Node schema validation; the actual APK contains the sandbox origin/project and Play Integrity setting. Absence of an EXPO_PUBLIC variable name in the bundle is expected inlining and does not establish a missing configuration. The exact screenshot path may also involve another startup exception; the fix still requires device verification.

Corrected EAS build [18b2dc7c-fe4f-4b0f-9a93-39b205579a02](https://expo.dev/accounts/lkurczab/projects/patternly/builds/18b2dc7c-fe4f-4b0f-9a93-39b205579a02) accepted, pinned to `f889ab4a54ff6423a236b31ed0efd0671ef0370c`. GitHub push was initially rejected by automatic approval review as an additional source export; user explicitly approved it and the exact commit was pushed to `lukaszkurczab/gcp-ace-trainer` main. Next: finish publishing the Android-only sandbox update, finish/retrieve the corrected APK, then verify startup and a learning flow without clearing user data.

Android-only update published: group `e383f87d-1998-4dc2-bb03-86141bcfc6a2`, update `01a11cb9-ef13-7e9f-ae09-b2c3e3f406b4`, runtime `0.1.0`, channel/branch sandbox. The first local export followed shared node_modules/expo/AppEntry into the concurrent worktree; that group `3c73552e-f858-4451-bcd2-b1715e75ffc0` was deleted before asking the user to install/use it. Re-exported with a physical Expo package in the isolated checkout, cleared Metro cache, and verified all 455 bundled application source contents against that checkout via the actual Hermes source map before publication. This temporary artifact inspection established isolation; it is not a native startup test. Cloud APK uses its separately uploaded clean archive and installed dependencies, not the local dependency links.

User asked to open online, wait about a minute, fully close and relaunch to receive the update, then report startup/lesson outcome. Current next action: device verification and corrected standalone APK completion.

## Email sign-in completion failure

The corrected build `18b2dc7c` is FINISHED. Downloaded `artifacts/android-sandbox-2026-10-08/patternly-sandbox-f889ab4a.apk`, SHA-256 `26fe73cdc3c4cfadbd3c5b211b93f8e19ca8ab76963e527cae6e2fb3996af9cf`. Its installation/device acceptance remains pending; no additional app reinstall or data clearing was performed.

User reports email login shows “Couldn’t finish signing in”. This is the broad `backendUnavailable` UI state and can also represent local profile/binding/barrier failure after successful Firebase authentication and `/me`; it does not establish bad credentials or server outage. Test Cloud Run logs around 19:26–19:28 UTC show successful session exchange, `/me` and one session revoke, but were not correlated to a controlled device reproduction and cannot prove this user's full login succeeded. Independent read-only review found no auth-persistence or native app-config change from source 913fbc9 to f889ab4a. Do not change persistence policy or remove data based on this symptom alone.

After the user restored the phone connection, macOS IOUSB shows Redmi Note 11 with MTP interface only (class/subclass 255/255, protocol 0), while adb lists no device. Requested toggling USB debugging and accepting the computer's debugging prompt. Device logs/control are explicitly authorized but currently inaccessible. Reinstalled official platform-tools under ignored `artifacts/android-tools` after temporary tools disappeared. Next: once ADB exposes the phone, read sanitized runtime logs and reproduce one login completion attempt, pin the exact failed stage, and verify data-preserving correction and cold-start session restoration.

## Email-session blocker repaired

Main `4cf057a3` / isolated deploy `d99445d3` fixes a valid empty local account profile being rejected as revoked before materialization. Exact current identity/scope checks and strict clearing of actual denial markers remain. 99 lifecycle/composition tests and typecheck PASS; independent design review APPROVE min0.88. Android OTA group267c31dd-4100-4c36-97bd-14bf05833b71 (update01a11d23-f155-7a91-bafd-fd8bcfd67df3, runtime0.1.0) exported from455 verified source files.

Same Redmi phone: before update revoked-session screen; after activation Home, Settings Signed in as, another cold start Home. Cloud responses20:12UTC `/me`200 twice, `/progress`200, `/entitlements`200. No account/data reset or password re-entry. No complete fresh-login or version-upgrade preservation matrix claimed. New standalone APK build5250177f-09d7-4103-af66-b5ae26286b74 submitted on isolated source d99445d3; pending completion. Follow-up architecture task AUTH-PROFILE-01 is in the canonical plan.
