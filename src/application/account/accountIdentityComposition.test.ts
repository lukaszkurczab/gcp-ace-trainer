import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { AUTH_INITIALIZATION_TIMEOUT_MS, canContinueAccountIdentityRefresh, classifyAccountFailure, classifyPrivacyRequestFailure, completeUnrecognizedPersistedAuthSignOut, createAccountSessionCoordinator, isNonEnumeratingRecoveryError, planPasswordVerificationCommand, publishRefreshedAuthenticatedState, requiresPasswordEmailVerification, type AccountState } from "./AccountSessionProvider";
import { createSensitiveCommandLane } from "./accountCommandGuards";
import { parseConfiguredPublicEnvironment } from "../../infrastructure/clients/publicEnvironment";
import { PatternlyApiClientError } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { composePatternlyNativeAppCheck, configurePatternlyAppCheckTokenProvider, createPatternlyNativeAppCheckProviderConfiguration, getPatternlyAppCheckToken } from "../../infrastructure/clients/patternlyAppCheckToken";
import { getFirebaseGoogleClientId, parseFirebaseClientConfiguration } from "../../infrastructure/firebase/publicConfig";
import { AUTH_USER_STORAGE_KEY, createSecureAuthPersistence, redactPersistedAuthUser } from "../../infrastructure/firebase/secureAuthPersistence";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { requiresVerifiedPasswordIdentity } from "../../infrastructure/runtime/runtimeMode";

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
  assert.match(screen, /testID="account-copy-recovery-codes"/);
  assert.match(screen, /testID="account-entry-continue"/);
  assert.match(screen, /testID="account-recovery-codes-saved-checkbox"/);
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
  assert.match(provider, /issueRecoveryCodes: \(credentials: FirebaseAuthCredentials\)/);
  assert.match(provider, /discardGuestData: \(\) => runWithAuth/);
  assert.match(provider, /mutation: \(\) => api\.issueRecoveryCodes\(\)/);
});

