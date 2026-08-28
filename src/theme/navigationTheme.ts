import { DefaultTheme, type Theme } from "@react-navigation/native";

import type { AppColors, ColorMode } from "./tokens";

export function buildNavigationTheme(colors: AppColors, colorMode: ColorMode): Theme {
  return {
    ...DefaultTheme,
    dark: colorMode === "dark",
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
