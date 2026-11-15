import "./infrastructure/identity/installNativeSha256";
import { NavigationContainer } from "@react-navigation/native";
import { useEffect, useSyncExternalStore } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "./i18n";
import { RootNavigator } from "./navigation/RootNavigator";
import { ContentPreparationGate } from "./content/application/ContentPreparationGate";
import { AppPreferencesProvider, useAppPreferences } from "./preferences";
import { buildNavigationTheme } from "./theme/navigationTheme";
import { PatternlyAccountProvider, usePatternlyAccount } from "./application/account/AccountSessionProvider";
import { ProfileStoragePreparationGate } from "./application/account/ProfileStoragePreparationGate";
import { AccountForegroundRefreshSidecar } from "./application/account/AccountForegroundRefreshSidecar";
import { ProfileTransitionSurface } from "./content/application/startupPreparationSurfaces";
import { Q13StorageReceiptHost } from "./application/runtimeAuditability/Q13StorageReceiptHost";
import { AndroidClockProbeHost } from "./application/runtimeAuditability/AndroidClockProbeHost";
import { isProfileTransitionActive, onProfileTransitionChanged, reloadForProfileTransition } from "./storage/repositories/profileStorageRepository";
import { isParallelBootEnabled, startBundledContentPrefetch } from "./application/bootstrap/parallelBoot";
import { contentPackageRuntimeOwner } from "./application/contentPackageRuntimeOwner";
import { installProgressSnapshotPersistence } from "./application/account/progressSnapshotPersistence";

installProgressSnapshotPersistence();

export default function RegularApplicationRoot() {
  // T2.3: verify bundled content while profile storage, auth and the account
  // bootstrap wait on native I/O and the network. Child effects (storage
  // preparation, auth setup) have already started when this one runs.
  useEffect(() => {
    if (!isParallelBootEnabled()) return;
    const handle = setTimeout(() => { void startBundledContentPrefetch(() => contentPackageRuntimeOwner.verifyBundledPackages()); }, 0);
    return () => clearTimeout(handle);
  }, []);
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
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

