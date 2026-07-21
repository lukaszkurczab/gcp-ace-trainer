import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { ContentPreparationGate } from "./src/content/application/ContentPreparationGate";
import { AppPreferencesProvider, useAppPreferences } from "./src/preferences";
import { buildNavigationTheme } from "./src/theme/navigationTheme";

export default function App() {
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <AppNavigation />
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

function AppNavigation() {
  const preferences = useAppPreferences();
  const navigationTheme = buildNavigationTheme(preferences.colors);

  return (
    <ContentPreparationGate>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={preferences.colorMode === "dark" ? "light" : "dark"} />
        <RootNavigator />
      </NavigationContainer>
    </ContentPreparationGate>
  );
}
