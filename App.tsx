import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "./src/i18n";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ContentPreparationGate } from "./src/content/application/ContentPreparationGate";
import { AppPreferencesProvider, useAppPreferences } from "./src/preferences";
import { buildNavigationTheme } from "./src/theme/navigationTheme";
import { PatternlyAccountProvider, usePatternlyAccount } from "./src/application/account/AccountSessionProvider";

export default function App() {
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <PatternlyAccountProvider>
          <AppNavigation />
        </PatternlyAccountProvider>
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

function AppNavigation() {
  const preferences = useAppPreferences();
  const { state } = usePatternlyAccount();
  const navigationTheme = buildNavigationTheme(preferences.colors);
  const sessionKey = state.kind === "authenticated" || state.kind === "guest" || state.kind === "signingOut" || state.kind === "deleting"
    ? "application-session"
    : "account-entry";

  return (
    <ContentPreparationGate>
      <NavigationContainer key={sessionKey} theme={navigationTheme}>
        <StatusBar style={preferences.colorMode === "dark" ? "light" : "dark"} />
        <RootNavigator />
      </NavigationContainer>
    </ContentPreparationGate>
  );
}
