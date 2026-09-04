import type { Persistence } from "firebase/auth";
import { sha256Utf8 } from "../identity/sha256";

const AUTH_USER_STORAGE_KEY = "patternly.auth.user";
const AUTH_PERSISTENCE_STORAGE_PREFIX = "patternly.auth.persistence.";

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
  const providerData = Array.isArray(value.providerData)
    ? value.providerData
      .filter(isRecord)
      .map((provider) => ({
        ...(typeof provider.providerId === "string" ? { providerId: provider.providerId } : {}),
        ...(typeof provider.uid === "string" ? { uid: provider.uid } : {}),
        ...(typeof provider.displayName === "string" ? { displayName: provider.displayName } : {}),
        ...(typeof provider.email === "string" ? { email: provider.email } : {}),
        ...(typeof provider.phoneNumber === "string" ? { phoneNumber: provider.phoneNumber } : {}),
        ...(typeof provider.photoURL === "string" ? { photoURL: provider.photoURL } : {}),
      }))
      .filter((provider) => Object.keys(provider).length > 0)
    : [];
  return Object.freeze({
    uid: value.uid,
    ...(typeof value.email === "string" ? { email: value.email } : {}),
    emailVerified: value.emailVerified,
    isAnonymous: value.isAnonymous,
    ...(typeof value.displayName === "string" ? { displayName: value.displayName } : {}),
    ...(typeof value.photoURL === "string" ? { photoURL: value.photoURL } : {}),
    ...(typeof value.phoneNumber === "string" ? { phoneNumber: value.phoneNumber } : {}),
    providerData,
    ...(typeof value.createdAt === "string" ? { createdAt: value.createdAt } : {}),
    ...(typeof value.lastLoginAt === "string" ? { lastLoginAt: value.lastLoginAt } : {}),
    stsTokenManager: Object.freeze({ refreshToken, expirationTime: 0 }),
  });
}

type SecureAuthPersistenceInstance = Persistence & {
  _isAvailable(): Promise<boolean>;
  _set(key: string, value: unknown): Promise<void>;
  _get<T = unknown>(key: string): Promise<T | null>;
  _remove(key: string): Promise<void>;
  _addListener(key: string, listener: (value: unknown) => void): void;
  _removeListener(key: string, listener: (value: unknown) => void): void;
};

type SecureAuthPersistenceConstructor = {
  new (): SecureAuthPersistenceInstance;
  readonly type: "LOCAL";
};

/**
 * Firebase Auth for React Native expects persistence entries to be class
 * constructors and instantiates them internally. Keep the SecureStore
 * dependency in the class closure while retaining the existing redaction
 * policy for the persisted Firebase user record.
 */
export function createSecureAuthPersistence(
  store: SecureStoreLike = getSecureStore(),
): SecureAuthPersistenceConstructor {
  const isFirebaseAuthUserKey = (key: string): boolean => /^firebase:authUser(?::|$)/u.test(key);
  const storageKeyForFirebaseKey = (key: string): string => `${AUTH_PERSISTENCE_STORAGE_PREFIX}${sha256Utf8(key)}`;

  const persistableAncillaryValue = (value: unknown): unknown => {
    const redacted = redactPersistedAuthUser(value);
    if (redacted) return redacted;
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    throw new Error("unsupported_firebase_persistence_value");
  };

  return class SecureAuthPersistence {
    static readonly type = "LOCAL" as const;
    readonly type = "LOCAL" as const;

    async _isAvailable(): Promise<boolean> {
      return true;
    }

    async _set(key: string, value: unknown): Promise<void> {
      if (isFirebaseAuthUserKey(key)) {
        const redacted = redactPersistedAuthUser(value);
        if (!redacted) {
          await store.deleteItemAsync(AUTH_USER_STORAGE_KEY);
          return;
        }
        await store.setItemAsync(AUTH_USER_STORAGE_KEY, JSON.stringify(redacted));
        return;
      }
      const storageKey = storageKeyForFirebaseKey(key);
      if (value === undefined || value === null) {
        await store.deleteItemAsync(storageKey);
        return;
      }
      await store.setItemAsync(storageKey, JSON.stringify(persistableAncillaryValue(value)));
    }

    async _get<T = unknown>(key: string): Promise<T | null> {
      if (isFirebaseAuthUserKey(key)) {
        const stored = await store.getItemAsync(AUTH_USER_STORAGE_KEY);
        if (!stored) return null;
        try {
          const parsed: unknown = JSON.parse(stored);
          return (redactPersistedAuthUser(parsed) ?? null) as T | null;
        } catch {
          await store.deleteItemAsync(AUTH_USER_STORAGE_KEY);
          return null;
        }
      }
      const stored = await store.getItemAsync(storageKeyForFirebaseKey(key));
      if (!stored) return null;
      try {
        const parsed: unknown = JSON.parse(stored);
        if (isRecord(parsed)) {
          const redacted = redactPersistedAuthUser(parsed);
          if (!redacted) {
            await store.deleteItemAsync(storageKeyForFirebaseKey(key));
            return null;
          }
          return redacted as T;
        }
        return parsed as T;
      } catch {
        await store.deleteItemAsync(storageKeyForFirebaseKey(key));
        return null;
      }
    }

    async _remove(key: string): Promise<void> {
      if (isFirebaseAuthUserKey(key)) {
        await store.deleteItemAsync(AUTH_USER_STORAGE_KEY);
        return;
      }
      await store.deleteItemAsync(storageKeyForFirebaseKey(key));
    }

    _addListener(_key: string, _listener: (value: unknown) => void): void {
      return undefined;
    }

    _removeListener(_key: string, _listener: (value: unknown) => void): void {
      return undefined;
    }
  };
}

export { AUTH_USER_STORAGE_KEY };
