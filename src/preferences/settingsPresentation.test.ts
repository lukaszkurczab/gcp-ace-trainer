import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const settingsTab = readFileSync("src/features/home/tabs/SettingsTab.tsx", "utf8");
const listRow = readFileSync("src/components/ListRow.tsx", "utf8");
const settingsGroup = readFileSync("src/components/SettingsGroup.tsx", "utf8");
const infoBlock = readFileSync("src/components/InfoBlock.tsx", "utf8");
const appearanceSettings = readFileSync("src/features/home/AppearanceSettingsScreen.tsx", "utf8");
const languageSettings = readFileSync("src/features/home/LanguageSettingsScreen.tsx", "utf8");
const languageSettingsModel = readFileSync("src/features/home/languageSettingsModel.ts", "utf8");
const appPreferencesProvider = readFileSync("src/preferences/AppPreferencesProvider.tsx", "utf8");
const accountCommand = readFileSync("src/features/account/useAccountCommand.ts", "utf8");
const informationScreen = readFileSync("src/features/home/SettingsInformationScreen.tsx", "utf8");
const yourDataScreen = readFileSync("src/features/home/YourDataScreen.tsx", "utf8");
const yourDataPresentation = readFileSync("src/features/home/yourDataPresentation.ts", "utf8");
const legalScreen = readFileSync("src/features/home/LegalInformationScreen.tsx", "utf8");
const legalRequestsScreen = readFileSync("src/features/home/LegalRequestsScreen.tsx", "utf8");
const legalRequestSubmission = readFileSync("src/features/home/legalRequestSubmission.ts", "utf8");
const choiceRow = readFileSync("src/components/ChoiceRow.tsx", "utf8");
const premiumScreen = readFileSync("src/features/premium/PremiumPurchaseScreen.tsx", "utf8");

