import { evaluateOfflinePremiumAccess, isPremiumCacheRecord, premiumCacheFromFreshResponse, type PremiumCacheRecord, type PremiumIdentity } from "../../domain/entitlements";
import { getActiveStorageProfileOrNull, getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";

const KEY = "patternly:premium-cache:v1";

function read(): PremiumCacheRecord | null {
  const raw = getKeyValueStorage().getString(KEY);
  if (raw === undefined) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isPremiumCacheRecord(value) ? value : null;
  } catch { return null; }
}

function write(value: PremiumCacheRecord): boolean {
  const storage = getKeyValueStorage();
  try {
    storage.setString(KEY, JSON.stringify(value));
    const verified = read();
    return verified !== null && JSON.stringify(verified) === JSON.stringify(value);
  } catch { return false; }
}

/** A failed or invalid online refresh does not mutate the previous cache. */
export function replacePremiumCacheFromFreshResponse(response: unknown, identity: PremiumIdentity, nowMs: number): boolean {
  try {
    const next = premiumCacheFromFreshResponse(response, identity, nowMs, read());
    return next !== null && write(next);
  } catch { return false; }
}

/** A synchronous write is required before offline Premium access is granted. */
export function hasOfflinePremiumAccess(identity: PremiumIdentity, nowMs: number): boolean {
  try {
    const decision = evaluateOfflinePremiumAccess(read(), identity, nowMs);
    return decision.nextRecord !== null && write(decision.nextRecord) && decision.allowed;
  } catch { return false; }
}

export function clearPremiumCache(): void { getKeyValueStorage().remove(KEY); }

export type OwnedPremiumCacheClearResult = "cleared" | "absent" | "foreign" | "unavailable";

/** Clears only a valid snapshot for the authenticated account in the captured active profile. */
export function clearPremiumCacheForAccountInProfile(accountId: string, expectedProfile: StorageProfile): OwnedPremiumCacheClearResult {
  if (!accountId.trim()) return "unavailable";
  const sameProfile = (left: StorageProfile | null): boolean => left !== null
    && left.id === expectedProfile.id
    && left.kind === expectedProfile.kind
    && left.accountId === expectedProfile.accountId;
  if (!sameProfile(getActiveStorageProfileOrNull())) return "unavailable";
  if (expectedProfile.accountId !== null && expectedProfile.accountId !== accountId) return "unavailable";
  try {
    const storage = getKeyValueStorage();
    const raw = storage.getString(KEY);
    if (raw === undefined) return "absent";
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return "unavailable"; }
    if (!isPremiumCacheRecord(parsed)) return "unavailable";
    if (parsed.snapshot.accountId !== accountId) return "foreign";
    storage.remove(KEY);
    return storage.getString(KEY) === undefined && sameProfile(getActiveStorageProfileOrNull()) ? "cleared" : "unavailable";
  } catch { return "unavailable"; }
}

/** A confirmed account may never inherit another account's stored snapshot. */
export function clearPremiumCacheUnlessBoundTo(accountId: string): boolean {
  try {
    const storage = getKeyValueStorage();
    const raw = storage.getString(KEY);
    if (raw === undefined) return true;
    const current = read();
    if (current?.snapshot.accountId === accountId) return true;
    storage.remove(KEY);
    return storage.getString(KEY) === undefined;
  } catch { return false; }
}
