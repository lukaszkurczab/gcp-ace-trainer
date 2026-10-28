import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppPreferencesProvider, useAppPreferences } from "../../preferences";
import { PracticeSessionScreen } from "../../features/practice/PracticeSessionScreen";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation/types";
import type { PracticeSessionRouteParams } from "../../features/practice/sessionConfig";
import { buildNavigationTheme } from "../../theme/navigationTheme";

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Minimal real navigator host for the isolated persisted Coding practice probe. */
export function Persist13PracticeUiHost({ routeParams }: Readonly<{ routeParams: PracticeSessionRouteParams }>) {
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <Persist13PracticeUiNavigation routeParams={routeParams} />
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

function Persist13PracticeUiNavigation({ routeParams }: Readonly<{ routeParams: PracticeSessionRouteParams }>) {
  const preferences = useAppPreferences();
  const { i18n, ready: translationsReady } = useTranslation("common");
  const navigationTheme = buildNavigationTheme(preferences.colors, preferences.colorMode);

  if (!preferences.ready || !translationsReady || i18n.language !== preferences.locale) {
    return <View style={{ flex: 1, backgroundColor: preferences.colors.background }} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={preferences.colorMode === "dark" ? "light" : "dark"} />
      <Stack.Navigator initialRouteName={ROUTES.PRACTICE_SESSION}>
        <Stack.Screen
          name={ROUTES.PRACTICE_SESSION}
          component={PracticeSessionScreen}
          initialParams={routeParams}
          options={{ headerShown: false, title: "Practice Session" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
