export type PatternlyAppCheckTokenProvider = () => Promise<string | null>;

export type PatternlyNativeAppCheckConfiguration = Readonly<{
  androidProvider?: "debug" | "playIntegrity";
  appleProvider?: "appAttest" | "appAttestWithDeviceCheckFallback" | "debug" | "deviceCheck";
}>;

export function createPatternlyNativeAppCheckProviderConfiguration(configuration: PatternlyNativeAppCheckConfiguration): Readonly<Record<string, unknown>> | null {
  const nativeConfiguration: Record<string, unknown> = {};
  if (configuration.androidProvider) nativeConfiguration.android = { provider: configuration.androidProvider };
  if (configuration.appleProvider) nativeConfiguration.apple = { provider: configuration.appleProvider };
  return Object.keys(nativeConfiguration).length > 0 ? Object.freeze(nativeConfiguration) : null;
}

let provider: PatternlyAppCheckTokenProvider | null = null;
// T1.6 readiness barrier: native Firebase starts after the first React Native turn, so the
// provider can still be composing when the first backend request asks for a token.
let composition: Promise<unknown> | null = null;
let compositionGeneration = 0;

/** Firebase App Check composition owns installation of the provider. No token is fabricated when it is absent. */
export function configurePatternlyAppCheckTokenProvider(next: PatternlyAppCheckTokenProvider | null): void {
  provider = next;
  // An explicit configuration supersedes a composition still in flight.
  compositionGeneration += 1;
  composition = null;
}

/**
 * Composes the native Firebase App Check provider. The native module is loaded
 * only at runtime so node tests and web builds can retain the explicit
 * unavailable state without fabricating a token.
 */
export function composePatternlyNativeAppCheck(configuration: PatternlyNativeAppCheckConfiguration): Promise<"available" | "unavailable"> {
  const nativeConfiguration = createPatternlyNativeAppCheckProviderConfiguration(configuration);
  if (!nativeConfiguration) {
    configurePatternlyAppCheckTokenProvider(null);
    return Promise.resolve("unavailable");
  }
  configurePatternlyAppCheckTokenProvider(null);
  const generation = compositionGeneration;
  const composed = Promise.resolve().then(() => composeNativeProvider(nativeConfiguration)).then((next) => {
    if (generation === compositionGeneration) configurePatternlyAppCheckTokenProvider(next);
    return next && generation === compositionGeneration ? "available" as const : "unavailable" as const;
  });
  composition = composed;
  return composed;
}

function composeNativeProvider(nativeConfiguration: Readonly<Record<string, unknown>>): PatternlyAppCheckTokenProvider | null {
  try {
    const module = require("@react-native-firebase/app-check") as NativeAppCheckModule;
    const nativeProvider = new module.ReactNativeFirebaseAppCheckProvider();
    nativeProvider.configure(nativeConfiguration);
    const appCheck = module.initializeAppCheck(undefined, { provider: nativeProvider, isTokenAutoRefreshEnabled: true });
    return async () => {
      const result = await module.getToken(appCheck);
      return typeof result.token === "string" && result.token.length > 0 ? result.token : null;
    };
  } catch {
    return null;
  }
}

/** Waits for a provider composition in flight; callers bound the wait with their own deadline. */
export async function getPatternlyAppCheckToken(): Promise<string | null> {
  if (composition) await composition;
  if (!provider) return null;
  try { return await provider(); }
  catch { return null; }
}

type NativeAppCheckModule = Readonly<{
  ReactNativeFirebaseAppCheckProvider: new () => {
    configure: (options: Readonly<Record<string, unknown>>) => void;
  };
  getToken: (appCheck: unknown) => Promise<Readonly<{ token: string }>>;
  initializeAppCheck: (app: unknown, options: Readonly<{ isTokenAutoRefreshEnabled: boolean; provider: unknown }>) => unknown;
}>;
