import { sha256Utf8 } from "../identity/sha256";
import { parseConfiguredPublicEnvironment } from "../clients/publicEnvironment";
import { parsePatternlyRuntimeMode } from "./runtimeMode";

export type EnvironmentIdentity = Readonly<{
  fingerprint: string;
  mode: "smoke" | "sandbox" | "release";
  apiOrigin: string;
  firebaseProjectId: string;
}>;

type Inputs = Readonly<Record<string, string | undefined>>;

/** One data-ownership identity for the whole installed application, including SDK caches.
 * Marketing links, login credentials, build numbers and checkout switches are not identity.
 * Public provider keys are hashed here and never persisted as configuration payloads. */
export function createEnvironmentIdentity(environment: Inputs): EnvironmentIdentity {
  const mode = parsePatternlyRuntimeMode(environment.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE);
  const required = (key: string): string => {
    const value = environment[key];
    if (!value || value.trim() !== value) throw new Error("environment_identity_configuration_invalid");
    return value;
  };
  if (!mode) throw new Error("environment_identity_configuration_invalid");
  let apiOrigin: string;
  let authEmulatorOrigin: string | null = null;
  if (mode === "smoke") {
    const loopback = (key: string): string => {
      const value = new URL(required(key));
      if (value.protocol !== "http:" || value.hostname !== "127.0.0.1" || value.pathname !== "/" || value.search || value.hash || value.username || value.password) throw new Error("environment_identity_configuration_invalid");
      return value.origin;
    };
    if (environment.EXPO_PUBLIC_PATTERNLY_BACKEND_E2E !== "true") throw new Error("environment_identity_configuration_invalid");
    apiOrigin = loopback("EXPO_PUBLIC_PATTERNLY_API_ORIGIN");
    authEmulatorOrigin = loopback("EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN");
  } else {
    const configured = parseConfiguredPublicEnvironment(JSON.parse(required("EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT")) as unknown);
    if (configured.environment !== (mode === "release" ? "production" : "sandbox")
      || ["EXPO_PUBLIC_PATTERNLY_BACKEND_E2E", "EXPO_PUBLIC_PATTERNLY_API_ORIGIN", "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN"].some((key) => Boolean(environment[key]))) throw new Error("environment_identity_configuration_invalid");
    apiOrigin = new URL(configured.apiOrigin).origin;
  }
  const firebaseProjectId = required("EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID");
  const fingerprint = sha256Utf8(JSON.stringify([
    "patternly.environment-identity.v1", mode, apiOrigin, authEmulatorOrigin,
    firebaseProjectId, required("EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID"), required("EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN"),
    // Present even while checkout is disabled: enabling checkout must not silently change ownership.
    environment.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY || null,
  ]));
  return Object.freeze({ fingerprint, mode, apiOrigin, firebaseProjectId });
}

/** Direct property reads are required for Expo's compile-time public env replacement. */
export function readEnvironmentIdentity(): EnvironmentIdentity {
  return createEnvironmentIdentity({
    EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT,
    EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: process.env.EXPO_PUBLIC_PATTERNLY_BACKEND_E2E,
    EXPO_PUBLIC_PATTERNLY_API_ORIGIN: process.env.EXPO_PUBLIC_PATTERNLY_API_ORIGIN,
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN,
    EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID,
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY,
  });
}
