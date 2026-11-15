/**
 * T2.5 stage 4: JS side of the `PatternlyFirstScreen` Nitro object (`native/first-screen`).
 *
 * The native overlay draws the first-screen record before React Native and stays until React Native
 * reports its first usable frame here (`reportFirstScreenReady`). The first report wins; later ones are
 * no-ops on both sides. Where the native object is absent (Node tests, Android, Expo Go, a build with the
 * plugin's kill switch) every function is a safe no-op.
 *
 * Native strings use "" for null; this module converts at the boundary.
 */
export type FirstScreenSurface = "today" | "account" | "other";

export type FirstScreenShown = Readonly<{ kind: "today" | "welcome" | "neutral"; profileId: string | null; revision: string | null }>;

export type FirstScreenPendingAction = Readonly<{
  id: string;
  action: string;
  profileId: string | null;
  revision: string | null;
  capturedAtMs: number;
}>;

type NativeFirstScreen = Readonly<{
  write(json: string): boolean;
  clear(): void;
  shownSnapshot(): string;
  markRnReady(surface: string, profileId: string, revision: string): void;
  takePendingAction(): string;
}>;

let native: NativeFirstScreen | null | undefined;
let reported = false;

function nativeFirstScreen(): NativeFirstScreen | null {
  if (native !== undefined) return native;
  native = null;
  try {
    const { Platform } = require("react-native") as typeof import("react-native");
    if (Platform.OS !== "ios") return null;
    const { NitroModules } = require("react-native-nitro-modules") as typeof import("react-native-nitro-modules");
    native = NitroModules.createHybridObject<NativeFirstScreen & import("react-native-nitro-modules").HybridObject<{ ios: "c++" }>>("PatternlyFirstScreen");
  } catch {
    native = null;
  }
  return native ?? null;
}

/** Keychain sink for `firstScreenRecord.ts`; null when the native module is absent. */
export function createFirstScreenNativeSink(): Readonly<{ write(json: string): boolean; clear(): void }> | null {
  const target = nativeFirstScreen();
  if (!target) return null;
  return Object.freeze({
    write: (json: string) => target.write(json),
    clear: () => { try { target.clear(); } catch { /* clearing a derived record never fails a write */ } },
  });
}

function parse<T>(raw: string, check: (value: Record<string, unknown>) => T | null): T | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? check(value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const optionalString = (value: unknown): string | null => (typeof value === "string" ? value : null);

/** What the overlay drew this launch, or null (no overlay, or no native module). */
export function readFirstScreenShown(): FirstScreenShown | null {
  const target = nativeFirstScreen();
  if (!target) return null;
  let raw = "";
  try { raw = target.shownSnapshot(); } catch { return null; }
  return parse(raw, (value) => value.kind === "today" || value.kind === "welcome" || value.kind === "neutral"
    ? Object.freeze({ kind: value.kind, profileId: optionalString(value.profileId), revision: optionalString(value.revision) })
    : null);
}

/**
 * React Native's first usable frame. `today` must carry the profile and Today revision it rendered; the
 * overlay crossfades only when they equal what it drew. Idempotent per process.
 */
export function reportFirstScreenReady(surface: FirstScreenSurface, token: Readonly<{ profileId: string; revision: string }> | null = null): void {
  if (reported) return;
  const target = nativeFirstScreen();
  if (!target) return;
  reported = true;
  try { target.markRnReady(surface, token?.profileId ?? "", token?.revision ?? ""); } catch { /* the native timeout removes the overlay */ }
}

export function hasReportedFirstScreenReady(): boolean {
  return reported;
}

/** The one action tapped on the overlay, at most once per process. Call after `reportFirstScreenReady`. */
export function takeFirstScreenPendingAction(): FirstScreenPendingAction | null {
  const target = nativeFirstScreen();
  if (!target) return null;
  let raw = "";
  try { raw = target.takePendingAction(); } catch { return null; }
  return parse(raw, (value) => typeof value.id === "string" && typeof value.action === "string" && typeof value.capturedAtMs === "number"
    ? Object.freeze({ id: value.id, action: value.action, profileId: optionalString(value.profileId), revision: optionalString(value.revision), capturedAtMs: value.capturedAtMs })
    : null);
}

/** Tests only. */
export function setFirstScreenNativeForTests(next: NativeFirstScreen | null | undefined): void {
  native = next;
  reported = false;
}
