export const PREMIUM_ENTITLEMENT = "premium" as const;
export type PremiumEntitlement = typeof PREMIUM_ENTITLEMENT;

export const PREMIUM_OFFER_KINDS = Object.freeze([
  "fixedDuration30Day",
  "fixedDuration90Day",
  "recurring",
] as const);
export type PremiumOfferKind = (typeof PREMIUM_OFFER_KINDS)[number];

export const PREMIUM_ENTITLEMENT_STATES = Object.freeze([
  "active",
  "grace",
  "expired",
  "revoked",
  "refunded",
] as const);
export type PremiumEntitlementState = (typeof PREMIUM_ENTITLEMENT_STATES)[number];

export const PREMIUM_OFFLINE_VERIFICATION_GRACE_DAYS = 7 as const;

const PREMIUM_OFFLINE_VERIFICATION_GRACE_MILLISECONDS = PREMIUM_OFFLINE_VERIFICATION_GRACE_DAYS * 24 * 60 * 60 * 1000;
const STRICT_ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const EMAIL_SHAPED_ACCOUNT_ID = /^[^@\s]+@[^@\s]+$/u;

/** The backend-owned account-bound Premium projection. */
export type PremiumProjection = Readonly<{
  accountId: string;
  entitlement: PremiumEntitlement;
  state: PremiumEntitlementState;
  verifiedAt: string;
  sourceRevision: string;
}>;

const PREMIUM_PROJECTION_KEYS = Object.freeze([
  "accountId",
  "entitlement",
  "state",
  "verifiedAt",
  "sourceRevision",
] as const);

function isStablePatternlyAccountId(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    !/\s/u.test(value) &&
    !EMAIL_SHAPED_ACCOUNT_ID.test(value);
}

function parseStrictIsoTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || !STRICT_ISO_TIMESTAMP.test(value)) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString() === value ? timestamp : null;
}

export function isPremiumOfferKind(value: unknown): value is PremiumOfferKind {
  return typeof value === "string" && PREMIUM_OFFER_KINDS.includes(value as PremiumOfferKind);
}

export function isPremiumEntitlementState(value: unknown): value is PremiumEntitlementState {
  return typeof value === "string" && PREMIUM_ENTITLEMENT_STATES.includes(value as PremiumEntitlementState);
}

/**
 * Validates the closed projection shape without inferring provider state or
 * accepting fields that belong to a different commercial layer.
 */
export function isPremiumProjection(value: unknown): value is PremiumProjection {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== PREMIUM_PROJECTION_KEYS.length || keys.some((key) => typeof key !== "string" || !PREMIUM_PROJECTION_KEYS.includes(key as (typeof PREMIUM_PROJECTION_KEYS)[number]))) return false;

    const record = value as Record<string, unknown>;
    return isStablePatternlyAccountId(record.accountId) &&
      record.entitlement === PREMIUM_ENTITLEMENT &&
      isPremiumEntitlementState(record.state) &&
      parseStrictIsoTimestamp(record.verifiedAt) !== null &&
      typeof record.sourceRevision === "string" && record.sourceRevision.trim().length > 0;
  } catch {
    return false;
  }
}

export function createPremiumProjection(input: unknown): PremiumProjection {
  if (!isPremiumProjection(input)) throw new Error("Invalid Premium entitlement projection.");
  const projection = input as PremiumProjection;
  return Object.freeze({
    accountId: projection.accountId,
    entitlement: PREMIUM_ENTITLEMENT,
    state: projection.state,
    verifiedAt: projection.verifiedAt,
    sourceRevision: projection.sourceRevision,
  });
}

/**
 * Returns whether a validated projection can authorize a new Premium session.
 * This predicate is pure and deliberately does not consult or derive provider
 * state, mutate verification metadata, or select a Free/Premium fallback.
 */
export function isPremiumAccessAllowed(value: unknown, now: Date): value is PremiumProjection {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) || !isPremiumProjection(value)) return false;
  if (value.state !== "active" && value.state !== "grace") return false;

  const verifiedAt = parseStrictIsoTimestamp(value.verifiedAt);
  if (verifiedAt === null) return false;

  const nowTimestamp = now.getTime();
  return verifiedAt <= nowTimestamp && nowTimestamp - verifiedAt <= PREMIUM_OFFLINE_VERIFICATION_GRACE_MILLISECONDS;
}
