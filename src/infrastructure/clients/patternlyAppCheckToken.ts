export type PatternlyAppCheckTokenProvider = () => Promise<string | null>;

export type PatternlyNativeAppCheckConfiguration = Readonly<{
  androidProvider: "debug" | "playIntegrity";
  appleProvider?: "appAttest" | "appAttestWithDeviceCheckFallback" | "debug" | "deviceCheck";
}>;

let provider: PatternlyAppCheckTokenProvider | null = null;

/** Firebase App Check composition owns installation of the provider. No token is fabricated when it is absent. */
export function configurePatternlyAppCheckTokenProvider(next: PatternlyAppCheckTokenProvider | null): void {
  provider = next;
}

/**
 * Composes the native Firebase App Check provider. The native module is loaded
 * only at runtime so node tests and web builds can retain the explicit
 * unavailable state without fabricating a token.
 */
export async function composePatternlyNativeAppCheck(configuration: PatternlyNativeAppCheckConfiguration): Promise<"available" | "unavailable"> {
  try {
    const module = require("@react-native-firebase/app-check") as NativeAppCheckModule;
    const nativeProvider = new module.ReactNativeFirebaseAppCheckProvider();
    const nativeConfiguration: Record<string, unknown> = {
      android: { provider: configuration.androidProvider },
    };
    if (configuration.appleProvider) nativeConfiguration.apple = { provider: configuration.appleProvider };
    nativeProvider.configure(nativeConfiguration);
    const appCheck = module.initializeAppCheck(undefined, { provider: nativeProvider, isTokenAutoRefreshEnabled: true });
    configurePatternlyAppCheckTokenProvider(async () => {
      const result = await module.getToken(appCheck);
      return typeof result.token === "string" && result.token.length > 0 ? result.token : null;
    });
    return "available";
  } catch {
    configurePatternlyAppCheckTokenProvider(null);
    return "unavailable";
  }
}

export async function getPatternlyAppCheckToken(): Promise<string | null> {
  return provider ? provider() : null;
}

type NativeAppCheckModule = Readonly<{
  ReactNativeFirebaseAppCheckProvider: new () => {
    configure: (options: Readonly<Record<string, unknown>>) => void;
  };
  getToken: (appCheck: unknown) => Promise<Readonly<{ token: string }>>;
  initializeAppCheck: (app: unknown, options: Readonly<{ isTokenAutoRefreshEnabled: boolean; provider: unknown }>) => unknown;
}>;
