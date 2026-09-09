import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { AUTH_INITIALIZATION_TIMEOUT_MS, canContinueAccountIdentityRefresh, classifyAccountFailure, createAccountSessionCoordinator, isNonEnumeratingRecoveryError, normalizeAccountSignOutPreparationFailure, planPasswordVerificationCommand, publishRefreshedAuthenticatedState, requiresPasswordEmailVerification, restoreAuthenticatedAfterSignOutFailure, type AccountState } from "./AccountSessionProvider";
import { createSensitiveCommandLane } from "./accountCommandGuards";
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

test("sign-out preparation failures restore the authenticated state before auth sign-out", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const authenticated = {
    accountData: {
      activeSessionBlocked: false,
      blockingConflictCode: null,
      lastFailureCode: null,
      lastSuccessfulSyncAt: null,
      pendingMutationCount: 0,
      preview: null,
      status: "synced",
    },
    backendUser: { id: "backend-user" },
    kind: "authenticated",
    user: { email: "learner@example.com", emailVerified: true, provider: "password", providers: ["password"], uid: "firebase-user" },
  } as unknown as Extract<AccountState, { kind: "authenticated" }>;
  const restored = restoreAuthenticatedAfterSignOutFailure(authenticated, "localDeletionFailure");
  assert.equal(restored.kind, "authenticated");
  assert.equal(restored.accountData.status, "synced");
  assert.equal(restored.accountData.lastFailureCode, "localDeletionFailure");
  const bindingMismatch = restoreAuthenticatedAfterSignOutFailure({ ...authenticated, accountData: { ...authenticated.accountData, lastFailureCode: "account_binding_mismatch" } }, "localDeletionFailure");
  assert.equal(bindingMismatch.accountData.lastFailureCode, "account_binding_mismatch");
  assert.equal(normalizeAccountSignOutPreparationFailure(new Error("injected storage failure")), "localDeletionFailure");
  assert.match(provider, /let prepared: Awaited<ReturnType<typeof prepareAccountSignOut>>;/);
  assert.match(provider, /prepared = await prepareAccountSignOut\(api, state\.backendUser\.id\);[\s\S]*?catch \(error\)[\s\S]*?restoreAuthenticatedAfterSignOutFailure\(state, failure\)/);
  assert.match(provider, /setState\(restoreAuthenticatedAfterSignOutFailure\(state, prepared\.failure\)\)/);
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
  assert.equal(en.termsRequired, "Confirm that you are at least 18 and agree to the Terms of Service to create an account.");
  assert.equal(pl.termsRequired, "Potwierdź, że masz co najmniej 18 lat, i zaakceptuj Warunki korzystania, aby utworzyć konto.");
  assert.match(screen, /account\.register\(email, password, acceptedTerms\)/u);
  assert.match(screen, /ROUTES\.TERMS_OF_SERVICE/gu);
  assert.match(screen, /ROUTES\.PRIVACY_POLICY/gu);
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
  const providerStart = screen.indexOf("function GoogleProviderButton");
  const providerEnd = screen.indexOf("function CredentialsForm", providerStart);

  assert.ok(providerStart >= 0 && providerEnd > providerStart);
  const accountEntry = screen.slice(0, providerStart);
  const provider = screen.slice(providerStart, providerEnd);

  assert.doesNotMatch(accountEntry, /Google\.useIdTokenAuthRequest/);
  assert.match(accountEntry, /firebaseConfig\.kind === "configured" \? \([\s\S]*?<GoogleProviderButton[\s\S]*?configuration=\{firebaseConfig\.value\}/);
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
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 409, "purchase_attempt_active")), "conflict");
  assert.equal(classifyAccountFailure({ code: "auth/command-in-flight" }), "conflict");
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/user-not-found", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/invalid-credential", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/too-many-requests", message: "private provider detail" }), false);
});
