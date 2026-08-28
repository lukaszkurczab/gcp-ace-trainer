import type { ConfiguredPublicEnvironment, PublicEnvironment } from "../clients/publicEnvironment";
import { developmentLoopbackHost } from "../developmentEndpoints";
import { isPatternlySmokeRuntime } from "../runtime/runtimeMode";

export type PublicLegalLinks = Readonly<Pick<ConfiguredPublicEnvironment, "privacyUrl" | "termsUrl" | "supportUrl" | "publicDeletionUrl">>;

export type PublicLegalLinksResult =
  | Readonly<{ kind: "configured"; value: PublicLegalLinks }>
  | Readonly<{ kind: "unavailable"; reason: "invalid_public_environment" | "no_public_environment_configuration" }>;

export type FirebaseClientConfiguration = Readonly<{
  apiKey: string;
  appId: string;
  authDomain: string;
  projectId: string;
  googleAndroidClientId: string;
  googleIosClientId: string;
  googleWebClientId: string;
}>;

export type FirebaseClientConfigurationResult =
  | Readonly<{ kind: "configured"; value: FirebaseClientConfiguration }>
  | Readonly<{ kind: "unavailable"; reason: "missing_configuration" | "invalid_configuration" }>;

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.trim() === value;
const isHostname = (value: unknown): value is string => {
  if (!isNonEmptyString(value) || /[/:?#@]/u.test(value)) return false;
  try {
    const parsed = new URL(`https://${value}`);
    return parsed.hostname === value && parsed.port === "";
  } catch {
    return false;
  }
};

export function parseFirebaseClientConfiguration(input: unknown): FirebaseClientConfigurationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return Object.freeze({ kind: "unavailable", reason: "invalid_configuration" });
  }
  const source = input as Record<string, unknown>;
  const required = ["apiKey", "appId", "authDomain", "projectId", "googleAndroidClientId", "googleIosClientId", "googleWebClientId"] as const;
  if (required.some((key) => !isNonEmptyString(source[key]))) {
    return Object.freeze({ kind: "unavailable", reason: "missing_configuration" });
  }
  if (!isHostname(source.authDomain) || !/^[a-z0-9-]+$/u.test(source.projectId as string) || !/^[A-Za-z0-9:_-]+$/u.test(source.appId as string)) {
    return Object.freeze({ kind: "unavailable", reason: "invalid_configuration" });
  }
  return Object.freeze({
    kind: "configured",
    value: Object.freeze({
      apiKey: source.apiKey as string,
      appId: source.appId as string,
      authDomain: source.authDomain as string,
      googleAndroidClientId: source.googleAndroidClientId as string,
      googleIosClientId: source.googleIosClientId as string,
      googleWebClientId: source.googleWebClientId as string,
      projectId: source.projectId as string,
    }),
  });
}

export function readFirebaseClientConfiguration(): FirebaseClientConfigurationResult {
  return parseFirebaseClientConfiguration({
    apiKey: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY,
    appId: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID,
    authDomain: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN,
    googleAndroidClientId: process.env.EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID,
    googleWebClientId: process.env.EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID,
    projectId: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID,
  });
}

export function readPublicEnvironmentFromRuntime(): PublicEnvironment {
  if (isPatternlySmokeRuntime()) return Object.freeze({ kind: "unconfigured", reason: "no_public_environment_configuration" });
  const encoded = process.env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT;
  if (!encoded) return Object.freeze({ kind: "unconfigured", reason: "no_public_environment_configuration" });
  try {
    const value: unknown = JSON.parse(encoded);
    const { parseConfiguredPublicEnvironment } = require("../clients/publicEnvironment") as typeof import("../clients/publicEnvironment");
    return Object.freeze({ kind: "configured", value: parseConfiguredPublicEnvironment(value) });
  } catch {
    return Object.freeze({ kind: "unconfigured", reason: "invalid_public_environment" });
  }
}

/**
 * The Firebase Auth Emulator is a local development-E2E dependency only.
 * Never hand it to the normal account composition in an installed build:
 * `EXPO_PUBLIC_*` values are compiled into the bundle.
 */
export function readDevelopmentFirebaseAuthEmulatorOrigin(): string | undefined {
  if (typeof __DEV__ === "undefined" || !__DEV__ || !isPatternlySmokeRuntime()) return undefined;
  if (process.env.EXPO_PUBLIC_PATTERNLY_BACKEND_E2E !== "true") return undefined;
  const value = process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN;
  if (!value) return undefined;
  try {
    const origin = new URL(value);
    return origin.protocol === "http:" && origin.hostname === developmentLoopbackHost && origin.pathname === "/" && origin.search === "" && origin.hash === "" ? origin.origin : undefined;
  } catch {
    return undefined;
  }
}

export function readPublicLegalLinksFromRuntime(): PublicLegalLinksResult {
  const environment = readPublicEnvironmentFromRuntime();
  if (environment.kind !== "configured") {
    return Object.freeze({ kind: "unavailable", reason: environment.reason });
  }

  return Object.freeze({
    kind: "configured",
    value: Object.freeze({
      privacyUrl: environment.value.privacyUrl,
      publicDeletionUrl: environment.value.publicDeletionUrl,
      supportUrl: environment.value.supportUrl,
      termsUrl: environment.value.termsUrl,
    }),
  });
}
