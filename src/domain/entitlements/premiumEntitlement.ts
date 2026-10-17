export const PREMIUM_ENTITLEMENT = "premium" as const;
export const PREMIUM_ENTITLEMENT_STATES = Object.freeze(["active", "grace", "hold", "expired", "refunded"] as const);
export type PremiumEntitlementState = (typeof PREMIUM_ENTITLEMENT_STATES)[number];
export type PremiumEnvironment = "SANDBOX" | "PRODUCTION";
export type PremiumSource = Readonly<{
  platform: "ios" | "android";
  store: "APP_STORE" | "PLAY_STORE";
  appId: string;
  rcProductId: string;
  storeProductId: string;
  basePlanId: string | null;
  state: "active" | "grace" | "hold" | "paused" | "expired" | "refunded";
  reason: null | "paused" | "account_hold";
  managementURL: string | null;
  providerExpiresAt: string | null;
  providerGraceExpiresAt: string | null;
}>;

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
function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim() === value && value.length > 0 && !/\s/u.test(value); }
function accountId(value: unknown): value is string { return nonEmpty(value) && !/^[^@\s]+@[^@\s]+$/u.test(value); }
const SOURCE_KEYS = ["platform", "store", "appId", "rcProductId", "storeProductId", "basePlanId", "state", "reason", "managementURL", "providerExpiresAt", "providerGraceExpiresAt"] as const;
const SNAPSHOT_KEYS = ["accountId", "entitlement", "productId", "state", "source", "mapVersion", "projectId", "environment", "reason", "sources", "providerExpiresAt", "providerGraceExpiresAt", "providerObservedAt", "serverObservedAt"] as const;

export type PremiumSnapshot = Readonly<{
  accountId: string;
  entitlement: typeof PREMIUM_ENTITLEMENT;
  /** Stable logical product namespace; never a store SKU. */
  productId: string;
  state: PremiumEntitlementState;
  source: "revenuecat";
  mapVersion: string;
  projectId: string;
  environment: PremiumEnvironment;
  reason: null | "paused" | "identity_conflict" | "promotional";
  sources: readonly PremiumSource[];
  providerExpiresAt: string | null;
  providerGraceExpiresAt: string | null;
  providerObservedAt: string;
  serverObservedAt: string;
}>;
export type PremiumCacheRecord = Readonly<{ snapshot: PremiumSnapshot; maxObservedWallTime: number }>;
export type PremiumIdentity = Readonly<{ accountId: string; entitlement: typeof PREMIUM_ENTITLEMENT; productId: string; projectId: string; mapVersion: string; environment: PremiumEnvironment }>;

function isPremiumSource(value: unknown): value is PremiumSource {
  if (!record(value) || !exactKeys(value, SOURCE_KEYS)) return false;
  if ((value.platform !== "ios" && value.platform !== "android") || (value.store !== "APP_STORE" && value.store !== "PLAY_STORE")
    || (value.platform === "ios") !== (value.store === "APP_STORE")) return false;
  if (![value.appId, value.rcProductId, value.storeProductId].every(nonEmpty) || (value.store === "APP_STORE" ? value.basePlanId !== null : !nonEmpty(value.basePlanId))) return false;
  if (!("active grace hold paused expired refunded".split(" ").includes(String(value.state)))
    || !(value.reason === null || value.reason === "paused" || value.reason === "account_hold")) return false;
  if (value.managementURL !== null) {
    if (typeof value.managementURL !== "string") return false;
    try {
      const url = new URL(value.managementURL);
      if (url.protocol !== "https:" || url.username || url.password || (value.store === "APP_STORE" ? url.hostname !== "apps.apple.com" : url.hostname !== "play.google.com")) return false;
    } catch { return false; }
  }
  const validExpiry = value.providerExpiresAt === null || instant(value.providerExpiresAt) !== null;
  const validGrace = value.providerGraceExpiresAt === null || instant(value.providerGraceExpiresAt) !== null;
  if (!validExpiry || !validGrace) return false;
  if (value.state === "active" && value.providerExpiresAt === null) return false;
  if (value.state === "grace" && (value.providerExpiresAt === null || value.providerGraceExpiresAt === null)) return false;
  return true;
}

export function isPremiumSnapshot(value: unknown): value is PremiumSnapshot {
  if (!record(value) || !exactKeys(value, SNAPSHOT_KEYS)) return false;
  if (!accountId(value.accountId) || value.entitlement !== PREMIUM_ENTITLEMENT || !nonEmpty(value.productId) || value.source !== "revenuecat") return false;
  if (!nonEmpty(value.mapVersion) || !nonEmpty(value.projectId) || (value.environment !== "SANDBOX" && value.environment !== "PRODUCTION")) return false;
  if (!PREMIUM_ENTITLEMENT_STATES.includes(value.state as PremiumEntitlementState)) return false;
  if (!(value.reason === null || value.reason === "paused" || value.reason === "identity_conflict" || value.reason === "promotional")) return false;
  if (value.reason === "identity_conflict") return false;
  if (!Array.isArray(value.sources) || !value.sources.every(isPremiumSource)) return false;
  const bindings = value.sources.map((item) => JSON.stringify([item.appId, item.store, item.rcProductId, item.storeProductId, item.basePlanId]));
  if (new Set(bindings).size !== bindings.length) return false;
  if (value.reason === "promotional" && value.sources.length !== 0) return false;
  if (value.reason !== "promotional" && value.state === "active" && !value.sources.some((item) => item.state === "active")) return false;
  if (value.reason !== "promotional" && value.state === "grace" && !value.sources.some((item) => item.state === "grace")) return false;
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
  return snapshot.accountId === identity.accountId && snapshot.entitlement === identity.entitlement && snapshot.productId === identity.productId
    && snapshot.projectId === identity.projectId && snapshot.mapVersion === identity.mapVersion && snapshot.environment === identity.environment;
}

/** Only a complete, account and map scoped provider response may replace cache. */
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
/** Fresh online confirmation uses provider/server time, independent of the device clock. */
export function isPremiumAccessConfirmedOnline(value: unknown): boolean {
  if (!isPremiumSnapshot(value)) return false;
  const expires = value.state === "active" ? instant(value.providerExpiresAt) : value.state === "grace" ? instant(value.providerGraceExpiresAt) : null;
  return expires !== null && instant(value.serverObservedAt)! < expires;
}
/** Persist nextRecord before honoring allowed. A clock rollback always denies. */
export function evaluateOfflinePremiumAccess(value: unknown, identity: PremiumIdentity, nowMs: number): PremiumOfflineDecision {
  if (!isPremiumCacheRecord(value) || !matches(value.snapshot, identity) || !Number.isSafeInteger(nowMs) || nowMs < 0) return { allowed: false, nextRecord: null };
  const nextRecord = Object.freeze({ snapshot: value.snapshot, maxObservedWallTime: Math.max(value.maxObservedWallTime, nowMs) });
  const expires = value.snapshot.state === "active" ? instant(value.snapshot.providerExpiresAt) : value.snapshot.state === "grace" ? instant(value.snapshot.providerGraceExpiresAt) : null;
  return { allowed: nowMs >= value.maxObservedWallTime && expires !== null && nowMs < expires, nextRecord };
}
