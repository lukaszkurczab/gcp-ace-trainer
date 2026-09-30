import { developmentLoopbackHost } from "../developmentEndpoints";

export const PROVIDER_AUTH_FIXTURE_URL = "com.lkurczab.patternly://audit/provider-auth";
export const PROVIDER_AUTH_FIXTURE_PROJECT_ID = "patternly-app-sandbox";

export type ProviderAuthFixtureProvider = "apple" | "google";
export type ProviderAuthFixtureScenario = "mapped" | "unmapped";
export type ProviderAuthFixtureCommand = Readonly<{
  runId: string;
  provider: ProviderAuthFixtureProvider;
  scenario: ProviderAuthFixtureScenario;
}>;

export type ProviderAuthFixtureUrlResult =
  | Readonly<{ kind: "unmatched" }>
  | Readonly<{ kind: "invalid"; reason: "unavailable" | "malformed" }>
  | Readonly<{ kind: "armed"; command: ProviderAuthFixtureCommand }>;

export function isProviderAuthFixtureEnabled(
  environment: NodeJS.ProcessEnv = process.env,
  development = typeof __DEV__ !== "undefined" && __DEV__,
): boolean {
  if (!development
    || environment.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE !== "smoke"
    || environment.EXPO_PUBLIC_PATTERNLY_BACKEND_E2E !== "true"
    || environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID !== PROVIDER_AUTH_FIXTURE_PROJECT_ID
    || !isLoopbackOrigin(environment.EXPO_PUBLIC_PATTERNLY_API_ORIGIN)
    || !isLoopbackOrigin(environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN)) return false;
  return true;
}

function isLoopbackOrigin(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:"
      && parsed.hostname === developmentLoopbackHost
      && parsed.username === ""
      && parsed.password === ""
      && parsed.pathname === "/"
      && parsed.search === ""
      && parsed.hash === "";
  } catch {
    return false;
  }
}

function isFixtureUrlCandidate(url: string): boolean {
  if (url.startsWith(`${PROVIDER_AUTH_FIXTURE_URL}?`) || url === PROVIDER_AUTH_FIXTURE_URL) return true;
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}` === PROVIDER_AUTH_FIXTURE_URL;
  } catch {
    return false;
  }
}

export function parseProviderAuthFixtureUrl(
  url: string | null,
  environment: NodeJS.ProcessEnv = process.env,
  development = typeof __DEV__ !== "undefined" && __DEV__,
): ProviderAuthFixtureUrlResult {
  if (!url || !isFixtureUrlCandidate(url)) return Object.freeze({ kind: "unmatched" });
  if (!isProviderAuthFixtureEnabled(environment, development)) return Object.freeze({ kind: "invalid", reason: "unavailable" });

  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password || parsed.hash) return Object.freeze({ kind: "invalid", reason: "malformed" });
    const params = [...parsed.searchParams.entries()];
    if (params.length !== 3 || params.some(([key]) => !["runId", "provider", "scenario"].includes(key))) {
      return Object.freeze({ kind: "invalid", reason: "malformed" });
    }
    const runId = parsed.searchParams.get("runId");
    const provider = parsed.searchParams.get("provider");
    const scenario = parsed.searchParams.get("scenario");
    if (runId === null || provider === null || scenario === null
      || !/^[a-z0-9][a-z0-9-]{7,63}$/u.test(runId)
      || (provider !== "google" && provider !== "apple")
      || (scenario !== "mapped" && scenario !== "unmapped")) {
      return Object.freeze({ kind: "invalid", reason: "malformed" });
    }
    const command = Object.freeze({ runId, provider, scenario }) as ProviderAuthFixtureCommand;
    const canonical = `${PROVIDER_AUTH_FIXTURE_URL}?runId=${runId}&provider=${provider}&scenario=${scenario}`;
    return url === canonical ? Object.freeze({ kind: "armed", command }) : Object.freeze({ kind: "invalid", reason: "malformed" });
  } catch {
    return Object.freeze({ kind: "invalid", reason: "malformed" });
  }
}
