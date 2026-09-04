import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { AUTH_INITIALIZATION_TIMEOUT_MS, classifyAccountFailure, createAccountSessionCoordinator, isNonEnumeratingRecoveryError, planPasswordVerificationCommand, requiresPasswordEmailVerification } from "./AccountSessionProvider";
import { parseConfiguredPublicEnvironment } from "../../infrastructure/clients/publicEnvironment";
import { PatternlyApiClientError } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { configurePatternlyAppCheckTokenProvider, getPatternlyAppCheckToken } from "../../infrastructure/clients/patternlyAppCheckToken";
import { parseFirebaseClientConfiguration } from "../../infrastructure/firebase/publicConfig";
import { AUTH_USER_STORAGE_KEY, createSecureAuthPersistence, redactPersistedAuthUser } from "../../infrastructure/firebase/secureAuthPersistence";
import { requiresVerifiedPasswordIdentity } from "../../infrastructure/runtime/runtimeMode";

const publicEnvironment = {
  apiOrigin: "https://api.patternly.example",
  androidAppLinkHost: "app.patternly.example",
  authActionOrigin: "https://auth.patternly.example",
  authRedirectDomain: "auth.patternly.example",
  environment: "sandbox",
  iosAssociatedDomain: "applinks:app.patternly.example",
  privacyUrl: "https://patternly.example/privacy",
  publicDeletionUrl: "https://patternly.example/delete",
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

test("only the explicit local smoke runtime finalizes every password-identity command without verification side effects", () => {
  const unverifiedPassword = { email: "learner@example.com", emailVerified: false, provider: "password", uid: "password-user" } as const;
  const verifiedPassword = { ...unverifiedPassword, emailVerified: true } as const;
  const unverifiedGoogle = { ...unverifiedPassword, provider: "google" } as const;

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
  assert.match(en.discardGuestDataDescription ?? "", /Guest progress will be removed/u);
  assert.match(en.discardGuestDataDescription ?? "", /account.?s progress/u);
  assert.match(en.recoveryCodesDescription ?? "", /10 single-use codes/u);
  assert.match(en.recoveryCodesSaveRequired ?? "", /before continuing/u);
  assert.equal(pl.accountEntryContinue, "Dalej");
  assert.match(pl.discardGuestDataDescription ?? "", /Postęp gościa zostanie usunięty/u);
  assert.match(pl.discardGuestDataDescription ?? "", /Dane konta pozostaną bez zmian/u);
  assert.match(pl.recoveryCodesDescription ?? "", /10 jednorazowych kodów/u);
});

test("account entry owns one terminal choice and keeps synced account controls separate", () => {
  const screen = readFileSync("src/features/account/AccountEntryScreen.tsx", "utf8");
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");

  assert.match(screen, /accountData\.status === "synced"/);
  assert.match(screen, /accountData\.status === "previewReady"/);
  assert.match(screen, /testID="account-entry-choice"/);
  assert.match(screen, /testID="account-keep-progress-toggle"/);
  assert.match(screen, /testID="account-copy-recovery-codes"/);
  assert.match(screen, /testID="account-entry-continue"/);
  assert.match(screen, /testID="account-recovery-codes-saved-checkbox"/);
  assert.match(screen, /account\.discardGuestData\(\)/);
  assert.match(screen, /account\.confirmAdoption\(resolutions\)/);
  assert.doesNotMatch(screen, /testID="account-authenticated"/);
  assert.doesNotMatch(screen, /testID="account-adoption-confirm"/);
  assert.doesNotMatch(screen, /text\.(?:preserve|upload|restore|deduplicated|decisions|keepGuest\b|keepAccount\b|confirmAdoption\b)/);
  assert.match(provider, /issueRecoveryCodes: \(password\?: string\)/);
  assert.match(provider, /discardGuestData: \(\) => runWithAuth/);
  assert.match(provider, /const issued = await api\.issueRecoveryCodes\(\)/);
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
  assert.match(screen, /account\.state\.kind === "guest" && navigation\.canGoBack\(\)[\s\S]*?navigation\.goBack\(\);[\s\S]*?account\.continueAsGuest\(\);/);
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
  assert.match(screen, /termsUnavailable.*account-terms-unavailable|account-terms-unavailable.*termsUnavailable/);
  assert.match(screen, /providerContent:[\s\S]*?minWidth: 0/);
  assert.doesNotMatch(screen, /providerIcon:[\s\S]*?position: "absolute"/);
  assert.doesNotMatch(screen, /themeColors\.(?:dark|light)|#[0-9a-f]{3,8}/i);
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

  assert.match(authClient, /onUserChanged: \(listener\) => onAuthStateChanged\(auth, \(user\) => \{\s*current = user;\s*listener\(user \? snapshot\(user\) : null\);/);
  assert.doesNotMatch(authClient, /onUserChanged:[^\n]*listener\(current \? snapshot\(current\) : null\)/);
  assert.match(rootNavigator, /state\.kind === "loading"[\s\S]*?<LoadingState[^>]*title=\{t\("Restoring session"\)\}/);
  assert.match(rootNavigator, /applicationSessionReady = state\.kind === "guest" \|\| state\.kind === "signingOut" \|\| state\.kind === "deleting" \|\| \(state\.kind === "authenticated" && state\.accountData\.status === "synced"\)/);
  assert.match(rootNavigator, /initialRouteName=\{applicationSessionReady \? ROUTES\.HOME : ROUTES\.ACCOUNT_ENTRY\}/);
  assert.match(rootNavigator, /key=\{applicationSessionReady \? "application" : "account"\}/);
  assert.match(rootNavigator, /applicationSessionReady \? \([\s\S]*?<Stack\.Group>[\s\S]*?name=\{ROUTES\.HOME\}[\s\S]*?<\/Stack\.Group>[\s\S]*?\) : null/);
  assert.match(rootNavigator, /name=\{ROUTES\.ACCOUNT_ENTRY\}[\s\S]*?initialParams=\{\{ initialMode: "entry" \}\}/);
  assert.match(rootNavigator, /testID="account-session-restore-loading"/);
  assert.match(app, /<AppPreferencesProvider>[\s\S]*?<ContentPreparationGate>[\s\S]*?<PatternlyAccountProvider>[\s\S]*?<AppNavigation/);
  assert.doesNotMatch(app, /<AppNavigation>[\s\S]*?<ContentPreparationGate>/);
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
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 503)), "backendUnavailable");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 400, "recovery_code_invalid")), "invalidRecoveryCode");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 400, "recovery_code_used")), "recoveryCodeUsed");
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/user-not-found", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/invalid-credential", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/too-many-requests", message: "private provider detail" }), false);
});
