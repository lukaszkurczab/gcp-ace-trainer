import { sha256Utf8 } from "../identity/sha256";

const LEGACY_OPERATION_KEY = "patternly.security.recovery-operation.v1";
const LEGACY_OPERATION_KEYCHAIN_SERVICE = "com.lkurczab.patternly.recovery-operation";
const LEGACY_CLIPBOARD_MARKER_KEY = "patternly.security.recovery-code-clipboard.v1";
export const RETIRED_RECOVERY_CLIPBOARD_RETENTION_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 60_000;

type SecureStorePort = Readonly<{
  deleteItemAsync: (key: string, options?: Readonly<Record<string, unknown>>) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
}>;
type ClipboardPort = Readonly<{
  getStringAsync: () => Promise<string>;
  setStringAsync: (value: string) => Promise<void | boolean>;
}>;
type Dependencies = Readonly<{
  secureStore: SecureStorePort;
  secureStoreOptions: Readonly<Record<string, unknown>>;
  clipboard: ClipboardPort;
  now: () => number;
  schedule: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
}>;

export type RetiredAccountSecretsCleanupState = Readonly<
  | { kind: "idle" | "complete" }
  | { kind: "pending"; retryAt: number | null }
>;

type LegacyClipboardMarker = Readonly<{ clearAfter: number; digest: string; version: 1 }>;

function parseLegacyClipboardMarker(value: string | null): LegacyClipboardMarker | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<LegacyClipboardMarker>;
    return parsed.version === 1 && typeof parsed.clearAfter === "number" && Number.isFinite(parsed.clearAfter)
      && typeof parsed.digest === "string" && /^[a-f0-9]{64}$/u.test(parsed.digest)
      ? { clearAfter: parsed.clearAfter, digest: parsed.digest, version: 1 }
      : null;
  } catch {
    return null;
  }
}

export function createRetiredAccountSecretsCleanup(dependencies: Dependencies) {
  let state: RetiredAccountSecretsCleanupState = Object.freeze({ kind: "idle" });
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lane = Promise.resolve();
  const listeners = new Set<() => void>();

  const publish = (next: RetiredAccountSecretsCleanupState) => {
    if (state.kind === next.kind && (state.kind !== "pending" || (next.kind === "pending" && state.retryAt === next.retryAt))) return;
    state = Object.freeze(next);
    listeners.forEach((listener) => listener());
  };

  const schedule = (retryAt: number) => {
    if (timer) dependencies.cancel(timer);
    const delay = Math.max(0, Math.min(retryAt - dependencies.now(), 2_147_483_647));
    timer = dependencies.schedule(() => {
      timer = null;
      void reconcile().catch(() => undefined);
    }, delay);
    publish({ kind: "pending", retryAt });
  };

  const reconcileNow = async () => {
    publish({ kind: "pending", retryAt: null });
    // Delete the exact legacy slot without reading, parsing, restoring, or acknowledging it.
    await dependencies.secureStore.deleteItemAsync(LEGACY_OPERATION_KEY, dependencies.secureStoreOptions);

    const rawMarker = await dependencies.secureStore.getItemAsync(LEGACY_CLIPBOARD_MARKER_KEY);
    const marker = parseLegacyClipboardMarker(rawMarker);
    if (marker && marker.clearAfter > dependencies.now()) {
      schedule(marker.clearAfter);
      return;
    }
    if (marker) {
      const currentClipboard = await dependencies.clipboard.getStringAsync();
      if (sha256Utf8(currentClipboard) === marker.digest) {
        const cleared = await dependencies.clipboard.setStringAsync("");
        if (cleared === false) throw new Error("device_cleanup_unavailable");
      }
    }
    if (rawMarker !== null) await dependencies.secureStore.deleteItemAsync(LEGACY_CLIPBOARD_MARKER_KEY);
    publish({ kind: "complete" });
  };

  const enqueue = (operation: () => Promise<void>) => {
    const result = lane.then(operation, operation);
    lane = result.catch(() => undefined);
    return result;
  };

  const reconcile = () => enqueue(async () => {
    try {
      await reconcileNow();
    } catch {
      if (timer) dependencies.cancel(timer);
      timer = null;
      publish({ kind: "pending", retryAt: dependencies.now() + RETRY_DELAY_MS });
      if (state.kind === "pending") {
        timer = dependencies.schedule(() => {
          timer = null;
          void reconcile().catch(() => undefined);
        }, RETRY_DELAY_MS);
      }
    }
  });

  return Object.freeze({
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    reconcile,
    dispose: () => { if (timer) dependencies.cancel(timer); timer = null; listeners.clear(); },
  });
}

function nativeDependencies(): Dependencies {
  const { Platform } = require("react-native") as typeof import("react-native");
  const SecureStore = require("expo-secure-store") as typeof import("expo-secure-store");
  const Clipboard = require("expo-clipboard") as ClipboardPort;
  const secureStoreOptions = Object.freeze({
    ...(Platform.OS === "ios" ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY } : {}),
    keychainService: LEGACY_OPERATION_KEYCHAIN_SERVICE,
  });
  return {
    secureStore: SecureStore,
    secureStoreOptions,
    clipboard: Clipboard,
    now: Date.now,
    schedule: setTimeout,
    cancel: clearTimeout,
  };
}

let nativeCleanup: ReturnType<typeof createRetiredAccountSecretsCleanup> | null = null;
let nativeInitializationFailed = false;
let nativeRetryTimer: ReturnType<typeof setTimeout> | null = null;
const nativeListeners = new Set<() => void>();
const notifyNativeListeners = () => nativeListeners.forEach((listener) => listener());

const nativeCleanupFacade = Object.freeze({
  getSnapshot: (): RetiredAccountSecretsCleanupState => nativeCleanup?.getSnapshot()
    ?? (nativeInitializationFailed ? Object.freeze({ kind: "pending", retryAt: null }) : Object.freeze({ kind: "idle" })),
  subscribe: (listener: () => void) => { nativeListeners.add(listener); return () => { nativeListeners.delete(listener); }; },
  reconcile: async () => {
    try {
      if (!nativeCleanup) {
        nativeCleanup = createRetiredAccountSecretsCleanup(nativeDependencies());
        nativeCleanup.subscribe(notifyNativeListeners);
      }
      nativeInitializationFailed = false;
      await nativeCleanup.reconcile();
    } catch {
      nativeInitializationFailed = true;
      notifyNativeListeners();
      if (!nativeRetryTimer) nativeRetryTimer = setTimeout(() => {
        nativeRetryTimer = null;
        void nativeCleanupFacade.reconcile();
      }, RETRY_DELAY_MS);
    }
  },
  dispose: () => {
    if (nativeRetryTimer) clearTimeout(nativeRetryTimer);
    nativeRetryTimer = null;
    nativeCleanup?.dispose();
    nativeCleanup = null;
    nativeListeners.clear();
  },
});

export function getRetiredAccountSecretsCleanup() {
  // This getter is safe during React render: Expo native modules are required
  // only when reconcile runs from an effect or an explicit Settings retry.
  return nativeCleanupFacade;
}

/** Reports migration progress only; it never reads or fingerprints legacy secret bytes. */
export function inspectQ13RetiredAccountSecretsCleanup(): RetiredAccountSecretsCleanupState {
  return nativeCleanupFacade.getSnapshot();
}
