export const RECOVERY_CODE_CLIPBOARD_RETENTION_MS = 5 * 60 * 1000;
const RECOVERY_CODE_CLIPBOARD_RETRY_MS = 60 * 1000;

const STORAGE_KEY = "patternly.security.recovery-code-clipboard.v1";

type ClipboardPort = Readonly<{
  getStringAsync: () => Promise<string>;
  setStringAsync: (value: string) => Promise<boolean>;
}>;
type SecureStorePort = Readonly<{
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}>;
type Dependencies = Readonly<{
  clipboard: ClipboardPort;
  secureStore: SecureStorePort;
  digest: (value: string) => Promise<string>;
  now: () => number;
  schedule: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
}>;
type PendingClipboardCleanup = Readonly<{ clearAfter: number; digest: string; version: 1 }>;

function parsePending(value: string | null): PendingClipboardCleanup | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PendingClipboardCleanup>;
    if (parsed.version !== 1 || typeof parsed.clearAfter !== "number" || !Number.isFinite(parsed.clearAfter) || typeof parsed.digest !== "string" || !/^[a-f0-9]{64}$/u.test(parsed.digest)) return null;
    return { clearAfter: parsed.clearAfter, digest: parsed.digest, version: 1 };
  } catch {
    return null;
  }
}

export function createRecoveryCodeClipboard(dependencies: Dependencies) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lane = Promise.resolve();

  const scheduleCleanup = (clearAfter: number) => {
    if (timer) dependencies.cancel(timer);
    const delay = Math.max(0, Math.min(clearAfter - dependencies.now(), 2_147_483_647));
    timer = dependencies.schedule(() => { void enqueue(reconcileNow).catch(() => undefined); }, delay);
  };
  const reconcileNow = async () => {
    const raw = await dependencies.secureStore.getItemAsync(STORAGE_KEY);
    const pending = parsePending(raw);
    if (!pending) {
      if (raw !== null) await dependencies.secureStore.deleteItemAsync(STORAGE_KEY);
      return;
    }
    if (pending.clearAfter > dependencies.now()) {
      scheduleCleanup(pending.clearAfter);
      return;
    }
    const current = await dependencies.clipboard.getStringAsync();
    if (await dependencies.digest(current) === pending.digest) {
      const cleared = await dependencies.clipboard.setStringAsync("");
      if (!cleared) {
        scheduleCleanup(dependencies.now() + RECOVERY_CODE_CLIPBOARD_RETRY_MS);
        return;
      }
    }
    await dependencies.secureStore.deleteItemAsync(STORAGE_KEY);
  };
  const enqueue = (operation: () => Promise<void>) => {
    const result = lane.then(operation, operation);
    lane = result.catch(() => undefined);
    return result;
  };

  return {
    copy: (codes: readonly string[]) => enqueue(async () => {
      const value = codes.join("\n");
      if (!value) throw new Error("recovery_code_clipboard_copy_failed");
      const pending: PendingClipboardCleanup = { clearAfter: dependencies.now() + RECOVERY_CODE_CLIPBOARD_RETENTION_MS, digest: await dependencies.digest(value), version: 1 };
      let markerStored = false;
      try {
        await dependencies.secureStore.setItemAsync(STORAGE_KEY, JSON.stringify(pending));
        markerStored = true;
        if (!(await dependencies.clipboard.setStringAsync(value))) throw new Error("recovery_code_clipboard_copy_failed");
        scheduleCleanup(pending.clearAfter);
      } catch (error) {
        if (markerStored) {
          let markerCanBeDeleted = false;
          try {
            const current = await dependencies.clipboard.getStringAsync();
            if (await dependencies.digest(current) === pending.digest) markerCanBeDeleted = await dependencies.clipboard.setStringAsync("");
            else markerCanBeDeleted = true;
          } catch { /* preserve the marker for startup/foreground recovery */ }
          if (markerCanBeDeleted) await dependencies.secureStore.deleteItemAsync(STORAGE_KEY).catch(() => undefined);
          else scheduleCleanup(pending.clearAfter);
        }
        throw error;
      }
    }),
    reconcile: () => enqueue(reconcileNow),
  };
}

function nativeDependencies(): Dependencies {
  const Clipboard = require("expo-clipboard") as ClipboardPort;
  const Crypto = require("expo-crypto") as typeof import("expo-crypto");
  const SecureStore = require("expo-secure-store") as SecureStorePort;
  return {
    clipboard: Clipboard,
    secureStore: SecureStore,
    digest: (value) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
    now: Date.now,
    schedule: setTimeout,
    cancel: clearTimeout,
  };
}

let nativeClipboard: ReturnType<typeof createRecoveryCodeClipboard> | null = null;
const getNativeClipboard = () => {
  nativeClipboard ??= createRecoveryCodeClipboard(nativeDependencies());
  return nativeClipboard;
};

export const recoveryCodeClipboard = {
  copy: (codes: readonly string[]) => getNativeClipboard().copy(codes),
  reconcile: () => getNativeClipboard().reconcile(),
};