test("account recovery owns one status message, a truthful retry, and a sign-out exit", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const recoveryStart = screen.indexOf("function AccountRecoveryScreen");
  const recoveryEnd = screen.indexOf("function RadioOption", recoveryStart);
  const recovery = screen.slice(recoveryStart, recoveryEnd);

  assert.ok(recoveryStart >= 0 && recoveryEnd > recoveryStart);
  assert.match(recovery, /getAccountRecoveryPresentation\(accountData, text\)/);
  assert.match(recovery, /const actionFailure = feedback\?\.kind === "failure"/);
  assert.match(recovery, /<AuthText accessibilityRole="header" style=\{styles\.accountHeading\}>\{presentation\.title\}/);
  assert.match(recovery, /<AuthText style=\{styles\.accountBody\}>\{presentation\.body\}/);
  assert.doesNotMatch(recovery, /<InfoBlock/);
  assert.match(recovery, /status\.retry \? \(/);
  assert.match(recovery, /loading=\{busyAction === "retry"\}/);
  assert.match(recovery, /testID="account-sync-retry"/);
  assert.match(recovery, /loading=\{busyAction === "signOut"\}/);
  assert.match(recovery, /testID="account-sign-out"/);
  assert.doesNotMatch(recovery, /AccountDataPanel|retryDisabled|loading=\{retryDisabled\}/);
  assert.match(screen, /function isRetryFailureCoveredByStatus\(accountData: AccountDataSession, failure: string\)/);
  assert.match(screen, /conflictDescription/);
  assert.match(screen, /account\.state\.kind === "guestAccessBlocked" && mode === "entry"/);
  assert.match(screen, /testID="account-binding-sign-in-notice"/);
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

test("remote session revocation warning appears only on signed-out sign-in and explains both states", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const en = JSON.parse(readFileSync("src/locales/en/account.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/account.json", "utf8")) as Record<string, string>;

  assert.match(screen, /account\.state\.kind === "signedOut" && account\.pendingRemoteRevokeCount > 0[\s\S]*?testID="account-remote-revoke-pending"/u);
  assert.match(en.remoteSessionRevocationPendingDescription ?? "", /device is signed out/u);
  assert.match(en.remoteSessionRevocationPendingDescription ?? "", /server session is still pending/u);
  assert.match(pl.remoteSessionRevocationPendingDescription ?? "", /urządzenie jest wylogowane/u);
  assert.match(pl.remoteSessionRevocationPendingDescription ?? "", /sesji na serwerze nie zostało jeszcze zakończone/u);
  assert.match(en.signOutPendingDescription ?? "", /safely retry/u);
  assert.match(en.signOutPendingDescription ?? "", /doesn’t need an internet connection/u);
  assert.match(pl.signOutPendingDescription ?? "", /bezpiecznie ponowić tę czynność/u);
  assert.match(pl.signOutPendingDescription ?? "", /nie wymaga połączenia z internetem/u);
  assert.doesNotMatch(en.remoteSessionRevocationPendingDescription ?? "", /uid|operation|retry in|within/u);
  assert.doesNotMatch(pl.remoteSessionRevocationPendingDescription ?? "", /uid|operation|za .* minut|w ciągu/u);
});

test("local sign-out persists its block before closing scope and never invokes remote preparation", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const signOut = provider.slice(provider.indexOf('signOut: () => runAuthMutationWithAuth'), provider.indexOf('changePassword: (credentials, newPassword)'));
  assert.match(signOut, /getAccountSignOutState\(\)/);
  assert.match(signOut, /scopedSignOut\?\.accountId === current\.backendUser\.id[\s\S]*?scopedSignOut\.operationId[\s\S]*?beginAccountSignOut\(current\.backendUser\.id\)/);
  assert.match(signOut, /logoutControl\.blockAndQueueRevoke\(user\.uid, operationId!\)/);
  assert.match(signOut, /performLocalAccountSignOut\([\s\S]*?publishLockedState:[\s\S]*?closeProfileStorage: closeSignOutProfileStorage[\s\S]*?signOutFirebase:[\s\S]*?auth\.signOut\(\)/);
  assert.match(signOut, /retainAuthOnControlFailure: durableOperation/);
  const setupFailure = signOut.slice(signOut.indexOf("finishLocalSignOutSetupFailure({"), signOut.indexOf("const outcome = await performLocalAccountSignOut"));
  assert.ok(setupFailure.includes("isCurrent: canContinue"));
  assert.ok(setupFailure.includes("persistFallbackControlPair: async () =>"));
  assert.ok(setupFailure.includes("logoutControl.blockAndQueueRevoke(user.uid, operationId)"));
  assert.ok(setupFailure.includes("closeProfileStorage: closeSignOutProfileStorage"));
  assert.ok(setupFailure.includes("signOutFirebase: () => auth.signOut()"));
  assert.ok(signOut.includes('recoveryOutcome === "stale" ? "revokedSession" : "localCleanupFailure"'));
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
  for (const command of ["register", "signIn", "signInWithApple", "signInWithGoogle", "registerWithApple", "registerWithGoogle", "signOut"]) {
    assert.match(accountCommands, new RegExp(`${command}: [^\\n]*=> runAuthMutationWithAuth\\(`), command);
  }
});

test("restored matching logout block closes scope and remains pending until manual retry", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const authObserver = provider.slice(provider.indexOf('configuredAuth.onUserChanged'), provider.indexOf('useEffect(() => {\n    if (state.kind === "guest"'));
  assert.match(authObserver, /findMatchingLocalLogoutBlock\(logoutControlSnapshotRef\.current, user\.uid\)/);
  assert.match(authObserver, /if \(matchingLogoutBlock\) \{[\s\S]*?closeActiveProfileStorage\(\);[\s\S]*?setState\(\{ kind: "signOutPending", user \}\);[\s\S]*?return;/);
  assert.match(authObserver, /clearBlockForAuth\(previousObservedUid, logoutBlock\.operationId, canClearLogoutBlock\)/);
  assert.match(authObserver, /const canClearLogoutBlock = \(\) => live && !observerDetached && eventRevision === authObserverRevision && configuredAuth\.getSnapshot\(\) === null/);
  assert.match(provider, /const logoutBlock = logoutControlSnapshotRef\.current\.blocked/);
  const nullAuthBranch = authObserver.slice(authObserver.indexOf("if (!user) {"), authObserver.indexOf("if (rejectedRestoreUid !== null && rejectedRestoreUid !== user.uid)"));
  assert.ok(nullAuthBranch.indexOf("closeProfileStorage: closeActiveProfileStorage") < nullAuthBranch.indexOf("clearBlockForAuth"));
  assert.match(nullAuthBranch, /logoutControlSnapshotRef\.current\.blocked[\s\S]*?clearBlockForAuth\(previousObservedUid, logoutBlock\.operationId, canClearLogoutBlock\)/);
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
  assert.match(screen, /showOwnerPreservationSmokeControl[\s\S]*?testID: "account-owner-preservation-guest"/);
  assert.match(screen, /ownerPreservationCommandResult\.status === "running"[\s\S]*?text\.ownerPreservationRunning/);
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

test("blocked owner smoke screen replaces the ordinary guest transition with the guarded command", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const blocked = screen.slice(screen.indexOf('if (account.state.kind === "guestAccessBlocked" && mode === "entry")'), screen.indexOf('if (account.state.kind === "verificationPending")'));

  assert.match(blocked, /footerAction=\{showOwnerPreservationSmokeControl\s*\?\s*\{[^}]*runOwnerPreservationGuestCommand\(\)[^}]*account-owner-preservation-guest[^}]*\}\s*:\s*\{[^}]*continueWithoutAccount[^}]*account-binding-guest[^}]*\}\}/);
  assert.doesNotMatch(blocked, /footerAction=\{\{\s*label: text\.continueWithoutAccount/);
});

