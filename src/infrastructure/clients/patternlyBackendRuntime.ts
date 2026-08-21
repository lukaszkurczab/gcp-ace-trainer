import {
  createFirebaseEmulatorIdTokenProvider,
  createPatternlyApiClient,
  type PatternlyApiClient,
} from "./PatternlyApiClientAdapter";

export type PatternlyBackendRuntimeConfig = Readonly<{
  apiOrigin: string;
  authEmulatorOrigin: string;
  email: string;
  password: string;
}>;

export type PatternlyBackendRuntime =
  | Readonly<{ kind: "disabled" }>
  | Readonly<{ kind: "invalid"; reason: "e2e_requires_development" | "missing_configuration" }>
  | Readonly<{ kind: "configured"; config: PatternlyBackendRuntimeConfig; client: PatternlyApiClient }>;

export function readPatternlyBackendRuntime(): PatternlyBackendRuntime {
  if (process.env.EXPO_PUBLIC_PATTERNLY_BACKEND_E2E !== "true") return Object.freeze({ kind: "disabled" });
  if (typeof __DEV__ !== "undefined" && !__DEV__) return Object.freeze({ kind: "invalid", reason: "e2e_requires_development" });
  const apiOrigin = process.env.EXPO_PUBLIC_PATTERNLY_API_ORIGIN;
  const authEmulatorOrigin = process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN;
  const email = process.env.EXPO_PUBLIC_PATTERNLY_E2E_EMAIL;
  const password = process.env.EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD;
  if (!apiOrigin || !authEmulatorOrigin || !email || !password) return Object.freeze({ kind: "invalid", reason: "missing_configuration" });
  const config = Object.freeze({ apiOrigin, authEmulatorOrigin, email, password });
  try {
    const client = createPatternlyApiClient({
      allowLocalHttpForSimulator: true,
      apiOrigin,
      getIdToken: createFirebaseEmulatorIdTokenProvider({ authEmulatorOrigin, email, password }),
    });
    return Object.freeze({ kind: "configured", config, client });
  } catch {
    return Object.freeze({ kind: "invalid", reason: "missing_configuration" });
  }
}

export function isPatternlyBackendE2eConfigured(): boolean {
  return readPatternlyBackendRuntime().kind !== "disabled";
}
