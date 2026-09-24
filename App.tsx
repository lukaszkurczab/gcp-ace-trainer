import { NavigationContainer } from "@react-navigation/native";
import { useSyncExternalStore } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "./src/i18n";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ContentPreparationGate } from "./src/content/application/ContentPreparationGate";
import { AppPreferencesProvider, useAppPreferences } from "./src/preferences";
import { buildNavigationTheme } from "./src/theme/navigationTheme";
import { PatternlyAccountProvider, usePatternlyAccount } from "./src/application/account/AccountSessionProvider";
import { AccountForegroundRefreshSidecar } from "./src/application/account/AccountForegroundRefreshSidecar";
import { RecoveryCodeClipboardGuard } from "./src/infrastructure/security/RecoveryCodeClipboardGuard";
import { Button, LoadingState, Screen } from "./src/components";
import { isProfileTransitionActive, onProfileTransitionChanged, reloadForProfileTransition } from "./src/infrastructure/storage/mmkvClient";
import { useTranslation } from "react-i18next";

export default function App() {
  return (
    <SafeAreaProvider>
      <RecoveryCodeClipboardGuard />
      <AppPreferencesProvider>
        <ContentPreparationGate>
          <PatternlyAccountProvider>
            <AccountForegroundRefreshSidecar />
            <AppNavigation />
          </PatternlyAccountProvider>
        </ContentPreparationGate>
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

function AppNavigation() {
  const preferences = useAppPreferences();
  const { state } = usePatternlyAccount();
  const profileTransition = useSyncExternalStore(onProfileTransitionChanged, isProfileTransitionActive, () => false);
  const navigationTheme = buildNavigationTheme(preferences.colors, preferences.colorMode);
  const sessionKey = state.kind === "authenticated" || state.kind === "guest" || state.kind === "signingOut" || state.kind === "deleting"
    ? "application-session"
    : "account-entry";

  if (profileTransition) return <ProfileTransitionSurface />;

  return (
    <NavigationContainer key={sessionKey} theme={navigationTheme}>
      <StatusBar style={preferences.colorMode === "dark" ? "light" : "dark"} />
      <RootNavigator />
    </NavigationContainer>
  );
}

function ProfileTransitionSurface() {
  const { t } = useTranslation("account");
  return (
    <Screen>
      <LoadingState showLogo testID="profile-transition-required" title={t("profileTransitionTitle")} description={t("profileTransitionDescription")} />
      <Button onPress={() => { void reloadForProfileTransition().catch(() => undefined); }} testID="profile-transition-retry">
        {t("profileTransitionRetry")}
      </Button>
    </Screen>
  );
}