test("registration keeps consent presentation separate from the boolean domain contract", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const en = JSON.parse(readFileSync("src/locales/en/account.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/account.json", "utf8")) as Record<string, string>;
  const registrationStart = screen.indexOf("function CredentialsForm");
  const termsStart = screen.indexOf("function TermsAcceptance");
  const termsEnd = screen.indexOf("function FormField", termsStart);
  const recoveryCheckboxStart = screen.indexOf('testID="account-recovery-codes-saved-checkbox"');
  const recoveryCheckboxEnd = screen.indexOf("</Pressable>", recoveryCheckboxStart);
  const passwordStart = screen.indexOf("function AuthPasswordInput");

  assert.match(screen, /type TermsPresentationState = "pristine" \| "checked" \| "uncheckedAfterInteraction"/u);
  assert.match(screen, /useState<TermsPresentationState>\("pristine"\)/u);
  assert.match(screen, /setTermsPresentationState\("pristine"\)/u);
  assert.match(screen, /setTermsPresentationState\(accepted \? "checked" : "uncheckedAfterInteraction"\)/u);
  assert.match(screen, /presentationState === "uncheckedAfterInteraction" && !accepted/u);
  assert.match(screen, /<Button disabled=\{acceptedTerms === false\}/u);
  assert.ok(registrationStart >= 0 && termsStart > registrationStart && termsEnd > termsStart && passwordStart > termsEnd);

  const registration = screen.slice(registrationStart, termsStart);
  const termsAcceptance = screen.slice(termsStart, termsEnd);
  const recoveryCheckbox = screen.slice(recoveryCheckboxStart, recoveryCheckboxEnd);
  const passwordInput = screen.slice(passwordStart);
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
  assert.doesNotMatch(termsAcceptance, /termsCheckboxChecked|termsCheckboxIcon/u);
  assert.match(recoveryCheckbox, /termsCheckboxChecked/u);
  assert.match(recoveryCheckbox, /termsCheckboxIcon/u);
  assert.equal(en.termsRequired, "Accept the Terms of Service and acknowledge the Privacy Policy to create an account.");
  assert.equal(pl.termsRequired, "Aby utworzyć konto, zaakceptuj Warunki korzystania i potwierdź zapoznanie się z Polityką prywatności.");
  assert.equal(`${en.acceptTermsPrefix}${en.termsOfService}${en.privacyAcknowledgementPrefix}${en.privacyPolicy}.`, "I agree to the Terms of Service and acknowledge the Privacy Policy.");
  assert.equal(`${pl.acceptTermsPrefix}${pl.termsOfService}${pl.privacyAcknowledgementPrefix}${pl.privacyPolicy}.`, "Akceptuję Warunki korzystania i potwierdzam zapoznanie się z Polityką prywatności.");
  assert.match(screen, /account\.register\(email, password, acceptedTerms, locale\)/u);
  assert.match(screen, /ROUTES\.TERMS_OF_SERVICE/gu);
  assert.match(screen, /ROUTES\.PRIVACY_POLICY/gu);
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  assert.match(provider, /registrationIntentRef[\s\S]*?inFlight\?\.uid === user\.uid[\s\S]*?return inFlight\.promise/u);
  assert.match(provider, /registrationIntentRef\.current = Object\.freeze\(\{ uid: user\.uid, promise \}\)/u);
  assert.match(provider, /signOutRejectedIdentity[\s\S]*?auth\.getSnapshot\(\)[\s\S]*?failure: "signOutPending"/u);
  assert.match(provider, /firebaseAuthErrorCode\(error\) === "auth\/email-already-in-use"[\s\S]*?auth\.signIn\(email\.trim\(\)\.toLowerCase\(\), password\)[\s\S]*?registerAuthenticatedIdentity/u);
});

