export const colors = {
  light: {
    background: "#F6F8FB",
    surface: "#FFFFFF",
    elevatedSurface: "#F9FBFE",
    border: "#D9E2EC",
    borderStrong: "#B9C6D4",
    textPrimary: "#132033",
    textSecondary: "#506176",
    textMuted: "#7B8798",
    primary: "#2563EB",
    primaryPressed: "#1D4ED8",
    primarySoft: "#E8F0FF",
    success: "#15803D",
    successSoft: "#E8F7EE",
    warning: "#B45309",
    warningSoft: "#FFF4E5",
    danger: "#B42318",
    dangerSoft: "#FDECEC",
    info: "#0369A1",
    infoSoft: "#E7F5FD",
    accentPurple: "#7C3AED",
    accentPurpleSoft: "#F1ECFF",
    accentTeal: "#0F766E",
    accentTealSoft: "#E6F6F4",
    accentOrange: "#C2410C",
    accentOrangeSoft: "#FFF1E7",
    shadow: "#152033"
  },
  dark: {
    background: "#0C1324",
    surface: "#111827",
    elevatedSurface: "#1E293B",
    border: "#263247",
    borderStrong: "#334155",
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    primary: "#8B5CF6",
    primaryPressed: "#7C3AED",
    primarySoft: "#2B2147",
    success: "#6EE7A8",
    successSoft: "#123B2A",
    warning: "#F6B44B",
    warningSoft: "#442B0B",
    danger: "#FDA29B",
    dangerSoft: "#4A1715",
    info: "#38BDF8",
    infoSoft: "#0B344A",
    accentPurple: "#B99CFF",
    accentPurpleSoft: "#2B2147",
    accentTeal: "#5EEAD4",
    accentTealSoft: "#143A38",
    accentOrange: "#FDBA74",
    accentOrangeSoft: "#43240F",
    shadow: "#020617"
  }
} as const;

export function colorWithOpacity(hexColor: string, opacity = 1): string {
  const normalized = hexColor.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999
} as const;

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700"
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700"
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700"
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400"
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600"
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400"
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500"
  }
} as const;

export const shadows = {
  none: {
    shadowOpacity: 0,
    elevation: 0
  },
  card: {
    shadowColor: colors.dark.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 1
  },
  elevated: {
    shadowColor: colors.dark.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3
  }
} as const;

export type ColorMode = keyof typeof colors;
export type AppColors = typeof colors.dark;
