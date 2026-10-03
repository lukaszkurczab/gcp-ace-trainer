# BIZQ-01 native profile feasibility

Date: 2026-10-03. Scope: source-backed profile and runner feasibility only. No device, runtime, service, account, environment-value, or credential inspection was performed for this note.

## Finding

The evidence available for this preflight identifies the current iPhone 17 state as a guest, and no already-authorized Premium test profile is confirmed. That means the current guest can exercise the existing Premium denial/paywall path, but cannot establish the Premium-session side of native BIZQ-01. This is an evidence gap about profile availability, not a finding that no such account exists. The remaining question is whether the owner can identify an existing authorized profile and its safe sign-in route; request only its name/location, never credentials or secrets.

The BIZQ-01 spec says tests use a “real, properly configured test profile” and requires native iOS review of correct, incorrect, and partial answers plus expanded Details on the repaired questions ([spec §2, §6](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md#L20); [§6–7](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md#L160)). It does not prescribe RevenueCat provenance as a separate acceptance rule. A profile that satisfies the existing app’s authenticated Premium admission contract is the relevant prerequisite; requiring a particular provider proof beyond that would add a criterion not stated by the spec.

## What the implementation establishes

- Premium product modes call the injected admission port; missing or denied admission fails closed ([TrainingLifecycleUseCases.ts:593–613](../../../../src/application/trainingLifecycle/TrainingLifecycleUseCases.ts#L593)). The real account-session provider only authorizes an authenticated account and binds refresh/cache decisions to its current account and auth identity ([AccountSessionProvider.tsx:1509–1542](../../../../src/application/account/AccountSessionProvider.tsx#L1509)).
- The settings premium toggle is a device-local test control. Its repository permits use only in sandbox/smoke and explicitly excludes sync/release authorization ([runtimeMode.ts:26–34](../../../../src/infrastructure/runtime/runtimeMode.ts#L26); [premiumTestingRepository.ts:6–19](../../../../src/storage/repositories/premiumTestingRepository.ts#L6)). It cannot turn the current guest into a properly configured Premium profile. Existing native evidence agrees: the guest reaches the paywall and remains blocked after the toggle is enabled ([NATIVE-REGRESSION.log:20–39](../NATIVE-REGRESSION.log#L20); [NATIVE-GUEST-RESTORE.log:1–13](../NATIVE-GUEST-RESTORE.log#L1)).
- The local AUD-02D smoke runner explicitly creates emulator-backed auth and synthetic entitlement state ([runAud02dIos.mjs:385–429](../../../../scripts/runAud02dIos.mjs#L385)). That verifies its simulated contract, not an independently configured native billing SDK/profile. Separately, the iOS purchase UI creates its RevenueCat adapter only with iOS purchase configuration and a current account ID, then refreshes account entitlement after purchase/restore ([PremiumPurchaseScreen.tsx:32–39, 72–94](../../../../src/features/premium/PremiumPurchaseScreen.tsx#L32)). These are implementation facts; they do not establish a new provider-specific BIZQ acceptance requirement.

## Bounded coverage and remaining gap

Guest-native coverage is feasible and supported by the existing evidence: keep the current guest/profile and accepted plan, verify the Premium entry remains gated at the paywall with no session, and confirm the local toggle does not bypass admission. The latest parent-provided run reports the guest cold flow at Home; this note does not independently rerun or certify that execution.

True Premium native session coverage remains unverified until an already-authorized, properly configured Premium test profile is identified and can enter through the existing account/admission flow. No purchase, account creation, provider configuration, or toggle-based substitute is implied. Once available, the spec’s repaired-question interactions also depend on those item IDs being naturally reachable in the real runner; the current BIZQ-01 reports say the changed seeds are outside the active Design pools, so profile availability alone does not establish that separate reachability requirement ([CONSUMER-QA.md:17–21](../CONSUMER-QA.md#L17)).

No claim is made here for full BIZQ-01 acceptance, native Premium completion, provider/SDK verification, or release readiness.
