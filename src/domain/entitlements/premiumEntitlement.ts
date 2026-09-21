export const PREMIUM_ENTITLEMENT = "premium" as const;
export const PREMIUM_ENTITLEMENT_STATES = Object.freeze(["active", "grace", "hold", "expired", "refunded"] as const);
export type PremiumEntitlementState = (typeof PREMIUM_ENTITLEMENT_STATES)[number];

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
function instant(value: unknown): number | null {
  if (typeof value !== "string" || !ISO_UTC.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value ? time : null;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Reflect.ownKeys(value);
  return keys.length === expected.length && keys.every((key) => typeof key === "string" && expected.includes(key));
}
function accountId(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0 && !/\s/u.test(value) && !/^[^@\s]+@[^@\s]+$/u.test(value);
}

export type PremiumSnapshot = Readonly<{
  accountId: string;
  entitlement: typeof PREMIUM_ENTITLEMENT;
  productId: string;
  state: PremiumEntitlementState;
  source: "revenuecat";
  providerExpiresAt: string | null;
  providerGraceExpiresAt: string | null;
  providerObservedAt: string;
  serverObservedAt: string;
}>;
export type PremiumCacheRecord = Readonly<{ snapshot: PremiumSnapshot; maxObservedWallTime: number }>;
export type PremiumIdentity = Readonly<{ accountId: string; entitlement: typeof PREMIUM_ENTITLEMENT; productId: string }>;
const SNAPSHOT_KEYS = ["accountId", "entitlement", "productId", "state", "source", "providerExpiresAt", "providerGraceExpiresAt", "providerObservedAt", "serverObservedAt"];

export function isPremiumSnapshot(value: unknown): value is PremiumSnapshot {
  if (!record(value) || !exactKeys(value, SNAPSHOT_KEYS)) return false;
  if (!accountId(value.accountId) || value.entitlement !== PREMIUM_ENTITLEMENT || typeof value.productId !== "string" || !value.productId.trim() || value.source !== "revenuecat") return false;
  if (!PREMIUM_ENTITLEMENT_STATES.includes(value.state as PremiumEntitlementState)) return false;
  if (instant(value.providerObservedAt) === null || instant(value.serverObservedAt) === null) return false;
  if (value.providerExpiresAt !== null && instant(value.providerExpiresAt) === null) return false;
  if (value.providerGraceExpiresAt !== null && instant(value.providerGraceExpiresAt) === null) return false;
  if (value.state === "active" && value.providerExpiresAt === null) return false;
  if (value.state === "grace" && (value.providerExpiresAt === null || value.providerGraceExpiresAt === null)) return false;
  return true;
}
export function isPremiumCacheRecord(value: unknown): value is PremiumCacheRecord {
  return record(value) && exactKeys(value, ["snapshot", "maxObservedWallTime"]) && isPremiumSnapshot(value.snapshot)
    && Number.isSafeInteger(value.maxObservedWallTime) && (value.maxObservedWallTime as number) >= instant((value.snapshot as PremiumSnapshot).serverObservedAt)!;
}
function matches(snapshot: PremiumSnapshot, identity: PremiumIdentity): boolean {
  return snapshot.accountId === identity.accountId && snapshot.entitlement === identity.entitlement && snapshot.productId === identity.productId;
}

/** Only a complete, account-bound provider response may replace cache. */
export function premiumCacheFromFreshResponse(response: unknown, identity: PremiumIdentity, nowMs: number, previous: unknown): PremiumCacheRecord | null {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0 || !record(response) || !exactKeys(response, ["serverObservedAt", "entitlements"])) return null;
  if (instant(response.serverObservedAt) === null || !Array.isArray(response.entitlements) || response.entitlements.length !== 1) return null;
  const item = response.entitlements[0];
  if (!record(item) || !exactKeys(item, SNAPSHOT_KEYS.filter((key) => key !== "serverObservedAt"))) return null;
  const snapshot = { ...item, serverObservedAt: response.serverObservedAt };
  if (!isPremiumSnapshot(snapshot) || !matches(snapshot, identity)) return null;
  const oldMax = isPremiumCacheRecord(previous) && matches(previous.snapshot, identity) ? previous.maxObservedWallTime : 0;
  return Object.freeze({ snapshot: Object.freeze(snapshot), maxObservedWallTime: Math.max(oldMax, nowMs, instant(snapshot.serverObservedAt)!) });
}

export type PremiumOfflineDecision = Readonly<{ allowed: boolean; nextRecord: PremiumCacheRecord | null }>;
/** Persist nextRecord before honoring allowed. A clock rollback always denies. */
export function evaluateOfflinePremiumAccess(value: unknown, identity: PremiumIdentity, nowMs: number): PremiumOfflineDecision {
  if (!isPremiumCacheRecord(value) || !matches(value.snapshot, identity) || !Number.isSafeInteger(nowMs) || nowMs < 0) return { allowed: false, nextRecord: null };
  const nextRecord = Object.freeze({ snapshot: value.snapshot, maxObservedWallTime: Math.max(value.maxObservedWallTime, nowMs) });
  const expires = value.snapshot.state === "active" ? instant(value.snapshot.providerExpiresAt) : value.snapshot.state === "grace" ? instant(value.snapshot.providerGraceExpiresAt) : null;
  return { allowed: nowMs >= value.maxObservedWallTime && expires !== null && nowMs < expires, nextRecord };
}
