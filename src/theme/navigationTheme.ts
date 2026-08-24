import { DefaultTheme, type Theme } from "@react-navigation/native";

import { ambient, type AppColors } from "./tokens";

export function buildNavigationTheme(colors: AppColors): Theme {
  return {
    ...DefaultTheme,
    dark: colors.background === ambient.canvas,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      border: colors.border,
      card: colors.surface,
      notification: colors.primary,
      primary: colors.primary,
      text: colors.textPrimary,
    },
  };
}
