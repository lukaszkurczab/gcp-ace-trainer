import { DefaultTheme, type Theme } from "@react-navigation/native";

import { colors } from "./tokens";

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.light.background,
    border: colors.light.border,
    card: colors.light.surface,
    notification: colors.light.primary,
    primary: colors.light.primary,
    text: colors.light.textPrimary
  }
};
