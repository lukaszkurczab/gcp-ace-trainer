import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { pendingRevokeFailureState, accountIdentityProofMatchesSubject, accountSessionFailureState, AUTH_INITIALIZATION_TIMEOUT_MS, canContinueAccountIdentityRefresh, classifyAccountFailure, classifyPrivacyRequestFailure, completeUnrecognizedPersistedAuthSignOut, createAccountSessionCoordinator, isAccountIdentityProofInFlightForActor, isAuthoritativeIdentityProofDenial, isNonEnumeratingRecoveryError, isTemporaryIdentityProofUnavailable, isLocalAccountStartupUnavailable, planPasswordVerificationCommand, publishRefreshedAuthenticatedState, readVerifiedAccountIdentityFence, sameVerifiedAccountIdentityFence, shouldClearAccountIdentityProofLatch, requiresPasswordEmailVerification, revokeBindingForAuthoritativeIdentityDenial, runAccountIdentityProof, type AccountIdentityProofBarrierContext, type AccountIdentityProofInFlight, type AccountState } from "./AccountSessionProvider";
import { createSensitiveCommandLane } from "./accountCommandGuards";
import { accountFinalizationPolicies, executeAccountFinalization } from "./accountFinalization";
import { completeAccountBootstrap, prepareAuthenticatedAccountBootstrap } from "../bootstrap/accountBootstrap";
import { parseConfiguredPublicEnvironment } from "../../infrastructure/clients/publicEnvironment";
import { PatternlyApiClientError } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { composePatternlyNativeAppCheck, configurePatternlyAppCheckTokenProvider, createPatternlyNativeAppCheckProviderConfiguration, getPatternlyAppCheckToken } from "../../infrastructure/clients/patternlyAppCheckToken";
import { getFirebaseGoogleClientId, parseFirebaseClientConfiguration } from "../../infrastructure/firebase/publicConfig";
import { AUTH_USER_STORAGE_KEY, createSecureAuthPersistence, redactPersistedAuthUser } from "../../infrastructure/firebase/secureAuthPersistence";
import { activatePreparedProfile, captureActiveProfileStorageLease, closeActiveProfileStorage, isActiveProfileStorageLeaseCurrent, MemoryKeyValueStorage, prepareProfileStorage, setProfileStoragePreparationFactoryForTests, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { beginAccountIdentityProofBarrier, readActiveAccountIdentityBinding, readPreparedAccountIdentityBinding, resolveAccountIdentityProofBarrier } from "../../storage/repositories/profileStorageRepository";
import { requiresVerifiedPasswordIdentity } from "../../infrastructure/runtime/runtimeMode";
import { claimLocalOfflineInitialRefresh } from "./accountReconnect";

const publicEnvironment = {
  apiOrigin: "https://api.patternly.example",
  androidAppLinkHost: "app.patternly.example",
  authActionOrigin: "https://auth.patternly.example",
  authRedirectDomain: "auth.patternly.example",
  environment: "sandbox",
  iosAssociatedDomain: "applinks:app.patternly.example",
  privacyUrl: "https://patternly.example/privacy",
  publicWebOrigin: "https://patternly.example",
  supportUrl: "https://patternly.example/support",
  termsUrl: "https://patternly.example/terms",
  transactionalSenderDomain: "mail.patternly.example",
} as const;

const firebaseConfiguration = {
  apiKey: "public-api-key",
  appId: "1:1234567890:ios:abcdef123456",
  authDomain: "patternly-app-sandbox.firebaseapp.com",
  googleAndroidClientId: "1234567890-android.apps.googleusercontent.com",
  googleIosClientId: "1234567890-ios.apps.googleusercontent.com",
  googleWebClientId: "1234567890-web.apps.googleusercontent.com",
  projectId: "patternly-app-sandbox",
};

test.afterEach(() => configurePatternlyAppCheckTokenProvider(null));

test("public environment and Firebase client configuration fail closed", () => {
  assert.deepEqual(parseConfiguredPublicEnvironment(publicEnvironment).environment, "sandbox");
  assert.equal(parseFirebaseClientConfiguration({}).kind, "unavailable");
  const invalidFirebase = parseFirebaseClientConfiguration({ ...firebaseConfiguration, authDomain: "https://not-a-host.example" });
  assert.equal(invalidFirebase.kind, "unavailable");
  if (invalidFirebase.kind === "unavailable") assert.equal(invalidFirebase.reason, "invalid_configuration");
  assert.equal(parseFirebaseClientConfiguration(firebaseConfiguration).kind, "configured");
});

test("Firebase account configuration requires core fields and accepts only valid optional Google IDs", () => {
  const { googleAndroidClientId: _android, googleIosClientId: _ios, googleWebClientId: _web, ...coreConfiguration } = firebaseConfiguration;
  const coreOnly = parseFirebaseClientConfiguration(coreConfiguration);
  assert.equal(coreOnly.kind, "configured");
  if (coreOnly.kind === "configured") {
    assert.equal(getFirebaseGoogleClientId(coreOnly.value, "ios"), undefined);
    assert.equal(getFirebaseGoogleClientId(coreOnly.value, "android"), undefined);
  }

  const iosOnly = parseFirebaseClientConfiguration({ ...coreConfiguration, googleIosClientId: firebaseConfiguration.googleIosClientId });
  assert.equal(iosOnly.kind, "configured");
  if (iosOnly.kind === "configured") {
    assert.equal(getFirebaseGoogleClientId(iosOnly.value, "ios"), firebaseConfiguration.googleIosClientId);
    assert.equal(getFirebaseGoogleClientId(iosOnly.value, "android"), undefined);
  }
  const androidOnly = parseFirebaseClientConfiguration({ ...coreConfiguration, googleAndroidClientId: firebaseConfiguration.googleAndroidClientId });
  assert.equal(androidOnly.kind, "configured");
  if (androidOnly.kind === "configured") {
    assert.equal(getFirebaseGoogleClientId(androidOnly.value, "android"), firebaseConfiguration.googleAndroidClientId);
    assert.equal(getFirebaseGoogleClientId(androidOnly.value, "ios"), undefined);
  }
  const invalidActiveIosId = parseFirebaseClientConfiguration({ ...coreConfiguration, googleIosClientId: "not-a-google-client-id" });
  assert.equal(invalidActiveIosId.kind, "configured");
  if (invalidActiveIosId.kind === "configured") assert.equal(getFirebaseGoogleClientId(invalidActiveIosId.value, "ios"), undefined);

  const validIosWithInvalidOtherIds = parseFirebaseClientConfiguration({
    ...coreConfiguration,
    googleAndroidClientId: "malformed-inactive-android-id",
    googleIosClientId: firebaseConfiguration.googleIosClientId,
    googleWebClientId: "malformed-web-id",
  });
  assert.equal(validIosWithInvalidOtherIds.kind, "configured");
  if (validIosWithInvalidOtherIds.kind === "configured") {
    assert.equal(getFirebaseGoogleClientId(validIosWithInvalidOtherIds.value, "ios"), firebaseConfiguration.googleIosClientId);
    assert.equal(getFirebaseGoogleClientId(validIosWithInvalidOtherIds.value, "android"), undefined);
    assert.equal(getFirebaseGoogleClientId(validIosWithInvalidOtherIds.value, "web"), undefined);
  }
});

test("native App Check composes either provider, both providers, or an explicit unavailable state", async () => {
  assert.deepEqual(createPatternlyNativeAppCheckProviderConfiguration({ appleProvider: "deviceCheck" }), { apple: { provider: "deviceCheck" } });
  assert.deepEqual(createPatternlyNativeAppCheckProviderConfiguration({ androidProvider: "playIntegrity" }), { android: { provider: "playIntegrity" } });
  assert.deepEqual(createPatternlyNativeAppCheckProviderConfiguration({ androidProvider: "debug", appleProvider: "appAttest" }), {
    android: { provider: "debug" },
    apple: { provider: "appAttest" },
  });
  assert.equal(createPatternlyNativeAppCheckProviderConfiguration({}), null);
  configurePatternlyAppCheckTokenProvider(async () => "stale-token");
  assert.equal(await composePatternlyNativeAppCheck({}), "unavailable");
  assert.equal(await getPatternlyAppCheckToken(), null);
});

test("only the explicit local smoke runtime finalizes every password-identity command without verification side effects", () => {
  const unverifiedPassword = { email: "learner@example.com", emailVerified: false, provider: "password", providers: ["password"] as const, uid: "password-user" } as const;
  const verifiedPassword = { ...unverifiedPassword, emailVerified: true } as const;
  const unverifiedGoogle = { ...unverifiedPassword, provider: "google", providers: ["google"] as const } as const;

  assert.equal(requiresVerifiedPasswordIdentity("smoke"), false);
  assert.equal(requiresVerifiedPasswordIdentity("sandbox"), true);
  assert.equal(requiresVerifiedPasswordIdentity("release"), true);
  assert.equal(requiresVerifiedPasswordIdentity(undefined), true);
  assert.equal(requiresVerifiedPasswordIdentity("unknown" as never), true);

  const commands = ["register", "signIn", "resend", "persisted", "refresh"] as const;
  const expectedVerificationActions = {
    persisted: "none",
    refresh: "none",
    register: "resend",
    resend: "resend",
    signIn: "signOut",
  } as const;

  for (const command of commands) {
    assert.equal(requiresPasswordEmailVerification("smoke", unverifiedPassword), false, `${command}: local smoke continues without email verification`);
    assert.deepEqual(planPasswordVerificationCommand(command, "smoke", unverifiedPassword), { kind: "finalize" }, `${command}: local smoke finalizes with neither resend nor sign-out`);

    assert.equal(requiresPasswordEmailVerification("sandbox", unverifiedPassword), true, `${command}: sandbox requires email verification`);
    assert.deepEqual(planPasswordVerificationCommand(command, "sandbox", unverifiedPassword), { kind: "verificationPending", action: expectedVerificationActions[command] }, `${command}: sandbox keeps its verification behavior`);

    assert.equal(requiresPasswordEmailVerification("release", unverifiedPassword), true, `${command}: release requires email verification`);
    assert.deepEqual(planPasswordVerificationCommand(command, "release", unverifiedPassword), { kind: "verificationPending", action: expectedVerificationActions[command] }, `${command}: release keeps its verification behavior`);
    assert.equal(requiresPasswordEmailVerification(undefined, unverifiedPassword), true, `${command}: missing runtime fails closed`);
  }
  assert.equal(requiresPasswordEmailVerification("sandbox", verifiedPassword), false);
  assert.equal(requiresPasswordEmailVerification("sandbox", unverifiedGoogle), false);
});

test("account entry owns one terminal choice and keeps synced account controls separate", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");

  assert.match(screen, /accountData\.status === "synced"/);
  assert.match(screen, /isHealthyAccountData\(account\.state\.accountData\)/);
  assert.match(screen, /accountData\.pendingMutationCount > 0/);
  assert.match(screen, /accountData\.blockingConflictCode !== null/);
  assert.match(screen, /accountData\.lastFailureCode !== null/);
  assert.match(screen, /accountData\.status === "previewReady"/);
  assert.match(screen, /testID="account-open-settings"/);
  assert.doesNotMatch(screen, /AccountManagementScreen/);
  assert.match(readFileSync("src/features/home/tabs/SettingsTab.tsx", "utf8"), /tAccount\("accountSignedInAs"\)/);
  assert.doesNotMatch(screen, /<AuthText style=\{styles\.accountHeading\}>\{text\.account\}<\/AuthText>[\s\S]*?accountManagementDescription/);
  assert.match(screen, /testID="account-entry-choice"/);
  assert.match(screen, /testID="account-keep-progress-toggle"/);
  assert.match(screen, /const entryChoice = accountData\.guestAdoptionChoice/u);
  assert.match(screen, /runCommand\("choice", \(\) => account\.setGuestAdoptionChoice\(choice\), setCommandFeedback\)/u);
  assert.doesNotMatch(screen, /useState<"transfer" \| "discard">\("transfer"\)/u);
  assert.match(screen, /testID="account-entry-continue"/);
  const adoption = screen.slice(screen.indexOf("function AccountAdoptionScreen"), screen.indexOf("function AccountRecoveryScreen"));
  assert.doesNotMatch(adoption, /account-adoption-sign-out|account\.signOut\(/u);
  assert.match(screen, /account\.discardGuestData\(\)/);
  assert.doesNotMatch(adoption, /Alert\.alert|accountDiscardConfirm|continueEntry/);
  assert.match(adoption, /onPress=\{executeEntry\}/);
  assert.match(adoption, /commandFeedback\?\.kind === "failure" \? renderFeedback/);
  assert.match(adoption, /plan\.remoteRecordCount > 0 \? text\.discardGuestDataExistingDescription : text\.discardGuestDataDescription/);
  assert.match(adoption, /entryChoice === "discard" \? styles\.accountDiscardWarning : null/);
  assert.match(screen, /account\.confirmAdoption\(resolutions, accountData\.preview/);
  assert.match(screen, /goalPlanConflictGroups/);
  assert.match(screen, /account-goal-plan-\$\{group\.trackId\}-keep-guest/);
  assert.match(screen, /account-goal-plan-\$\{group\.trackId\}-keep-account/);
  assert.match(screen, /tCommon\(getTrackDisplay\(group\.trackId\)\.shortTitle\)/);
  assert.doesNotMatch(screen, /testID="account-authenticated"/);
  assert.doesNotMatch(screen, /testID="account-adoption-confirm"/);
  assert.doesNotMatch(screen, /text\.(?:preserve|upload|restore|deduplicated|decisions|keepGuest\b|keepAccount\b|confirmAdoption\b)/);
  assert.match(provider, /discardGuestData: \(\) => runWithAuth/);
  assert.match(provider, /setGuestAdoptionChoice: \(choice\) => runWithAuth[\s\S]*?await saveGuestAdoptionChoice\(choice\)[\s\S]*?setState\(\{ \.\.\.state, accountData: \{ \.\.\.state\.accountData, guestAdoptionChoice: choice \} \}\)/u);
});

test("account recovery owns one status message, a truthful retry, and a sign-out exit", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const recoveryStart = screen.indexOf("function AccountRecoveryScreen");
  const recoveryEnd = screen.indexOf("function RadioOption", recoveryStart);
  const recovery = screen.slice(recoveryStart, recoveryEnd);

  assert.ok(recoveryStart >= 0 && recoveryEnd > recoveryStart);
  assert.match(recovery, /getAccountRecoveryPresentation\(accountData, text\)/);
  assert.match(recovery, /const actionFailure = feedback\?\.kind === "failure"/);
  assert.match(recovery, /<AuthText accessibilityRole="header" style=\{\[styles\.accountHeading/);
  assert.match(recovery, /<AuthText style=\{\[styles\.accountBody/);
  assert.doesNotMatch(recovery, /<InfoBlock/);
  assert.match(recovery, /status\.retry && accountSyncAutomaticRetryAllowed\(accountData\) \? \(/);
  assert.match(recovery, /conflictAction\.kind === "inspect"/);
  assert.match(recovery, /testID="account-sync-conflict-inspect"/);
  const resolveStart = recovery.indexOf("const resolveConflict = async");
  const resolveEnd = recovery.indexOf("const status = getAccountRecoveryPresentation", resolveStart);
  const resolve = recovery.slice(resolveStart, resolveEnd);
  assert.ok(resolveStart >= 0 && resolveEnd > resolveStart);
  assert.match(resolve, /if \(result\.kind === "failure"\) \{\s*setConflictPreview\(null\);\s*setFeedback\(result\);/);
  assert.match(recovery, /loading=\{busyAction === "retry"\}/);
  assert.match(recovery, /testID="account-sync-retry"/);
  assert.match(recovery, /loading=\{busyAction === "signOut"\}/);
  assert.match(recovery, /testID="account-sign-out"/);
  assert.doesNotMatch(recovery, /AccountDataPanel|retryDisabled|loading=\{retryDisabled\}/);
  const presentationStart = screen.indexOf("function getAccountRecoveryPresentation");
  const presentationEnd = screen.indexOf("function isHealthyAccountData", presentationStart);
  const presentation = screen.slice(presentationStart, presentationEnd);
  assert.ok(presentationStart >= 0 && presentationEnd > presentationStart);
  assert.match(presentation, /status === "resumeRequired"\) return \{[^}]*cloudRecovery: true/u);
  assert.match(presentation, /status === "offlinePending"\) return \{[^}]*cloudRecovery: true/u);
  assert.match(presentation, /pendingMutationCount > 0\) return \{[^}]*cloudRecovery: true/u);
  assert.match(presentation, /blockingConflictCode !== null\) return \{[^}]*cloudRecovery: true/u);
  assert.match(presentation, /lastFailureCode !== null\) return \{[^}]*cloudRecovery: true/u);
  assert.match(presentation, /status === "conflict"\) return \{[^}]*cloudRecovery: true/u);
  assert.match(presentation, /status === "failed"\) return \{[^}]*cloudRecovery: true/u);
  assert.match(presentation, /status === "initialSyncRequired"\) return \{[^}]*cloudRecovery: true/u);
  assert.match(presentation, /status === "signOutPending"\) return \{[^}]*cloudRecovery: false/u);
  assert.match(presentation, /status === "remoteDeletionPending"\) return \{[^}]*cloudRecovery: false/u);
  assert.match(presentation, /status === "localCleanupPending"\) return \{[^}]*cloudRecovery: false/u);
  assert.match(presentation, /activeSessionBlocked[\s\S]*?cloudRecovery: false/u);
  assert.match(presentation, /journal_recovery_required[\s\S]*?cloudRecovery: false/u);
  assert.ok(presentation.indexOf('lastFailureCode === "journal_recovery_required"') < presentation.indexOf("accountData.activeSessionBlocked"),
    "a pending journal can also block an active session; its recovery reason must precede generic adoption copy");
  assert.match(presentation, /account_binding_mismatch[\s\S]*?cloudRecovery: false/u);
  assert.match(presentation, /return \{ body: text\.syncing, cloudRecovery: false/u);
  assert.match(recovery, /const showCloudRecovery = status\.cloudRecovery && feedbackAction !== "signOut"/u);
  assert.match(recovery, /showCloudRecovery && !largeText \? styles\.accountRecoveryCentered/u);
  assert.match(recovery, /fontScale >= 1\.3/u);
  assert.match(recovery, /<IconTile name="cloud" tone="primary" \/>/u);
  assert.match(screen, /accountRecoveryContainer: \{ flex: 1, gap: spacing\.md \}/u);
  assert.match(screen, /accountRecoveryCentered: \{ justifyContent: "center" \}/u);
  assert.match(screen, /accountRecoveryCenteredContent: \{ alignItems: "center" \}/u);
  assert.match(screen, /accountRecoveryCenteredText: \{ textAlign: "center" \}/u);
  const iconTile = readFileSync("src/components/IconTile.tsx", "utf8");
  const icon = readFileSync("src/components/Icon.tsx", "utf8");
  assert.match(iconTile, /<Icon color=\{toneStyle\.color\} name=\{name\}/u);
  assert.match(icon, /accessibilityElementsHidden/u);
  assert.match(icon, /importantForAccessibility="no-hide-descendants"/u);
  for (const locale of ["de", "en", "es", "et", "fr", "it", "pl"]) {
    const account = JSON.parse(readFileSync(`src/locales/${locale}/account.json`, "utf8")) as Record<string, string>;
    for (const key of ["account", "dataFailure", "dataFailureDescription", "retrySync", "signOut"]) {
      assert.ok(account[key]?.trim(), `${locale}/account.json must define ${key}`);
    }
  }
  assert.match(screen, /function isRetryFailureCoveredByStatus\(accountData: AccountDataSession, failure: string\)/);
  assert.match(screen, /conflictDescription/);
  assert.match(screen, /account\.state\.kind === "guestAccessBlocked" && mode === "entry"/);
  assert.match(screen, /testID="account-binding-sign-in-notice"/);
});

