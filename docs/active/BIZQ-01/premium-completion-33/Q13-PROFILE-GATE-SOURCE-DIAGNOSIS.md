# Q13 profile-gate source diagnosis

The visible unavailable state comes from the `ProfileStoragePreparationGate` catch in `src/application/account/ProfileStoragePreparationGate.tsx`. Its single asynchronous chain runs, in order, `createNativeLocalLogoutControl().read()`, `prepareProfileStorage()`, and `inspectPreparedProfileState()`. The catch turns a `LocalLogoutControlError` into the sign-out-state copy; every other error is reduced to the generic operational-failure presentation. It retains a typed encrypted-storage code for the separate lost-key path, but does not expose a stage or safe error category for this generic state.

No existing safe diagnostic sink observes that catch. The development bootstrap diagnostic is reached below the profile gate, so it cannot report an error that prevents the gate from mounting its children. `encrypted_storage_not_initialized` is returned when the published MMKV client is absent; it does not prove whether profile preparation opened or inspected native storage, nor which earlier gate step failed. The source and current main ref agree for the relevant gate and storage modules, so this does not point to a source drift issue.

The smallest source-backed observation is a one-shot Inspector breakpoint at the first statement of the existing catch callback. A non-mutating capability check must first establish one inspector target, one loaded candidate script containing the unique source-verified catch, and successful breakpoint set/remove. If that passes independent tool QA, one ordinary reload may capture only an allowlisted exception class and an own, allowlisted `code` data property. It must resume and detach automatically. The probe does not invoke the gate, retry, load modules, call storage APIs, inspect messages or stacks, or change application source. If script identity or catch matching is ambiguous, stop without reloading.

This diagnosis does not establish the underlying exception cause. It does not justify profile recreation or any change to auth, storage, native configuration, or account state. An exception class/code may narrow the failed stage only when its source contract does so; otherwise the truthful result remains `profile_gate_catch` with an unknown safe category.

## Evidence and verification

- Source chain and generic catch: `src/application/account/ProfileStoragePreparationGate.tsx`.
- Native logout errors: `src/infrastructure/storage/localLogoutControl.ts`.
- Encrypted-storage typed failures: `src/infrastructure/storage/encryptedStorageBootstrap.ts`.
- Profile preparation and publication boundary: `src/storage/repositories/profileStorageRepository.ts` and `src/infrastructure/storage/mmkvClient.ts`.
- The added probe is only a versioned diagnostic tool. It has not been run against the app or caused a reload.
