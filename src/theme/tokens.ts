export const colors = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceMuted: "#F1F5F9",
    border: "#D8E0EA",
    text: "#172033",
    textMuted: "#64748B",
    primary: "#2563EB",
    primaryPressed: "#1D4ED8",
    primarySoft: "#DBEAFE",
    success: "#0F766E",
    warning: "#B45309",
    danger: "#B91C1C",
    dangerSoft: "#FEE2E2",
    shadow: "#0F172A"
  },
  dark: {
    background: "#101827",
    surface: "#182235",
    surfaceMuted: "#22304A",
    border: "#334155",
    text: "#F8FAFC",
    textMuted: "#CBD5E1",
    primary: "#60A5FA",
    primaryPressed: "#3B82F6",
    primarySoft: "#1E3A8A",
    success: "#5EEAD4",
    warning: "#FBBF24",
    danger: "#FCA5A5",
    dangerSoft: "#7F1D1D",
    shadow: "#000000"
  }
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999
} as const;

export const typography = {
  title: {
    fontSize: 30,
    lineHeight: 36,
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
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500"
  }
} as const;

export const shadows = {
  card: {
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2
  }
} as const;

export type ColorMode = keyof typeof colors;
export type AppColors = typeof colors.light;