test("account recovery back action follows live navigator history", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");

  assert.match(screen, /import \{ useIsFocused, useNavigationState, usePreventRemove \} from "@react-navigation\/native";/u);
  assert.match(screen, /const navigationIndex = useNavigationState\(\(state\) => state\.index\);/u);
  assert.match(screen, /const backAction = mode === "register"[\s\S]*?setMode\("signIn"\)[\s\S]*?navigationIndex > 0[\s\S]*?if \(navigation\.canGoBack\(\)\) navigation\.goBack\(\);/u);
  assert.match(screen, /usePreventRemove\(mode === "register", \(\) => \{[\s\S]*?setMode\("signIn"\)/u);
  assert.doesNotMatch(screen, /navigation\.addListener\("beforeRemove"/u);
  assert.match(screen, /initialMode === "entry"[\s\S]*?initialMode === "register"[\s\S]*?: "entry"/u);
  assert.match(screen, /backAction=\{mode === "register" \? undefined : \{\s*destinationLabel: text\.signIn,\s*onPress: \(\) => \{ setFeedback\(null\); setMode\("signIn"\); \},\s*testID: "account-back-to-sign-in"/u);
  assert.match(screen, /mode === "register" \? \([\s\S]*?<CredentialsForm[\s\S]*?account-register-submit/u);
  assert.match(screen, /accessibilityRole="link" onPress=\{onSignIn\} style=\{styles.registrationSignInLink\} testID="account-register-back-to-sign-in"/u);
  assert.doesNotMatch(screen, /const backAction = navigation\.canGoBack\(\)/u);
});

test("signed-out sign-in presentation is independent of pending remote revocation", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const en = JSON.parse(readFileSync("src/locales/en/account.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/account.json", "utf8")) as Record<string, string>;
  const locales = ["de", "en", "es", "et", "fr", "it", "pl"];

  assert.doesNotMatch(screen, /pendingRemoteRevokeCount|account-remote-revoke-pending|remoteSessionRevocationPending/u);
  for (const locale of locales) {
    const accountLocale = JSON.parse(readFileSync(`src/locales/${locale}/account.json`, "utf8")) as Record<string, string>;
    assert.equal("remoteSessionRevocationPending" in accountLocale, false, `${locale} title key removed`);
    assert.equal("remoteSessionRevocationPendingDescription" in accountLocale, false, `${locale} description key removed`);
  }
  assert.match(en.signOutPendingDescription ?? "", /safely retry/u);
  assert.match(en.signOutPendingDescription ?? "", /doesn’t need an internet connection/u);
  assert.match(pl.signOutPendingDescription ?? "", /bezpiecznie ponowić tę czynność/u);
  assert.match(pl.signOutPendingDescription ?? "", /nie wymaga połączenia z internetem/u);
  assert.match(screen, /credentialsError \? <AuthText[\s\S]*?testID="account-password-error"[\s\S]*?text\.signInCredentialsError/u);
  assert.match(screen, /signInCredentialsError: t\("signInCredentialsError"\)/u);
});

test("local sign-out persists its block before closing scope and never invokes remote preparation", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const signOut = provider.slice(provider.indexOf('signOut: () => runAuthMutationWithAuth'), provider.indexOf('changePassword: (credentials, newPassword)'));
  assert.match(signOut, /getAccountSignOutState\(\)/);
  assert.match(signOut, /const current = stateRef\.current;[\s\S]*?current\.kind === "authenticated" \|\| current\.kind === "localOffline"[\s\S]*?const accountId = current\.kind === "authenticated" \? current\.backendUser\.id : current\.accountId;[\s\S]*?scopedSignOut\?\.accountId === accountId[\s\S]*?beginAccountSignOut\(accountId\)/);
  assert.match(signOut, /logoutControl\.blockAndQueueRevoke\(user\.uid, operationId!\)/);
  assert.match(signOut, /performLocalAccountSignOut\([\s\S]*?publishLockedState:[\s\S]*?clearOwnedPremiumCache:[\s\S]*?closeProfileStorage: closeSignOutProfileStorage[\s\S]*?signOutFirebase:[\s\S]*?auth\.signOut\(\)/);
  assert.match(signOut, /retainAuthOnControlFailure: durableOperation/);
  const setupFailure = signOut.slice(signOut.indexOf("finishLocalSignOutSetupFailure({"), signOut.indexOf("const outcome = await performLocalAccountSignOut"));
  assert.ok(setupFailure.includes("isCurrent: canContinue"));
  assert.ok(setupFailure.includes("persistFallbackControlPair: async () =>"));
  assert.ok(setupFailure.includes("logoutControl.blockAndQueueRevoke(user.uid, operationId)"));
  assert.ok(setupFailure.includes("hasVerifiedLocalLogoutReceipt(snapshot, user.uid, operationId)"));
  assert.ok(setupFailure.includes("clearOwnedPremiumCache: () => clearSigningOutAccountCache(operationId)"));
  assert.ok(setupFailure.includes("closeProfileStorage: closeSignOutProfileStorage"));
  assert.ok(setupFailure.includes("signOutFirebase: () => auth.signOut()"));
  assert.ok(signOut.includes('recoveryOutcome === "stale"'));
  assert.ok(signOut.includes('recoveryOutcome === "signOutPending"'));
  assert.doesNotMatch(signOut, /clearPremiumCache\(\)/);
  assert.match(signOut, /if \(!signOutProfile\) \{[\s\S]*?stateAtSignOut\.kind !== "verificationPending" \|\| stateAtSignOut\.user\.uid !== user\.uid[\s\S]*?getActiveStorageProfileOrNull\(\) === null && canContinue\(\) \? true : "stale"/u);
  assert.match(signOut, /return \{ kind: "failure", failure: "localCleanupFailure" \}/);
  assert.doesNotMatch(signOut, /prepareAccountSignOut|revokeSessions|synchronizeBoundAccount|clearAccountOwnedLocalData/);
  assert.doesNotMatch(signOut, /revokeGuestAccess/);
  assert.doesNotMatch(provider, /completeRemoteRevokedSignOut/);
  assert.match(provider, /pendingRemoteRevokeCount: logoutControlSnapshot\.pending\.length \+ \(state\.kind === "signOutPending"/);
  assert.match(setupFailure, /publishLockedState:[\s\S]*?setState\(\{ kind: "signOutPending", user,[\s\S]*?closeProfileStorage: closeSignOutProfileStorage/);
});

test("completed sign-out cannot publish signed-out state over a newly authenticated UID", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const signOut = provider.slice(provider.indexOf('signOut: () => runAuthMutationWithAuth'), provider.indexOf('changePassword: (credentials, newPassword)'));
  assert.match(signOut, /if \(auth\.getSnapshot\(\) !== null\) return \{ kind: "failure", failure: "revokedSession" \};[\s\S]*?setAccountEntryMode\("login"\);[\s\S]*?setState\(\{ kind: "signedOut" \}\)/);
});

test("explicit login and registration Auth mutations serialize with local sign-out", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  assert.match(provider, /const runAuthMutationWithAuth = useCallback[\s\S]*?sensitiveCommandLane\.runWhenIdle\(\(\) => runWithAuth\(operation\)\)/);
  const accountCommands = provider.slice(provider.indexOf("const value = useMemo<AccountSessionContextValue>"), provider.indexOf("}), [accountEntryMode"));
  for (const command of ["register", "signIn", "signOut"]) {
    assert.match(accountCommands, new RegExp(`${command}: [^\\n]*=> runAuthMutationWithAuth\\(`), command);
  }
  assert.match(accountCommands, /signInWithApple: \(locale, appleCredentialDependencies\) => authClient && apiClient \? runProviderFirstUse/u);
  assert.match(accountCommands, /signInWithGoogle: \(idToken, locale\) => authClient && apiClient \? runProviderFirstUse/u);
  assert.doesNotMatch(accountCommands, /registerWithApple|registerWithGoogle/u);
});

test("restored matching logout block closes scope and remains pending until manual retry", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const bootstrap = readFileSync("src/application/bootstrap/accountBootstrap.ts", "utf8");
  assert.match(bootstrap, /findPendingSessionRevocation\(logoutControlSnapshotRef\.current, user\.uid\)[\s\S]*?finishPendingSignOut\(pendingRevoke\.operationId, "signOutPending", false\)[\s\S]*?findMatchingLocalLogoutBlock/u);
  const authObserver = provider.slice(provider.indexOf('configuredAuth.onUserChanged'), provider.indexOf('useEffect(() => {\n    if (state.kind === "guest"'));
  assert.match(bootstrap, /await input\.drainPendingRevocations\(\)[\s\S]*?const prepared = await input\.prepareProfile\(\)/u);
  assert.match(provider, /const admitAuthenticatedBootstrap = useCallback\([\s\S]*?admitAccountBootstrap\([\s\S]*?pendingSessionRevocationDrainRef/u);
  assert.match(bootstrap, /export function admitAccountBootstrap\([\s\S]*?drainPendingRevocations: async \(\) => \{[\s\S]*?drainPendingSessionRevocations\([\s\S]*?executor: pendingSessionRevocationDrainRef\.current![\s\S]*?generation: generation\.generation[\s\S]*?onSnapshot:[\s\S]*?isCurrent\(\)/u);
  assert.match(authObserver, /admitAuthenticatedBootstrap\(configuredAuth, client, user, generation/u);
  assert.match(bootstrap, /sessionCoordinator\.isCurrent\(generation\) && sessionExchangeUidRef\.current === user\.uid/u);
  assert.match(authObserver, /findMatchingLocalLogoutBlock\(logoutControlSnapshotRef\.current, user\.uid\)/);
  assert.match(authObserver, /if \(matchingLogoutBlock\) \{[\s\S]*?closeActiveProfileStorage\(\);[\s\S]*?setState\(\{ kind: "signOutPending", user \}\);[\s\S]*?return;/);
  assert.match(authObserver, /clearBlockForAuth\(previousObservedUid, logoutBlock\.operationId, canClearLogoutBlock\)/);
  assert.match(authObserver, /const canClearLogoutBlock = \(\) => live && !observerDetached && eventRevision === authObserverRevision && configuredAuth\.getSnapshot\(\) === null/);
  assert.match(provider, /const logoutBlock = logoutControlSnapshotRef\.current\.blocked/);
  const nullAuthBranch = authObserver.slice(authObserver.indexOf("if (!user) {"), authObserver.indexOf("if (rejectedRestoreUid !== null && rejectedRestoreUid !== user.uid)"));
  assert.ok(nullAuthBranch.indexOf("closeProfileStorage: closeActiveProfileStorage") < nullAuthBranch.indexOf("clearBlockForAuth"));
  assert.match(nullAuthBranch, /logoutControlSnapshotRef\.current\.blocked[\s\S]*?clearBlockForAuth\(previousObservedUid, logoutBlock\.operationId, canClearLogoutBlock\)/);
  const explicitFinalize = provider.slice(provider.indexOf("const finalizeExplicitAuthentication"), provider.indexOf("// Firebase publishes a new credential"));
  assert.match(explicitFinalize, /admitAuthenticatedBootstrap\(auth, api, user, generation/u);
  assert.match(bootstrap, /activatePreparedProfile\(profile\.id, profile\.kind, \{ deferReadyNotification: true \}\)/);
  assert.match(bootstrap, /guardAuthenticatedScopeAgainstIncompleteSignOut\([\s\S]*?readScopedSignOut: getAccountSignOutState/);
  assert.match(bootstrap, /guardAuthenticatedScopeAgainstIncompleteSignOut\([\s\S]*?if \(logoutGuard === "blocked"\)[\s\S]*?return attempt;[\s\S]*?notifyProfileStorageReady\(\);[\s\S]*?setState\(\{ kind: "profilePreparing"/);
  assert.doesNotMatch(provider.slice(provider.indexOf("async function reconcileAuthenticatedUser"), provider.indexOf("export async function completeUnrecognizedPersistedAuthSignOut")), /getAccountSignOutState|shouldLockForIncompleteScopedSignOut/u);
});

test("foreground identity publication keeps the latest account data and rejects stale generations", () => {
  const latest = {
    accountData: {
      activeSessionBlocked: false,
      blockingConflictCode: null,
      lastFailureCode: null,
      lastSuccessfulSyncAt: "2026-09-07T10:00:00.000Z",
      pendingMutationCount: 2,
      preview: null,
      status: "synced",
    },
    backendUser: { id: "backend-old" },
    kind: "authenticated",
    user: { email: "old@example.com", emailVerified: true, provider: "password", providers: ["password"], uid: "uid-a" },
  } as unknown as Extract<AccountState, { kind: "authenticated" }>;
  const refreshedUser = { ...latest.user, email: "new@example.com" };
  const published = publishRefreshedAuthenticatedState(latest, { backendUser: { id: "backend-new" } as never, isCurrent: () => true, user: refreshedUser });
  assert.equal(published.kind, "authenticated");
  if (published.kind === "authenticated") {
    assert.equal(published.user.email, "new@example.com");
    assert.equal(published.backendUser.id, "backend-new");
    assert.equal(published.accountData, latest.accountData);
  }
  assert.equal(publishRefreshedAuthenticatedState(latest, { backendUser: { id: "backend-new" } as never, isCurrent: () => false, user: refreshedUser }), latest);
});

test("identity refresh requires exact /me subject and an unchanged verified profile binding fence", () => {
  const lease = { profile: { id: "profile-a", kind: "account", accountId: "backend-a" }, generation: 7 } as const;
  const binding = {
    kind: "verified",
    binding: {
      schema: "patternly.account-binding.v1",
      profileId: "profile-a",
      profileKind: "account",
      accountId: "backend-a",
      firebaseUid: "uid-a",
      verified: true,
      verificationRevision: 12,
      checksum: "binding-checksum-a",
    },
  } as const;
  const fence = readVerifiedAccountIdentityFence(binding, lease, "backend-a", "uid-a");
  assert.ok(fence);
  assert.equal(sameVerifiedAccountIdentityFence(fence, fence), true);
  assert.equal(sameVerifiedAccountIdentityFence(fence, { ...fence!, verificationRevision: 13 }), false);
  assert.equal(sameVerifiedAccountIdentityFence(fence, { ...fence!, checksum: "binding-checksum-b" }), false);
  assert.equal(sameVerifiedAccountIdentityFence(fence, { ...fence!, leaseGeneration: 8 }), false);
  assert.equal(readVerifiedAccountIdentityFence({ kind: "invalidated" }, lease, "backend-a", "uid-a"), null);
  assert.equal(readVerifiedAccountIdentityFence(binding, lease, "backend-a", "uid-b"), null);
  assert.equal(readVerifiedAccountIdentityFence(binding, { ...lease, profile: { ...lease.profile, id: "profile-b" } }, "backend-a", "uid-a"), null);

  const response = { user: { id: "backend-a", identity: { subject: "uid-a" } } } as never;
  assert.equal(accountIdentityProofMatchesSubject(response, "backend-a", "uid-a"), true);
  assert.equal(accountIdentityProofMatchesSubject({ user: { id: "backend-a", identity: { subject: "uid-b" } } } as never, "backend-a", "uid-a"), false);
  assert.equal(accountIdentityProofMatchesSubject({ user: { id: "backend-b", identity: { subject: "uid-a" } } } as never, "backend-a", "uid-a"), false);

  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  assert.match(provider, /identityProof\.barrier !== null[\s\S]*?kind: "backendUnavailable"/u);
  assert.match(provider, /await readActiveAccountIdentityBinding\(identityLease\)[\s\S]*?!durableFence[\s\S]*?publishRefreshedAuthenticatedState/u);
  assert.match(provider, /await readActiveAccountIdentityBinding\(lease\)[\s\S]*?sameVerifiedAccountIdentityFence\(initialFence, responseFence\)[\s\S]*?replacePremiumCacheFromFreshResponse/u);
});

test("synchronous Premium projection stays blocked for an unresolved same-actor identity proof", () => {
  const active = { uid: "uid-a", accountId: "backend-a", generation: { uid: "uid-a", generation: 8 } } as const;
  assert.equal(isAccountIdentityProofInFlightForActor(active, "uid-a", "backend-a"), true);
  assert.equal(isAccountIdentityProofInFlightForActor({ ...active, generation: { uid: "uid-a", generation: 9 } }, "uid-a", "backend-a"), true,
    "a same-actor generation advance must not expose the cached Premium projection while the old proof remains unresolved");
  assert.equal(isAccountIdentityProofInFlightForActor(active, "uid-b", "backend-a"), false);
  assert.equal(isAccountIdentityProofInFlightForActor(active, "uid-a", "backend-b"), false);
  assert.equal(isAccountIdentityProofInFlightForActor(null, "uid-a", "backend-a"), false);

  const flight = active as AccountIdentityProofInFlight;
  const current = { uid: "uid-a", accountId: "backend-a", generation: flight.generation, isCurrent: true } as const;
  assert.equal(shouldClearAccountIdentityProofLatch(flight, flight, false, current), false, "a failed proof cannot release the actor latch");
  assert.equal(shouldClearAccountIdentityProofLatch(flight, flight, true, { ...current, generation: { uid: "uid-a", generation: 9 } }), false,
    "a late proof from an older generation cannot release the latch");
  assert.equal(shouldClearAccountIdentityProofLatch({ ...flight, generation: { uid: "uid-a", generation: 7 } }, flight, true, current), false,
    "a completed older run cannot release a newer same-actor proof latch");
  assert.equal(shouldClearAccountIdentityProofLatch(flight, flight, true, current), true,
    "only the same current run after durable binding revalidation may release the latch");

  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const readPremium = provider.slice(provider.indexOf("const readCurrentPremiumAccess"), provider.indexOf("const captureCurrentAuthenticatedActorFence"));
  assert.ok(readPremium.indexOf("isAccountIdentityProofInFlightForActor") < readPremium.indexOf("readCachedPremiumAccess"));
  assert.match(provider, /const identityProofFlight = Object\.freeze\(\{ uid: previousUser\.uid, accountId: expectedAccountId, generation \}\)[\s\S]*?if \(hasLiveDeletionAuthorization\(\)\)[\s\S]*?accountIdentityProofInFlightRef\.current = identityProofFlight/u);
  assert.match(provider, /await readActiveAccountIdentityBinding\(identityLease\)[\s\S]*?identityProofFenceRevalidated = true[\s\S]*?finally\(\(\) => \{[\s\S]*?shouldClearAccountIdentityProofLatch\(pending, identityProofFlight, identityProofFenceRevalidated/u);
  assert.doesNotMatch(provider, /if \(result\.kind === "failure"[\s\S]{0,160}accountIdentityProofInFlightRef\.current = null/u);
  assert.match(provider, /if \(canContinue\(auth, auth\.getSnapshot\(\)\)\) setState\(sdkRefresh\.state\)/u);
  assert.match(provider, /if \(canContinue\(auth, auth\.getSnapshot\(\)\)\) setState\(identityProof\.state\)/u);
});

test("queued identity refresh is rejected by the production guard after sign-out or UID switch", async () => {
  const token = { generation: 4, uid: "uid-a" } as const;
  const authenticated = {
    accountData: { activeSessionBlocked: false, blockingConflictCode: null, lastFailureCode: null, lastSuccessfulSyncAt: null, pendingMutationCount: 0, preview: null, status: "synced" },
    backendUser: { id: "backend-a" },
    kind: "authenticated",
    user: { email: "a@example.com", emailVerified: true, provider: "password", providers: ["password"], uid: "uid-a" },
  } as unknown as Extract<AccountState, { kind: "authenticated" }>;

  for (const transition of ["signOut", "switchUid"] as const) {
    let currentState: AccountState = authenticated;
    let authUid: string | null = "uid-a";
    let generationCurrent = true;
    let release: (() => void) | undefined;
    const lane = createSensitiveCommandLane();
    const blocker = lane.run(async () => {
      await new Promise<void>((resolve) => { release = resolve; });
    });
    let refreshCalls = 0;
    const queuedRefresh = lane.runWhenIdle(async () => {
      const canContinue = canContinueAccountIdentityRefresh({
        authUid,
        currentState,
        expectedUid: token.uid,
        generation: token,
        isCurrentGeneration: () => generationCurrent,
        refreshedUid: authUid,
      });
      if (canContinue) refreshCalls += 1;
      return canContinue;
    });
    await Promise.resolve();
    if (transition === "signOut") {
      currentState = { kind: "signedOut" };
      authUid = null;
    } else {
      currentState = { ...authenticated, user: { ...authenticated.user, uid: "uid-b" } };
      authUid = "uid-b";
    }
    generationCurrent = false;
    release?.();
    await blocker;
    assert.equal(await queuedRefresh, false, transition);
    assert.equal(refreshCalls, 0, transition);
  }
});

test("email security composition delegates refresh to the global foreground owner", () => {
  const app = readFileSync("src/RegularApplicationRoot.tsx", "utf8");
  const sidecar = readFileSync("src/application/account/AccountForegroundRefreshSidecar.tsx", "utf8");
  const screen = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  const pendingScreen = readFileSync("src/features/account/AccountEmailChangePendingScreen.tsx", "utf8");
  const en = JSON.parse(readFileSync("src/locales/en/settings.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/settings.json", "utf8")) as Record<string, string>;
  assert.match(app, /<AccountForegroundRefreshSidecar \/>/u);
  assert.match(sidecar, /AppState\.addEventListener\("change"/u);
  assert.match(sidecar, /previousState !== "active" && nextState === "active"/u);
  const foregroundRefresh = sidecar.slice(sidecar.indexOf("refresh: async (intent)"), sidecar.indexOf("AppState.addEventListener(\"change\""));
  assert.match(foregroundRefresh, /beginStartupSpan\("account_foreground_refresh"\)[\s\S]*?await accountRef\.current\.refreshAccountIdentity\(\)[\s\S]*?markStartup\(`account_foreground_refresh:\$\{outcome\}`\)[\s\S]*?endSpan\(\)/u);
  assert.ok(foregroundRefresh.indexOf("endSpan()") < foregroundRefresh.indexOf("await accountRef.current.refreshPremiumEntitlement"), "the identity span excludes Premium and recovery refreshes");
  assert.doesNotMatch(screen, /refreshIdentity|identityRefreshed|Refresh account details|Odśwież dane konta/u);
  assert.match(screen, /account\.refreshAccountIdentityFailure/u);
  assert.match(screen, /const requestedEmail = mode === "email" \? nextValue\.trim\(\)\.toLowerCase\(\) : ""/u);
  assert.match(screen, /account\.requestEmailChange\(credentials, requestedEmail\)/u);
  assert.match(screen, /navigation\.replace\(ROUTES\.ACCOUNT_EMAIL_CHANGE_PENDING/u);
  assert.match(pendingScreen, /getAccountEmailChangePendingStatus/u);
  for (const testID of ["email-change-waiting", "email-change-confirmed", "email-change-refresh-error", "email-change-unavailable", "email-change-return"]) {
    assert.match(pendingScreen, new RegExp(`testID="${testID}"`, "u"));
  }
  assert.equal("emailVerificationSent" in en, false);
  assert.equal("emailVerificationSent" in pl, false);
  assert.equal("emailChangePendingTitle" in en, true);
  assert.equal("emailChangePendingTitle" in pl, true);
  assert.equal("identityRefreshed" in en, false);
  assert.equal("refreshIdentity" in en, false);
  assert.equal("identityRefreshed" in pl, false);
  assert.equal("refreshIdentity" in pl, false);
});

test("the foreground owner retries plan recovery at bootstrap, reconnect, foreground, and its durable timer", () => {
  const sidecar = readFileSync("src/application/account/AccountForegroundRefreshSidecar.tsx", "utf8");
  assert.match(sidecar, /currentRecoveryIncidentId/u);
  assert.match(sidecar, /NetInfo\.addEventListener[\s\S]*transition\.reconnected[\s\S]*retryLearningPlanRecovery/u);
  assert.match(sidecar, /refresh: async[\s\S]*refreshAccountIdentity[\s\S]*retryLearningPlanRecovery[\s\S]*AppState\.addEventListener\("change"/u);
  assert.match(sidecar, /setInterval[\s\S]*retryLearningPlanRecovery[\s\S]*30_000/u);
  assert.ok(sidecar.match(/retryLearningPlanRecovery/g)?.length === 4, "bootstrap, reconnect, foreground, and timer must be the only trigger owners");
});

test("local-offline initial reachability check is actor-scoped and is not rearmed by generation changes", () => {
  const sidecar = readFileSync("src/application/account/AccountForegroundRefreshSidecar.tsx", "utf8");
  assert.match(sidecar, /claimLocalOfflineInitialRefresh\(\{[\s\S]*?attemptedUid: localOfflineInitialRefreshUidRef\.current[\s\S]*?accountRef\.current\.refreshAccountIdentity\(\)/u);
  assert.match(sidecar, /\}, \[account\.state\.kind, currentUid\]\);/u);
  assert.doesNotMatch(sidecar, /account\.state\.kind === "localOffline" \? account\.state\.generation\.generation/u);
});

test("sign-in keeps guest access visible and uses the approved Google logo asset", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  assert.match(screen, /ambientVariant="auth"/);
  assert.match(screen, /testID="account-sign-in-guest"/);
  assert.match(screen, /onPress=\{continueWithoutAccount\}/);
  assert.match(screen, /footerVariant="sticky"/);
  assert.match(screen, /"account-back-to-sign-in"/);
  assert.match(screen, /setMode\("signIn"\)/);
  assert.match(screen, /testID="account-register-terms-checkbox"/);
  assert.match(screen, /accessibilityRole="checkbox"/);
  assert.match(screen, /disabled=\{acceptedTerms === false\}/);
  assert.match(screen, /testID="account-register-terms-link"/);
  assert.match(screen, /testID="account-register-privacy-link"/);
  assert.match(screen, /if \(account\.state\.kind === "guest" && navigation\.canGoBack\(\)\)/);
  assert.match(screen, /navigation\.goBack\(\);[\s\S]*?account\.continueAsGuest\(\)/);
  assert.match(screen, /import GoogleIcon from "\.\.\/\.\.\/assets\/icons\/google\.svg"/);
  assert.match(screen, /<GoogleIcon height=\{18\} width=\{18\} \/>/);
  assert.match(screen, /providerButton:[\s\S]*?backgroundColor: palette\.provider\.brandedSurface[\s\S]*?borderColor: palette\.provider\.brandedBorder/);
  assert.match(screen, /centeredInput: \{ textAlignVertical: "center" \}/);
  assert.match(screen, /<Icon color=\{colors\.provider\.appleIcon\} name="apple" size=\{26\} \/>/);
  assert.match(screen, /authPrimaryButton:[\s\S]*?backgroundColor: palette\.primary/);
  assert.match(screen, /authTitle:[\s\S]*?color: palette\.textPrimary/);
  assert.match(screen, /errorTestID="account-password-confirmation-error"/);
  assert.match(screen, /errorTestID="account-register-email-error"/);
  assert.match(screen, /errorTestID="account-register-password-error"/);
  assert.match(screen, /errorTestID="account-recovery-email-error"/);
  assert.match(screen, /errorTestID="account-reset-password-error"/);
  assert.match(screen, /useWindowDimensions/);
  assert.match(screen, /function AuthText\(\{ maxFontSizeMultiplier = 2/);
  assert.match(screen, /<Text key=\{fontScale\} maxFontSizeMultiplier=\{maxFontSizeMultiplier\}/);
  assert.doesNotMatch(screen, /AUTH_HEADING_MAX_FONT_SCALE|maxFontSizeMultiplier=\{1\.35\}/);
  assert.doesNotMatch(screen, /termsUnavailable|account-terms-unavailable/);
  assert.match(screen, /providerContent:[\s\S]*?minWidth: 0/);
  assert.doesNotMatch(screen, /providerIcon:[\s\S]*?position: "absolute"/);
  assert.doesNotMatch(screen, /themeColors\.(?:dark|light)|#[0-9a-f]{3,8}/i);
});

test("registration keeps consent presentation separate from the boolean domain contract", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const en = JSON.parse(readFileSync("src/locales/en/account.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/account.json", "utf8")) as Record<string, string>;
  const registrationStart = screen.indexOf("function CredentialsForm");
  const termsStart = screen.indexOf("function TermsAcceptance");
  const termsEnd = screen.indexOf("function FormField", termsStart);
  const passwordStart = screen.indexOf("function AuthPasswordInput");
  const providerReviewStart = screen.indexOf("function ProviderRegistrationScreen");
  const providerReviewEnd = screen.indexOf("function DocumentConfirmation", providerReviewStart);

  assert.match(screen, /type TermsPresentationState = "pristine" \| "checked" \| "uncheckedAfterInteraction"/u);
  assert.match(screen, /useState<TermsPresentationState>\("pristine"\)/u);
  assert.match(screen, /setTermsPresentationState\("pristine"\)/u);
  assert.match(screen, /setTermsPresentationState\(accepted \? "checked" : "uncheckedAfterInteraction"\)/u);
  assert.match(screen, /presentationState === "uncheckedAfterInteraction" && !accepted/u);
  assert.match(screen, /<Button disabled=\{acceptedTerms === false\}/u);
  assert.ok(registrationStart >= 0 && termsStart > registrationStart && termsEnd > termsStart && passwordStart > termsEnd);

  const registration = screen.slice(registrationStart, termsStart);
  const termsAcceptance = screen.slice(termsStart, termsEnd);
  const passwordInput = screen.slice(passwordStart);
  const providerReview = screen.slice(providerReviewStart, providerReviewEnd);
  assert.equal((registration.match(/enableFocusHighlight/g) ?? []).length, 2);
  assert.match(registration, /const \[emailFocused, setEmailFocused\] = useState\(false\)/u);
  assert.match(registration, /onFocus=\{\(\) => setEmailFocused\(true\)\}/u);
  assert.match(registration, /onBlur=\{\(\) => setEmailFocused\(false\)\}/u);
  assert.match(registration, /accessibilityLabel=\{text\.email\}[\s\S]*?textContentType="emailAddress"[\s\S]*?returnKeyType="next"/u);
  assert.match(registration, /accessibilityLabel=\{text\.password\}[\s\S]*?returnKeyType="next"[\s\S]*?textContentType="newPassword"/u);
  assert.match(registration, /accessibilityLabel=\{text\.confirmPassword\}[\s\S]*?returnKeyType="done"[\s\S]*?textContentType="newPassword"/u);
  assert.match(passwordInput, /const \[focused, setFocused\] = useState\(false\)/u);
  assert.match(passwordInput, /if \(enableFocusHighlight\) setFocused\(true\)/u);
  assert.match(passwordInput, /if \(enableFocusHighlight\) setFocused\(false\)/u);
  assert.match(passwordInput, /enableFocusHighlight && focused \? styles\.authInputFocused : null, error \? styles\.authInputError : null/u);
  assert.match(screen, /emailFocused \? styles\.authInputFocused : null, emailError \? styles\.authInputError : null/u);
  assert.match(screen, /authInputFocused: \{ borderColor: palette\.primary \}/u);
  assert.match(screen, /termsCheckboxChecked: \{ backgroundColor: palette\.primary, borderColor: palette\.primary \}/u);
  assert.match(screen, /termsCheckboxIcon: \{ color: palette\.onPrimary \}/u);
  assert.match(screen, /termsAcceptanceCheckboxChecked: \{ backgroundColor: palette\.onPrimary, borderColor: palette\.primary \}/u);
  assert.match(screen, /termsAcceptanceCheckboxIcon: \{ color: palette\.primary \}/u);
  assert.match(termsAcceptance, /termsAcceptanceCheckboxChecked/u);
  assert.match(termsAcceptance, /termsAcceptanceCheckboxIcon/u);
  assert.match(termsAcceptance, /accessibilityRole="checkbox"[\s\S]*?accessibilityState=\{\{ checked: accepted \}\}/u);
  assert.equal(termsAcceptance.includes('accessibilityLabel={`${text.acceptTermsPrefix}${text.termsOfService}${text.privacyAcknowledgementPrefix}${text.privacyPolicy}.`}'), true);
  assert.match(termsAcceptance, /accessibilityRole="link"[\s\S]*?testID="account-register-terms-link"/u);
  assert.match(termsAcceptance, /accessibilityRole="link"[\s\S]*?testID="account-register-privacy-link"/u);
  assert.doesNotMatch(termsAcceptance, /termsCheckboxChecked|termsCheckboxIcon/u);
  assert.doesNotMatch(termsAcceptance, /numberOfLines|maxHeight/u);
  assert.match(screen, /termsLinks:\s*\{\s*flex:\s*1,\s*flexDirection:\s*"row",\s*flexWrap:\s*"wrap",\s*minWidth:\s*0\s*\}/u);
  assert.match(screen, /termsCheckboxRow:\s*\{[^}]*flexDirection:\s*"row"[^}]*minWidth:\s*0/u);
  assert.equal(en.termsRequired, "Accept the Terms of Service and acknowledge the Privacy Policy to create an account.");
  assert.equal(pl.termsRequired, "Aby utworzyć konto, zaakceptuj Warunki korzystania i potwierdź zapoznanie się z Polityką prywatności.");
  assert.equal(`${en.acceptTermsPrefix}${en.termsOfService}${en.privacyAcknowledgementPrefix}${en.privacyPolicy}.`, "I agree to the Terms of Service and acknowledge the Privacy Policy.");
  assert.equal(`${pl.acceptTermsPrefix}${pl.termsOfService}${pl.privacyAcknowledgementPrefix}${pl.privacyPolicy}.`, "Akceptuję Warunki korzystania i znam Politykę prywatności.");
  assert.match(screen, /const legalLocale = locale === "pl" \? "pl" : "en"/u);
  assert.match(screen, /account\.register\(email, password, acceptedTerms, legalLocale\)/u);
  assert.match(screen, /ROUTES\.TERMS_OF_SERVICE/gu);
  assert.match(screen, /ROUTES\.PRIVACY_POLICY/gu);
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const bootstrap = readFileSync("src/application/bootstrap/accountBootstrap.ts", "utf8");
  assert.match(provider, /registrationIntentRef[\s\S]*?inFlight\?\.uid === user\.uid[\s\S]*?return inFlight\.promise/u);
  assert.match(provider, /registrationIntentRef\.current = Object\.freeze\(\{ uid: user\.uid, promise \}\)/u);
  assert.match(provider, /const registration = await api\.registerAccount\(evidence\)/u);
  const adoptionMarker = provider.indexOf('if (registration.registration.created && getActiveStorageProfileOrNull()?.kind === "guest") await markGuestInstallationAdoptionPending()');
  const registrationFinalize = provider.indexOf("accountFinalizationPolicies.registrationCreated<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>(generation)");
  assert.ok(adoptionMarker >= 0 && registrationFinalize > adoptionMarker, "registration adoption is durably marked before the named finalization policy runs");
  for (const policy of ["preparedProfile", "registrationCreated", "verification", "resendVerification", "passwordRefresh", "localOfflineRefresh", "deletionReauthentication"]) {
    assert.ok(provider.includes(`accountFinalizationPolicies.${policy}`) || bootstrap.includes(`accountFinalizationPolicies.${policy}`), `the ${policy} call site selects its named policy`);
  }
  assert.doesNotMatch(provider, /finalizeCurrent\(auth, api, user, false,/u, "finalization call sites no longer use positional booleans");
  assert.match(bootstrap, /!activeProfile && preparedSelection\?\.kind === "guest"[\s\S]*?activatePreparedProfile\(preparedSelection\.id, preparedSelection\.kind, \{ deferReadyNotification: true \}\)/u);
  assert.match(bootstrap, /guestInstallation\?\.bindingState === "adoption_pending"[\s\S]*?attempt\.guestAdoption = true[\s\S]*?notifyProfileStorageReady\(\)/u);
  assert.match(provider, /register: \(email,[\s\S]*?legalAcceptancePendingRef\.current = true[\s\S]*?auth\.register\([\s\S]*?legalAcceptancePendingRef\.current = false/u);
  assert.match(provider, /signInWithApple: \(locale, appleCredentialDependencies\) => authClient && apiClient \? runProviderFirstUse\(authClient, apiClient, locale, \(\) => authClient\.signInWithApple\(appleCredentialDependencies\)\)/u);
  assert.match(provider, /signInWithGoogle: \(idToken, locale\) => authClient && apiClient \? runProviderFirstUse\(authClient, apiClient, locale, \(\) => authClient\.signInWithGoogle\(idToken\)\)/u);
  assert.match(provider, /isAccountNotFound: \(error\) => error instanceof PatternlyApiClientError[\s\S]*?error\.status === 404[\s\S]*?error\.serverCode === "account_not_found"/u);
  assert.match(provider, /!user && isProviderAuthenticationCancelled\(error\)[\s\S]*?kind: "success", next: "signedOut"/u);
  assert.match(provider, /ERR_REQUEST_CANCELED[\s\S]*?auth\/popup-closed-by-user/u);
  assert.match(screen, /result\.kind === "success" && result\.next === "signedOut" \? null : result/u);
  assert.match(provider, /registerProviderIdentity = useCallback[\s\S]*?termsAccepted: boolean, privacyPolicyAcknowledged: boolean[\s\S]*?termsAccepted \|\| !privacyPolicyAcknowledged/u);
  assert.match(provider, /termsVersion: current\.documents\.documents\.terms\.version[\s\S]*?privacyPolicyVersion: current\.documents\.documents\.privacy\.version[\s\S]*?privacyPolicyAcknowledged: true/u);
  assert.match(provider, /result\.kind === "failure"[\s\S]*?auth\.getSnapshot\(\) === null[\s\S]*?observerBlockedUidRef\.current === current\.user\.uid[\s\S]*?observerBlockedUidRef\.current = null/u);
  assert.match(providerReview, /const \[termsAccepted, setTermsAccepted\] = useState\(false\)/u);
  assert.match(providerReview, /const \[privacyAcknowledged, setPrivacyAcknowledged\] = useState\(false\)/u);
  assert.match(providerReview, /const \[termsViewed, setTermsViewed\] = useState\(false\)/u);
  assert.match(providerReview, /const \[privacyViewed, setPrivacyViewed\] = useState\(false\)/u);
  assert.doesNotMatch(provider, /registerWithApple|registerWithGoogle/u);
  assert.match(provider, /signOutRejectedIdentity[\s\S]*?auth\.getSnapshot\(\)[\s\S]*?failure: "signOutPending"/u);
  assert.match(provider, /firebaseAuthErrorCode\(error\) === "auth\/email-already-in-use"[\s\S]*?auth\.signIn\(email\.trim\(\)\.toLowerCase\(\), password\)[\s\S]*?registerAuthenticatedIdentity/u);
});

test("unconfigured account entry never composes Google OAuth without typed provider configuration", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const securityScreen = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  const providerStart = screen.indexOf("function GoogleProviderButton");
  const providerEnd = screen.indexOf("function CredentialsForm", providerStart);

  assert.ok(providerStart >= 0 && providerEnd > providerStart);
  const accountEntry = screen.slice(0, providerStart);
  const provider = screen.slice(providerStart, providerEnd);

  assert.doesNotMatch(accountEntry, /Google\.useIdTokenAuthRequest/);
  assert.match(accountEntry, /const isLocalAndroidApp = Platform\.OS === "android"[\s\S]*?Constants\.expoConfig\?\.android\?\.package === "com\.lkurczab\.patternly\.local"[\s\S]*?Constants\.expoConfig\?\.extra\?\.patternlyRuntime === "smoke"/u);
  assert.match(accountEntry, /isLocalAndroidApp \? \([\s\S]*?<InfoBlock[\s\S]*?text\.providerUnavailable[\s\S]*?account-google-provider-unavailable[\s\S]*?\) : firebaseConfig\.kind === "configured" && getFirebaseGoogleClientId\(firebaseConfig\.value, Platform\.OS\) \? \([\s\S]*?<GoogleProviderButton[\s\S]*?configuration=\{firebaseConfig\.value\}/u);
  assert.match(securityScreen, /const isLocalAndroidApp = Platform\.OS === "android"[\s\S]*?Constants\.expoConfig\?\.android\?\.package === "com\.lkurczab\.patternly\.local"[\s\S]*?Constants\.expoConfig\?\.extra\?\.patternlyRuntime === "smoke"/u);
  assert.match(securityScreen, /!isLocalAndroidApp && usesGoogle && configuration\.kind === "configured" && getFirebaseGoogleClientId\(configuration\.value, Platform\.OS\)[\s\S]*?<GoogleVerification/u);
  assert.match(securityScreen, /: <InfoBlock body=\{ta\("providerUnavailable"\)\} title=\{title\} \/>/u);
  assert.match(provider, /configuration: FirebaseClientConfiguration/);
  assert.match(provider, /Google\.useIdTokenAuthRequest\([\s\S]*?androidClientId: configuration\.googleAndroidClientId[\s\S]*?iosClientId: configuration\.googleIosClientId[\s\S]*?webClientId: configuration\.googleWebClientId/);
  assert.match(provider, /googleResponse\.type !== "success"[\s\S]*?googleResponse\.type === "error"/);
  assert.match(provider, /accountRef\.current[\s\S]*?signInWithGoogle/);
  assert.doesNotMatch(accountEntry.slice(accountEntry.indexOf('if (mode === "register")'), accountEntry.indexOf('if (mode === "recovery")')), /continueWithApple|continueWithGoogle|registerWith/u);
  assert.match(provider, /feedbackRef\.current/);
  assert.match(provider, /<ProviderButton[\s\S]*?icon="google"[\s\S]*?text=\{text\}/);
  assert.doesNotMatch(provider, /(?:androidClientId|iosClientId|webClientId):\s*["']/);
});

test("a guest transition resets navigation into the application session", () => {
  const app = readFileSync("src/RegularApplicationRoot.tsx", "utf8");
  assert.match(app, /const \{ state, isMaterializedAccountTransition \} = usePatternlyAccount\(\)/);
  assert.match(app, /<NavigationContainer key=\{sessionKey\} theme=\{navigationTheme\}>/);
  assert.match(app, /state\.kind === "authenticated" \|\| state\.kind === "guest"/);
});

test("secure auth persistence stores only a Firebase refresh-token-shaped record", async () => {
  const stored = new Map<string, string>();
  const Persistence = createSecureAuthPersistence({
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 7,
    deleteItemAsync: async (key) => { stored.delete(key); },
    getItemAsync: async (key) => stored.get(key) ?? null,
    setItemAsync: async (key, value) => { stored.set(key, value); },
  });
  const persistence = new Persistence();
  const input = {
    accessToken: "synthetic-short-lived-value",
    displayName: "Patternly Test",
    email: "learner@example.com",
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: "+48123456789",
    providerData: [{ accessToken: "synthetic-short-lived-value", email: "learner@example.com", providerId: "password" }],
    stsTokenManager: { accessToken: "synthetic-short-lived-value", expirationTime: 9999999999999, refreshToken: "synthetic-refresh-value" },
    uid: "firebase-user-1",
  };
  const redacted = redactPersistedAuthUser(input);
  assert.ok(redacted);
  if (!redacted) throw new Error("expected_redacted_auth_user");
  assert.equal("accessToken" in redacted, false);
  assert.equal("accessToken" in (redacted.stsTokenManager as Record<string, unknown>), false);
  assert.equal("accessToken" in ((redacted.providerData as Array<Record<string, unknown>>)[0] ?? {}), false);
  assert.equal((redacted.stsTokenManager as Record<string, unknown>).expirationTime, 0);
  assert.equal(Persistence.type, "LOCAL");
  await persistence._set("firebase:authUser:patternly", input);
  const persistedUser = stored.get(AUTH_USER_STORAGE_KEY);
  assert.ok(persistedUser);
  assert.doesNotMatch(persistedUser, /accessToken/u);
  const restored = await persistence._get<Record<string, unknown>>("firebase:authUser:patternly");
  assert.equal(restored?.uid, "firebase-user-1");
  assert.equal((restored?.stsTokenManager as Record<string, unknown>).refreshToken, "synthetic-refresh-value");
});

test("secure auth persistence isolates Firebase metadata from the saved auth user", async () => {
  const stored = new Map<string, string>();
  const Persistence = createSecureAuthPersistence({
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 7,
    deleteItemAsync: async (key) => { stored.delete(key); },
    getItemAsync: async (key) => stored.get(key) ?? null,
    setItemAsync: async (key, value) => { stored.set(key, value); },
  });
  const persistence = new Persistence();
  const authUserKey = "firebase:authUser:public-api-key:patternly";
  const metadataKey = "firebase:persistence:public-api-key:patternly";
  const input = {
    emailVerified: true,
    isAnonymous: false,
    stsTokenManager: { refreshToken: "refresh-token" },
    uid: "firebase-user-2",
  };

  await persistence._set(authUserKey, input);
  await persistence._set(metadataKey, "LOCAL");
  assert.equal((await persistence._get<Record<string, unknown>>(authUserKey))?.uid, "firebase-user-2");
  assert.equal(await persistence._get<string>(metadataKey), "LOCAL");
  assert.ok(stored.has(AUTH_USER_STORAGE_KEY));
  assert.equal(stored.size, 2);

  await persistence._set(metadataKey, {
    ...input,
    accessToken: "redirect-short-lived-value",
    providerData: [{ accessToken: "redirect-short-lived-value", providerId: "google.com" }],
    stsTokenManager: { accessToken: "redirect-short-lived-value", refreshToken: "redirect-refresh-value" },
  });
  const ancillaryEntry = [...stored.entries()].find(([key]) => key !== AUTH_USER_STORAGE_KEY);
  assert.ok(ancillaryEntry);
  assert.doesNotMatch(ancillaryEntry?.[1] ?? "", /accessToken/u);
  assert.equal((await persistence._get<Record<string, unknown>>(metadataKey))?.uid, "firebase-user-2");

  await persistence._remove(metadataKey);
  assert.equal(await persistence._get<string>(metadataKey), null);
  assert.ok(stored.has(AUTH_USER_STORAGE_KEY));
  await persistence._remove(authUserKey);
  assert.equal(await persistence._get<Record<string, unknown>>(authUserKey), null);
});

test("startup waits for persisted auth resolution before choosing the entry screen or Home", () => {
  const authClient = readFileSync("src/infrastructure/firebase/firebaseAuthClient.ts", "utf8");
  const rootNavigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
  const app = readFileSync("src/RegularApplicationRoot.tsx", "utf8");
  const accountProvider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");

  assert.match(authClient, /onUserChanged: \(listener\) => onAuthStateChanged\(auth, \(user\) => \{\s*current = user;\s*listener\(user \? snapshot\(user\) : null\);/);
  assert.doesNotMatch(authClient, /onUserChanged:[^\n]*listener\(current \? snapshot\(current\) : null\)/);
  assert.match(rootNavigator, /state\.kind === "loading" \|\| state\.kind === "profilePreparing"[\s\S]*?<AccountProfileTransitionLoadingState \/>/);
  assert.match(rootNavigator, /import \{ AccountProfileTransitionLoadingState \} from "\.\.\/application\/account\/AccountProfileTransitionLoadingState"/);
  assert.match(rootNavigator, /applicationSessionReady = state\.kind === "guest" \|\| state\.kind === "localOffline" \|\| state\.kind === "signingOut" \|\| state\.kind === "deleting" \|\| \(state\.kind === "authenticated" && state\.accountData\.status === "synced"\)/);
  assert.match(rootNavigator, /initialRouteName=\{applicationSessionReady \? ROUTES\.HOME : ROUTES\.ACCOUNT_ENTRY\}/);
  assert.match(rootNavigator, /key=\{applicationSessionReady \? "application" : "account"\}/);
  assert.match(rootNavigator, /applicationSessionReady \? \([\s\S]*?<Stack\.Group>[\s\S]*?name=\{ROUTES\.HOME\}[\s\S]*?<\/Stack\.Group>[\s\S]*?\) : null/);
  assert.match(rootNavigator, /name=\{ROUTES\.ACCOUNT_ENTRY\}[\s\S]*?initialParams=\{\{ initialMode: accountEntryMode === "login" \? "signIn" : "entry" \}\}/);
  assert.match(rootNavigator, /testID="account-session-restore-loading"/);
  assert.match(app, /<AppPreferencesProvider>[\s\S]*?<ProfileStoragePreparationGate>[\s\S]*?<PatternlyAccountProvider>[\s\S]*?<AppContent/);
  assert.match(app, /const needsContent = [^;]*state\.kind === "localOffline"/);
  assert.match(app, /const sessionKey = [^\n]*state\.kind === "localOffline"/);
  assert.match(app, /<ContentPreparationGate completeAccountPreparation=\{completeProfilePreparation\} handoffToken=\{profilePreparationHandoffToken\}><AppNavigation \/><\/ContentPreparationGate>/);
  assert.doesNotMatch(app, /AccountBootstrapCompletion/);
  assert.match(accountProvider, /createPatternlyApiClient\(\{ allowLocalHttpForSimulator:/);
  assert.doesNotMatch(accountProvider, /accountDataProtocolMode|protocolVersion|contentIdentitySchema/u);
});

test("the five ready profile preparation paths publish one opaque attempt handoff to the content gate", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const bootstrap = readFileSync("src/application/bootstrap/accountBootstrap.ts", "utf8");
  const app = readFileSync("src/RegularApplicationRoot.tsx", "utf8");
  const gate = readFileSync("src/content/application/ContentPreparationGate.tsx", "utf8");
  assert.equal((provider + bootstrap).match(/handoffToken: profilePreparationHandoffRef\.current!\.begin\(\)/gu)?.length, 3);
  assert.equal((provider + bootstrap).match(/attempt\.handoffReady = true;\s*(?:setState|publish)\(\{ kind: "profilePreparing"/gu)?.length, 5);
  assert.match(provider, /state\.kind === "profilePreparing"[\s\S]*?currentProfilePreparation\?\.handoffReady[\s\S]*?currentProfilePreparation\.profile\.id === state\.profile\.id[\s\S]*?currentProfilePreparation\.handoffToken/u);
  assert.match(app, /handoffToken=\{profilePreparationHandoffToken\}/u);
  assert.match(gate, /if \(handoffToken\) lastHandoffTokenRef\.current = handoffToken/u);
  assert.match(gate, /const activeHandoffToken = lastHandoffTokenRef\.current/u);
  assert.match(gate, /completeAccountPreparationRef\.current = completeAccountPreparation/u);
  assert.doesNotMatch(gate, /\[activeHandoffToken, bootstrapRevision, completeAccountPreparation/u);
});

test("account finalization coordinator shares one in-flight and completed result per generation", async () => {
  let calls = 0;
  const published: string[] = [];
  const coordinator = createAccountSessionCoordinator<string>((_token, value) => { published.push(value); });
  const token = coordinator.begin("account-a");
  const operation = async () => {
    calls += 1;
    await Promise.resolve();
    return "finalized";
  };
  const first = coordinator.run(token, operation);
  const second = coordinator.run(token, operation);
  assert.deepEqual(await Promise.all([first, second]), ["finalized", "finalized"]);
  assert.equal(calls, 1);
  assert.deepEqual(published, ["finalized"]);
  assert.equal(await coordinator.run(coordinator.begin("account-a"), operation), "finalized");
  assert.equal(calls, 1);
});

test("account finalization coordinator drops late results after invalidation and disposal", async () => {
  let release: ((value: string) => void) | undefined;
  const published: string[] = [];
  const coordinator = createAccountSessionCoordinator<string>((_token, value) => { published.push(value); });
  const token = coordinator.begin("account-a");
  const pending = coordinator.run(token, () => new Promise<string>((resolve) => { release = resolve; }));
  await Promise.resolve();
  coordinator.invalidate();
  release?.("stale");
  assert.equal(await pending, "stale");
  assert.deepEqual(published, []);
  coordinator.dispose();
  const disposedToken = coordinator.begin("account-b");
  await assert.rejects(coordinator.run(disposedToken, async () => "disposed"), /account_session_generation_stale/u);
});

test("the production coordinator does not publish a stale-UID finalization result", async () => {
  const publishedStates: string[] = [];
  const coordinator = createAccountSessionCoordinator<Readonly<{ result: string; state?: string }>>((_token, outcome) => {
    if (outcome.state) publishedStates.push(outcome.state);
  });
  const token = coordinator.begin("account-a");
  let authUid: string | null = "account-a";
  let release!: () => void;
  let entered!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const arrived = new Promise<void>((resolve) => { entered = resolve; });
  const pending = coordinator.run(token, () => executeAccountFinalization({
    options: accountFinalizationPolicies.verification<typeof token, string>(),
    barrier: null,
    canContinue: () => coordinator.isCurrent(token) && authUid === token.uid,
    staleResult: () => ({ result: "revoked" }),
    proveIdentity: async () => { entered(); await gate; return { kind: "continue", value: "proof" }; },
    selectAccountProfile: async () => ({ kind: "continue", value: undefined }),
    verifyAccountIdentity: async () => ({ kind: "continue", value: "binding" }),
    loadAccountData: async () => ({ kind: "continue", value: "synced" }),
    shouldReconcileReminders: () => false,
    reconcileReminders: async () => undefined,
    finish: () => ({ result: "success", state: "authenticated" }),
  }));
  await arrived;
  authUid = "account-b";
  release();
  assert.deepEqual(await pending, { result: "revoked" });
  assert.deepEqual(publishedStates, [], "the real coordinator callback sees no stale state to publish");
});

test("read-only generation capture cannot reactivate a session during sign-out", () => {
  const coordinator = createAccountSessionCoordinator<string>(() => undefined);
  const first = coordinator.begin("account-a");
  assert.deepEqual(coordinator.current("account-a"), first);
  assert.equal(coordinator.current("account-b"), null);
  coordinator.invalidate();
  assert.equal(coordinator.current("account-a"), null);
  assert.equal(coordinator.isCurrent(first), false);
});

test("account restore has a bounded initialization recovery path", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  assert.equal(AUTH_INITIALIZATION_TIMEOUT_MS, 15_000);
  assert.match(provider, /reason: "auth_restore_timeout"/);
  assert.match(provider, /retrySessionRestore/);
  const timeout = provider.slice(provider.indexOf("initializationTimeout = setTimeout(() => {"), provider.indexOf("}, AUTH_INITIALIZATION_TIMEOUT_MS);"));
  assert.match(timeout, /if \(!live \|\| observerResolved\) return;/);
  assert.doesNotMatch(timeout, /detachObserver\(\)|unsubscribe/);
  assert.match(timeout, /setState\(\{ kind: "unavailable", reason: "auth_restore_timeout" \}\)/);
  const observer = provider.slice(provider.indexOf("unsubscribe = configuredAuth.onUserChanged((restoredUser) => {"));
  assert.match(observer, /if \(!live \|\| observerDetached\) return;/);
  assert.match(observer, /if \(!live \|\| observerDetached \|\| eventRevision !== authObserverRevision\) return;/);
  assert.match(observer, /const user = configuredAuth\.getSnapshot\(\);/);
  assert.match(observer, /return \(\) => \{[\s\S]*?live = false;[\s\S]*?detachObserver\(\);/);
  assert.doesNotMatch(provider, /auth\.signOut\(\);[\s\S]*?auth_restore_timeout/);
});

test("restore Retry synchronously fences delivered and in-flight callbacks before effect cleanup", async () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const detach = provider.slice(provider.indexOf("const detachObserver = () => {"), provider.indexOf("    detachAuthObserverRef.current = detachObserver;"));
  const retry = provider.match(/const retrySessionRestore = useCallback\((\(\) => \{[\s\S]*?\n  \}), \[/)?.[1];
  const initialGuard = provider.match(/if \(!live \|\| observerDetached\) return;/)?.[0];
  const resumedGuard = provider.match(/if \(!live \|\| observerDetached \|\| eventRevision !== authObserverRevision\) return;/)?.[0];
  assert.ok(retry && initialGuard && resumedGuard);
  // Execute the production detach/retry bodies and callback eligibility guards.
  // The deferred barrier models identity preparation, not Firebase SDK timing.
  for (const alreadyWaiting of [false, true]) {
    let resolveBarrier!: () => void;
    const effects: string[] = [];
    const scope = {
      live: true, authObserverRevision: 1, eventRevision: 1,
      providerCancellationUidRef: { current: null }, observerBlockedUidRef: { current: null },
      detachAuthObserverRef: { current: null as null | (() => void) },
      initializationTimeout: undefined, unsubscribe: () => effects.push("unsubscribe"),
      clearTimeout: () => effects.push("clearTimeout"),
      sessionCoordinator: { invalidate: () => effects.push("invalidate") },
      revokeDeletionAuthorization: () => effects.push("revoke"),
      setState: () => effects.push("state"), setAuthInitializationRevision: () => effects.push("revision"),
      barrier: new Promise<void>((resolve) => { resolveBarrier = resolve; }),
      effects,
    };
    const owner = new Function("scope", `with (scope) {
      let observerDetached = false;
      ${detach}
      detachAuthObserverRef.current = detachObserver;
      return { retry: ${retry}, cleanup: detachObserver, deliver: async () => {
        ${initialGuard}
        effects.push("identity");
        await barrier;
        ${resumedGuard}
        effects.push("profile");
      }};
    }`)(scope) as { retry: () => void; cleanup: () => void; deliver: () => Promise<void> };
    const pending = alreadyWaiting ? owner.deliver() : undefined;
    owner.retry();
    assert.ok(effects.indexOf("unsubscribe") < effects.indexOf("invalidate"));
    const delivered = pending ?? owner.deliver();
    resolveBarrier();
    await delivered;
    assert.equal(effects.filter((effect) => effect === "identity").length, alreadyWaiting ? 1 : 0);
    assert.equal(effects.includes("profile"), false);
    const newerDetach = () => undefined;
    scope.detachAuthObserverRef.current = newerDetach;
    owner.cleanup();
    assert.equal(scope.detachAuthObserverRef.current, newerDetach, "old cleanup cannot detach a replacement owner");
    assert.equal(effects.filter((effect) => effect === "unsubscribe").length, 1);
  }
});

test("App Check has an explicit unavailable state and never fabricates a token", async () => {
  configurePatternlyAppCheckTokenProvider(null);
  assert.equal(await getPatternlyAppCheckToken(), null);
  configurePatternlyAppCheckTokenProvider(async () => { throw new Error("private native provider failure"); });
  assert.equal(await getPatternlyAppCheckToken(), null);
});

test("account failures expose explicit provider, network, expiry, and revoked-session states", () => {
  assert.equal(classifyAccountFailure({ code: "auth/invalid-email", message: "private provider detail" }), "invalidEmail");
  assert.equal(classifyAccountFailure({ code: "auth/argument-error", message: "private provider detail" }), "invalid");
  assert.equal(classifyAccountFailure({ code: "auth/invalid-action-code", message: "private provider detail" }), "invalid");
  assert.equal(classifyAccountFailure({ code: "auth/weak-password", message: "private provider detail" }), "weakPassword");
  assert.equal(classifyAccountFailure({ code: "auth/email-already-in-use", message: "private provider detail" }), "invalidCredential");
  assert.equal(classifyAccountFailure({ code: "auth/too-many-requests", message: "private provider detail" }), "rateLimited");
  assert.equal(classifyAccountFailure({ code: "auth/network-request-failed", message: "private provider detail" }), "offline");
  assert.equal(classifyAccountFailure({ code: "auth/expired-action-code", message: "private provider detail" }), "expiredAction");
  assert.equal(classifyAccountFailure({ code: "auth/user-token-expired", message: "private provider detail" }), "revokedSession");
  assert.equal(classifyAccountFailure({ code: "auth/operation-not-allowed", message: "private provider detail" }), "providerUnavailable");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("transport_failed")), "offline");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("request_timeout")), "backendUnavailable");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 429)), "rateLimited");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 429, "recovery_rate_limited")), "rateLimited");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 401, "authentication_required")), "revokedSession");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 401, "recent_reauthentication_required")), "reauthenticationRequired");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 401, "reauthentication_required")), "reauthenticationRequired");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 401, "authorization_generation_stale")), "reauthenticationRequired");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 409, "authorization_generation_stale")), "reauthenticationRequired");
  const staleGenerationFailure = classifyAccountFailure(new PatternlyApiClientError("server_error", 401, "authorization_generation_stale"));
  assert.deepEqual(accountSessionFailureState(staleGenerationFailure, { email: "learner@example.com", emailVerified: true, providers: ["password"], uid: "firebase-uid" }), {
    kind: "reauthenticationRequired",
    user: { email: "learner@example.com", emailVerified: true, providers: ["password"], uid: "firebase-uid" },
  });
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 503)), "backendUnavailable");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 409, "purchase_attempt_active")), "conflict");
  assert.equal(classifyAccountFailure({ code: "auth/command-in-flight" }), "conflict");
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/user-not-found", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/invalid-credential", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/too-many-requests", message: "private provider detail" }), false);
});

test("only authoritative identity-proof errors tombstone a binding; App Check and local SDK metadata failures do not", () => {
  for (const code of ["account_deleted", "authentication_required", "authorization_generation_invalid", "authorization_generation_required", "authorization_generation_stale", "firebase_authorization_generation_invalid"]) {
    assert.equal(isAuthoritativeIdentityProofDenial(new PatternlyApiClientError("server_error", 401, code)), true, code);
  }
  assert.equal(isAuthoritativeIdentityProofDenial(new PatternlyApiClientError("server_error", 404, "user_not_found")), true);
  assert.equal(isAuthoritativeIdentityProofDenial(new PatternlyApiClientError("server_error", 404, "account_not_found")), true);
  for (const code of ["app_check_required", "app_check_invalid", "recent_reauthentication_required", "reauthentication_required", "account_not_found"]) {
    assert.equal(isAuthoritativeIdentityProofDenial(new PatternlyApiClientError("server_error", 401, code)), false, code);
  }
  assert.equal(isAuthoritativeIdentityProofDenial(new PatternlyApiClientError("server_error", 503, "app_check_not_configured")), false);
  assert.equal(isAuthoritativeIdentityProofDenial(new PatternlyApiClientError("server_error", 401, "account_not_found")), false);
  for (const code of ["auth/invalid-user-token", "auth/user-disabled", "auth/user-not-found", "auth/user-token-expired"]) {
    assert.equal(isAuthoritativeIdentityProofDenial({ code }), true, code);
  }
  assert.equal(isAuthoritativeIdentityProofDenial({ code: "auth/authorization-generation-invalid" }), false);
  assert.equal(isAuthoritativeIdentityProofDenial(new PatternlyApiClientError("transport_failed")), false);

  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const bootstrap = readFileSync("src/application/bootstrap/accountBootstrap.ts", "utf8");
  assert.match(provider, /async function invalidateAccountBindingAfterIdentityDenial[\s\S]*?readActiveAccountIdentityBinding\(lease\)[\s\S]*?readPreparedAccountIdentityBinding\(input\.profile\.id\)[\s\S]*?binding\.binding\.firebaseUid !== input\.uid[\s\S]*?invalidateActiveAccountIdentityBinding\(\{ lease[\s\S]*?invalidatePreparedAccountIdentityBinding\(\{ profileId: input\.profile\.id/u);
  assert.match(bootstrap, /getMe: async \(\) => \{[\s\S]*?getMeWithExchangedSession[\s\S]*?revokeBindingForAuthoritativeIdentityDenial\(error/u);
  assert.match(bootstrap, /const identityProof = await runAccountIdentityProof\([\s\S]*?request: \(\) => getMeWithExchangedSession[\s\S]*?revokeDeniedBinding: async \(error\) => \{ await revokeBindingForAuthoritativeIdentityDenial\(error/u);
  assert.match(provider, /const identityDenied = isAuthoritativeIdentityProofDenial\(error\)[\s\S]*?revokeBindingForAuthoritativeIdentityDenial\(error[\s\S]*?verificationRevision: current\.bindingRevision[\s\S]*?accountSessionFailureState\(failure === "reauthenticationRequired" \? failure : "revokedSession"/u);
});

test("prepared-profile and explicit sign-in retain the shared identity-proof barrier", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const bootstrap = readFileSync("src/application/bootstrap/accountBootstrap.ts", "utf8");
  const preparation = bootstrap.slice(bootstrap.indexOf("export async function prepareAuthenticatedAccountBootstrap"), bootstrap.indexOf("export function completeAccountBootstrap"));
  assert.ok(preparation.indexOf("beginIdentityProofBarrier(auth, user, generation, true)") < preparation.indexOf("const pendingRevoke = findPendingSessionRevocation"), "prepared identity proof remains ahead of the durable session-revoke gate");
  const explicitFinalize = provider.slice(provider.indexOf("const finalizeExplicitAuthentication"), provider.indexOf("// Firebase publishes a new credential"));
  assert.match(explicitFinalize, /await admitAuthenticatedBootstrap\(auth, api, user/u);
  assert.doesNotMatch(explicitFinalize.slice(0, explicitFinalize.indexOf("await admitAuthenticatedBootstrap")), /return \{ kind: "success"/u, "same-UID sign-in must not bypass the fresh durable revoke drain");
  assert.match(provider, /const beginIdentityProofBarrier = useCallback/u);
  assert.match(provider, /const resolveIdentityProofBarrier = useCallback/u);
});
test("cold account startup admits local attestation unavailability without admitting server or identity denials", () => {
  for (const error of [new PatternlyApiClientError("request_timeout"), new PatternlyApiClientError("transport_failed"), new PatternlyApiClientError("app_check_unavailable"), { code: "auth/network-request-failed" }]) {
    assert.equal(isLocalAccountStartupUnavailable(error), true);
  }
  for (const error of [
    new PatternlyApiClientError("server_error", 503),
    new PatternlyApiClientError("server_error", 503, "app_check_not_configured"),
    ...["app_check_invalid", "app_check_required", "app_check_not_configured", "account_deleted", "authentication_required"].map((code) => new PatternlyApiClientError("server_error", 401, code)),
    new PatternlyApiClientError("server_error", 404, "account_not_found"),
    new PatternlyApiClientError("app_check_unavailable", 503),
    new PatternlyApiClientError("request_timeout", 429),
    new PatternlyApiClientError("authentication_required"),
    new PatternlyApiClientError("invalid_response"),
    { code: "auth/user-token-expired" },
    new Error("unknown failure"),
  ]) assert.equal(isLocalAccountStartupUnavailable(error), false);
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const bootstrap = readFileSync("src/application/bootstrap/accountBootstrap.ts", "utf8");
  assert.match(bootstrap, /if \(ownsPreparation && isLocalAccountStartupUnavailable\(error\) && canContinue\(\)/u);
});

for (const failureCode of ["request_timeout", "app_check_unavailable"] as const) {
test(`the production identity-proof boundary retains exact localOffline on ${failureCode} and admits a later verified response`, async () => {
  assert.equal(isTemporaryIdentityProofUnavailable(new PatternlyApiClientError("request_timeout")), true);
  assert.equal(isTemporaryIdentityProofUnavailable(new PatternlyApiClientError("transport_failed")), true);
  assert.equal(isTemporaryIdentityProofUnavailable(new PatternlyApiClientError("server_error", 503)), true);
  assert.equal(isTemporaryIdentityProofUnavailable(new PatternlyApiClientError("server_error", 401, "app_check_invalid")), false);
  assert.equal(isTemporaryIdentityProofUnavailable(new PatternlyApiClientError("server_error", 404, "account_not_found")), false);

  const accountId = "offline-proof-account";
  const uid = "offline-proof-firebase-uid";
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const base = new MemoryKeyValueStorage();
  const controlValues = new Map<string, string>();
  const control: StorageManifestStore = {
    async get(key) { return controlValues.get(key) ?? null; },
    async set(key, value) { controlValues.set(key, value); },
    async remove(key) { controlValues.delete(key); },
  };
  let nextIdentity = 300;
  const identity = { async create() { return { installationId: uuid(nextIdentity++), localDatasetId: uuid(nextIdentity++) }; } };
  let router = await openProfileStorageRouter(base, control, { identity });
  const profile = await router.selectAccount(accountId);
  router = await openProfileStorageRouter(base, control);
  const binding = await router.writeVerifiedSelectedAccountIdentityBinding({ firebaseUid: uid, accountId, canContinue: () => true });
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  try {
    await prepareProfileStorage();
    activatePreparedProfile(profile.id, profile.kind);
    const lease = captureActiveProfileStorageLease();
    assert.ok(lease);
    const user = { uid, email: "offline@example.test", emailVerified: true, providers: ["password"] as const };
    let currentState: AccountState;
    const coordinator = createAccountSessionCoordinator<Readonly<{ result: Readonly<{ kind: "failure"; failure: string }>; state?: AccountState }>>((_token, outcome) => {
      if (outcome.state) currentState = outcome.state;
    });
    const generation = coordinator.begin(uid);
    const accountData = {
      status: "synced" as const, preview: null, lastSuccessfulSyncAt: "2026-10-08T00:00:00.000Z",
      pendingMutationCount: 2, blockingConflictCode: null, lastFailureCode: null,
      activeSessionBlocked: false, guestAdoptionChoice: "discard" as const,
    };
    currentState = {
      kind: "localOffline", accountId, accountData, bindingRevision: binding.verificationRevision,
      generation, profile: lease.profile, profileLease: lease, user,
    };
    let requests = 0;
    const failed = await coordinator.run(generation, async () => {
      const proof = await runAccountIdentityProof<Readonly<{ user: Readonly<{ id: string }> }> >({
        request: async () => { requests += 1; throw new PatternlyApiClientError(failureCode); },
        user, generation, getCurrentState: () => currentState, getCurrentSdkUid: () => uid,
        beginBarrier: async () => {
          const receipt = await beginAccountIdentityProofBarrier({ profileId: profile.id, accountId, firebaseUid: uid, verificationRevision: binding.verificationRevision, lease, canContinue: () => coordinator.isCurrent(generation) });
          return receipt ? { receipt, lease, profile, previousBinding: binding, requestUid: uid, generation } : null;
        },
        resolveBarrier: (barrier) => resolveAccountIdentityProofBarrier({ receipt: barrier.receipt, lease, canContinue: () => coordinator.isCurrent(generation) }),
        matchesProofSubject: (value, barrier) => value.user.id === barrier.previousBinding.accountId && barrier.previousBinding.firebaseUid === uid,
        isCurrentGeneration: coordinator.isCurrent, isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
        readBinding: readActiveAccountIdentityBinding,
        revokeDeniedBinding: async (error) => { await revokeBindingForAuthoritativeIdentityDenial(error, { profile, uid, lease, verificationRevision: binding.verificationRevision, canContinue: () => coordinator.isCurrent(generation) }); },
      });
      assert.equal(proof.kind, "failed");
      if (proof.kind === "failed") return { result: { kind: "failure", failure: proof.failure }, state: proof.state };
      return { result: { kind: "failure", failure: "test_unexpected_success" }, state: currentState };
    });
    assert.deepEqual(failed.result, { kind: "failure", failure: "backendUnavailable" });
    assert.equal(requests, 1);
    assert.equal(currentState.kind, "localOffline");
    if (currentState.kind === "localOffline") {
      assert.equal(currentState.accountData, accountData);
      assert.equal(currentState.profileLease, lease);
      assert.equal(currentState.bindingRevision, binding.verificationRevision + 2);
      assert.equal(currentState.generation, generation);
    }
    const restoredBinding = await readActiveAccountIdentityBinding(lease);
    assert.equal(restoredBinding.kind, "verified");
    if (restoredBinding.kind === "verified") {
      assert.equal(restoredBinding.binding.firebaseUid, uid);
      assert.equal(restoredBinding.binding.accountId, accountId);
      assert.equal(restoredBinding.binding.verificationRevision, binding.verificationRevision + 2);
    }

    const firstProbe = claimLocalOfflineInitialRefresh({ stateKind: currentState.kind, uid, attemptedUid: null });
    assert.equal(firstProbe.shouldRefresh, true);
    const afterFailure = claimLocalOfflineInitialRefresh({ stateKind: currentState.kind, uid, attemptedUid: firstProbe.attemptedUid });
    assert.equal(afterFailure.shouldRefresh, false, "same local actor must not auto-loop another initial probe after timeout");

    const me = { user: { id: accountId, email: user.email!, emailVerified: true, providers: ["password"] } } as const;
    const recovered = await runAccountIdentityProof({
      request: async () => { requests += 1; return me; },
      user, generation, getCurrentState: () => currentState, getCurrentSdkUid: () => uid,
      beginBarrier: async () => null,
      barrierAlreadyCaptured: true,
      resolveBarrier: async () => { throw new Error("unexpected barrier restore"); },
      matchesProofSubject: () => false,
      isCurrentGeneration: coordinator.isCurrent, isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
      readBinding: readActiveAccountIdentityBinding,
      revokeDeniedBinding: async (error) => { await revokeBindingForAuthoritativeIdentityDenial(error, { profile, uid, lease, verificationRevision: binding.verificationRevision, canContinue: () => coordinator.isCurrent(generation) }); },
    });
    assert.deepEqual(recovered, { kind: "verified", value: me, barrier: null });
    assert.equal(requests, 2);
    const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
    assert.match(provider, /proveIdentity: async \(barrier\) => \{[\s\S]*?runAccountIdentityProof/u);
    assert.match(provider, /finish: \(response, _verified, accountData\) => \{[\s\S]*?kind: "authenticated", backendUser: response\.user/u);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

}

test("a lost tombstone readback prevents every identity proof call and leaves the cold binding invalidated", async () => {
  const accountId = "identity-barrier-readback-account";
  const uid = "identity-barrier-readback-uid";
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const base = new MemoryKeyValueStorage();
  const controlValues = new Map<string, string>();
  const getCounts = new Map<string, number>();
  let failNextSetReadback = false;
  let failReadKey: string | null = null;
  let failReadOccurrence = 0;
  const control: StorageManifestStore = {
    async get(key) {
      const occurrence = (getCounts.get(key) ?? 0) + 1;
      getCounts.set(key, occurrence);
      if (key === failReadKey && occurrence === failReadOccurrence) {
        failReadKey = null;
        throw new Error("injected_control_readback_failure");
      }
      return controlValues.get(key) ?? null;
    },
    async set(key, value) {
      controlValues.set(key, value);
      if (failNextSetReadback) {
        failNextSetReadback = false;
        failReadKey = key;
        failReadOccurrence = (getCounts.get(key) ?? 0) + 1;
      }
    },
    async remove(key) { controlValues.delete(key); },
  };
  let nextIdentity = 500;
  const identity = { async create() { return { installationId: uuid(nextIdentity++), localDatasetId: uuid(nextIdentity++) }; } };
  let router = await openProfileStorageRouter(base, control, { identity });
  const profile = await router.selectAccount(accountId);
  router = await openProfileStorageRouter(base, control);
  const binding = await router.writeVerifiedSelectedAccountIdentityBinding({ firebaseUid: uid, accountId, canContinue: () => true });
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  try {
    await prepareProfileStorage();
    activatePreparedProfile(profile.id, profile.kind);
    const lease = captureActiveProfileStorageLease();
    assert.ok(lease);
    const user = { uid, email: "barrier@example.test", emailVerified: true, providers: ["password"] as const };
    const coordinator = createAccountSessionCoordinator<Readonly<{ result: Readonly<{ kind: "failure"; failure: string }>; state?: AccountState }>>(() => undefined);
    const generation = coordinator.begin(uid);
    const accountData = { status: "synced" as const, preview: null, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, activeSessionBlocked: false, guestAdoptionChoice: "discard" as const };
    const currentState: AccountState = { kind: "localOffline", accountId, accountData, bindingRevision: binding.verificationRevision, generation, profile, profileLease: lease, user };
    let proofCalls = 0;
    failNextSetReadback = true;
    const result = await runAccountIdentityProof({
      request: async () => { proofCalls += 1; throw new PatternlyApiClientError("transport_failed"); },
      user, generation, barrierAlreadyCaptured: false,
      beginBarrier: async () => {
        const receipt = await beginAccountIdentityProofBarrier({ profileId: profile.id, accountId, firebaseUid: uid, verificationRevision: binding.verificationRevision, lease, canContinue: () => coordinator.isCurrent(generation) });
        return receipt ? { receipt, lease, profile, previousBinding: binding, requestUid: uid, generation } : null;
      },
      resolveBarrier: (barrier) => resolveAccountIdentityProofBarrier({ receipt: barrier.receipt, lease, canContinue: () => coordinator.isCurrent(generation) }),
      matchesProofSubject: () => true, getCurrentState: () => currentState, getCurrentSdkUid: () => uid,
      isCurrentGeneration: coordinator.isCurrent, isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
      readBinding: readActiveAccountIdentityBinding,
      revokeDeniedBinding: async () => undefined,
    });
    assert.equal(result.kind, "failed");
    assert.equal(proofCalls, 0, "the /me or SDK proof callback never runs until the durable tombstone readback succeeds");
    assert.deepEqual(await readActiveAccountIdentityBinding(lease), { kind: "invalidated" });
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("cold identity proof and reconnect revocation both persist the exact binding tombstone across router reopen", async () => {
  const accountId = "identity-proof-account";
  const uid = "identity-proof-firebase-uid";
  const denied = new PatternlyApiClientError("server_error", 404, "account_not_found");
  const appCheckDenied = new PatternlyApiClientError("server_error", 401, "app_check_invalid");
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

  async function exercise(scope: "prepared" | "active"): Promise<void> {
    const base = new MemoryKeyValueStorage();
    const controlValues = new Map<string, string>();
    const control: StorageManifestStore = {
      async get(key) { return controlValues.get(key) ?? null; },
      async set(key, value) { controlValues.set(key, value); },
      async remove(key) { controlValues.delete(key); },
    };
    let nextIdentity = 100;
    const identity = { async create() { return { installationId: uuid(nextIdentity++), localDatasetId: uuid(nextIdentity++) }; } };
    let router = await openProfileStorageRouter(base, control, { identity });
    const selected = await router.selectAccount(accountId);
    router = await openProfileStorageRouter(base, control);
    const binding = await router.writeVerifiedSelectedAccountIdentityBinding({ firebaseUid: uid, accountId, canContinue: () => true });
    const profile = router.profile;
    setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
    try {
      await prepareProfileStorage();
      const lease = scope === "active" ? (activatePreparedProfile(profile.id, profile.kind), captureActiveProfileStorageLease()) : null;
      assert.ok(scope === "prepared" || (lease && lease.profile.id === selected.id));
      const input = {
        profile,
        uid,
        ...(lease ? { lease, verificationRevision: binding.verificationRevision } : {}),
        canContinue: () => true,
      };
      const readBinding = () => lease
        ? readActiveAccountIdentityBinding(lease)
        : readPreparedAccountIdentityBinding(profile.id);
      assert.equal(await revokeBindingForAuthoritativeIdentityDenial(appCheckDenied, input), false);
      assert.deepEqual(await readBinding(), { kind: "verified", binding });
      assert.equal(await revokeBindingForAuthoritativeIdentityDenial(denied, input), true);
      assert.deepEqual(await readBinding(), { kind: "invalidated" });

      setProfileStoragePreparationFactoryForTests(null);
      setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
      await prepareProfileStorage();
      assert.deepEqual(await readPreparedAccountIdentityBinding(profile.id), { kind: "invalidated" }, `${scope}: offline fallback must remain denied after reopening storage`);
    } finally {
      closeActiveProfileStorage();
      setProfileStoragePreparationFactoryForTests(null);
    }
  }

  await exercise("prepared");
  await exercise("active");
  const accountDataService = readFileSync("src/application/account/accountDataService.ts", "utf8");
  assert.doesNotMatch(accountDataService, /revokeBindingForAuthoritativeIdentityDenial|isAuthoritativeIdentityProofDenial/u);
});

test("cold account_not_found clears persisted Firebase auth or exposes a truthful sign-out retry", async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const user = { uid: "cold-uid", email: "user@example.com", emailVerified: true, providers: [] } as any;
  const states: AccountState[] = [];
  let current: typeof user | null = user;
  await completeUnrecognizedPersistedAuthSignOut({ getSnapshot: () => current, signOut: async () => { current = null; } }, user, (state) => states.push(state), () => true);
  assert.deepEqual(states, [{ kind: "signedOut" }]);
  current = user;
  states.length = 0;
  await completeUnrecognizedPersistedAuthSignOut({ getSnapshot: () => current, signOut: async () => { throw new Error("offline"); } }, user, (state) => states.push(state), () => true);
  assert.deepEqual(states, [{ kind: "signOutPending", user }]);
});

test("privacy requests expose App Check failures as unavailable", () => {
  assert.equal(classifyPrivacyRequestFailure(new PatternlyApiClientError("app_check_unavailable")), "appCheckUnavailable");
  assert.equal(classifyPrivacyRequestFailure(new PatternlyApiClientError("server_error", 401, "app_check_required")), "appCheckUnavailable");
  assert.equal(classifyPrivacyRequestFailure(new PatternlyApiClientError("server_error", 401, "app_check_invalid")), "appCheckUnavailable");
  assert.equal(classifyPrivacyRequestFailure(new PatternlyApiClientError("server_error", 503, "app_check_not_configured")), "appCheckUnavailable");
  assert.equal(classifyPrivacyRequestFailure(new PatternlyApiClientError("server_error", 401, "authentication_required")), "authenticationRequired");
});


test("expired-revoke presentation belongs only to the exact durable UID/ID and explicit restart", async () => {
  const { SessionRevocationExpiredError } = await import("./pendingSessionRevocation");
  const user = { uid: "uid-expired", email: null, emailVerified: true, providers: ["password"] as const };
  const old = { uid: user.uid, operationId: "00000000-0000-4000-8000-000000000001" };
  const other = { uid: user.uid, operationId: "00000000-0000-4000-8000-000000000002" };
  const snapshot = { version: 2 as const, blocked: old, pending: [other, old], completed: [] };
  assert.deepEqual(pendingRevokeFailureState(user, new SessionRevocationExpiredError(old), snapshot), {
    kind: "signOutPending", user, operationId: old.operationId, remoteRevokeExpired: true,
  });
  for (const error of [new Error("session_revocation_operation_expired"), new PatternlyApiClientError("server_error", 409, "session_revocation_operation_invalid"), new SessionRevocationExpiredError({ ...old, uid: "foreign" })]) {
    assert.equal(pendingRevokeFailureState(user, error, snapshot).remoteRevokeExpired, undefined);
  }
  assert.equal(pendingRevokeFailureState(user, new SessionRevocationExpiredError(old), { ...snapshot, blocked: null, pending: [other] }).remoteRevokeExpired, undefined);
  const provider = readFileSync(new URL("./AccountSessionProvider.tsx", import.meta.url), "utf8");
  const restart = provider.slice(provider.indexOf("restartExpiredSessionRevocation: () => runAuthMutationWithAuth"), provider.indexOf("signOut: () => runAuthMutationWithAuth"));
  assert.match(restart, /current\.provisional[\s\S]*?!current\.remoteRevokeExpired[\s\S]*?current\.user\.uid !== user\.uid/u);
  assert.match(restart, /await logoutControl\.replaceExpiredPendingRevoke[\s\S]*?logoutControlSnapshotRef\.current = snapshot[\s\S]*?return finalizeExplicitAuthentication/u);
  assert.match(restart, /catch[\s\S]*?if \(!canContinue\(\)\)[\s\S]*?retrySessionRestore\(\)/u);
  const screen = readFileSync(new URL("../../features/account/AccountEntryScreen.tsx", import.meta.url), "utf8");
  assert.match(screen, /account\.state\.remoteRevokeExpired[\s\S]*?text\.restartSessionRevocation[\s\S]*?account\.restartExpiredSessionRevocation\(\)/u);
  for (const locale of ["en", "pl", "de", "es", "fr", "it", "et"]) {
    const copy = JSON.parse(readFileSync(new URL(`../../locales/${locale}/account.json`, import.meta.url), "utf8"));
    for (const key of ["sessionRevocationExpired", "sessionRevocationExpiredDescription", "restartSessionRevocation"]) assert.ok(copy[key].length > 5);
  }
});


test("verified closed-profile entry and failed-login retry await bootstrap while identity-barrier refresh keeps its policy", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const start = provider.indexOf("refreshVerification: () => runSensitiveWithAuth");
  const refresh = provider.slice(start, provider.indexOf("refreshAccountIdentity: () =>", start));
  const verifiedPlan = refresh.indexOf('const plan = planPasswordVerificationCommand("refresh", runtimeMode, user)');
  const verifiedEntry = refresh.indexOf('if ((current.kind === "verificationPending" || current.kind === "backendUnavailable") && proofBarrier === null && getActiveStorageProfileOrNull() === null)');
  const legacyRefresh = refresh.indexOf("return finalizeCurrent(auth, api, user, accountFinalizationPolicies.passwordRefresh");
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const retryScreen = screen.slice(screen.indexOf('if (account.state.kind === "backendUnavailable")'));
  assert.match(retryScreen, /onPress=\{\(\) =>\s*void account\.refreshVerification\(\)\.then\(setResult\(setFeedback\)\)\s*\}[\s\S]*?testID="account-retry-backend"/u);
  assert.ok(verifiedPlan >= 0 && verifiedEntry > verifiedPlan && legacyRefresh > verifiedEntry);
  assert.match(refresh.slice(verifiedEntry, legacyRefresh), /return finalizeExplicitAuthentication\(auth, api, user\)/u);
  const explicit = provider.slice(provider.indexOf("const finalizeExplicitAuthentication ="), provider.indexOf("const completeExplicitRecoveryAccountTransition ="));
  assert.match(explicit, /await admitAuthenticatedBootstrap[\s\S]*return attempt\.completion/u);
});
