import type { Persistence } from "firebase/auth";

const AUTH_USER_STORAGE_KEY = "patternly.auth.user";

type SecureStoreLike = Readonly<{
  deleteItemAsync: (key: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
}>;

type PersistedBlob = Record<string, unknown>;

function getSecureStore(): SecureStoreLike {
  const module = require("expo-secure-store") as Partial<SecureStoreLike>;
  if (typeof module.getItemAsync !== "function" || typeof module.setItemAsync !== "function" || typeof module.deleteItemAsync !== "function") {
    throw new Error("secure_store_unavailable");
  }
  return module as SecureStoreLike;
}

function isRecord(value: unknown): value is PersistedBlob {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Firebase Auth expects to persist a user-shaped record. Only its refresh token
 * is durable here; the short-lived Firebase ID/access token is deliberately
 * removed before SecureStore receives the payload.
 */
export function redactPersistedAuthUser(value: unknown): PersistedBlob | null {
  if (!isRecord(value) || typeof value.uid !== "string" || typeof value.emailVerified !== "boolean" || typeof value.isAnonymous !== "boolean" || !isRecord(value.stsTokenManager)) return null;
  const refreshToken = value.stsTokenManager.refreshToken;
  if (typeof refreshToken !== "string" || refreshToken.length === 0) return null;
  return Object.freeze({
    uid: value.uid,
    ...(typeof value.email === "string" ? { email: value.email } : {}),
    emailVerified: value.emailVerified,
    isAnonymous: value.isAnonymous,
    ...(typeof value.displayName === "string" ? { displayName: value.displayName } : {}),
    ...(typeof value.photoURL === "string" ? { photoURL: value.photoURL } : {}),
    providerData: Array.isArray(value.providerData) ? value.providerData : [],
    ...(typeof value.createdAt === "string" ? { createdAt: value.createdAt } : {}),
    ...(typeof value.lastLoginAt === "string" ? { lastLoginAt: value.lastLoginAt } : {}),
    stsTokenManager: Object.freeze({ refreshToken, expirationTime: 0 }),
  });
}

export function createSecureAuthPersistence(store: SecureStoreLike = getSecureStore()): Persistence {
  const persistence = {
    type: "LOCAL" as const,
    _isAvailable: async () => true,
    _set: async (_key: string, value: unknown) => {
      const redacted = redactPersistedAuthUser(value);
      if (!redacted) {
        await store.deleteItemAsync(AUTH_USER_STORAGE_KEY);
        return;
      }
      await store.setItemAsync(AUTH_USER_STORAGE_KEY, JSON.stringify(redacted));
    },
    _get: async <T>() => {
      const stored = await store.getItemAsync(AUTH_USER_STORAGE_KEY);
      if (!stored) return null as T | null;
      try {
        const parsed: unknown = JSON.parse(stored);
        return (redactPersistedAuthUser(parsed) ?? null) as T | null;
      } catch {
        await store.deleteItemAsync(AUTH_USER_STORAGE_KEY);
        return null as T | null;
      }
    },
    _remove: async (_key: string) => { await store.deleteItemAsync(AUTH_USER_STORAGE_KEY); },
    _addListener: (_key: string, _listener: (value: unknown) => void) => undefined,
    _removeListener: (_key: string, _listener: (value: unknown) => void) => undefined,
  };
  return persistence as Persistence;
}

export { AUTH_USER_STORAGE_KEY };
