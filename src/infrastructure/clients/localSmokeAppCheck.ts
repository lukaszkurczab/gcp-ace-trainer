import { developmentLoopbackHost } from "../developmentEndpoints";

/** Local integration fixture, never a Firebase attestation or a release credential. */
export function localSmokeAppCheckToken(input: {
  development: boolean;
  mode?: string;
  enabled?: string;
  apiOrigin?: string;
  authOrigin?: string;
  projectId?: string;
  token?: string;
}): string | null {
  const local = (value: string | undefined): boolean => {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === "http:" && url.hostname === developmentLoopbackHost
        && Boolean(url.port) && !url.username && !url.password
        && url.pathname === "/" && !url.search && !url.hash;
    } catch { return false; }
  };
  if (!input.development || input.mode !== "smoke" || input.enabled !== "true"
    || input.projectId !== "patternly-app-sandbox"
    || !local(input.apiOrigin) || !local(input.authOrigin)
    || !input.token || !/^[a-f0-9]{64}$/.test(input.token)) return null;
  return input.token;
}

export function readLocalSmokeAppCheckToken(): string | null {
  return localSmokeAppCheckToken({
    development: typeof __DEV__ !== "undefined" && __DEV__,
    mode: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    enabled: process.env.EXPO_PUBLIC_PATTERNLY_BACKEND_E2E,
    apiOrigin: process.env.EXPO_PUBLIC_PATTERNLY_API_ORIGIN,
    authOrigin: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN,
    projectId: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID,
    token: process.env.EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN,
  });
}
