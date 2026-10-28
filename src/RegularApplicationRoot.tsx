import { NavigationContainer } from "@react-navigation/native";
import { useSyncExternalStore } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "./i18n";
import { RootNavigator } from "./navigation/RootNavigator";
import { ContentPreparationGate } from "./content/application/ContentPreparationGate";
import { AppPreferencesProvider, useAppPreferences } from "./preferences";
import { buildNavigationTheme } from "./theme/navigationTheme";
import { PatternlyAccountProvider, usePatternlyAccount } from "./application/account/AccountSessionProvider";
import { ProfileStoragePreparationGate } from "./application/account/ProfileStoragePreparationGate";
import { RetiredAccountSecretsCleanupHost } from "./application/account/RetiredAccountSecretsCleanupHost";
import { AccountForegroundRefreshSidecar } from "./application/account/AccountForegroundRefreshSidecar";
import { ProfileTransitionSurface } from "./content/application/startupPreparationSurfaces";
import { Q13StorageReceiptHost } from "./application/runtimeAuditability/Q13StorageReceiptHost";
import { AndroidClockProbeHost } from "./application/runtimeAuditability/AndroidClockProbeHost";
import { isProfileTransitionActive, onProfileTransitionChanged, reloadForProfileTransition } from "./storage/repositories/profileStorageRepository";

export default function RegularApplicationRoot() {
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <RetiredAccountSecretsCleanupHost />
        <ProfileStoragePreparationGate>
          <PatternlyAccountProvider>
            <AccountForegroundRefreshSidecar />
            <Q13StorageReceiptHost />
            <AndroidClockProbeHost />
            <AppContent />
          </PatternlyAccountProvider>
        </ProfileStoragePreparationGate>
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { state, completeProfilePreparation, profilePreparationHandoffToken } = usePatternlyAccount();
  const needsContent = state.kind === "profilePreparing" || state.kind === "guest" || state.kind === "authenticated" || state.kind === "localOffline" || state.kind === "signingOut" || state.kind === "deleting";
  return needsContent
    ? <ContentPreparationGate completeAccountPreparation={completeProfilePreparation} handoffToken={profilePreparationHandoffToken}><AppNavigation /></ContentPreparationGate>
    : <AppNavigation />;
}

function AppNavigation() {
  const preferences = useAppPreferences();
  const { state, isMaterializedAccountTransition } = usePatternlyAccount();
  const profileTransition = useSyncExternalStore(onProfileTransitionChanged, isProfileTransitionActive, () => false);
  const navigationTheme = buildNavigationTheme(preferences.colors, preferences.colorMode);
  const sessionKey = state.kind === "authenticated" || state.kind === "guest" || state.kind === "localOffline" || state.kind === "signingOut" || state.kind === "deleting"
    ? "application-session"
    : "account-entry";

  if (profileTransition) return isMaterializedAccountTransition ? <ProfileTransitionSurface /> : <ProfileTransitionSurface onRetry={() => { void reloadForProfileTransition().catch(() => undefined); }} />;

  return (
    <NavigationContainer key={sessionKey} theme={navigationTheme}>
      <StatusBar style={preferences.colorMode === "dark" ? "light" : "dark"} />
      <RootNavigator />
    </NavigationContainer>
  );
}

