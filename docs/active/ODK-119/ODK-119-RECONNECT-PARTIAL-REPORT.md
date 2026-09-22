# ODK-119 — reconnect refresh (partial)

The app subscribes to NetInfo reachability and refreshes the current authenticated account's RevenueCat-backed entitlement only after a confirmed `isInternetReachable: false → true` transition. `null` and the initial online event do not count as reconnects; authenticated bootstrap already refreshes separately. Existing session-generation checks and the Premium refresh queue prevent stale or overlapping writes. The provider response still replaces cache only after strict validation, and errors do not overwrite it.

Dependency: `@react-native-community/netinfo@12.0.1`, matching [Expo's recommended version](https://docs.expo.dev/versions/latest/sdk/netinfo/). `expo install` was blocked by the repository's mandatory runtime-mode config under the local `.env`, so the exact Expo-recommended version was installed with npm and locked in `package-lock.json`.

Verification: `npm run typecheck`, focused reconnect/foreground/refresh-queue tests 4/4. Independent QA approved, minimum 0.84 (architecture 0.91, simplicity 0.92, risk 0.84, maintainability 0.88). Listener mounting and unsubscribe were reviewed in code but not simulated in a component test. No device reconnect test was run.

ODK-119 remains partial: paid content/session admission and provider-console evidence are outstanding.
