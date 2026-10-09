import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { accountSessionFailureState, AUTH_INITIALIZATION_TIMEOUT_MS, canContinueAccountIdentityRefresh, classifyAccountFailure, classifyPrivacyRequestFailure, completeUnrecognizedPersistedAuthSignOut, createAccountSessionCoordinator, isAuthoritativeIdentityProofDenial, isNonEnumeratingRecoveryError, isTemporaryIdentityProofUnavailable, planPasswordVerificationCommand, publishRefreshedAuthenticatedState, recoveryOperationTransitionIsAllowed, requiresPasswordEmailVerification, revokeBindingForAuthoritativeIdentityDenial, runAccountIdentityProof, type AccountIdentityProofBarrierContext, type AccountState } from "./AccountSessionProvider";
import { createSensitiveCommandLane } from "./accountCommandGuards";
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

test("account entry copy makes the destructive choice and code acknowledgement explicit", () => {
  const en = JSON.parse(readFileSync("src/locales/en/account.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/account.json", "utf8")) as Record<string, string>;

  assert.deepEqual(Object.keys(pl).sort(), Object.keys(en).sort());
  assert.equal(en.accountEntryContinue, "Continue");
  assert.match(en.accountDiscardDescription ?? "", /saved only on this device will be removed/u);
  assert.match(en.accountDiscardDescription ?? "", /data already saved to your account/u);
  assert.match(en.recoveryCodesDescription ?? "", /10 single-use codes/u);
  assert.match(en.recoveryCodesSaveRequired ?? "", /before continuing/u);
  assert.equal(en.accountSignedInAs, "Signed in as");
  assert.equal(pl.accountEntryContinue, "Dalej");
  assert.match(pl.accountDiscardDescription ?? "", /zapisane tylko na tym urządzeniu zostaną usunięte/u);
  assert.match(pl.accountDiscardDescription ?? "", /dane zapisane już na koncie/u);
  assert.match(pl.recoveryCodesDescription ?? "", /10 jednorazowych kodów/u);
  assert.equal(pl.accountSignedInAs, "Zalogowano jako");
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
  const adoption = screen.slice(screen.indexOf("function AccountAdoptionScreen"), screen.indexOf("function RecoveryPendingScreen"));
  assert.match(adoption, /runCommand\("signOut", \(\) => account\.signOut\(\), setCommandFeedback\)/u);
  assert.match(adoption, /<Button\s+disabled=\{busyAction !== null \|\| recoveryOperation\.blocksProfilePreparation\}\s+loading=\{busyAction === "signOut"\}\s+onPress=\{signOut\}\s+testID="account-adoption-sign-out"/u);
  assert.match(screen, /<RecoveryOperationPanel[\s\S]*?snapshot=\{recoveryOperation\}/u);
  assert.match(screen, /onConfirmSaved=\{\(\) => runCommand\("recovery", \(\) => account\.confirmRecoveryCodesSaved\(\)/u);
  assert.match(screen, /account\.discardGuestData\(\)/);
  assert.match(screen, /Alert\.alert\(text\.accountDiscardTitle, text\.accountDiscardDescription/);
  assert.match(screen, /style: "destructive", onPress: executeEntry/);
  assert.match(screen, /account\.confirmAdoption\(resolutions, accountData\.preview/);
  assert.match(screen, /goalPlanConflictGroups/);
  assert.match(screen, /account-goal-plan-\$\{group\.trackId\}-keep-guest/);
  assert.match(screen, /account-goal-plan-\$\{group\.trackId\}-keep-account/);
  assert.match(screen, /tCommon\(getTrackDisplay\(group\.trackId\)\.shortTitle\)/);
  assert.doesNotMatch(screen, /testID="account-authenticated"/);
  assert.doesNotMatch(screen, /testID="account-adoption-confirm"/);
  assert.doesNotMatch(screen, /text\.(?:preserve|upload|restore|deduplicated|decisions|keepGuest\b|keepAccount\b|confirmAdoption\b)/);
  assert.match(provider, /const \[recoveryOperation, setRecoveryOperation\] = useState<RecoveryOperationSnapshot>/u);
  assert.match(provider, /recoveryCoordinator\.subscribe\(\(snapshot\) => \{[\s\S]*?setRecoveryOperation\(recoveryIssuePublicationGateRef\.current\.publish\(snapshot\)\)/u);
  assert.match(provider, /recoveryOperation,\s*refreshPremiumEntitlement/u);
  assert.match(provider, /confirmRecoveryCodesSaved: \(\) => runSensitiveWithAuth[\s\S]*coordinator\.confirmRecoveryCodesSaved\(\)/u);
  assert.match(provider, /discardGuestData: \(\) => runWithAuth/);
  assert.match(provider, /setGuestAdoptionChoice: \(choice\) => runWithAuth[\s\S]*?await saveGuestAdoptionChoice\(choice\)[\s\S]*?setState\(\{ \.\.\.state, accountData: \{ \.\.\.state\.accountData, guestAdoptionChoice: choice \} \}\)/u);
  assert.match(provider, /currentCoordinator\.startIssue\(\{ firebaseUid: user\.uid, authorizationGeneration \}\)[\s\S]*?acceptRecoveryOperation\(snapshot, \{ kind: "issueStart", firebaseUid: user\.uid, authorizationGeneration \}\)/u);
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

test("current-account ISSUE defer requires an explicit sign-in, canonical session check, and persistent identity fence", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const entry = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const completionStart = provider.indexOf("const completeExplicitRecoveryAccountTransition");
  const completionEnd = provider.indexOf("// Firebase publishes a new credential", completionStart);
  const completion = provider.slice(completionStart, completionEnd);
  const transitionStart = provider.indexOf("continueWithCurrentAccount: () => runSensitiveWithAuth");
  const transitionEnd = provider.indexOf("discardGuestData: () => runWithAuth", transitionStart);
  const transition = provider.slice(transitionStart, transitionEnd);

  assert.ok(completionStart >= 0 && completionEnd > completionStart);
  assert.ok(transitionStart >= 0 && transitionEnd > transitionStart);
  assert.match(completion, /getMeWithExchangedSession/u);
  assert.match(completion, /getAuthorizationGeneration/u);
  assert.match(completion, /coordinator\.deferIssueToIdentity/u);
  assert.match(completion, /deferred\.blocksProfilePreparation/u);
  assert.ok(completion.indexOf("getMeWithExchangedSession") < completion.indexOf("coordinator.deferIssueToIdentity"));
  assert.match(transition, /explicitRecoveryAccountTransitionRef\.current = Object\.freeze/u);
  assert.match(transition, /await auth\.signOut\(\)/u);
  assert.match(transition, /setState\(\{ kind: "signedOut" \}\)/u);
  assert.doesNotMatch(transition, /continueAsGuest|discardGuestData|confirmAdoption/u);
  assert.match(provider, /signIn: \(email, password\)[\s\S]*?completeExplicitRecoveryAccountTransition\(auth, api, user\)[\s\S]*?finalizeExplicitAuthentication\(auth, api, user\)/u);
  assert.match(provider, /pending\.kind === "issue" && pending\.deferredFor && !pending\.blocksProfilePreparation[\s\S]*?coordinator\.reconcilePending\(user \? \{ firebaseUid: user\.uid, authorizationGeneration \} : null\)/u);
  assert.match(entry, /onTransitionStarted=\{\(\) => \{ setRecoveryAccountTransitionRequired\(true\); setMode\("signIn"\); \}\}/u);
  assert.match(entry, /account\.state\.kind === "guestAccessBlocked" \|\| recoveryAccountTransitionRequired \? undefined/u);
  assert.match(entry, /!recoveryAccountTransitionRequired \? <View style=\{\[styles\.authLinks/u);
});

test("account recovery back action follows live navigator history", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");

  assert.match(screen, /import \{ useNavigationState, usePreventRemove \} from "@react-navigation\/native";/u);
  assert.match(screen, /const navigationIndex = useNavigationState\(\(state\) => state\.index\);/u);
  assert.match(screen, /const backAction = mode === "register"[\s\S]*?setMode\("signIn"\)[\s\S]*?navigationIndex > 0[\s\S]*?if \(navigation\.canGoBack\(\)\) navigation\.goBack\(\);/u);
  assert.match(screen, /usePreventRemove\(mode === "register", \(\) => \{[\s\S]*?setMode\("signIn"\)/u);
  assert.doesNotMatch(screen, /navigation\.addListener\("beforeRemove"/u);
  assert.match(screen, /initialMode === "entry"[\s\S]*?initialMode === "register"[\s\S]*?: "entry"/u);
  assert.match(screen, /footer=\{mode === "register" \? undefined/u);
  assert.match(screen, /testID="account-register-back-to-sign-in"/u);
  assert.match(screen, /mode === "register" \? \([\s\S]*?<CredentialsForm[\s\S]*?account-register-submit[\s\S]*?account-register-back-to-sign-in/u);
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
  const pendingPreparation = provider.slice(provider.indexOf("const startAuthenticatedProfilePreparation"), provider.indexOf("const completeProfilePreparation"));
  assert.match(pendingPreparation, /findPendingSessionRevocation\(logoutControlSnapshotRef\.current, user\.uid\)[\s\S]*?finishPendingSignOut\(pendingRevoke\.operationId, "signOutPending", false\)[\s\S]*?findMatchingLocalLogoutBlock/u);
  const authObserver = provider.slice(provider.indexOf('configuredAuth.onUserChanged'), provider.indexOf('useEffect(() => {\n    if (state.kind === "guest"'));
  assert.match(authObserver, /drainPendingSessionRevocations\([\s\S]*?executor: pendingSessionRevocationDrainRef\.current![\s\S]*?generation: generation\.generation[\s\S]*?onSnapshot:[\s\S]*?canContinue\(\)/);
  assert.match(authObserver, /sessionCoordinator\.isCurrent\(generation\) && sessionExchangeUidRef\.current === user\.uid/u);
  assert.match(authObserver, /findMatchingLocalLogoutBlock\(logoutControlSnapshotRef\.current, user\.uid\)/);
  assert.match(authObserver, /if \(matchingLogoutBlock\) \{[\s\S]*?closeActiveProfileStorage\(\);[\s\S]*?setState\(\{ kind: "signOutPending", user \}\);[\s\S]*?return;/);
  assert.match(authObserver, /clearBlockForAuth\(previousObservedUid, logoutBlock\.operationId, canClearLogoutBlock\)/);
  assert.match(authObserver, /const canClearLogoutBlock = \(\) => live && !observerDetached && eventRevision === authObserverRevision && configuredAuth\.getSnapshot\(\) === null/);
  assert.match(provider, /const logoutBlock = logoutControlSnapshotRef\.current\.blocked/);
  const nullAuthBranch = authObserver.slice(authObserver.indexOf("if (!user) {"), authObserver.indexOf("if (rejectedRestoreUid !== null && rejectedRestoreUid !== user.uid)"));
  assert.ok(nullAuthBranch.indexOf("closeProfileStorage: closeActiveProfileStorage") < nullAuthBranch.indexOf("clearBlockForAuth"));
  assert.match(nullAuthBranch, /logoutControlSnapshotRef\.current\.blocked[\s\S]*?clearBlockForAuth\(previousObservedUid, logoutBlock\.operationId, canClearLogoutBlock\)/);
  const explicitFinalize = provider.slice(provider.indexOf("const finalizeExplicitAuthentication"), provider.indexOf("// Firebase publishes a new credential"));
  assert.ok(explicitFinalize.indexOf("drainPendingSessionRevocations(") < explicitFinalize.indexOf("startAuthenticatedProfilePreparation("));
  assert.match(explicitFinalize, /sessionCoordinator\.isCurrent\(generation\) && sessionExchangeUidRef\.current === user\.uid/u);
  const preparation = provider.slice(provider.indexOf("const startAuthenticatedProfilePreparation"), provider.indexOf("const completeProfilePreparation"));
  assert.match(preparation, /activatePreparedProfile\(profile\.id, profile\.kind, \{ deferReadyNotification: true \}\)/);
  assert.match(preparation, /guardAuthenticatedScopeAgainstIncompleteSignOut\([\s\S]*?readScopedSignOut: getAccountSignOutState/);
  assert.match(preparation, /guardAuthenticatedScopeAgainstIncompleteSignOut\([\s\S]*?if \(logoutGuard === "blocked"\)[\s\S]*?return attempt;[\s\S]*?notifyProfileStorageReady\(\);[\s\S]*?setState\(\{ kind: "profilePreparing"/);
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
  const app = readFileSync("App.tsx", "utf8");
  const sidecar = readFileSync("src/application/account/AccountForegroundRefreshSidecar.tsx", "utf8");
  const screen = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  const pendingScreen = readFileSync("src/features/account/AccountEmailChangePendingScreen.tsx", "utf8");
  const en = JSON.parse(readFileSync("src/locales/en/settings.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/settings.json", "utf8")) as Record<string, string>;
  assert.match(app, /<AccountForegroundRefreshSidecar \/>/u);
  assert.match(sidecar, /AppState\.addEventListener\("change"/u);
  assert.match(sidecar, /previousState !== "active" && nextState === "active"/u);
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
  assert.match(screen, /testID="account-back-to-sign-in"/);
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
  assert.match(screen, /mode === "recovery" && recoveryMethod === "code"[\s\S]*?styles\.recoveryCodeTitle/);
  assert.match(screen, /recoveryCodeTitle:\s*\{[\s\S]*?flexShrink:\s*1[\s\S]*?fontSize:\s*34[\s\S]*?lineHeight:\s*40[\s\S]*?maxWidth:\s*"100%"/);
  assert.match(screen, /errorTestID="account-password-confirmation-error"/);
  assert.match(screen, /mode === "register" && isRegisterFieldFailure\(feedback\) \? null : isAuthFieldFailure\(mode, recoveryMethod, feedback\) \? null : renderFeedback\(feedback, text\)/);
  assert.match(screen, /errorTestID="account-register-email-error"/);
  assert.match(screen, /errorTestID="account-register-password-error"/);
  assert.match(screen, /errorTestID="account-recovery-code-error"/);
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
  assert.match(provider, /registrationIntentRef[\s\S]*?inFlight\?\.uid === user\.uid[\s\S]*?return inFlight\.promise/u);
  assert.match(provider, /registrationIntentRef\.current = Object\.freeze\(\{ uid: user\.uid, promise \}\)/u);
  assert.match(provider, /const registration = await api\.registerAccount\(evidence\)/u);
  assert.match(provider, /if \(registration\.registration\.created\) await markGuestInstallationAdoptionPending\(\)/u);
  assert.match(provider, /registration\.registration\.created[\s\S]*?finalizeCurrent\(auth, api, user, false, generation, true, true\)[\s\S]*?: finalizeExisting \? finalizeExisting\(\) : finalizeExplicitAuthentication\(auth, api, user\)/u);
  assert.match(provider, /loadAccountDataSession\(api, response\.user\.id, \{ guestAdoption: allowGuestAdoption \? "allow" : "discard" \}\)/u);
  assert.match(provider, /!activeProfile && \(preparedSelection\.kind === "guest" \|\| preparedSelection\.kind === "legacy_guest"\)[\s\S]*?activatePreparedProfile\(preparedSelection\.id, preparedSelection\.kind, \{ deferReadyNotification: true \}\)/u);
  assert.match(provider, /guestInstallation\?\.bindingState === "adoption_pending"[\s\S]*?attempt\.guestAdoption = true[\s\S]*?notifyProfileStorageReady\(\)/u);
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

test("both recovery-code surfaces warn before copying through the guarded clipboard", () => {
  const entry = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const security = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  const panel = readFileSync("src/features/account/RecoveryOperationPanel.tsx", "utf8");
  const warning = panel.indexOf('t("recoveryCodesClipboardWarning")');
  const guardedCopy = panel.indexOf("recoveryCodeClipboard.copy(codes)");

  assert.ok(warning >= 0 && guardedCopy > warning);
  assert.match(panel, /const \[codesVisible, setCodesVisible\] = useState\(\(\) => AppState\.currentState === "active"\)/u);
  assert.match(panel, /AppState\.addEventListener\("change", \(nextState\) => \{[\s\S]*?appStateRef\.current = nextState;[\s\S]*?setAppState\(nextState\);[\s\S]*?if \(nextState !== "active"\) setCodesVisible\(false\)/u);
  assert.match(panel, /operationId !== null && lastIssueOperationIdRef\.current !== operationId[\s\S]*?lastIssueOperationIdRef\.current = operationId;[\s\S]*?setCodesVisible\(appStateRef\.current === "active"\)/u);
  assert.match(panel, /snapshot\.codes && appState === "active" && !codesVisible \? <View[^>]*testID="recovery-operation-codes-hidden"/u);
  assert.match(panel, /onPress=\{\(\) => setCodesVisible\(true\)\}[^>]*testID="recovery-operation-show-codes"/u);
  assert.match(panel, /snapshot\.codes && appState === "active" && codesVisible \? <View testID="recovery-operation-codes"/u);
  assert.match(panel, /testID="recovery-operation-copy-codes"/u);
  assert.match(panel, /accessibilityRole="checkbox"[\s\S]*?accessibilityState=\{\{ checked: snapshot\.savedIntent, disabled: busy \|\| snapshot\.savedIntent \}\}[\s\S]*?testID="recovery-operation-saved-ack"/u);
  assert.doesNotMatch(panel, /Clipboard\.setStringAsync\(codes\.join/u);
  for (const screen of [entry, security]) {
    assert.match(screen, /import \{ RecoveryOperationPanel \} from "\.\/RecoveryOperationPanel"/u);
    assert.match(screen, /<RecoveryOperationPanel[\s\S]*?snapshot=\{recoveryOperation\}/u);
    assert.match(screen, /onConfirmSaved=\{[\s\S]*?account\.confirmRecoveryCodesSaved\(\)/u);
    assert.match(screen, /onRetry=\{[\s\S]*?account\.retryRecoveryOperation\(\)/u);
    assert.match(screen, /onResume=\{[\s\S]*?account\.resumePendingRecovery\(\)/u);
    assert.doesNotMatch(screen, /recoveryCodeClipboard|Clipboard\.setStringAsync/u);
  }
  const appStateListenerStart = panel.indexOf('AppState.addEventListener("change"');
  const appStateListenerEnd = panel.indexOf("return () => subscription.remove()", appStateListenerStart);
  assert.ok(appStateListenerStart >= 0 && appStateListenerEnd > appStateListenerStart);
  assert.doesNotMatch(panel.slice(appStateListenerStart, appStateListenerEnd), /setCodesVisible\(true\)/u);
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
  assert.match(accountEntry, /firebaseConfig\.kind === "configured" && getFirebaseGoogleClientId\(firebaseConfig\.value, Platform\.OS\) \? \([\s\S]*?<GoogleProviderButton[\s\S]*?configuration=\{firebaseConfig\.value\}/);
  assert.match(securityScreen, /usesGoogle && configuration\.kind === "configured" && getFirebaseGoogleClientId\(configuration\.value, Platform\.OS\)[\s\S]*?<GoogleVerification/u);
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
  const app = readFileSync("App.tsx", "utf8");
  assert.match(app, /const \{ state \} = usePatternlyAccount\(\)/);
  assert.match(app, /<NavigationContainer key=\{sessionKey\} theme=\{navigationTheme\}>/);
  assert.match(app, /state\.kind === "authenticated" \|\| state\.kind === "guest"/);
});

test("secure auth persistence stores only a Firebase refresh-token-shaped record", async () => {
  const stored = new Map<string, string>();
  const Persistence = createSecureAuthPersistence({
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
  const app = readFileSync("App.tsx", "utf8");
  const accountProvider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");

  assert.match(authClient, /onUserChanged: \(listener\) => onAuthStateChanged\(auth, \(user\) => \{\s*current = user;\s*listener\(user \? snapshot\(user\) : null\);/);
  assert.doesNotMatch(authClient, /onUserChanged:[^\n]*listener\(current \? snapshot\(current\) : null\)/);
  assert.match(rootNavigator, /state\.kind === "loading" \|\| state\.kind === "profilePreparing"[\s\S]*?<LoadingState[^>]*title=\{t\("Restoring session"\)\}/);
  assert.match(rootNavigator, /applicationSessionReady = state\.kind === "guest" \|\| state\.kind === "localOffline" \|\| state\.kind === "signingOut" \|\| state\.kind === "deleting" \|\| \(state\.kind === "authenticated" && state\.accountData\.status === "synced"\)/);
  assert.match(rootNavigator, /initialRouteName=\{applicationSessionReady \? ROUTES\.HOME : ROUTES\.ACCOUNT_ENTRY\}/);
  assert.match(rootNavigator, /key=\{applicationSessionReady \? "application" : "account"\}/);
  assert.match(rootNavigator, /applicationSessionReady \? \([\s\S]*?<Stack\.Group>[\s\S]*?name=\{ROUTES\.HOME\}[\s\S]*?<\/Stack\.Group>[\s\S]*?\) : null/);
  assert.match(rootNavigator, /name=\{ROUTES\.ACCOUNT_ENTRY\}[\s\S]*?initialParams=\{\{ initialMode: accountEntryMode === "login" \? "signIn" : "entry" \}\}/);
  assert.match(rootNavigator, /testID="account-session-restore-loading"/);
  assert.match(app, /<AppPreferencesProvider>[\s\S]*?<ProfileStoragePreparationGate>[\s\S]*?<PatternlyAccountProvider>[\s\S]*?<AppContent/);
  assert.match(app, /const needsContent = [^;]*state\.kind === "localOffline"/);
  assert.match(app, /const sessionKey = [^\n]*state\.kind === "localOffline"/);
  assert.match(app, /<ContentPreparationGate completeAccountPreparation=\{completeProfilePreparation\}><AppNavigation \/><\/ContentPreparationGate>/);
  assert.doesNotMatch(app, /AccountBootstrapCompletion/);
  assert.match(accountProvider, /createPatternlyApiClient\(\{ allowLocalHttpForSimulator:/);
  assert.doesNotMatch(accountProvider, /accountDataProtocolMode|protocolVersion|contentIdentitySchema/u);
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
  assert.match(provider, /detachObserver\(\);[\s\S]*?setState\(\{ kind: "unavailable", reason: "auth_restore_timeout" \}\)/);
  assert.doesNotMatch(provider, /auth\.signOut\(\);[\s\S]*?auth_restore_timeout/);
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
  assert.equal(classifyAccountFailure({ code: "auth/weak-password", message: "private provider detail" }), "weakPassword");
  assert.equal(classifyAccountFailure({ code: "auth/email-already-in-use", message: "private provider detail" }), "invalidCredential");
  assert.equal(classifyAccountFailure({ code: "auth/too-many-requests", message: "private provider detail" }), "rateLimited");
  assert.equal(classifyAccountFailure({ code: "auth/network-request-failed", message: "private provider detail" }), "offline");
  assert.equal(classifyAccountFailure({ code: "auth/expired-action-code", message: "private provider detail" }), "expiredAction");
  assert.equal(classifyAccountFailure({ code: "auth/user-token-expired", message: "private provider detail" }), "revokedSession");
  assert.equal(classifyAccountFailure({ code: "auth/operation-not-allowed", message: "private provider detail" }), "providerUnavailable");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("transport_failed")), "offline");
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
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 400, "recovery_code_invalid")), "invalidRecoveryCode");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 400, "recovery_code_used")), "recoveryCodeUsed");
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
  assert.match(provider, /async function invalidateAccountBindingAfterIdentityDenial[\s\S]*?readActiveAccountIdentityBinding\(lease\)[\s\S]*?readPreparedAccountIdentityBinding\(input\.profile\.id\)[\s\S]*?binding\.binding\.firebaseUid !== input\.uid[\s\S]*?invalidateActiveAccountIdentityBinding\(\{ lease[\s\S]*?invalidatePreparedAccountIdentityBinding\(\{ profileId: input\.profile\.id/u);
  assert.match(provider, /getMe: async \(\) => \{[\s\S]*?getMeWithExchangedSession[\s\S]*?revokeBindingForAuthoritativeIdentityDenial\(error/u);
  assert.match(provider, /const identityProof = await runAccountIdentityProof\([\s\S]*?request: \(\) => getMeWithExchangedSession[\s\S]*?revokeDeniedBinding: async \(error\) => \{ await revokeBindingForAuthoritativeIdentityDenial\(error/u);
  assert.match(provider, /const identityDenied = isAuthoritativeIdentityProofDenial\(error\)[\s\S]*?revokeBindingForAuthoritativeIdentityDenial\(error[\s\S]*?verificationRevision: current\.bindingRevision[\s\S]*?accountSessionFailureState\(failure === "reauthenticationRequired" \? failure : "revokedSession"/u);
});

test("only exact current /me proof clears a persisted sync-denial marker before account sync loads", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const finalizeCurrent = provider.slice(provider.indexOf("const finalizeCurrent"), provider.indexOf("const startAuthenticatedProfilePreparation"));
  assert.match(finalizeCurrent, /matchesProofSubject: \(response, barrier\) => response\.user\.id === barrier\.previousBinding\.accountId[\s\S]*?response\.user\.identity\.subject === user\.uid[\s\S]*?barrier\.previousBinding\.firebaseUid === user\.uid/u);
  assert.match(finalizeCurrent, /if \(!pendingDeletion && response\.user\.identity\.subject === user\.uid/u);
  const clearMarker = finalizeCurrent.indexOf("clearAccountIdentityDenialAfterProof(");
  const loadAccountData = finalizeCurrent.indexOf("loadAccountDataSession(api, response.user.id");
  assert.ok(clearMarker >= 0 && loadAccountData > clearMarker, "identity marker clear precedes local account loading and sync");
  const clearBlock = finalizeCurrent.slice(clearMarker, loadAccountData);
  assert.match(clearBlock, /sessionCoordinator\.isCurrent\(token\)[\s\S]*?auth\.getSnapshot\(\)\?\.uid !== token\.uid[\s\S]*?isActiveProfileStorageLeaseCurrent\(lease\)/u);
  assert.match(clearBlock, /latest\.binding\.accountId === response\.user\.id[\s\S]*?latest\.binding\.firebaseUid === user\.uid[\s\S]*?latest\.binding\.checksum === verifiedBinding\.checksum[\s\S]*?latest\.binding\.verificationRevision === verifiedBinding\.verificationRevision/u);
  assert.match(clearBlock, /if \(!cleared\) return \{ result: \{ kind: "failure", failure: "revokedSession" \}/u);
  const preparation = provider.slice(provider.indexOf("const startAuthenticatedProfilePreparation"), provider.indexOf("const completeProfilePreparation"));
  assert.ok(preparation.indexOf("beginIdentityProofBarrier(auth, user, generation, true)") < preparation.indexOf("guardRecoveryBeforePreparation(auth, { generation, barrier: proofBarrier })"), "startup barrier precedes recovery checks that read Auth generations or exchange tokens");
  const explicitFinalize = provider.slice(provider.indexOf("const finalizeExplicitAuthentication"), provider.indexOf("// Firebase publishes a new credential"));
  assert.doesNotMatch(explicitFinalize, /guardRecoveryBeforePreparation\(auth\)/u, "explicit login delegates proof ordering to the barrier-first profile preparation path");
  const recoveryTransition = provider.slice(provider.indexOf("const completeExplicitRecoveryAccountTransition"), provider.indexOf("// Firebase publishes a new credential"));
  assert.ok(recoveryTransition.indexOf("beginIdentityProofBarrier(auth, user, generation)") < recoveryTransition.indexOf("getMeWithExchangedSession("));
  assert.match(recoveryTransition, /runAccountIdentityProof\([\s\S]*?resolveBarrier: \(barrier\) => resolveIdentityProofBarrier[\s\S]*?revokeDeniedBinding:/u);
});

test("recovery claim denials keep the durable barrier while local generation metadata failures remain nonauthoritative", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const guard = provider.slice(provider.indexOf("const guardRecoveryBeforePreparation"), provider.indexOf("const beginIdentityProofBarrier = useCallback"));
  assert.match(guard, /const revokeDeniedIdentity = async \(error: unknown,[\s\S]*?isAuthoritativeIdentityProofDenial\(error\)[\s\S]*?revokeBindingForAuthoritativeIdentityDenial\(error,[\s\S]*?setState\(\{ kind: "revokedSession", user \}\)/u);
  assert.match(guard, /catch \(error\) \{\s*proofScopeRef\.current\?\.assertCurrent\(\);\s*if \(await revokeDeniedIdentity\(error, user\)\) return false;/u);
  assert.match(guard, /catch \(error\) \{\s*if \(await revokeDeniedIdentity\(error, auth\?\.getSnapshot\(\) \?\? null\)\) return false;/u);
  assert.match(guard, /setState\(\{ kind: "backendUnavailable", user \}\);\s*return false;/u);
  assert.doesNotMatch(guard, /auth\/authorization-generation-invalid" \? "revokedSession"/u);
  const firstClaimRead = guard.indexOf("await auth.getAuthorizationGeneration()");
  assert.ok(firstClaimRead > guard.indexOf("await ensureProofScope(user)"), "the prepared binding barrier precedes the first SDK claim read");
  const signInExchange = guard.indexOf("await ensureRecoveryIssueSignInSession({");
  assert.ok(signInExchange > guard.indexOf("scope.bindRecoveryOperation(pending)"));
  assert.ok(signInExchange > guard.indexOf("const scope = await ensureProofScope(user)"), "the recovery session exchange uses the same barrier scope as the forced generation read");
  assert.match(guard, /scope\.acceptRecoveryOperation\(replacement, \{\s*kind: "issueReplace",[\s\S]*?previousOperationId: pending\.operationId/u);
  assert.match(guard, /scope\.acceptRecoveryOperation\(resumed, \{\s*kind: "issueResume",[\s\S]*?deferredFor: pending\.deferredFor/u);

  const issueCodes = provider.slice(provider.indexOf("issueRecoveryCodes: (credentials) =>"), provider.indexOf("consumeRecoveryCode: (code) =>"));
  assert.ok(issueCodes.indexOf("createRecoveryProofScopeRef.current(auth, user") < issueCodes.indexOf("await auth.getAuthorizationGeneration()"));
  assert.ok(issueCodes.indexOf("proofScope.assertCurrent();", issueCodes.indexOf("await auth.getAuthorizationGeneration()")) > issueCodes.indexOf("await auth.getAuthorizationGeneration()"));
  const replacementRequestStart = provider.lastIndexOf("requestRecoveryCodeReplacement: () =>");
  const replacementRequest = provider.slice(replacementRequestStart, provider.indexOf("resumePendingRecovery: () =>", replacementRequestStart));
  assert.ok(replacementRequest.indexOf("createRecoveryProofScopeRef.current(auth, current)") < replacementRequest.indexOf("await auth.getAuthorizationGeneration()"));
  assert.ok(replacementRequest.indexOf("await auth.getAuthorizationGeneration()") < replacementRequest.indexOf("await auth.signOut()"));
  const continueCurrentStart = provider.lastIndexOf("continueWithCurrentAccount: () =>");
  const continueCurrent = provider.slice(continueCurrentStart, provider.indexOf("}), [", continueCurrentStart));
  assert.ok(continueCurrent.indexOf("createRecoveryProofScopeRef.current(auth, current)") < continueCurrent.indexOf("await auth.getAuthorizationGeneration()"));
  assert.match(continueCurrent, /proofScope\.assertCurrent\(\);[\s\S]*?await coordinator\.reconcilePending\([\s\S]*?proofScope\.acceptRecoveryOperation\(checked\)/u);

  const scope = provider.slice(provider.indexOf("const createRecoveryProofScope = useCallback"), provider.indexOf("beginIdentityProofBarrierRef.current ="));
  assert.match(scope, /const ownsBarrier = !owner\?\.barrier/u);
  assert.match(scope, /(!activeLease \? capturePreparedProfileStorageLease\(\) : null)/u);
  assert.match(scope, /const baseCurrent = \(\) => sessionCoordinator\.isCurrent\(generation\) && auth\.getSnapshot\(\)\?\.uid === user\.uid[\s\S]*?isActiveProfileStorageLeaseCurrent\(activeLease\)[\s\S]*?isPreparedProfileStorageLeaseCurrent\(preparedLease\)/u);
  assert.match(scope, /if \(expectedRecoveryOperation !== null\)[\s\S]*?recoveryOperationIdentity\(current\) !== expectedRecoveryOperation/u);
  assert.match(scope, /if \(!ownsBarrier \|\| !barrier \|\| isAuthoritativeIdentityProofDenial\(error\)\) return;\s*assertCurrent\(\)[\s\S]*?await resolveBarrier\(barrier, auth, user, generation\);\s*assertCurrent\(\)/u);
  assert.match(guard, /if \(!auth \|\| user\.uid !== auth\.getSnapshot\(\)\?\.uid \|\| !createRecoveryProofScopeRef\.current\) throw new AccountSessionGenerationStaleError\(\)/u);

  const transition = provider.slice(provider.indexOf("const completeExplicitRecoveryAccountTransition"), provider.indexOf("// Firebase publishes a new credential"));
  assert.match(transition, /resolveOnSuccess: false/u);
  const defer = transition.indexOf("await coordinator.deferIssueToIdentity(");
  const secondGeneration = transition.indexOf("const afterGeneration = await auth.getAuthorizationGeneration()");
  const resolve = transition.lastIndexOf("await restoreExactProofBinding()");
  assert.ok(defer > 0 && secondGeneration > defer && resolve > secondGeneration, "an exact old binding is restored only after both generation reads and deferred identity verification");
  assert.match(transition, /proofBarrier && !proofBarrierResolutionAttempted && !isAuthoritativeIdentityProofDenial\(error\)/u);
  assert.match(transition, /if \(isAuthoritativeIdentityProofDenial\(error\) && canContinue\(\)\) setState\(\{ kind: "revokedSession", user \}\)/u);
  const firstUse = provider.slice(provider.indexOf("const runProviderFirstUse"), provider.indexOf("const registerProviderIdentity"));
  assert.match(firstUse, /const recoveryTransitionIntent = explicitRecoveryAccountTransitionRef\.current[\s\S]*?completeExplicitRecoveryAccountTransition\(auth, api, user\)/u);
  const transitionReuse = firstUse.slice(firstUse.indexOf("if (recoveryTransition?.kind === \"success\")"), firstUse.indexOf("const generation = sessionCoordinator.restart(user.uid)"));
  assert.match(transitionReuse, /pending\.operationId !== recoveryTransitionIntent\.operationId[\s\S]*?pending\.deferredFor\?\.firebaseUid !== user\.uid[\s\S]*?pending\.deferredFor\.authorizationGeneration !== pending\.authorizationGeneration[\s\S]*?pending\.blocksProfilePreparation/u);
  assert.match(transitionReuse, /else if \(!await guardRecoveryBeforePreparation\(auth\)\)/u);
  assert.doesNotMatch(transitionReuse.slice(transitionReuse.indexOf("if (recoveryTransition?.kind === \"success\")"), transitionReuse.indexOf("} else if")), /getAuthorizationGeneration\(/u);
});

test("recovery proof scope accepts only exact operation identity or witnessed coordinator successors", () => {
  const actorUid = "scope-actor";
  const deferredUid = "deferred-actor";
  const issue = (overrides: Record<string, unknown> = {}) => ({
    kind: "issue" as const,
    operationId: "00000000-0000-4000-8000-000000000101",
    status: "delivery_unconfirmed" as const,
    firebaseUid: actorUid,
    authorizationGeneration: 8,
    generationId: null,
    codes: null,
    savedIntent: false,
    replacementPending: false,
    deferredFor: null as Readonly<{ firebaseUid: string; authorizationGeneration: number }> | null,
    accountResolution: null as "missing_generation" | "different_uid" | "different_generation" | null,
    needsAccountResolution: false,
    failure: null as null,
    blocksProfilePreparation: true,
    ...overrides,
  });
  const original = issue();
  const deferred = issue({ deferredFor: { firebaseUid: deferredUid, authorizationGeneration: 2 } });
  const resumed = issue({ deferredFor: null, blocksProfilePreparation: false, status: "provider_retryable" });
  const resumeWitness = { kind: "issueResume" as const, operationId: original.operationId, firebaseUid: actorUid, authorizationGeneration: 8, deferredFor: { firebaseUid: deferredUid, authorizationGeneration: 2 } };
  assert.equal(recoveryOperationTransitionIsAllowed(original, deferred, actorUid), false, "a changed deferred binding is not an implicit same-operation success");
  assert.equal(recoveryOperationTransitionIsAllowed(deferred, resumed, actorUid, resumeWitness), true, "resume accepts only the exact captured operation and deferred identity");
  assert.equal(recoveryOperationTransitionIsAllowed(deferred, issue({ ...resumed, deferredFor: null, authorizationGeneration: 9 }), actorUid, resumeWitness), false);
  assert.equal(recoveryOperationTransitionIsAllowed(deferred, issue({ ...resumed, deferredFor: null, operationId: "00000000-0000-4000-8000-000000000102" }), actorUid, resumeWitness), false);

  const replacementId = "00000000-0000-4000-8000-000000000103";
  const replacement = issue({ operationId: replacementId, previousIssueOperationId: original.operationId, status: "provider_retryable" });
  const replaceWitness = { kind: "issueReplace" as const, previousOperationId: original.operationId, firebaseUid: actorUid, authorizationGeneration: 8 };
  assert.equal(recoveryOperationTransitionIsAllowed(original, replacement, actorUid, replaceWitness), true, "replacement requires the exact validated vault predecessor ID");
  assert.equal(recoveryOperationTransitionIsAllowed(original, issue({ ...replacement, previousIssueOperationId: "00000000-0000-4000-8000-000000000104" }), actorUid, replaceWitness), false);
  assert.equal(recoveryOperationTransitionIsAllowed(issue({ status: "provider_retryable" }), replacement, actorUid, replaceWitness), false, "replacement cannot bypass the delivery_unconfirmed predecessor status");
  const replacementTerminal = { kind: "terminal" as const, operationId: replacementId, status: "superseded" as const, previousIssueOperationId: original.operationId, blocksProfilePreparation: false as const };
  assert.equal(recoveryOperationTransitionIsAllowed(original, replacementTerminal, actorUid, replaceWitness), true);
  assert.equal(recoveryOperationTransitionIsAllowed(original, { ...replacementTerminal, previousIssueOperationId: undefined }, actorUid, replaceWitness), false);

  const idle = { kind: "idle" as const, blocksProfilePreparation: false as const };
  const firstIssue = issue({ operationId: replacementId, status: "in_progress" });
  assert.equal(recoveryOperationTransitionIsAllowed(idle, firstIssue, actorUid, { kind: "issueStart", firebaseUid: actorUid, authorizationGeneration: 8 }), true);
  assert.equal(recoveryOperationTransitionIsAllowed(idle, firstIssue, "foreign-actor", { kind: "issueStart", firebaseUid: actorUid, authorizationGeneration: 8 }), false);
  assert.equal(recoveryOperationTransitionIsAllowed(original, { kind: "terminal", operationId: original.operationId, status: "acknowledged", blocksProfilePreparation: false }, actorUid), true);
  assert.equal(recoveryOperationTransitionIsAllowed(original, { kind: "terminal", operationId: replacementId, status: "acknowledged", blocksProfilePreparation: false }, actorUid), false, "a terminal result cannot clear a different accepted operation");
});

test("the production identity-proof boundary retains exact localOffline on temporary failure and admits a later verified response", async () => {
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
        request: async () => { requests += 1; throw new PatternlyApiClientError("request_timeout"); },
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
    assert.deepEqual(failed.result, { kind: "failure", failure: "offline" });
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
    assert.match(provider, /const identityProof = await runAccountIdentityProof\([\s\S]*?if \(identityProof\.kind === "failed"\) return \{ result: \{ kind: "failure", failure: identityProof\.failure \}, state: identityProof\.state \};[\s\S]*?const response = identityProof\.value;[\s\S]*?state: \{ kind: "authenticated", backendUser: response\.user/u);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

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

test("a definitive SDK claim denial after /me cannot restore the deferred recovery binding", async () => {
  const accountId = "recovery-claim-denial-account";
  const uid = "recovery-claim-denial-uid";
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const base = new MemoryKeyValueStorage();
  const controlValues = new Map<string, string>();
  const control: StorageManifestStore = {
    async get(key) { return controlValues.get(key) ?? null; },
    async set(key, value) { controlValues.set(key, value); },
    async remove(key) { controlValues.delete(key); },
  };
  let nextIdentity = 700;
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
    const user = { uid, email: "recovery-claim@example.test", emailVerified: true, providers: ["password"] as const };
    const coordinator = createAccountSessionCoordinator<unknown>(() => undefined);
    const generation = coordinator.begin(uid);
    const barrierReceipt = await beginAccountIdentityProofBarrier({ profileId: profile.id, accountId, firebaseUid: uid, verificationRevision: binding.verificationRevision, lease, canContinue: () => coordinator.isCurrent(generation) });
    assert.ok(barrierReceipt);
    const barrier: AccountIdentityProofBarrierContext = { receipt: barrierReceipt, profile, lease, previousBinding: binding, requestUid: uid, generation };
    const proof = await runAccountIdentityProof({
      request: async () => ({ user: { id: accountId, identity: { subject: uid } } }),
      user, generation, barrier, barrierAlreadyCaptured: true, resolveOnSuccess: false,
      beginBarrier: async () => barrier,
      resolveBarrier: (captured) => resolveAccountIdentityProofBarrier({ receipt: captured.receipt, lease, canContinue: () => coordinator.isCurrent(generation) }),
      matchesProofSubject: (value, captured) => value.user.id === captured.previousBinding.accountId && value.user.identity.subject === captured.previousBinding.firebaseUid,
      getCurrentState: () => ({ kind: "loading" }), getCurrentSdkUid: () => uid,
      isCurrentGeneration: coordinator.isCurrent, isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
      readBinding: readActiveAccountIdentityBinding,
      revokeDeniedBinding: async (error) => { await revokeBindingForAuthoritativeIdentityDenial(error, { profile, uid, lease, verificationRevision: binding.verificationRevision, canContinue: () => coordinator.isCurrent(generation) }); },
    });
    assert.equal(proof.kind, "verified");
    if (proof.kind !== "verified") return;
    assert.ok(proof.barrier, "the positive /me result keeps the barrier until later generation checks complete");
    assert.deepEqual(await readActiveAccountIdentityBinding(lease), { kind: "invalidated" });

    const claimError = { code: "auth/user-token-expired" };
    assert.equal(isAuthoritativeIdentityProofDenial(claimError), true);
    await revokeBindingForAuthoritativeIdentityDenial(claimError, { profile, uid, lease, verificationRevision: binding.verificationRevision, canContinue: () => coordinator.isCurrent(generation) });
    assert.deepEqual(await readActiveAccountIdentityBinding(lease), { kind: "invalidated" }, "a later definitive SDK denial cannot use the retained receipt to restore access");

    closeActiveProfileStorage();
    router = await openProfileStorageRouter(base, control);
    assert.deepEqual(await router.readSelectedAccountIdentityBinding(), { kind: "invalidated" }, "the denial survives reopening the canonical router");
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
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
