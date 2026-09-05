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
const accountCommand = readFileSync("src/features/account/useAccountCommand.ts", "utf8");
const informationScreen = readFileSync("src/features/home/SettingsInformationScreen.tsx", "utf8");
const yourDataScreen = readFileSync("src/features/home/YourDataScreen.tsx", "utf8");
const legalScreen = readFileSync("src/features/home/LegalInformationScreen.tsx", "utf8");
const choiceRow = readFileSync("src/components/ChoiceRow.tsx", "utf8");

test("Settings exposes account and participant navigation actions plus conditional developer verification actions", () => {
  const navigationRows = settingsTab.match(/<SettingsNavigationRow\b/g) ?? [];
  assert.equal(navigationRows.length, 10);

  for (const callback of [
    "onOpenAccount",
    "onOpenAppearance",
    "onOpenLanguage",
    "onOpenLegalInformation",
    "onOpenNotifications",
    "onOpenPracticeSettings",
    "onOpenYourData",
  ]) {
    assert.match(settingsTab, new RegExp(`onPress=\\{${callback}\\}`));
  }
  assert.match(settingsTab, /testID="settings-backend-diagnostics"/);
  assert.match(settingsTab, /backendDiagnosticsConfigured \? \(/);
  assert.match(settingsTab, /premiumTestingAvailable \? \([\s\S]*?testID="settings-premium-testing"/);
  assert.match(settingsTab, /testID="settings-sign-out"/);
  assert.match(settingsTab, /testID="settings-language"/);
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
  assert.match(accountProvider, /signOut: \(\) => runWithAuth/);
  assert.match(accountProvider, /prepareAccountSignOut\(api, state\.backendUser\.id\)/);
});

test("Settings keeps the backend verification group explicitly development-only", () => {
  const groups = settingsTab.match(/<SettingsGroup\b/g) ?? [];
  assert.equal(groups.length, 5);
  assert.match(settingsTab, /title=\{text\.developerVerification\}/);
  assert.match(settingsTab, /backendDiagnosticsConfigured \? \([\s\S]*?\) : null/);
});

test("grouped settings rows follow the Figma 200% text geometry", () => {
  assert.match(listRow, /groupedRow:\s*\{[\s\S]*?borderRadius:\s*radius\.lg,[\s\S]*?minHeight:\s*63,[\s\S]*?paddingHorizontal:\s*spacing\.lg,[\s\S]*?paddingVertical:\s*14,/);
  assert.match(listRow, /listRowTitle/);
  assert.match(listRow, /listRowDetail/);
  assert.match(settingsGroup, /rows:\s*\{[\s\S]*?gap:\s*spacing\.sm,/);
  assert.match(settingsGroup, /titleGap\?: number/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{text\.app\} titleGap=\{0\}>/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{text\.learning\} titleGap=\{0\}>/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{text\.dataPrivacy\} titleGap=\{0\}>/);
  assert.match(settingsTab, /IconTile iconSize=\{24\} name=\{icon\} size=\{32\} tone="settings"/);
  assert.match(settingsTab, /name="chevron-right" size=\{20\}/);
  assert.match(settingsTab, /<ScreenHeader description=\{text\.settingsDescription\} title=\{text\.appSettings\}/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{text\.learning\} titleGap=\{0\}>/);
  assert.match(settingsGroup, /dividedRows:[\s\S]*?gap:\s*0/);
});

test("Settings description reflects app and practice preferences without account semantics", () => {
  const settingsEn = readFileSync("src/locales/en/settings.json", "utf8");
  const settingsPl = readFileSync("src/locales/pl/settings.json", "utf8");
  assert.match(settingsEn, /"settingsDescription": "Manage your app, practice, and privacy preferences\."/);
  assert.match(settingsPl, /"settingsDescription": "Zarządzaj preferencjami aplikacji, ćwiczeń i prywatności\."/);
  assert.doesNotMatch(settingsEn, /"settingsDescription": "[^"]*account[^"]*"/);
  assert.doesNotMatch(settingsPl, /"settingsDescription": "[^"]*kontem[^"]*"/);
});

test("Settings app identity follows the Figma footer geometry", () => {
  assert.match(settingsTab, /footer: \{[\s\S]*?gap: spacing\.xxs,[\s\S]*?paddingHorizontal: spacing\.lg \}/);
  assert.match(settingsTab, /footerTitle: \{ color: palette\.textPrimary, fontSize: 13, fontWeight: "600", lineHeight: 16 \}/);
  assert.match(settingsTab, /footerText: \{ color: palette\.textMuted, fontSize: 11, fontWeight: "400", lineHeight: 15 \}/);
  assert.match(settingsTab, /packageJson\.version/);
  assert.doesNotMatch(settingsTab, /expo-constants|buildNumber|versionCode/);
  assert.doesNotMatch(settingsTab, /Version 0\.1\.0|Build 1/);
});

test("Settings uses honest practice setup copy and keeps appearance values readable at large text", () => {
  const settingsEn = readFileSync("src/locales/en/settings.json", "utf8");
  const settingsPl = readFileSync("src/locales/pl/settings.json", "utf8");
  assert.match(settingsEn, /"practiceSettingsDetail": "Choose a practice session setup\."/);
  assert.match(settingsPl, /"practiceSettingsDetail": "Wybierz ustawienia sesji ćwiczeń\."/);
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
  assert.match(dataEn, /Confirmed account-owned records can be restored only through the explicit adoption flow/);
  assert.match(dataPl, /Potwierdzone rekordy konta można przywrócić wyłącznie przez jawny przepływ adopcji/);
  assert.doesNotMatch(dataEn, /It offers no backup or restore path/);
  assert.doesNotMatch(dataPl, /Nie oferuje backupu ani przywracania/);
});