test("both recovery-code surfaces warn before copying through the guarded clipboard", () => {
  const entry = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const security = readFileSync("src/features/account/AccountSecurityScreen.tsx", "utf8");
  for (const screen of [entry, security]) {
    const warning = screen.indexOf("recoveryCodesClipboardWarning");
    const guardedCopy = screen.indexOf("recoveryCodeClipboard.copy(codes)");
    assert.ok(warning >= 0 && guardedCopy > warning);
    assert.doesNotMatch(screen, /Clipboard\.setStringAsync\(codes\.join/);
  }
  assert.match(entry, /AppState\.addEventListener\("change"[\s\S]*?state !== "active"[\s\S]*?setRecoveryCodes\(null\)/);
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
  assert.match(rootNavigator, /applicationSessionReady = state\.kind === "guest" \|\| state\.kind === "signingOut" \|\| state\.kind === "deleting" \|\| \(state\.kind === "authenticated" && state\.accountData\.status === "synced"\)/);
  assert.match(rootNavigator, /initialRouteName=\{applicationSessionReady \? ROUTES\.HOME : ROUTES\.ACCOUNT_ENTRY\}/);
  assert.match(rootNavigator, /key=\{applicationSessionReady \? "application" : "account"\}/);
  assert.match(rootNavigator, /applicationSessionReady \? \([\s\S]*?<Stack\.Group>[\s\S]*?name=\{ROUTES\.HOME\}[\s\S]*?<\/Stack\.Group>[\s\S]*?\) : null/);
  assert.match(rootNavigator, /name=\{ROUTES\.ACCOUNT_ENTRY\}[\s\S]*?initialParams=\{\{ initialMode: accountEntryMode === "login" \? "signIn" : "entry" \}\}/);
  assert.match(rootNavigator, /testID="account-session-restore-loading"/);
  assert.match(app, /<AppPreferencesProvider>[\s\S]*?<ProfileStoragePreparationGate>[\s\S]*?<PatternlyAccountProvider>[\s\S]*?<AppContent/);
  assert.match(app, /state\.kind === "profilePreparing"[\s\S]*?<ContentPreparationGate><AccountBootstrapCompletion \/><AppNavigation \/><\/ContentPreparationGate>/);
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
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 503)), "backendUnavailable");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 400, "recovery_code_invalid")), "invalidRecoveryCode");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 400, "recovery_code_used")), "recoveryCodeUsed");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 409, "purchase_attempt_active")), "conflict");
  assert.equal(classifyAccountFailure({ code: "auth/command-in-flight" }), "conflict");
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/user-not-found", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/invalid-credential", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/too-many-requests", message: "private provider detail" }), false);
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
