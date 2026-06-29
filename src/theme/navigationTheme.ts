import { DefaultTheme, type Theme } from "@react-navigation/native";

import { colors } from "./tokens";

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.dark.background,
    border: colors.dark.border,
    card: colors.dark.surface,
    notification: colors.dark.primary,
    primary: colors.dark.primary,
    text: colors.dark.textPrimary
  }
};
