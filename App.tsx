import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { ContentPreparationGate } from "./src/content/application/ContentPreparationGate";
import { navigationTheme } from "./src/theme/navigationTheme";

export default function App() {
  return (
    <ContentPreparationGate>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </ContentPreparationGate>
  );
}