test("Settings exposes account and participant navigation actions plus conditional developer verification actions", () => {
  const navigationRows = settingsTab.match(/<SettingsNavigationRow\b/g) ?? [];
  assert.equal(navigationRows.length, 12);

  for (const callback of [
    "onOpenAccount",
    "onOpenAppearance",
    "onOpenLanguage",
    "onOpenLegalInformation",
    "onOpenNotifications",
    "onOpenPremium",
    "onOpenYourData",
  ]) {
    assert.match(settingsTab, new RegExp(`onPress=\\{${callback}\\}`));
  }
  assert.match(settingsTab, /onOpenGoal/);
  assert.match(settingsTab, /testID="settings-goal"/);
  assert.match(settingsTab, /remindersDetail: t\("remindersDetail"\)/);
  assert.match(settingsTab, /title=\{text\.reminders\}/);
  assert.doesNotMatch(settingsTab, /notificationsDetail|text\.notifications/);
  const settingsEn = JSON.parse(readFileSync("src/locales/en/settings.json", "utf8")) as Record<string, string>;
  const settingsPl = JSON.parse(readFileSync("src/locales/pl/settings.json", "utf8")) as Record<string, string>;
  assert.equal(settingsEn.reminders, "Reminders");
  assert.equal(settingsPl.reminders, "Przypomnienia");
  assert.equal(settingsEn.notifications, undefined);
  assert.equal(settingsEn.notificationsDetail, undefined);
  assert.equal(settingsPl.notifications, undefined);
  assert.equal(settingsPl.notificationsDetail, undefined);
  assert.match(settingsTab, /testID="settings-backend-diagnostics"/);
  assert.match(settingsTab, /backendDiagnosticsConfigured \? \(/);
  assert.match(settingsTab, /premiumTestingAvailable \? \([\s\S]*?testID="settings-premium-testing"/);
  assert.match(settingsTab, /testID="settings-sign-out"/);
  assert.match(settingsTab, /testID="settings-language"/);
  assert.doesNotMatch(settingsTab, /settings-practice|onOpenPracticeSettings/);
});

test("Legal information exposes distinct personal-rights and non-personal-recovery entries", () => {
  for (const id of ["complaint", "withdrawal", "privacy", "data-recovery", "suspension-appeal"]) assert.match(legalScreen, new RegExp(`testID=\"legal-request-${id}\"`));
  assert.equal(legalScreen.match(/testID="legal-request-/g)?.length, 5);
  assert.doesNotMatch(legalScreen, /legal-data-rights-|dataRightsVisible|SettingsBottomSheet/);
  assert.match(legalScreen, /kind: "complaint"/);
  assert.match(legalScreen, /kind: "withdrawal"/);
  assert.match(legalScreen, /kind: "suspension_appeal"/);
  assert.match(legalRequestsScreen, /authenticated: account\.state\.kind === "authenticated"/);
  assert.match(legalRequestsScreen, /account\.createPublicLegalRequest/);
  assert.match(legalRequestsScreen, /testID="legal-request-email"/);
  assert.match(legalScreen, /kind: "data_recovery"/);
  assert.match(legalScreen, /navigation\.navigate\(ROUTES\.PRIVACY_REQUESTS\)/);
  assert.match(legalRequestSubmission, /input\.kind !== "withdrawal" && !narrative/);
  assert.match(legalRequestSubmission, /\.\.\.\(narrative \? \{ narrative \} : \{\}\)/);
  assert.doesNotMatch(legalRequestsScreen, /mailto:/);
});

test("Legal information scopes missing public configuration to external support and keeps local documents available", () => {
  const legalEn = JSON.parse(readFileSync("src/locales/en/legal.json", "utf8")) as Record<string, string>;
  const legalPl = JSON.parse(readFileSync("src/locales/pl/legal.json", "utf8")) as Record<string, string>;

  assert.equal(legalEn.supportUnavailableTitle, "External support unavailable");
  assert.equal(legalPl.supportUnavailableTitle, "Zewnętrzna pomoc jest niedostępna");
  assert.match(legalEn.publicLinksUnconfiguredDescription ?? "", /support link is disabled/u);
  assert.match(legalEn.publicLinksInvalidDescription ?? "", /support link is disabled/u);
  assert.match(legalPl.publicLinksUnconfiguredDescription ?? "", /link do pomocy jest wyłączony/u);
  assert.match(legalPl.publicLinksInvalidDescription ?? "", /link do pomocy jest wyłączony/u);
  assert.equal(legalEn.publicLinksUnavailableTitle, undefined);
  assert.equal(legalPl.publicLinksUnavailableTitle, undefined);

  assert.match(legalScreen, /available \? null : <InfoBlock[\s\S]*?title=\{text\.supportUnavailableTitle\}/u);
  assert.match(legalScreen, /navigation\.navigate\(ROUTES\.PRIVACY_POLICY\)[\s\S]*?testID="legal-link-privacy"/u);
  assert.match(legalScreen, /navigation\.navigate\(ROUTES\.TERMS_OF_SERVICE\)[\s\S]*?testID="legal-link-terms"/u);
  assert.match(legalScreen, /available=\{link\.url !== null\}/u);
  assert.doesNotMatch(legalScreen, /publicLinksUnavailableTitle/u);
});

test("Legal request form keeps validation inline, field-specific, and API-free", () => {
  assert.match(legalRequestsScreen, /t\(`legalRequests\.kinds\.\$\{kind\}\.intro`\)[\s\S]*?isAuthenticated \? "" : `[\s\S]*?legalRequests\.guestIntro/u);
  assert.match(legalRequestsScreen, /type LegalRequestEmailError = "emailRequired"/u);
  assert.match(legalRequestsScreen, /type LegalRequestNarrativeError = "narrativeRequired"/u);
  assert.match(legalRequestsScreen, /const \[emailError, setEmailError\] = useState<LegalRequestEmailError \| null>\(null\)/u);
  assert.match(legalRequestsScreen, /const \[narrativeError, setNarrativeError\] = useState<LegalRequestNarrativeError \| null>\(null\)/u);
  assert.equal((legalRequestSubmission.match(/LEGAL_REQUEST_EMAIL_PATTERN/g) ?? []).length, 2);
  assert.match(legalRequestsScreen, /if \(submission\.kind === "validation_failure"\)[\s\S]*?setNarrativeError\(submission\.errors\.narrative\);[\s\S]*?setEmailError\(submission\.errors\.email\);[\s\S]*?return/u);
  assert.match(legalRequestsScreen, /testID="legal-request-email-error"/u);
  assert.match(legalRequestsScreen, /testID="legal-request-narrative-error"/u);
  assert.match(legalRequestsScreen, /accessibilityHint=\{emailErrorMessage\}[\s\S]*?accessibilityLabel=\{emailLabel\}[\s\S]*?styles\.inputError/u);
  assert.match(legalRequestsScreen, /accessibilityHint=\{narrativeErrorMessage\}[\s\S]*?accessibilityLabel=\{narrativeLabel\}[\s\S]*?styles\.inputError/u);
  assert.match(legalRequestsScreen, /setEmail\(value\); setEmailError\(null\)/u);
  assert.match(legalRequestsScreen, /setNarrative\(value\); setNarrativeError\(null\)/u);
  assert.match(legalRequestsScreen, /function openForm\(\)\s*\{\s*setEmailError\(null\);\s*setNarrativeError\(null\);\s*setFormVisible\(true\);/u);
  assert.match(legalRequestsScreen, /setTransactionId\(""\);\s*setEmailError\(null\);\s*setNarrativeError\(null\);\s*setFormVisible\(false\)/u);
  assert.doesNotMatch(legalRequestsScreen, /setFailure\(t\("legalRequests\.(?:emailRequired|narrativeRequired)"\)\)/u);
});

test("Settings account presentation names guest, authenticated, and unavailable states and keeps sign-out provider-owned", () => {
  const home = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
  const accountProvider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const settingsEn = readFileSync("src/locales/en/settings.json", "utf8");
  assert.match(settingsTab, /account: SettingsAccountPresentation/);
  assert.match(settingsTab, /account\.status === "guest"\s*\n\s*\? text\.signedOutAccount/);
  assert.match(settingsEn, /"signedOutAccount": "Sign in or create an account"/);
  assert.match(settingsEn, /"guestAccountDetail": "[^\n]*stays on this device[^\n]*Sign in or create an account/);
  assert.match(settingsTab, /account\.status === "verificationPending"[\s\S]*?text\.verificationPending/);
  assert.match(settingsTab, /account\.status === "guestAccessBlocked"[\s\S]*?text\.guestAccessBlocked/);
  assert.match(settingsEn, /"verificationPendingDetail": "Check your email to finish signing in\."/);
  assert.match(settingsEn, /"guestAccessBlockedDetail": "This saved progress belongs to another account\. Sign in to continue\."/);
  assert.doesNotMatch(settingsEn, /"(?:verificationPending|guestAccessBlocked)Detail": "[^\"]*(?:retry|sign out|sync status)[^\"]*"/i);
  assert.match(settingsTab, /if \(!account\.canSignOut\) return/);
  assert.match(settingsTab, /useAccountCommand/);
  assert.match(settingsTab, /disabled=\{busyAction !== null\}/);
  assert.match(accountCommand, /const busyRef = useRef\(false\)/);
  assert.match(accountCommand, /if \(busyRef\.current\) return/);
  assert.match(accountCommand, /if \(mountedRef\.current\) onResult\(result\)/);
  assert.match(settingsTab, /runCommand\("signOut", onSignOut/);
  assert.match(settingsTab, /testID="settings-sign-out-error"/);
  assert.doesNotMatch(settingsTab, /FirebaseAuth|auth\.signOut/);
  assert.match(home, /getSettingsAccountPresentation\(account\.state\)/);
  assert.match(home, /initialMode: "signIn"/);
  assert.match(home, /onSignOut=\{\(\) => account\.signOut\(\)\}/);
  assert.match(accountProvider, /signOut: \(\) => runAuthMutationWithAuth/);
  const localSignOut = accountProvider.slice(accountProvider.indexOf('signOut: () => runAuthMutationWithAuth'), accountProvider.indexOf('changePassword: (credentials, newPassword)'));
  assert.match(localSignOut, /performLocalAccountSignOut\(/);
  assert.match(localSignOut, /persistBlock: async \(\) => \{[\s\S]*?logoutControl\.blockAndQueueRevoke/);
  assert.match(localSignOut, /signOutFirebase: async \(\) => \{[\s\S]*?await auth\.signOut\(\)/);
  assert.doesNotMatch(localSignOut, /revokeSessions|synchronizeBoundAccount|clearAccountOwnedLocalData/);
});

test("Settings keeps the backend verification group explicitly development-only", () => {
  const groups = settingsTab.match(/<SettingsGroup\b/g) ?? [];
  assert.equal(groups.length, 5);
  assert.equal((settingsTab.match(/titleGap=\{spacing\.md\}/g) ?? []).length, 5);
  assert.match(settingsTab, /title=\{text\.developerVerification\}/);
  assert.match(settingsTab, /backendDiagnosticsConfigured \? \([\s\S]*?\) : null/);
});

test("grouped settings rows follow the Figma 200% text geometry", () => {
  assert.match(listRow, /groupedRow:\s*\{[\s\S]*?borderRadius:\s*radius\.lg,[\s\S]*?minHeight:\s*63,[\s\S]*?paddingHorizontal:\s*spacing\.lg,[\s\S]*?paddingVertical:\s*14,/);
  assert.match(listRow, /listRowTitle/);
  assert.match(listRow, /listRowDetail/);
  assert.match(settingsGroup, /rows:\s*\{[\s\S]*?gap:\s*spacing\.sm,/);
  assert.match(settingsGroup, /titleGap\?: number/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{t\("preferencesSecurity"\)\} titleGap=\{spacing\.md\}>/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{text\.learning\} titleGap=\{spacing\.md\}>/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{text\.dataPrivacy\} titleGap=\{spacing\.md\}>/);
  assert.match(settingsTab, /IconTile iconSize=\{24\} name=\{icon\} size=\{32\} tone="settings"/);
  assert.match(settingsTab, /name="chevron-right" size=\{20\}/);
  assert.match(settingsTab, /<ScreenHeader title=\{text\.appSettings\} \/>/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{text\.learning\} titleGap=\{spacing\.md\}>/);
  assert.match(settingsGroup, /dividedRows:[\s\S]*?gap:\s*0/);
});

test("Settings heading has no redundant description and locale keeps goal copy", () => {
  assert.doesNotMatch(settingsTab, /settingsDescription/);
  const settingsEn = readFileSync("src/locales/en/settings.json", "utf8");
  const settingsPl = readFileSync("src/locales/pl/settings.json", "utf8");
  assert.doesNotMatch(settingsEn, /"settingsDescription"/);
  assert.doesNotMatch(settingsPl, /"settingsDescription"/);
  assert.match(settingsEn, /"goal": "Goal"/);
  assert.match(settingsEn, /"goalDetail": "Set your learning goal and preferred practice days\."/);
  assert.match(settingsPl, /"goal": "Cel"/);
  assert.match(settingsPl, /"goalDetail": "Ustaw cel nauki i dni ćwiczeń\."/);
});

test("Premium keeps a localized Settings context while retaining the back action", () => {
  assert.match(premiumScreen, /<ScreenHeader backAction=\{\{ onPress: \(\) => navigation\.goBack\(\) \}\} context=\{t\("appSettings"\)\} title=\{t\("premiumTitle"\)\} \/>/);
  assert.doesNotMatch(premiumScreen, /context=\{t\("settings"\)\}/);
  const settingsEn = JSON.parse(readFileSync("src/locales/en/settings.json", "utf8")) as Record<string, unknown>;
  const settingsPl = JSON.parse(readFileSync("src/locales/pl/settings.json", "utf8")) as Record<string, unknown>;
  assert.equal(settingsEn.appSettings, "Settings");
  assert.equal(settingsPl.appSettings, "Ustawienia");
  assert.equal(settingsEn.settings, undefined);
  assert.equal(settingsPl.settings, undefined);
});

test("Your data keeps the Settings entry label and names its local header consistently", () => {
  assert.match(settingsTab, /testID="settings-your-data" title=\{text\.data\}/);
  assert.match(yourDataScreen, /<ScreenHeader backAction=\{\{ onPress: \(\) => navigation\.goBack\(\) \}\} context=\{t\("settings"\)\} contextTone="primary" title=\{t\("yourData"\)\} \/>/);
  const dataEn = JSON.parse(readFileSync("src/locales/en/data.json", "utf8")) as Record<string, unknown>;
  const dataPl = JSON.parse(readFileSync("src/locales/pl/data.json", "utf8")) as Record<string, unknown>;
  assert.equal(dataEn.settings, "Settings");
  assert.equal(dataEn.yourData, "Your data");
  assert.equal(dataPl.settings, "Ustawienia");
  assert.equal(dataPl.yourData, "Twoje dane");
});

test("Your data owns an exhaustive account-state action matrix and wires the mapped controls", () => {
  assert.match(yourDataPresentation, /export function getYourDataPresentation\(state: AccountState\)/u);
  assert.match(yourDataPresentation, /switch \(state\.kind\)/u);
  assert.match(yourDataPresentation, /function assertNever\(value: never\): never/u);
  for (const state of ["authenticated", "guest", "signedOut", "guestAccessBlocked", "verificationPending", "loading", "unavailable", "deletionPending", "signingOut", "deleting", "backendUnavailable", "revokedSession"]) {
    assert.match(yourDataPresentation, new RegExp(`case "${state}"`));
  }
  assert.match(yourDataPresentation, /auth_restore_timeout/);
  assert.match(yourDataPresentation, /firebase_unconfigured/);
  assert.match(yourDataPresentation, /public_environment_unconfigured/);
  assert.match(yourDataPresentation, /public_environment_invalid/);
  assert.match(yourDataScreen, /getYourDataPresentation\(account\.state\)/u);
  assert.match(yourDataScreen, /account\.retrySessionRestore\(\)/u);
  assert.match(yourDataScreen, /account\.retryPendingDeletion\(\)/u);
  assert.match(yourDataScreen, /account\.refreshAccountIdentity\(\)/u);
  assert.match(yourDataScreen, /account\.signOut\(\)/u);
  assert.match(yourDataScreen, /if \(busyRef\.current \|\| !activeRef\.current\) return/u);
  assert.match(yourDataScreen, /presentation\.action\.kind === "none" \? <ListRow/u);
  assert.match(yourDataScreen, /presentation\.details !== "none"/u);
  assert.match(yourDataScreen, /presentation\.privacyRequests \?/u);
  assert.match(yourDataScreen, /testID=\{presentation\.action\.testID\}/u);
  assert.match(yourDataPresentation, /reset: stateCopy === "authenticated" \|\| stateCopy === "guest"/u);
  for (const testID of ["data-local-reset", "data-local-reset-confirmation", "data-local-reset-scope", "data-local-reset-cancel", "data-local-reset-confirm", "data-local-reset-success", "data-local-reset-error", "data-local-reset-running"]) {
    assert.match(yourDataScreen, new RegExp(`testID="${testID}"`));
  }
  assert.match(yourDataScreen, /account\.resetLocalLearningHistory\(\)/u);
  assert.doesNotMatch(yourDataScreen, /testID="your-data-none"/u);
  for (const locale of ["en", "pl"]) {
    const data = JSON.parse(readFileSync(`src/locales/${locale}/data.json`, "utf8")) as Record<string, unknown>;
    assert.ok(data.state);
    assert.ok(data.actions);
    assert.ok(data.localReset);
    assert.equal(typeof (data.status as Record<string, unknown>).actionFailed, "string");
  }
});

test("Your data export copy matches the complete JSON scope and the system share or save action", () => {
  const en = JSON.parse(readFileSync("src/locales/en/data.json", "utf8")) as Record<string, any>;
  const pl = JSON.parse(readFileSync("src/locales/pl/data.json", "utf8")) as Record<string, any>;

  assert.equal(en.actions.export.title, "Share or download account data");
  assert.match(en.actions.export.summary, /account data, synced learning, and account activity/u);
  for (const phrase of ["legal acceptances", "purchase confirmations", "consumer cases", "device metadata", "sync metadata", "system share or save sheet", "cannot be imported"]) assert.match(en.details.accountBody, new RegExp(phrase, "u"));
  assert.equal(pl.actions.export.title, "Udostępnij lub pobierz dane konta");
  assert.match(pl.actions.export.summary, /danymi konta, synchronizowaną nauką i aktywnością konta/u);
  for (const phrase of ["akceptacje prawne", "potwierdzenia zakupów", "sprawy konsumenckie", "metadane urządzeń", "metadane synchronizacji", "systemowego arkusza udostępniania lub zapisu", "nie można go zaimportować"]) assert.match(pl.details.accountBody, new RegExp(phrase, "u"));
});

test("Settings app identity follows the Figma footer geometry", () => {
  assert.match(settingsTab, /footer: \{[\s\S]*?gap: spacing\.xxs,[\s\S]*?paddingHorizontal: spacing\.lg \}/);
  assert.match(settingsTab, /footerTitle: \{ color: palette\.textPrimary, fontSize: 13, fontWeight: "600", lineHeight: 16 \}/);
  assert.match(settingsTab, /footerText: \{ color: palette\.textMuted, fontSize: 11, fontWeight: "400", lineHeight: 15 \}/);
  assert.match(settingsTab, /packageJson\.version/);
  assert.doesNotMatch(settingsTab, /expo-constants|buildNumber|versionCode/);
  assert.doesNotMatch(settingsTab, /Version 0\.1\.0|Build 1/);
});

test("Settings keeps appearance values readable at large text", () => {
  assert.match(settingsTab, /const largeText = fontScale >= 1\.3/);
  assert.match(settingsTab, /const rowDetail = largeText && value \? `\$\{detail\}\\n\$\{value\}` : detail/);
  assert.match(settingsTab, /!largeText && value/);
});

test("shared supporting list-row text uses the Figma fractional line height", () => {
  assert.match(listRow, /listRowDetail/);
  const tokens = readFileSync("src/theme/tokens.ts", "utf8");
  assert.match(tokens, /listRowDetail:[\s\S]*?fontSize: 11,[\s\S]*?lineHeight: 15\.4,[\s\S]*?fontWeight: "400"/);
});

test("appearance selection owns the typed accessible radio choice flow", () => {
  assert.equal(existsSync("src/features/home/PreferenceSelectionScreen.tsx"), false);
  assert.match(appearanceSettings, /<View accessibilityLabel=\{t\("options"\)\} accessibilityRole="radiogroup"/);
  assert.match(appearanceSettings, /<ChoiceRow[\s\S]*selected=\{preferences\.appearance === option\.value\}[\s\S]*testID=\{`preference-option-\$\{option\.value\}`\}/);
  assert.match(appearanceSettings, /loading=\{savingValue === option\.value\}/);
  assert.match(appearanceSettings, /<InfoBlock accessibilityAlert[\s\S]*testID="appearance-save-error"/);
  assert.match(appearanceSettings, /testID="appearance-save-error"/);
  assert.match(appearanceSettings, /const savingRef = useRef<AppearancePreference \| null>\(null\)/);
  assert.match(appearanceSettings, /const mountedRef = useRef\(true\)/);
  assert.match(appearanceSettings, /if \(value === preferences\.appearance \|\| savingRef\.current !== null\) return/);
  assert.match(appearanceSettings, /if \(mountedRef\.current\) setSaveError\(true\)/);
  assert.match(choiceRow, /accessibilityRole="radio"/);
  assert.match(choiceRow, /loading\?: boolean/);
  assert.match(choiceRow, /detail\?: string/);
  assert.match(choiceRow, /!compact && detail \?/);
  assert.match(choiceRow, /accessibilityState=\{\{ busy: loading, disabled: isDisabled, selected \}\}/);
  assert.match(choiceRow, /minHeight:\s*72,[\s\S]*?paddingHorizontal:\s*14,[\s\S]*?paddingVertical:\s*spacing\.md/);
  assert.match(choiceRow, /height:\s*20,[\s\S]*?width:\s*20/);
  assert.match(choiceRow, /height:\s*8,[\s\S]*?width:\s*8/);
});

test("language selection owns the typed accessible radio choice flow", () => {
  assert.match(languageSettingsModel, /value: LanguagePreference/);
  assert.match(languageSettingsModel, /value: "system"/);
  assert.match(languageSettingsModel, /value: "en"/);
  assert.match(languageSettingsModel, /value: "pl"/);
  assert.match(languageSettings, /<View accessibilityLabel=\{t\("languageOptions"\)\} accessibilityRole="radiogroup"/);
  assert.match(languageSettings, /<ChoiceRow[\s\S]*selected=\{preferences\.language === option\.value\}[\s\S]*testID=\{`language-option-\$\{option\.value\}`\}/);
  assert.match(languageSettings, /loading=\{savingValue === option\.value\}/);
  assert.match(languageSettings, /<InfoBlock accessibilityAlert[\s\S]*testID="language-save-error"/);
  assert.match(languageSettings, /const savingRef = useRef<LanguagePreference \| null>\(null\)/);
  assert.match(languageSettings, /if \(value === preferences\.language \|\| savingRef\.current !== null\) return/);
  assert.match(languageSettings, /await preferences\.setLanguage\(value\)/);
  assert.match(appPreferencesProvider, /deviceLocale: AppLocale/);
  assert.match(appPreferencesProvider, /const deviceLocale = resolveSystemLocale\(\)/);
  assert.match(appPreferencesProvider, /settings\.language === "system" \? deviceLocale : settings\.language/);
  assert.match(languageSettings, /detail=\{option\.detailKey \? t\(option\.detailKey, \{ lng: preferences\.deviceLocale \}\) : undefined\}/);
  assert.match(languageSettingsModel, /detailKey\?: string/);
  assert.match(languageSettingsModel, /\{ detailKey: "languageSystemDetail", labelKey: "languageSystem", value: "system" \}/);
  assert.doesNotMatch(languageSettingsModel, /languageEnglishDetail|languagePolishDetail/);
});

test("System language detail follows the device locale independently from the selected app locale", () => {
  const settingsEn = JSON.parse(readFileSync("src/locales/en/settings.json", "utf8")) as Record<string, string>;
  const settingsPl = JSON.parse(readFileSync("src/locales/pl/settings.json", "utf8")) as Record<string, string>;
  const settingsByLocale = { en: settingsEn, pl: settingsPl } as const;

  for (const appLocale of ["en", "pl"] as const) {
    for (const deviceLocale of ["en", "pl"] as const) {
      const appStrings = settingsByLocale[appLocale];
      const deviceStrings = settingsByLocale[deviceLocale];

      assert.equal(appStrings.languageSystem, "System");
      assert.equal(
        deviceStrings.languageSystemDetail,
        deviceLocale === "en" ? "Follow your device language." : "Użyj języka urządzenia.",
        `${appLocale} app/${deviceLocale} device`,
      );
      assert.equal(appStrings.languageEnglishDetail, undefined);
      assert.equal(appStrings.languagePolishDetail, undefined);
    }
  }
});

test("InfoBlock exposes opt-in alert semantics for dynamic settings errors", () => {
  assert.match(infoBlock, /accessibilityAlert\?: boolean/);
  assert.match(infoBlock, /accessible=\{accessibilityAlert\}/);
  assert.match(infoBlock, /accessibilityLiveRegion=\{accessibilityAlert \? "polite" : undefined\}/);
  assert.match(infoBlock, /accessibilityRole=\{accessibilityAlert \? "alert" : undefined\}/);
});

test("appearance choices use the Figma preview variants without changing language choices", () => {
  assert.match(appearanceSettings, /appearancePreview=\{option\.value\}/);
  assert.match(choiceRow, /function AppearancePreview/);
  assert.match(choiceRow, /previewLightSurface/);
  assert.match(choiceRow, /previewDarkSurface/);
  assert.match(choiceRow, /height:\s*48,[\s\S]*?width:\s*60/);
  assert.match(choiceRow, /appearancePreview \? content : radio/);
  assert.match(choiceRow, /appearancePreview \? radio : content/);
});

test("settings bottom sheets use the Figma elevated shell and modal accessibility boundary", () => {
  const bottomSheet = readFileSync("src/components/SettingsBottomSheet.tsx", "utf8");
  const tokens = readFileSync("src/theme/tokens.ts", "utf8");
  assert.match(bottomSheet, /accessibilityViewIsModal style=\{(?:styles\.sheet|\[styles\.sheet,)/);
  assert.match(bottomSheet, /backgroundColor:\s*palette\.bottomSheet\.surface/);
  assert.match(bottomSheet, /borderTopLeftRadius:\s*radius\.sheet/);
  assert.match(bottomSheet, /shadowOffset:\s*\{ height:\s*-4, width:\s*0 \}/);
  assert.match(bottomSheet, /testID="settings-bottom-sheet-close"/);
  assert.match(bottomSheet, /KeyboardAvoidingView behavior=\{Platform\.OS === "ios" \? "padding" : "height"\}/);
  assert.match(tokens, /bottomSheet:\s*\{[\s\S]*?surface:\s*"#F7FAF9"[\s\S]*?border:\s*"#E3EAE9"/);
  assert.match(tokens, /bottomSheet:\s*\{[\s\S]*?surface:\s*"#0F172A"[\s\S]*?border:\s*"#1E293B"/);
});

test("information topics keep a stable locale-independent selection and explicit next-page affordance", () => {
  assert.match(informationScreen, /type InformationTopicSelection = Readonly/);
  assert.match(informationScreen, /const \[activeTopicSelection, setActiveTopicSelection\]/);
  assert.match(informationScreen, /sections\[activeTopicSelection\.sectionIndex\]\?\.topics\[activeTopicSelection\.topicIndex\]/);
  assert.match(informationScreen, /onPress=\{\(\) => setActiveTopicSelection\(\{ sectionIndex, topicIndex \}\)\}/);
  assert.match(informationScreen, /trailing=\{<Icon color=\{colors\.listRow\.icon\} name="chevron-right" size=\{20\} \/>\}/);
  assert.doesNotMatch(informationScreen, /useState<InformationTopic \| null>/);
  assert.doesNotMatch(yourDataScreen, /useAppPreferences|locale/);
  assert.doesNotMatch(legalScreen, /useAppPreferences|locale/);

  const dataEn = readFileSync("src/locales/en/data.json", "utf8");
  const dataPl = readFileSync("src/locales/pl/data.json", "utf8");
  assert.match(dataEn, /Supported account records can also sync to your account cloud and return through normal sync after you sign in/);
  assert.match(dataPl, /Obsługiwane rekordy konta mogą być także synchronizowane z chmurą konta i wrócić przez zwykłą synchronizację po zalogowaniu/);
  assert.match(dataEn, /normal sync can restore supported records from the account cloud/);
  assert.match(dataPl, /zwykła synchronizacja może przywrócić obsługiwane rekordy z chmury konta/);
  assert.match(dataEn, /completed session summaries and results/);
  assert.match(dataPl, /podsumowania i wyniki ukończonych sesji/);
  assert.match(dataEn, /Guest-data adoption is a separate choice that merges eligible progress from this device into the account/);
  assert.match(dataPl, /Adopcja danych gościa jest osobną decyzją, która łączy kwalifikujący się postęp z tego urządzenia z kontem/);
  assert.match(dataEn, /system share or save sheet for access and portability and cannot be imported into Patternly/);
  assert.match(dataPl, /systemowego arkusza udostępniania lub zapisu, służy dostępowi i przenoszeniu danych i nie można go zaimportować do Patternly/);
  assert.doesNotMatch(dataEn, /restored only through the explicit adoption flow/);
  assert.doesNotMatch(dataPl, /przywrócić wyłącznie przez jawny przepływ adopcji/);
  assert.doesNotMatch(dataEn, /It offers no backup or restore path/);
  assert.doesNotMatch(dataPl, /Nie oferuje backupu ani przywracania/);
});
