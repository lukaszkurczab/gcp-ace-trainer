export const AVAILABLE_ACCOUNT_SECURITY_SCREENS = ["delete", "email", "export", "password", "privacy"] as const;
export type AccountSecurityScreen = typeof AVAILABLE_ACCOUNT_SECURITY_SCREENS[number];

function isAccountSecurityScreen(value: string): value is AccountSecurityScreen {
  return AVAILABLE_ACCOUNT_SECURITY_SCREENS.some((screen) => screen === value);
}

/** Old persisted/deep-linked screen values are explicitly unavailable. */
export function resolveAccountSecurityScreen(value: unknown): AccountSecurityScreen | null {
  return typeof value === "string" && isAccountSecurityScreen(value) ? value : null;
}

export function readAccountSecurityRouteScreen(params: unknown): AccountSecurityScreen | null {
  if (typeof params !== "object" || params === null || Array.isArray(params) || !("screen" in params)) return null;
  return resolveAccountSecurityScreen(params.screen);
}
