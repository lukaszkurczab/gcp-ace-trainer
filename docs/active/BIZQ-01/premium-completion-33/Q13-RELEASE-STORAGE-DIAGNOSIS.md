# Q13 Release storage startup diagnosis

## Finding

The observed Release screen is produced by the first local sign-out-control read in `ProfileStoragePreparationGate`, before encrypted profile storage is prepared. The run therefore has not reached `prepareProfileStorage()`, `openEncryptedStorage()`, MMKV open, profile registry inspection, `PatternlyAccountProvider`, or Q13 resume. It does not show that MMKV or the account provider failed.

`ProfileStoragePreparationGate` calls `createNativeLocalLogoutControl().read()` first and chains `prepareProfileStorage()` only after that promise resolves (`src/application/account/ProfileStoragePreparationGate.tsx:67-70`). Its catch chooses the exact displayed sign-out-state message only for `LocalLogoutControlError` (`:75-82`). That error has two outcomes possible on this read:

- `local_logout_control_corrupt`: the returned non-null control record failed JSON, schema, identity, uniqueness, or blocked/pending validation (`src/infrastructure/storage/localLogoutControl.ts:56-91`).
- `local_logout_control_unavailable`: the underlying manifest-store read rejected (`:111-117`). In production that adapter calls `expo-secure-store.getItemAsync` with the existing service and accessibility options (`src/infrastructure/storage/encryptedStorageNative.ts:35-46`).

`local_logout_control_verification_failed` is a write/read-back outcome and cannot be produced by this `read()` call. A missing Keychain item resolves as `null` and is treated as an empty control record by the parser; absence alone does not produce the displayed failure.

The current wrapper discards the original native exception when it maps a rejected store read to `local_logout_control_unavailable`. The screen receives only the closed `LocalLogoutControlError` category, not an OSStatus. `encryptedStorageFailureCode()` cannot recover a SecureStore cause here, and the gate does not display that class for this message.

## Evidence boundaries

The actual fresh Q13 entry receipt in Release demonstrates that the expected instrumented JavaScript entry ran and that its Expo cache receipt write succeeded. It does not establish SecureStore or Keychain access.

The UI text is affirmative evidence that the local logout-control read rejected or its record failed validation. Because that read precedes `prepareProfileStorage`, it excludes the encrypted-storage manifest/MMKV bootstrap and account-session provider as the source of this specific screen. `App.tsx:24-29` places the gate outside the provider, so the provider is not mounted while the gate is unavailable.

The native adapter uses one source path for Debug and Release: `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, keychain service `com.lkurczab.patternly.encrypted-storage`, and no explicit access group. The project uses the same entitlements file in both Xcode configurations; that source file contains the Sign in with Apple entitlement only. Debug adds the SonarKit preprocessor definition and disables Swift optimization, while Release enables optimization. No source/config evidence identifies a SecureStore-specific Debug/Release branch. Artifact comparison did not parse a signed Keychain access-group entitlement, so this review does not claim that artifact signing or Keychain continuity is verified.

## Smallest safe probe

Do not retry the ordinary gate as a diagnostic: if the read succeeds on retry, it proceeds into `prepareProfileStorage()`, whose bootstrap may create keys, write manifests, migrate storage, or open MMKV.

If another build is approved, add a test-only diagnostic branch at the existing gate read boundary. It should:

1. Invoke only `createNativeLocalLogoutControl().read()` once; do not call `prepareProfileStorage`, `inspectPreparedProfileState`, bootstrap, migration, or any writer.
2. Record only a fresh build-bound nonce, a fixed stage (`local_logout_control_read`), and one allowlisted result: `read_succeeded`, `local_logout_control_corrupt`, or `local_logout_control_unavailable`.
3. Write that receipt to the app-owned Expo cache already proven writable by the fresh Release entry receipt. Treat receipt-write failure as no result.
4. Stop at a clearly test-only diagnostic screen after recording either result. Do not publish or display the control snapshot, UID, operation ID, Keychain value, exception message, or stack. A `read_succeeded` receipt means only this one read succeeded; it must not be reported as profile preparation or Q13 success.

This single receipt separates the two source-supported causes without reading canonical learning state or changing any storage. If it reports `local_logout_control_unavailable`, the wrapper has already erased the underlying Keychain status; a later, separately reviewed probe would need an explicit allowlisted native error category. Do not infer a signing/entitlement fix from the current screen alone.

If it reports `local_logout_control_corrupt`, preserve the stored record and stop. Do not reset or delete it: the source treats the control state as a sign-out safety boundary, and no evidence here establishes that the pending/revocation state is disposable.

## Verification and limits

This is a source/config diagnosis and probe plan. It does not identify which of the two failure categories occurred in this Release run, assert an OSStatus, read Keychain or MMKV contents, or authorize another build/install. No repair is justified until the exact safe category is available.

Scores for the proposed probe: objective fit **0.94**, simplicity **0.91**, risk **0.91**, maintainability **0.86**; minimum **0.86**. The boundary is already proven by the gate ordering; the probe adds only one allowlisted outcome at that boundary and explicitly stops before stateful profile preparation.

Source references: `src/application/account/ProfileStoragePreparationGate.tsx:67-82`; `src/infrastructure/storage/localLogoutControl.ts:56-91,111-117,197-203`; `src/infrastructure/storage/encryptedStorageNative.ts:35-55`; `src/infrastructure/storage/mmkvClient.ts:41-58`; `App.tsx:19-31`; `app.config.js:200-205,218-221`; `ios/Patternly.xcodeproj/project.pbxproj` Debug/Release settings; `ios/Patternly/Patternly.entitlements`; installed `expo-secure-store@57.0.2` source.
