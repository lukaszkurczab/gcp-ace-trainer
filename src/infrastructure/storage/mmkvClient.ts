export interface KeyValueStorage {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  remove(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): readonly string[];
}

import { openProfileStorageRouter, ProfileStorageError, ProfileTransitionActiveError, type AccountIdentityBinding, type AccountIdentityBindingRead, type AccountIdentityProofBarrierReceipt, type GuestRemoval34ExpectedState, type GuestRemoval34Receipt, type ProfileStorageRouter, type StorageProfile } from "./profileStorageRouter";
import type { StorageManifestStore } from "./encryptedStorageBootstrap";
import { STORAGE_KEYS } from "../../storage/keys";
import { sha256Utf8 } from "../identity/sha256";

let client: KeyValueStorage | null = null;
let profileRouter: ProfileStorageRouter | null = null;
type OpenedProfileStorage = Readonly<{ base: KeyValueStorage; router: ProfileStorageRouter; secureControl?: StorageManifestStore }>;
type PreparedProfileStorage = OpenedProfileStorage & Readonly<{ generation: number }>;
export type ActiveProfileStorageLease = Readonly<{ profile: StorageProfile; generation: number }>;
/** A read-only fence for the already prepared profile while it is not active. */
export type PreparedProfileStorageLease = Readonly<{ profile: StorageProfile; generation: number }>;
export type AccountIdentityProofBarrier = Readonly<{
  schema: "patternly.account-identity-proof-barrier-scope.v1";
  ownerReceipt: AccountIdentityProofBarrierReceipt;
  storageGeneration: number;
  leaseGeneration: number | null;
}>;
let preparedStorage: PreparedProfileStorage | null = null;
let activePreparedStorage: PreparedProfileStorage | null = null;
let preparation: Promise<PreparedProfileStorage> | null = null;
let testPreparationFactory: (() => Promise<OpenedProfileStorage>) | null = null;
let testProfileTransitionReload: (() => Promise<void>) | null = null;
let profileStorageGeneration = 0;
const readyListeners = new Set<() => void>();
const profileTransitionListeners = new Set<() => void>();
let profileTransitionActive = false;
let profileStorageReadyNotified = false;
const MODERN_PROFILE_PREFIX = "patternly:profile:v1:";
const BIZQ01_CANARY_FAMILY_PREFIX = `${MODERN_PROFILE_PREFIX}bizq01-canary-`;
const BIZQ01_REMOVED_GUEST_ID_SHA256 = "b880a3a8d1530601f6f1ed2f244078468f09f51f9d68ba5f6d3cec95cfa5e52d";

export type GuestRemovalPostcoldPrefixReceipt = Readonly<{
  schemaVersion: "bizq01-guest-removal-postcold-prefix-v1";
  result: "observed" | "failed";
  stage: string;
  oldPrefixKeyCount?: number;
}>;

export type GuestRemovalCanaryReceipt = Readonly<{
  schemaVersion: "bizq01-guest-removal-canary-v1";
  result: "passed" | "failed";
  stage: string;
  canaryValueSha256?: string;
  accountStateSha256?: string;
  globalStateSha256?: string;
  protectedAdapterStateSha256?: string;
  protectedStateUnchanged?: boolean;
  cleanupVerified?: boolean;
}>;

export type GuestRemovalReconciliationReceipt = Readonly<{
  schemaVersion: "bizq01-guest-removal-reconciliation-v1";
  result: "observed" | "failed";
  stage: string;
  profileTransitionActive?: boolean;
  activeLearningWorkPresent?: boolean;
  guestKind?: string;
  selectedGuestMatches?: boolean;
  installationIdSha256?: string;
  datasetIdSha256?: string;
  accountProfileCount?: number;
  guestProfileCount?: number;
  profileIdentityInventorySha256?: string;
  guestKeyCount?: number;
  guestRecordCount?: number;
  guestMetadataKeyCount?: number;
  guestKeyInventorySha256?: string;
  canaryFamilyKeyCount?: number;
  canaryFamilyKeyInventorySha256?: string;
  accountStateSha256?: string;
  globalStateSha256?: string;
  protectedAdapterStateSha256?: string;
}>;

type GuestRemovalCanaryBaseline = Readonly<{
  accountStateSha256: string;
  globalStateSha256: string;
  protectedAdapterStateSha256: string;
}>;

function hashStorageEntries(base: KeyValueStorage, keys: readonly string[]): string {
  const entries = [...keys].sort().map((key) => {
    const value = base.getString(key);
    if (value === undefined) throw new Error("guest_removal_canary_snapshot_unreadable");
    return [sha256Utf8(key), sha256Utf8(value)];
  });
  return sha256Utf8(JSON.stringify(entries));
}

function snapshotGuestRemovalCanaryState(base: KeyValueStorage, router: ProfileStorageRouter, namespace: string): GuestRemovalCanaryBaseline {
  const keys = [...base.getAllKeys()];
  if (keys.some((key) => typeof key !== "string") || new Set(keys).size !== keys.length) throw new Error("guest_removal_canary_key_inventory_invalid");
  if (keys.some((key) => key.startsWith(namespace))) throw new Error("guest_removal_canary_namespace_occupied");
  const accountPrefixes = router.registry.profiles.filter((profile) => profile.kind === "account")
    .map((profile) => `${MODERN_PROFILE_PREFIX}${profile.id}:`);
  const accountKeys = keys.filter((key) => accountPrefixes.some((prefix) => key.startsWith(prefix)));
  const globalKeys = keys.filter((key) => !key.startsWith(MODERN_PROFILE_PREFIX));
  return Object.freeze({
    accountStateSha256: hashStorageEntries(base, accountKeys),
    globalStateSha256: hashStorageEntries(base, globalKeys),
    protectedAdapterStateSha256: hashStorageEntries(base, keys),
  });
}

function guestRemovalCanaryFailure(
  stage: string,
  facts: Partial<GuestRemovalCanaryBaseline> = {},
  extra: Pick<GuestRemovalCanaryReceipt, "canaryValueSha256" | "protectedStateUnchanged" | "cleanupVerified"> = {},
): GuestRemovalCanaryReceipt {
  return Object.freeze({ schemaVersion: "bizq01-guest-removal-canary-v1", result: "failed", stage, ...facts, ...extra });
}

function activeLearningWorkPresent(router: ProfileStorageRouter): boolean {
  const workKeys = [
    STORAGE_KEYS.ACTIVE_TRAINING_SESSION,
    STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT,
    STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
    STORAGE_KEYS.ACTIVE_JOURNAL,
  ];
  return workKeys.some((key) => router.storage.getString(key) !== undefined);
}

function guestProfileIdentityInventory(router: ProfileStorageRouter): Readonly<{
  accountProfileCount: number;
  guestProfileCount: number;
  profileIdentityInventorySha256: string;
}> {
  const identities = router.registry.profiles.map((profile) => ({
    idSha256: sha256Utf8(profile.id),
    kind: profile.kind,
    accountIdSha256: profile.accountId === null ? null : sha256Utf8(profile.accountId),
  })).sort((left, right) => left.idSha256.localeCompare(right.idSha256));
  return Object.freeze({
    accountProfileCount: identities.filter((profile) => profile.kind === "account").length,
    guestProfileCount: identities.filter((profile) => profile.kind === "guest" || profile.kind === "legacy_guest").length,
    profileIdentityInventorySha256: sha256Utf8(JSON.stringify(identities)),
  });
}

function snapshotGuestRemovalReconciliationState(base: KeyValueStorage, router: ProfileStorageRouter): GuestRemovalCanaryBaseline & Readonly<{
  canaryFamilyKeyCount: number;
  canaryFamilyKeyInventorySha256: string;
  guestKeyCount: number;
  guestRecordCount: number;
  guestMetadataKeyCount: number;
  guestKeyInventorySha256: string;
}> {
  const keys = [...base.getAllKeys()];
  if (keys.some((key) => typeof key !== "string") || new Set(keys).size !== keys.length) throw new Error("guest_removal_reconciliation_key_inventory_invalid");
  const canaryFamilyKeys = keys.filter((key) => key.startsWith(BIZQ01_CANARY_FAMILY_PREFIX)).sort();
  const accountPrefixes = router.registry.profiles.filter((profile) => profile.kind === "account")
    .map((profile) => `${MODERN_PROFILE_PREFIX}${profile.id}:`);
  const accountKeys = keys.filter((key) => accountPrefixes.some((prefix) => key.startsWith(prefix)));
  const globalKeys = keys.filter((key) => !key.startsWith(MODERN_PROFILE_PREFIX));
  const guestLogicalKeys = [...router.storage.getAllKeys()].sort();
  if (guestLogicalKeys.some((key) => typeof key !== "string") || new Set(guestLogicalKeys).size !== guestLogicalKeys.length) throw new Error("guest_removal_reconciliation_guest_inventory_invalid");
  const metadataNames = new Set<string>([STORAGE_KEYS.GUEST_INSTALLATION, STORAGE_KEYS.GUEST_ACCESS, STORAGE_KEYS.METADATA]);
  const guestMetadataKeys = guestLogicalKeys.filter((key) => metadataNames.has(key));
  const recordKeys = guestLogicalKeys.filter((key) => !metadataNames.has(key));
  const knownRecord = (key: string) => key === STORAGE_KEYS.ACTIVE_TRACK
    || key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION || key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT
    || key === STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER || key === STORAGE_KEYS.ACTIVE_JOURNAL
    || key === STORAGE_KEYS.TRAINING_SESSION_INDEX || key.startsWith(STORAGE_KEYS.trainingSession(""))
    || (key.startsWith(STORAGE_KEYS.trainingSessionResult("")) && key.length > STORAGE_KEYS.trainingSessionResult("").length)
    || key === STORAGE_KEYS.TRAINING_ATTEMPT_INDEX || key.startsWith("patternly:canonical:v1:training-attempt:")
    || key === STORAGE_KEYS.REVIEW_INDEX || key.startsWith("patternly:canonical:v1:review-entry:")
    || key === STORAGE_KEYS.SETTINGS || key.startsWith("patternly:canonical:v1:goal:")
    || key.startsWith("patternly:canonical:v1:learning-plan:") || key === STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES
    || key === STORAGE_KEYS.NOTIFICATION_SETTINGS || key === STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL
    || key === STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX || key.startsWith("patternly:canonical:v1:archival-history:")
    || key === STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX || key.startsWith("patternly:canonical:v1:unavailable-active:")
    || key === STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX || key.startsWith("patternly:canonical:v1:unavailable-review:")
    || key === STORAGE_KEYS.ACCOUNT_SYNC || key === STORAGE_KEYS.ACCOUNT_SIGN_OUT || key === STORAGE_KEYS.ACCOUNT_DELETION;
  if (recordKeys.some((key) => !knownRecord(key))) throw new Error("guest_removal_reconciliation_guest_inventory_invalid");
  return Object.freeze({
    accountStateSha256: hashStorageEntries(base, accountKeys),
    globalStateSha256: hashStorageEntries(base, globalKeys),
    protectedAdapterStateSha256: hashStorageEntries(base, keys),
    canaryFamilyKeyCount: canaryFamilyKeys.length,
    canaryFamilyKeyInventorySha256: sha256Utf8(JSON.stringify(canaryFamilyKeys.map(sha256Utf8))),
    guestKeyCount: guestLogicalKeys.length,
    guestRecordCount: recordKeys.length,
    guestMetadataKeyCount: guestMetadataKeys.length,
    guestKeyInventorySha256: sha256Utf8(JSON.stringify(guestLogicalKeys.map(sha256Utf8))),
  });
}

export type PreparedStorage = Readonly<{ base: KeyValueStorage; router: ProfileStorageRouter }>;
export type PreparedProfileState = Readonly<{
  profiles: readonly StorageProfile[];
  selectedProfile: StorageProfile;
  isFreshInstallation: boolean;
}>;

export type Q13StorageReadiness = Readonly<
  | { kind: "ready"; registeredProfileCount: number; physicalKeyCount: number }
  | { kind: "unavailable"; reason: "prepared_storage_missing" | "profile_transition_active" | "prepared_storage_changed" | "physical_key_inventory_invalid" | "physical_key_read_failed" }
>;

export type Q13StorageInventorySnapshot = Readonly<{
  kind: "observed" | "unavailable";
  complete: boolean;
  reason?: "prepared_storage_missing" | "profile_transition_active" | "prepared_storage_changed" | "physical_key_inventory_invalid" | "physical_key_read_failed" | "unclassified_key" | "control_inventory_unavailable";
  registryGeneration?: number;
  registryChecksumSha256?: string;
  profileCount?: number;
  profileInventorySha256?: string;
  physicalKeyCount?: number;
  physicalInventorySha256?: string;
  unclassifiedKeys?: Readonly<{
    keyCount: number;
    scopeCounts: readonly Readonly<{ scope: "registered_profile" | "unregistered_profile" | "legacy_profile" | "global" | "unscoped"; count: number }>[];
    fingerprints: readonly Readonly<{ scope: "registered_profile" | "unregistered_profile" | "legacy_profile" | "global" | "unscoped"; keySha256: string }>[];
  }>;
  profileInventories?: readonly Readonly<{
    profileIdSha256: string;
    kind: StorageProfile["kind"];
    keyCount: number;
    inventorySha256: string;
    categoryInventories: readonly Readonly<{ category: "learningProgress" | "settings" | "profileLifecycle" | "packagePointers" | "premiumCache" | "premiumTestRuntime"; keyCount: number; inventorySha256: string }>[];
  }>[];
  globalInventories?: readonly Readonly<{ category: string; keyCount: number; inventorySha256: string }>[];
  control?: Awaited<ReturnType<ProfileStorageRouter["inspectQ13ControlInventory"]>>;
  secureControl?: Readonly<{ kind: "observed"; slotCount: number; keyMaterialPresentCount: number; inventorySha256: string } | { kind: "unavailable" }>;
  packagePointerSources?: readonly Readonly<{ profileIdSha256: string; entries: readonly Readonly<{ key: string; value: string }>[] }>[];
}>;

function isKnownQ13CanonicalKey(key: string): boolean {
  const exact: string[] = Object.entries(STORAGE_KEYS).flatMap(([, value]) => typeof value === "string" ? [value] : []);
  if (exact.includes(key) || globalQ13Category(key) !== null) return true;
  const dynamicPrefixes = [
    "patternly:canonical:v1:training-session:", "patternly:canonical:v1:training-session-result:",
    "patternly:canonical:v1:training-attempt:", "patternly:canonical:v1:review-entry:",
    "patternly:canonical:v1:goal:", "patternly:canonical:v1:learning-plan:",
    "patternly:canonical:v1:archival-history:", "patternly:canonical:v1:unavailable-active:",
    "patternly:canonical:v1:unavailable-review:",
  ];
  return dynamicPrefixes.some((prefix) => key.startsWith(prefix) && key.length > prefix.length && /^[a-zA-Z0-9._:-]+$/u.test(key.slice(prefix.length)));
}

type Q13ProfileCategory = "learningProgress" | "settings" | "profileLifecycle" | "packagePointers" | "premiumCache" | "premiumTestRuntime";
const Q13_PROFILE_CATEGORIES: readonly Q13ProfileCategory[] = Object.freeze(["learningProgress", "settings", "profileLifecycle", "packagePointers", "premiumCache", "premiumTestRuntime"]);

function canonicalQ13Category(key: string): Exclude<Q13ProfileCategory, "packagePointers"> | null {
  const learningProgress: readonly string[] = [
    STORAGE_KEYS.ACTIVE_TRACK, STORAGE_KEYS.ACTIVE_TRAINING_SESSION, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
    STORAGE_KEYS.TRAINING_SESSION_INDEX, STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, STORAGE_KEYS.REVIEW_INDEX,
    STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX, STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX, STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX,
  ];
  if (learningProgress.includes(key) || [
    "patternly:canonical:v1:training-session:", "patternly:canonical:v1:training-session-result:",
    "patternly:canonical:v1:training-attempt:", "patternly:canonical:v1:review-entry:",
    "patternly:canonical:v1:archival-history:", "patternly:canonical:v1:unavailable-active:",
    "patternly:canonical:v1:unavailable-review:", "patternly:canonical:v1:goal:", "patternly:canonical:v1:learning-plan:",
  ].some((prefix) => key.startsWith(prefix) && key.length > prefix.length)) return "learningProgress";
  const settings: readonly string[] = [
    STORAGE_KEYS.SETTINGS, STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES,
    STORAGE_KEYS.NOTIFICATION_SETTINGS, STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL,
  ];
  if (settings.includes(key)) return "settings";
  const profileLifecycle: readonly string[] = [
    STORAGE_KEYS.METADATA, STORAGE_KEYS.GUEST_INSTALLATION, STORAGE_KEYS.GUEST_ACCESS, STORAGE_KEYS.ACTIVE_JOURNAL,
    STORAGE_KEYS.ACCOUNT_SYNC, STORAGE_KEYS.ACCOUNT_SIGN_OUT, STORAGE_KEYS.ACCOUNT_DELETION, STORAGE_KEYS.CONTENT_REPORT_OUTBOX,
  ];
  if (profileLifecycle.includes(key)) return "profileLifecycle";
  const cacheCategory = globalQ13Category(key);
  if (cacheCategory === "premium_cache") return "premiumCache";
  if (cacheCategory === "premium_test_runtime") return "premiumTestRuntime";
  return null;
}

function isQ13PackagePointerKey(key: string): boolean {
  return /^patternly\.content-node\.active\.v1\.[a-f0-9]{64}$/u.test(key);
}

type Q13UnclassifiedScope = "registered_profile" | "unregistered_profile" | "legacy_profile" | "global" | "unscoped";
const Q13_UNCLASSIFIED_SCOPES: readonly Q13UnclassifiedScope[] = Object.freeze(["registered_profile", "unregistered_profile", "legacy_profile", "global", "unscoped"]);

function q13UnknownKeyFingerprint(key: string, profiles: readonly StorageProfile[], legacyProfileId: string | null): Readonly<{ scope: Q13UnclassifiedScope; keySha256: string }> {
  let scope: Q13UnclassifiedScope;
  let normalizedKey: string;
  if (key.startsWith(MODERN_PROFILE_PREFIX)) {
    const rest = key.slice(MODERN_PROFILE_PREFIX.length);
    const separator = rest.indexOf(":");
    if (separator < 0) {
      scope = "unregistered_profile";
      normalizedKey = key;
    } else {
      const profileId = rest.slice(0, separator);
      scope = profiles.some((profile) => profile.id === profileId) ? "registered_profile" : "unregistered_profile";
      const encodedLogicalKey = rest.slice(separator + 1);
      try {
        const logicalKey = decodeURIComponent(encodedLogicalKey);
        normalizedKey = encodeURIComponent(logicalKey) === encodedLogicalKey ? logicalKey : encodedLogicalKey;
      } catch { normalizedKey = encodedLogicalKey; }
    }
  } else if (key.startsWith("patternly:canonical:v1:") || key.startsWith("patternly.content-node.active.v1.")) {
    scope = legacyProfileId ? "legacy_profile" : "unscoped";
    normalizedKey = key;
  } else if (key.startsWith("patternly:premium-cache:") || key.startsWith("patternly:test-runtime:")) {
    scope = "global";
    normalizedKey = key;
  } else {
    scope = "unscoped";
    normalizedKey = key;
  }
  return Object.freeze({ scope, keySha256: sha256Utf8(`${scope}\u0000${normalizedKey}`) });
}

function q13UnclassifiedInventory(keys: readonly Readonly<{ scope: Q13UnclassifiedScope; keySha256: string }>[]) {
  const fingerprints = [...keys].sort((left, right) => left.scope.localeCompare(right.scope) || left.keySha256.localeCompare(right.keySha256));
  return Object.freeze({
    keyCount: fingerprints.length,
    scopeCounts: Object.freeze(Q13_UNCLASSIFIED_SCOPES.map((scope) => Object.freeze({ scope, count: fingerprints.filter((entry) => entry.scope === scope).length }))),
    fingerprints: Object.freeze(fingerprints),
  });
}

function globalQ13Category(key: string): string | null {
  if (key === "patternly:premium-cache:v1") return "premium_cache";
  if (key === "patternly:test-runtime:v1:premium-access") return "premium_test_runtime";
  return null;
}
const Q13_GLOBAL_CATEGORIES = Object.freeze(["premium_cache", "premium_test_runtime"] as const);

/** Full, sanitized census over refs already prepared by normal lifecycle; no open, refresh, or selection. */
export async function inspectPreparedQ13StorageInventory(actorUidSha256?: string | null): Promise<Q13StorageInventorySnapshot> {
  const current = activePreparedStorage ?? preparedStorage;
  const readiness = inspectPreparedQ13StorageReadiness();
  if (readiness.kind !== "ready" || !current) return Object.freeze({ kind: "unavailable", complete: false, reason: readiness.kind === "unavailable" ? readiness.reason : "prepared_storage_missing" });
  const router = current.router;
  let keys: string[], values: string[];
  try {
    keys = [...current.base.getAllKeys()];
    const readValues = keys.map((key) => current.base.getString(key));
    if (readValues.some((value) => value === undefined)) return Object.freeze({ kind: "unavailable", complete: false, reason: "physical_key_read_failed" });
    values = readValues as string[];
  } catch { return Object.freeze({ kind: "unavailable", complete: false, reason: "physical_key_read_failed" }); }
  if (keys.some((key) => typeof key !== "string") || new Set(keys).size !== keys.length || keys.length !== values.length) return Object.freeze({ kind: "unavailable", complete: false, reason: "physical_key_inventory_invalid" });
  const physicalEntries = keys.map((key, index) => [sha256Utf8(key), sha256Utf8(values[index]!)] as const).sort((a, b) => a[0].localeCompare(b[0]));
  const physicalInventorySha256 = sha256Utf8(JSON.stringify(physicalEntries));
  const profiles = router.registry.profiles;
  const byProfile = new Map(profiles.map((profile) => [profile.id, [] as Array<readonly [string, string]>]));
  const profileCategories = new Map(profiles.map((profile) => [profile.id, new Map(Q13_PROFILE_CATEGORIES.map((category) => [category, [] as Array<readonly [string, string]>]))]));
  const globals = new Map<string, Array<readonly [string, string]>>();
  const packageEntries = new Map(profiles.map((profile) => [profile.id, [] as Array<Readonly<{ key: string; value: string }>>]));
  const unclassified: Array<Readonly<{ scope: Q13UnclassifiedScope; keySha256: string }>> = [];
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]!; const value = values[index]!;
    if (key.startsWith(MODERN_PROFILE_PREFIX)) {
      const rest = key.slice(MODERN_PROFILE_PREFIX.length); const separator = rest.indexOf(":");
      if (separator <= 0) { unclassified.push(q13UnknownKeyFingerprint(key, profiles, router.registry.legacyProfileId)); continue; }
      const id = rest.slice(0, separator); const profile = profiles.find((candidate) => candidate.id === id);
      if (!profile) { unclassified.push(q13UnknownKeyFingerprint(key, profiles, router.registry.legacyProfileId)); continue; }
      let logical: string;
      try { logical = decodeURIComponent(rest.slice(separator + 1)); } catch { unclassified.push(q13UnknownKeyFingerprint(key, profiles, router.registry.legacyProfileId)); continue; }
      if (encodeURIComponent(logical) !== rest.slice(separator + 1) || (!isKnownQ13CanonicalKey(logical) && !isQ13PackagePointerKey(logical))) { unclassified.push(q13UnknownKeyFingerprint(key, profiles, router.registry.legacyProfileId)); continue; }
      byProfile.get(id)!.push([sha256Utf8(key), sha256Utf8(value)]);
      const category: Q13ProfileCategory | null = isQ13PackagePointerKey(logical) ? "packagePointers" : canonicalQ13Category(logical);
      if (!category) { unclassified.push(q13UnknownKeyFingerprint(key, profiles, router.registry.legacyProfileId)); continue; }
      profileCategories.get(id)!.get(category)!.push([sha256Utf8(key), sha256Utf8(value)]);
      if (category === "packagePointers") packageEntries.get(id)!.push(Object.freeze({ key: logical, value }));
      continue;
    }
    if (isQ13PackagePointerKey(key) && router.registry.legacyProfileId) {
      const legacyId = router.registry.legacyProfileId;
      byProfile.get(legacyId)!.push([sha256Utf8(key), sha256Utf8(value)]);
      profileCategories.get(legacyId)!.get("packagePointers")!.push([sha256Utf8(key), sha256Utf8(value)]);
      packageEntries.get(legacyId)!.push(Object.freeze({ key, value }));
      continue;
    }
    if (key.startsWith(STORAGE_KEYS.METADATA.slice(0, "patternly:canonical:v1:".length))) {
      const legacyId = router.registry.legacyProfileId;
      const category = canonicalQ13Category(key);
      if (!legacyId || !byProfile.has(legacyId) || !category) { unclassified.push(q13UnknownKeyFingerprint(key, profiles, legacyId)); continue; }
      byProfile.get(legacyId)!.push([sha256Utf8(key), sha256Utf8(value)]);
      profileCategories.get(legacyId)!.get(category)!.push([sha256Utf8(key), sha256Utf8(value)]);
      continue;
    }
    const category = globalQ13Category(key);
    if (!category) { unclassified.push(q13UnknownKeyFingerprint(key, profiles, router.registry.legacyProfileId)); continue; }
    const list = globals.get(category) ?? []; list.push([sha256Utf8(key), sha256Utf8(value)]); globals.set(category, list);
  }
  if (unclassified.length > 0) return Object.freeze({ kind: "unavailable", complete: false, reason: "unclassified_key", physicalKeyCount: keys.length, physicalInventorySha256, unclassifiedKeys: q13UnclassifiedInventory(unclassified) });
  let control: Awaited<ReturnType<ProfileStorageRouter["inspectQ13ControlInventory"]>>;
  try { control = await router.inspectQ13ControlInventory(actorUidSha256); } catch { return Object.freeze({ kind: "unavailable", complete: false, reason: "control_inventory_unavailable", physicalKeyCount: keys.length, physicalInventorySha256 }); }
  if (control.kind !== "observed") return Object.freeze({ kind: "unavailable", complete: false, reason: "control_inventory_unavailable", physicalKeyCount: keys.length, physicalInventorySha256 });
  let secureControl: NonNullable<Q13StorageInventorySnapshot["secureControl"]> = Object.freeze({ kind: "unavailable" });
  if (current.secureControl) {
    try {
      const secureNames = ["patternly.storage.manifest.a", "patternly.storage.manifest.b", "patternly.storage.key.a", "patternly.storage.key.b", "patternly.storage.quarantine-key", "patternly.storage.rotation-request"] as const;
      const secureValues = await Promise.all(secureNames.map((name) => current.secureControl!.get(name)));
      const entries = secureNames.map((name, index) => [sha256Utf8(name), secureValues[index] === null ? null : name.startsWith("patternly.storage.key.") || name.endsWith("quarantine-key") ? "present" : sha256Utf8(secureValues[index]!)]);
      secureControl = Object.freeze({ kind: "observed", slotCount: secureNames.length, keyMaterialPresentCount: secureNames.filter((name, index) => (name.startsWith("patternly.storage.key.") || name.endsWith("quarantine-key")) && secureValues[index] !== null).length, inventorySha256: sha256Utf8(JSON.stringify(entries)) });
    } catch { return Object.freeze({ kind: "unavailable", complete: false, reason: "control_inventory_unavailable", physicalKeyCount: keys.length, physicalInventorySha256 }); }
  }
  const profileInventories = profiles.map((profile) => {
    const entries = byProfile.get(profile.id)!;
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const categoryInventories = Q13_PROFILE_CATEGORIES.map((category) => {
      const categoryEntries = profileCategories.get(profile.id)!.get(category)!;
      categoryEntries.sort((a, b) => a[0].localeCompare(b[0]));
      return Object.freeze({ category, keyCount: categoryEntries.length, inventorySha256: sha256Utf8(JSON.stringify(categoryEntries)) });
    });
    return Object.freeze({ profileIdSha256: sha256Utf8(profile.id), kind: profile.kind, keyCount: entries.length, inventorySha256: sha256Utf8(JSON.stringify(entries)), categoryInventories: Object.freeze(categoryInventories) });
  }).sort((a, b) => a.profileIdSha256.localeCompare(b.profileIdSha256));
  const globalInventories = Q13_GLOBAL_CATEGORIES.map((category) => {
    const entries = globals.get(category) ?? [];
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return Object.freeze({ category, keyCount: entries.length, inventorySha256: sha256Utf8(JSON.stringify(entries)) });
  });
  const after = inspectPreparedQ13StorageReadiness();
  let afterEntries: Array<readonly [string, string]>;
  try {
    const afterKeys = [...current.base.getAllKeys()];
    if (afterKeys.length !== keys.length || afterKeys.some((key) => !keys.includes(key))) return Object.freeze({ kind: "unavailable", complete: false, reason: "prepared_storage_changed", physicalKeyCount: keys.length, physicalInventorySha256 });
    afterEntries = afterKeys.map((key) => {
      const value = current.base.getString(key);
      if (value === undefined) throw new Error("q13_value_missing");
      return [sha256Utf8(key), sha256Utf8(value)] as const;
    }).sort((a, b) => a[0].localeCompare(b[0]));
  } catch { return Object.freeze({ kind: "unavailable", complete: false, reason: "physical_key_read_failed", physicalKeyCount: keys.length, physicalInventorySha256 }); }
  if (after.kind !== "ready" || current.router !== (activePreparedStorage ?? preparedStorage)?.router || JSON.stringify(physicalEntries) !== JSON.stringify(afterEntries)) return Object.freeze({ kind: "unavailable", complete: false, reason: "prepared_storage_changed", physicalKeyCount: keys.length, physicalInventorySha256 });
  const profileIdentityRows = profiles.map((profile) => [sha256Utf8(profile.id), profile.kind, profile.accountId === null ? null : sha256Utf8(profile.accountId)]);
  profileIdentityRows.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return Object.freeze({
    kind: "observed" as const, complete: true, registryGeneration: router.registry.generation, registryChecksumSha256: sha256Utf8(router.registry.checksum), profileCount: profiles.length,
    profileInventorySha256: sha256Utf8(JSON.stringify(profileIdentityRows)),
    physicalKeyCount: keys.length, physicalInventorySha256, profileInventories, globalInventories, control, secureControl,
    packagePointerSources: Object.freeze(profiles.map((profile) => Object.freeze({ profileIdSha256: sha256Utf8(profile.id), entries: Object.freeze(packageEntries.get(profile.id)!) }))),
  });
}

function closePublishedProfileStorage(): void {
  profileStorageGeneration += 1;
  client = null;
  profileRouter = null;
  activePreparedStorage = null;
  profileStorageReadyNotified = false;
}

async function openProductionProfileStorage(generation: number): Promise<PreparedProfileStorage> {
  const { openEncryptedStorage, STORAGE_MIGRATION_MARKER_KEY } = await import("./encryptedStorageBootstrap");
  const { createNativeEncryptedStoragePlatform } = await import("./encryptedStorageNative");
  const platform = createNativeEncryptedStoragePlatform();
  const result = await openEncryptedStorage(platform);
  const base: KeyValueStorage = {
    getString: (key) => result.storage.getString(key),
    setString: (key, value) => { result.storage.setString(key, value); },
    remove: (key) => { result.storage.remove(key); },
    contains: (key) => key !== STORAGE_MIGRATION_MARKER_KEY && result.storage.getString(key) !== undefined,
    getAllKeys: () => result.storage.getAllKeys().filter((key) => key !== STORAGE_MIGRATION_MARKER_KEY),
  };
  profileTransitionActive = false;
  const router = await openProfileStorageRouter(base, platform.manifestStore, {
    isTransitionActive: () => profileTransitionActive || profileStorageGeneration !== generation,
    onBeforeProfileCommit: beginProfileTransition,
  });
  return { base, router, secureControl: platform.manifestStore, generation };
}

async function ensurePreparedStorage(): Promise<PreparedProfileStorage> {
  if (preparedStorage) return preparedStorage;
  if (!preparation) {
    const generation = profileStorageGeneration;
    const open = testPreparationFactory
      ? () => testPreparationFactory!()
      : () => openProductionProfileStorage(generation);
    preparation = open().then((opened) => {
      const prepared = { ...opened, generation };
      preparedStorage = prepared;
      return prepared;
    }).catch((error) => {
      preparedStorage = null;
      preparation = null;
      closePublishedProfileStorage();
      throw error;
    });
  }
  return preparation;
}

async function preparedStorageForDecision(): Promise<PreparedProfileStorage> {
  const prepared = preparedStorage ?? await ensurePreparedStorage();
  if (prepared !== preparedStorage || prepared.generation !== profileStorageGeneration) {
    closePublishedProfileStorage();
    preparedStorage = null;
    preparation = null;
    throw new Error("prepared_profile_stale");
  }
  return prepared;
}

async function refreshPreparedAfterSelection(
  prepared: PreparedProfileStorage,
  canContinue: () => boolean,
): Promise<void> {
  let router: ProfileStorageRouter;
  try {
    router = await prepared.router.refresh();
  } catch (error) {
    if (preparedStorage === prepared) {
      preparedStorage = null;
      preparation = null;
      closePublishedProfileStorage();
    }
    throw error;
  }
  if (preparedStorage !== prepared || prepared.generation !== profileStorageGeneration || client) {
    throw new Error("prepared_profile_stale");
  }
  const refreshed = { ...prepared, router };
  preparedStorage = refreshed;
  preparation = Promise.resolve(refreshed);
  profileTransitionActive = false;
  if (!canContinue()) throw new Error("profile_transition_cancelled");
}

/** Opens encrypted storage and its control registry without publishing profile-scoped storage. */
export async function prepareProfileStorage(): Promise<StorageProfile> {
  if (!preparedStorage && !preparation) closePublishedProfileStorage();
  try {
    return (await ensurePreparedStorage()).router.profile;
  } catch (error) {
    closePublishedProfileStorage();
    throw error;
  }
}

/** Reads only the prepared router registry and never opens a profile-scoped client. */
export async function inspectPreparedProfileState(): Promise<PreparedProfileState> {
  const { router } = await preparedStorageForDecision();
  const selectedProfile = router.registry.profiles.find((profile) => profile.id === router.registry.selectedProfileId);
  if (!selectedProfile) throw new Error("profile_registry_corrupt");
  return Object.freeze({
    profiles: router.registry.profiles,
    selectedProfile,
    isFreshInstallation: router.isFreshInstallation,
  });
}

/** Capability-only, read-only probe over storage refs already opened by normal app preparation. */
export function inspectPreparedQ13StorageReadiness(): Q13StorageReadiness {
  if (profileTransitionActive) return Object.freeze({ kind: "unavailable", reason: "profile_transition_active" });
  const active = activePreparedStorage;
  const prepared = preparedStorage;
  const current = active ?? prepared;
  if (!current || current.generation !== profileStorageGeneration) {
    return Object.freeze({ kind: "unavailable", reason: "prepared_storage_missing" });
  }
  const router = active ? profileRouter : current.router;
  if (!router || current.router !== router) return Object.freeze({ kind: "unavailable", reason: "prepared_storage_changed" });
  if (active ? client === null || activePreparedStorage !== active : client !== null || preparedStorage !== prepared || profileRouter !== null) {
    return Object.freeze({ kind: "unavailable", reason: "prepared_storage_changed" });
  }

  let first: string[];
  let second: string[];
  try {
    first = [...current.base.getAllKeys()];
    second = [...current.base.getAllKeys()];
  } catch {
    return Object.freeze({ kind: "unavailable", reason: "physical_key_read_failed" });
  }
  if (first.some((key) => typeof key !== "string") || new Set(first).size !== first.length) {
    return Object.freeze({ kind: "unavailable", reason: "physical_key_inventory_invalid" });
  }
  const firstIdentity = JSON.stringify([...first].sort());
  if (firstIdentity !== JSON.stringify([...second].sort())) return Object.freeze({ kind: "unavailable", reason: "prepared_storage_changed" });
  const sameOwner = profileStorageGeneration === current.generation && !profileTransitionActive
    && (active ? activePreparedStorage === active && profileRouter === router && client !== null
      : preparedStorage === prepared && profileRouter === null && client === null);
  if (!sameOwner) return Object.freeze({ kind: "unavailable", reason: "prepared_storage_changed" });
  return Object.freeze({ kind: "ready", registeredProfileCount: router.registry.profiles.length, physicalKeyCount: first.length });
}

/** Validates only the exact selected guest's access and installation markers before publication. */
export async function validatePreparedGuestAccess(profileId: string): Promise<boolean> {
  const { router } = await preparedStorageForDecision();
  if (client || router.registry.selectedProfileId !== profileId) return false;
  return router.hasValidGuestAccess(profileId);
}

/** Selects the authenticated backend account profile while storage remains closed. */
export async function selectPreparedAccountProfile(
  accountId: string,
  canContinue: () => boolean = () => true,
  options: Readonly<{ recoverBoundGuest?: boolean }> = {},
): Promise<Readonly<{ profile: StorageProfile; changed: boolean }>> {
  const prepared = await preparedStorageForDecision();
  const { router } = prepared;
  if (client || !canContinue()) throw new Error("profile_transition_cancelled");
  const previous = router.registry.profiles.find((profile) => profile.id === router.registry.selectedProfileId);
  if (!previous) throw new Error("profile_registry_corrupt");
  const profile = (options.recoverBoundGuest ? await router.promoteSelectedBoundGuest(accountId, canContinue) : null)
    ?? await router.selectAccount(accountId, canContinue);
  const changed = profile.id !== previous.id || profile.kind !== previous.kind;
  if (!canContinue() && !changed) throw new Error("profile_transition_cancelled");
  if (changed) await refreshPreparedAfterSelection(prepared, canContinue);
  return Object.freeze({ profile, changed });
}

/**
 * Reopens a preserved guest without reading its payload. An implicit choice is
 * allowed only when the selected profile is a guest or exactly one guest exists.
 */
export async function selectPreparedGuestProfile(
  profileId?: string,
  canContinue: () => boolean = () => true,
): Promise<Readonly<{ profile: StorageProfile; changed: boolean }>> {
  const prepared = await preparedStorageForDecision();
  const { router } = prepared;
  if (client || !canContinue()) throw new Error("profile_transition_cancelled");
  const previous = router.registry.profiles.find((profile) => profile.id === router.registry.selectedProfileId);
  if (!previous) throw new Error("profile_registry_corrupt");
  const guests = router.registry.profiles.filter((profile) => profile.kind === "guest" || profile.kind === "legacy_guest");
  const selectedIsGuest = previous.kind === "guest" || previous.kind === "legacy_guest";
  let targetId = profileId;
  if (targetId === undefined) {
    if (selectedIsGuest) targetId = previous.id;
    else if (guests.length === 1) targetId = guests[0]!.id;
    else if (guests.length > 1) throw new ProfileStorageError("prepared_guest_choice_required");
  }
  const profile = targetId === undefined
    ? await router.selectGuest(canContinue)
    : await router.selectExistingGuest(targetId, canContinue);
  const changed = profile.id !== previous.id || profile.kind !== previous.kind;
  if (!canContinue() && !changed) throw new Error("profile_transition_cancelled");
  if (changed) await refreshPreparedAfterSelection(prepared, canContinue);
  return Object.freeze({ profile, changed });
}

/** Closes published storage and restores its router metadata for another safe decision. */
export function closeActiveProfileStorage(): void {
  if (!client) return;
  const retained = activePreparedStorage;
  client = null;
  profileRouter = null;
  activePreparedStorage = null;
  if (retained && retained.generation === profileStorageGeneration) {
    preparedStorage = retained;
    preparation = Promise.resolve(retained);
  }
}

/** Purpose-bound one-time maintenance operation; publication resumes only after journaled removal completes. */
export async function removeOriginalGuest34(expected: GuestRemoval34ExpectedState): Promise<GuestRemoval34Receipt> {
  const prepared = activePreparedStorage;
  const router = profileRouter;
  if (!client || !prepared || !router || prepared.router !== router || profileTransitionActive) {
    return Object.freeze({ schemaVersion: "bizq01-guest-removal-34-v1", result: "failed", stage: "active_profile_unavailable" });
  }
  let receipt: GuestRemoval34Receipt;
  try { receipt = await router.removeOriginalGuest34(expected); }
  catch { receipt = Object.freeze({ schemaVersion: "bizq01-guest-removal-34-v1", result: "failed", stage: "transaction_unavailable" }); }
  if (receipt.result !== "passed") {
    if (profileTransitionActive) closeActiveProfileStorage();
    return receipt;
  }
  closeActiveProfileStorage();
  try {
    const refreshed = await router.refresh();
    if (refreshed.profile.kind !== "guest" || refreshed.profile.id === router.profile.id || refreshed.registry.profiles.length !== 10
      || refreshed.registry.profiles.filter((profile) => profile.kind === "account").length !== 9
      || refreshed.registry.profiles.some((profile) => profile.id === router.profile.id)) throw new Error("replacement_profile_invalid");
    const next = { ...prepared, router: refreshed };
    preparedStorage = next;
    preparation = Promise.resolve(next);
    profileTransitionActive = false;
    activatePreparedProfile(refreshed.profile.id, refreshed.profile.kind);
    return receipt;
  } catch {
    beginProfileTransition();
    closeActiveProfileStorage();
    return Object.freeze({ schemaVersion: "bizq01-guest-removal-34-v1", result: "failed", stage: "replacement_publication_failed" });
  }
}

/** Publishes only the exact profile prepared by the router. A mismatch leaves storage closed. */
export function activatePreparedProfile(profileId: string, kind: StorageProfile["kind"], options: Readonly<{ deferReadyNotification?: boolean }> = {}): KeyValueStorage {
  if (profileTransitionActive) throw new ProfileTransitionActiveError();
  const prepared = preparedStorage;
  const profile = prepared?.router.profile;
  if (!prepared || prepared.generation !== profileStorageGeneration || !profile || profile.id !== profileId || profile.kind !== kind) {
    preparedStorage = null;
    preparation = null;
    closePublishedProfileStorage();
    throw new Error("prepared_profile_mismatch");
  }
  profileTransitionActive = false;
  profileRouter = prepared.router;
  activePreparedStorage = prepared;
  const generation = prepared.generation;
  const checkPublished = () => {
    if (profileStorageGeneration !== generation || profileTransitionActive || client !== publishedStorage) throw new ProfileTransitionActiveError();
  };
  const scopedStorage = prepared.router.storage;
  const publishedStorage: KeyValueStorage = {
    getString(key) { checkPublished(); return scopedStorage.getString(key); },
    setString(key, value) { checkPublished(); scopedStorage.setString(key, value); },
    remove(key) { checkPublished(); scopedStorage.remove(key); },
    contains(key) { checkPublished(); return scopedStorage.contains(key); },
    getAllKeys() { checkPublished(); return scopedStorage.getAllKeys(); },
  };
  client = Object.freeze(publishedStorage);
  preparedStorage = null;
  preparation = null;
  profileStorageReadyNotified = false;
  if (!options.deferReadyNotification) notifyProfileStorageReady();
  return client;
}

/** Notifies preferences/content listeners after the account access gate has approved the active scope. */
export function notifyProfileStorageReady(): void {
  if (!client || profileStorageReadyNotified) return;
  profileStorageReadyNotified = true;
  try {
    for (const listener of readyListeners) listener();
  } catch (error) {
    closePublishedProfileStorage();
    throw error;
  }
}

export function onKeyValueStorageReady(listener: () => void): () => void {
  readyListeners.add(listener);
  if (client && profileStorageReadyNotified) listener();
  return () => { readyListeners.delete(listener); };
}

export function getActiveStorageProfile(): StorageProfile {
  if (!profileRouter) throw new Error("encrypted_storage_not_initialized");
  return profileRouter.profile;
}

export function getActiveStorageProfileOrNull(): StorageProfile | null { return profileRouter?.profile ?? null; }

export function captureActiveProfileStorageLease(): ActiveProfileStorageLease | null {
  if (!client || !profileRouter || !activePreparedStorage || profileTransitionActive || activePreparedStorage.generation !== profileStorageGeneration) return null;
  return Object.freeze({ profile: Object.freeze({ ...profileRouter.profile }), generation: activePreparedStorage.generation });
}

/** Captures only an existing closed prepared router; this never prepares or opens scoped storage. */
export function capturePreparedProfileStorageLease(): PreparedProfileStorageLease | null {
  const prepared = preparedStorage;
  if (!prepared || client || profileTransitionActive || prepared.generation !== profileStorageGeneration) return null;
  return Object.freeze({ profile: Object.freeze({ ...prepared.router.profile }), generation: prepared.generation });
}

export function isPreparedProfileStorageLeaseCurrent(lease: PreparedProfileStorageLease): boolean {
  const prepared = preparedStorage;
  return Boolean(prepared && !client && !profileTransitionActive && prepared.generation === lease.generation
    && prepared.generation === profileStorageGeneration && prepared.router.profile.id === lease.profile.id
    && prepared.router.profile.kind === lease.profile.kind && prepared.router.profile.accountId === lease.profile.accountId);
}

export function isActiveProfileStorageLeaseCurrent(lease: ActiveProfileStorageLease): boolean {
  const profile = profileRouter?.profile;
  return Boolean(client && activePreparedStorage && !profileTransitionActive && activePreparedStorage.generation === lease.generation
    && profile && profile.id === lease.profile.id && profile.kind === lease.profile.kind && profile.accountId === lease.profile.accountId
    && activePreparedStorage.generation === profileStorageGeneration);
}

export async function readPreparedAccountIdentityBinding(profileId: string): Promise<AccountIdentityBindingRead> {
  const prepared = preparedStorage;
  const registered = prepared?.router.registry.profiles.find((profile) => profile.id === profileId);
  if (client || !prepared || profileTransitionActive || prepared.generation !== profileStorageGeneration
    || prepared.router.profile.id !== profileId || prepared.router.registry.selectedProfileId !== profileId
    || !registered || registered.kind !== prepared.router.profile.kind || registered.accountId !== prepared.router.profile.accountId) {
    throw new ProfileStorageError("profile_transition_cancelled");
  }
  const value = await prepared.router.readSelectedAccountIdentityBinding();
  if (preparedStorage !== prepared || prepared.generation !== profileStorageGeneration || client || profileTransitionActive) {
    throw new ProfileStorageError("profile_transition_cancelled");
  }
  return value;
}

export async function invalidatePreparedAccountIdentityBinding(input: Readonly<{ profileId: string; canContinue: () => boolean }>): Promise<void> {
  const prepared = preparedStorage;
  if (client || !prepared || profileTransitionActive || prepared.generation !== profileStorageGeneration || prepared.router.profile.id !== input.profileId) {
    throw new ProfileStorageError("profile_transition_cancelled");
  }
  await prepared.router.invalidateSelectedAccountIdentityBinding(input.canContinue);
  if (preparedStorage !== prepared || prepared.generation !== profileStorageGeneration || client || profileTransitionActive || !input.canContinue()) {
    throw new ProfileStorageError("profile_transition_cancelled");
  }
}

export async function readActiveAccountIdentityBinding(lease: ActiveProfileStorageLease): Promise<AccountIdentityBindingRead> {
  const router = profileRouter;
  if (!router || !isActiveProfileStorageLeaseCurrent(lease)) throw new ProfileStorageError("profile_transition_cancelled");
  const value = await router.readSelectedAccountIdentityBinding();
  if (profileRouter !== router || !isActiveProfileStorageLeaseCurrent(lease)) throw new ProfileStorageError("profile_transition_cancelled");
  return value;
}

export async function writeActiveAccountIdentityBinding(input: Readonly<{
  lease: ActiveProfileStorageLease;
  accountId: string;
  firebaseUid: string;
  canContinue: () => boolean;
}>): Promise<AccountIdentityBinding> {
  const router = profileRouter;
  const guard = () => input.canContinue() && isActiveProfileStorageLeaseCurrent(input.lease);
  if (!router || !guard()) throw new ProfileStorageError("profile_transition_cancelled");
  const value = await router.writeVerifiedSelectedAccountIdentityBinding({
    accountId: input.accountId,
    firebaseUid: input.firebaseUid,
    canContinue: guard,
  });
  if (profileRouter !== router || !guard()) throw new ProfileStorageError("profile_transition_cancelled");
  return value;
}

export async function invalidateActiveAccountIdentityBinding(input: Readonly<{
  lease: ActiveProfileStorageLease;
  canContinue: () => boolean;
}>): Promise<void> {
  const router = profileRouter;
  const guard = () => input.canContinue() && isActiveProfileStorageLeaseCurrent(input.lease);
  if (!router || !guard()) throw new ProfileStorageError("profile_transition_cancelled");
  await router.invalidateSelectedAccountIdentityBinding(guard);
  if (profileRouter !== router || !guard()) throw new ProfileStorageError("profile_transition_cancelled");
}

export async function beginAccountIdentityProofBarrier(input: Readonly<{
  profileId: string;
  accountId: string;
  firebaseUid: string;
  verificationRevision: number;
  lease?: ActiveProfileStorageLease;
  canContinue: () => boolean;
}>): Promise<AccountIdentityProofBarrier | null> {
  if (input.lease) {
    const router = profileRouter;
    const guard = () => input.canContinue() && isActiveProfileStorageLeaseCurrent(input.lease!);
    if (!router || input.lease.profile.id !== input.profileId || !guard()) throw new ProfileStorageError("profile_transition_cancelled");
    const receipt = await router.beginSelectedAccountIdentityProofBarrier({
      accountId: input.accountId, firebaseUid: input.firebaseUid, verificationRevision: input.verificationRevision, canContinue: guard,
    });
    if (profileRouter !== router || !guard()) throw new ProfileStorageError("profile_transition_cancelled");
    return receipt ? Object.freeze({ schema: "patternly.account-identity-proof-barrier-scope.v1", ownerReceipt: receipt, storageGeneration: input.lease.generation, leaseGeneration: input.lease.generation }) : null;
  }
  const prepared = preparedStorage;
  if (client || !prepared || profileTransitionActive || prepared.generation !== profileStorageGeneration
    || prepared.router.profile.id !== input.profileId || prepared.router.profile.accountId !== input.accountId
    || !input.canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
  const receipt = await prepared.router.beginSelectedAccountIdentityProofBarrier({
    accountId: input.accountId, firebaseUid: input.firebaseUid, verificationRevision: input.verificationRevision,
    canContinue: input.canContinue,
  });
  if (preparedStorage !== prepared || prepared.generation !== profileStorageGeneration || client || profileTransitionActive || !input.canContinue()) {
    throw new ProfileStorageError("profile_transition_cancelled");
  }
  return receipt ? Object.freeze({ schema: "patternly.account-identity-proof-barrier-scope.v1", ownerReceipt: receipt, storageGeneration: prepared.generation, leaseGeneration: null }) : null;
}

export async function resolveAccountIdentityProofBarrier(input: Readonly<{
  receipt: AccountIdentityProofBarrier;
  lease?: ActiveProfileStorageLease;
  canContinue: () => boolean;
}>): Promise<AccountIdentityBinding> {
  const scope = input.receipt;
  if (scope.schema !== "patternly.account-identity-proof-barrier-scope.v1") throw new ProfileStorageError("account_binding_conflict");
  if (scope.leaseGeneration !== null) {
    const router = profileRouter;
    const lease = input.lease;
    const guard = () => input.canContinue() && Boolean(lease) && lease!.generation === scope.leaseGeneration
      && lease!.generation === scope.storageGeneration && isActiveProfileStorageLeaseCurrent(lease!);
    if (!router || !lease || lease.profile.id !== scope.ownerReceipt.profileId || !guard()) throw new ProfileStorageError("profile_transition_cancelled");
    const binding = await router.resolveSelectedAccountIdentityProofBarrier({ receipt: scope.ownerReceipt, canContinue: guard });
    if (profileRouter !== router || !guard()) throw new ProfileStorageError("profile_transition_cancelled");
    return binding;
  }
  const prepared = preparedStorage;
  if (client || !prepared || profileTransitionActive || prepared.generation !== scope.storageGeneration
    || prepared.generation !== profileStorageGeneration || prepared.router.profile.id !== scope.ownerReceipt.profileId
    || !input.canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
  const binding = await prepared.router.resolveSelectedAccountIdentityProofBarrier({ receipt: scope.ownerReceipt, canContinue: input.canContinue });
  if (preparedStorage !== prepared || prepared.generation !== profileStorageGeneration || client || profileTransitionActive || !input.canContinue()) {
    throw new ProfileStorageError("profile_transition_cancelled");
  }
  return binding;
}

export function beginProfileTransition(): void {
  if (profileTransitionActive) return;
  profileTransitionActive = true;
  for (const listener of profileTransitionListeners) listener();
}

export function isProfileTransitionActive(): boolean { return profileTransitionActive; }

/** Stage 1 bounded canary and read-only reconciliation for the reviewed BIZQ-01 Guest removal. */
export function inspectBizq01GuestRemoval34Canary(
  expectedDatasetIdSha256: string,
  expectedInstallationIdSha256: string,
): GuestRemovalReconciliationReceipt {
  const fail = (stage: string, extra: Partial<GuestRemovalReconciliationReceipt> = {}): GuestRemovalReconciliationReceipt =>
    Object.freeze({ schemaVersion: "bizq01-guest-removal-reconciliation-v1", result: "failed", stage, ...extra });
  if (!/^[a-f0-9]{64}$/u.test(expectedDatasetIdSha256) || !/^[a-f0-9]{64}$/u.test(expectedInstallationIdSha256)) return fail("input_invalid");
  const prepared = activePreparedStorage;
  const router = profileRouter;
  if (!client || !prepared || !router || prepared.router !== router) return fail("active_profile_unavailable");
  const profile = router.profile;
  const guests = router.registry.profiles.filter((candidate) => candidate.kind === "guest" || candidate.kind === "legacy_guest");
  if (profile.kind !== "guest" || profile.accountId !== null || router.registry.selectedProfileId !== profile.id || guests.length !== 1
    || !router.hasExactUnboundModernGuest(profile.id, expectedInstallationIdSha256, expectedDatasetIdSha256)) {
    return fail("expected_guest_mismatch", { profileTransitionActive });
  }
  let workPresent: boolean;
  try { workPresent = activeLearningWorkPresent(router); }
  catch { return fail("active_learning_state_unavailable", { profileTransitionActive, guestKind: profile.kind, selectedGuestMatches: true }); }
  if (workPresent) return fail("active_learning_work_present", { profileTransitionActive, activeLearningWorkPresent: true, guestKind: profile.kind, selectedGuestMatches: true });
  let snapshot: ReturnType<typeof snapshotGuestRemovalReconciliationState>;
  try { snapshot = snapshotGuestRemovalReconciliationState(prepared.base, router); }
  catch { return fail("protected_state_unavailable", { profileTransitionActive, activeLearningWorkPresent: false, guestKind: profile.kind, selectedGuestMatches: true }); }
  const identities = guestProfileIdentityInventory(router);
  return Object.freeze({
    schemaVersion: "bizq01-guest-removal-reconciliation-v1",
    result: "observed",
    stage: snapshot.canaryFamilyKeyCount === 0 ? "complete" : "canary_family_nonempty",
    profileTransitionActive,
    activeLearningWorkPresent: false,
    guestKind: profile.kind,
    selectedGuestMatches: true,
    installationIdSha256: expectedInstallationIdSha256,
    datasetIdSha256: expectedDatasetIdSha256,
    ...identities,
    ...snapshot,
  });
}

/** Read-only, purpose-bound check for residual physical keys under the exact removed Guest ID. */
export function inspectRemovedOriginalGuest34(
  expectedReplacementDatasetIdSha256: string,
  expectedInstallationIdSha256: string,
): GuestRemovalPostcoldPrefixReceipt {
  const fail = (stage: string): GuestRemovalPostcoldPrefixReceipt =>
    Object.freeze({ schemaVersion: "bizq01-guest-removal-postcold-prefix-v1", result: "failed", stage });
  if (!/^[a-f0-9]{64}$/u.test(expectedReplacementDatasetIdSha256)
    || !/^[a-f0-9]{64}$/u.test(expectedInstallationIdSha256)) return fail("input_invalid");

  const reconciliation = inspectBizq01GuestRemoval34Canary(expectedReplacementDatasetIdSha256, expectedInstallationIdSha256);
  if (reconciliation.result !== "observed") return fail("guest_reconciliation_failed");
  if (reconciliation.profileTransitionActive !== false) return fail("profile_transition_active");
  if (reconciliation.activeLearningWorkPresent !== false || reconciliation.guestKind !== "guest"
    || reconciliation.selectedGuestMatches !== true || reconciliation.datasetIdSha256 !== expectedReplacementDatasetIdSha256
    || reconciliation.accountProfileCount !== 9 || reconciliation.guestProfileCount !== 1) return fail("guest_reconciliation_failed");

  const prepared = activePreparedStorage;
  const router = profileRouter;
  if (!client || !prepared || !router || prepared.router !== router) return fail("active_profile_unavailable");
  try {
    const keys = prepared.base.getAllKeys();
    if (keys.some((key) => typeof key !== "string") || new Set(keys).size !== keys.length) return fail("protected_state_unavailable");
    const profileIdPattern = /^patternly:profile:v1:([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}):/iu;
    let oldPrefixKeyCount = 0;
    for (const key of keys) {
      const match = profileIdPattern.exec(key);
      if (match && sha256Utf8(match[1]!) === BIZQ01_REMOVED_GUEST_ID_SHA256) oldPrefixKeyCount += 1;
    }
    return Object.freeze({
      schemaVersion: "bizq01-guest-removal-postcold-prefix-v1",
      result: "observed",
      stage: oldPrefixKeyCount === 0 ? "complete" : "old_prefix_present",
      oldPrefixKeyCount,
    });
  } catch {
    return fail("protected_state_unavailable");
  }
}

export function runBizq01GuestRemoval34Canary(
  expectedDatasetIdSha256: string,
  expectedInstallationIdSha256: string,
  nonce: string,
): GuestRemovalCanaryReceipt {
  if (!/^[a-f0-9]{64}$/u.test(expectedDatasetIdSha256) || !/^[a-f0-9]{64}$/u.test(expectedInstallationIdSha256)
    || !/^[a-f0-9]{64}$/u.test(nonce)) return guestRemovalCanaryFailure("input_invalid");
  const prepared = activePreparedStorage;
  const router = profileRouter;
  if (!client || !prepared || !router || prepared.router !== router || profileTransitionActive) return guestRemovalCanaryFailure("active_profile_unavailable");
  const profile = router.profile;
  const guests = router.registry.profiles.filter((candidate) => candidate.kind === "guest" || candidate.kind === "legacy_guest");
  if (profile.kind !== "guest" || profile.accountId !== null || router.registry.selectedProfileId !== profile.id || guests.length !== 1
    || !router.hasExactUnboundModernGuest(profile.id, expectedInstallationIdSha256, expectedDatasetIdSha256)) {
    return guestRemovalCanaryFailure("expected_guest_mismatch");
  }
  try { if (activeLearningWorkPresent(router)) return guestRemovalCanaryFailure("active_learning_work_present"); }
  catch { return guestRemovalCanaryFailure("active_learning_state_unavailable"); }
  try { beginProfileTransition(); } catch { return guestRemovalCanaryFailure("transition_barrier_failed"); }

  const base = prepared.base;
  const namespace = `${BIZQ01_CANARY_FAMILY_PREFIX}${nonce}:`;
  const key = `${namespace}adapter-check:${nonce}`;
  const value = JSON.stringify({ schemaVersion: "bizq01-guest-removal-canary-value-v1", nonce });
  const canaryValueSha256 = sha256Utf8(value);
  let baseline: GuestRemovalCanaryBaseline;
  try { baseline = snapshotGuestRemovalCanaryState(base, router, namespace); }
  catch { return guestRemovalCanaryFailure("protected_baseline_unavailable"); }

  let writeAttempted = false;
  let operationFailure: string | null = null;
  let cleanupFailed = false;
  try {
    writeAttempted = true;
    base.setString(key, value);
    if (!base.getAllKeys().includes(key)) operationFailure = "canary_enumeration_failed";
    else if (base.getString(key) !== value) operationFailure = "canary_readback_failed";
  } catch { operationFailure = "canary_adapter_operation_failed"; }
  finally {
    if (writeAttempted) {
      try { base.remove(key); } catch { cleanupFailed = true; }
    }
  }

  let cleanupVerified = false;
  let after: GuestRemovalCanaryBaseline | null = null;
  try {
    cleanupVerified = !base.getAllKeys().includes(key) && base.getString(key) === undefined;
    if (cleanupVerified) after = snapshotGuestRemovalCanaryState(base, router, namespace);
  } catch { cleanupVerified = false; }
  const protectedStateUnchanged = after !== null
    && after.accountStateSha256 === baseline.accountStateSha256
    && after.globalStateSha256 === baseline.globalStateSha256
    && after.protectedAdapterStateSha256 === baseline.protectedAdapterStateSha256;
  const facts = { ...baseline, canaryValueSha256, protectedStateUnchanged, cleanupVerified: cleanupVerified && !cleanupFailed };
  if (cleanupFailed || !cleanupVerified) return guestRemovalCanaryFailure("canary_cleanup_failed", facts);
  if (operationFailure) return guestRemovalCanaryFailure(operationFailure, facts);
  if (!protectedStateUnchanged) return guestRemovalCanaryFailure("protected_state_changed", facts);
  return Object.freeze({ schemaVersion: "bizq01-guest-removal-canary-v1", result: "passed", stage: "complete", ...facts });
}

export function onProfileTransitionChanged(listener: () => void): () => void {
  profileTransitionListeners.add(listener);
  return () => { profileTransitionListeners.delete(listener); };
}

export async function continueAsGuestInNewProfile(): Promise<void> {
  if (!profileRouter) throw new Error("encrypted_storage_not_initialized");
  await profileRouter.selectGuest();
  await reloadForProfileTransition();
}

export async function selectAccountProfileAndRestart(
  accountId: string,
  canContinue: () => boolean = () => true,
  options: Readonly<{ recoverBoundGuest?: boolean }> = {},
): Promise<boolean> {
  if (!profileRouter) throw new Error("encrypted_storage_not_initialized");
  const selected = (options.recoverBoundGuest ? await profileRouter.promoteSelectedBoundGuest(accountId, canContinue) : null)
    ?? await profileRouter.selectAccount(accountId, canContinue);
  const changed = selected.id !== profileRouter.profile.id || selected.kind !== profileRouter.profile.kind;
  if (!changed) return false;
  await reloadForProfileTransition();
  return true;
}

export async function reloadForProfileTransition(): Promise<void> {
  if (!profileTransitionActive) throw new Error("profile_transition_not_started");
  if (testProfileTransitionReload) {
    await testProfileTransitionReload();
    return;
  }
  const { reloadAppAsync } = await import("expo");
  await reloadAppAsync("Patternly local data profile changed");
}

export function getKeyValueStorage(): KeyValueStorage {
  if (!client) {
    throw new Error("encrypted_storage_not_initialized");
  }
  return client;
}

/** Destructive recovery used only after the user confirms an unrecoverable key loss. */
export async function removeUnavailableEncryptedStorage(): Promise<void> {
  const { resetUnavailableEncryptedStorage } = await import("./encryptedStorageBootstrap");
  const { createNativeEncryptedStoragePlatform } = await import("./encryptedStorageNative");
  await resetUnavailableEncryptedStorage(createNativeEncryptedStoragePlatform());
  closePublishedProfileStorage();
  preparedStorage = null;
  preparation = null;
  profileTransitionActive = false;
}

/** Test infrastructure. Production always uses the one MMKV instance above. */
export class MemoryKeyValueStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();
  private failurePlan: FailurePlan | null = null;
  readonly operations: { kind: "read" | "write" | "remove"; key: string }[] = [];
  private reads = 0; private writes = 0; private removes = 0;
  getString(key: string): string | undefined { this.reads += 1; this.operations.push({ kind: "read", key }); this.fail("read", key, this.reads); return this.values.get(key); }
  setString(key: string, value: string): void { this.writes += 1; this.operations.push({ kind: "write", key }); this.fail("write", key, this.writes); this.values.set(key, value); }
  remove(key: string): void { this.removes += 1; this.operations.push({ kind: "remove", key }); this.fail("remove", key, this.removes); this.values.delete(key); }
  contains(key: string): boolean { return this.values.has(key); }
  getAllKeys(): readonly string[] { return [...this.values.keys()]; }
  setFailurePlan(plan: FailurePlan | null): void { this.failurePlan = plan; }
  resetCounters(): void { this.reads = 0; this.writes = 0; this.removes = 0; this.operations.length = 0; }
  snapshot(): ReadonlyMap<string, string> { return new Map(this.values); }
  private fail(kind: "read" | "write" | "remove", key: string, number: number): void { const plan = this.failurePlan; if (!plan) return; const matchingKeyWrites = kind === "write" ? this.operations.filter((operation) => operation.kind === "write" && operation.key === key).length : 0; const fail = (plan.kind === "fail_on_write_number" && kind === "write" && plan.writeNumber === number) || (plan.kind === "fail_on_key_write" && kind === "write" && plan.key === key) || (plan.kind === "fail_on_key_write_occurrence" && kind === "write" && plan.key === key && plan.occurrence === matchingKeyWrites) || (plan.kind === "fail_on_read_number" && kind === "read" && plan.readNumber === number) || (plan.kind === "fail_on_key_read" && kind === "read" && plan.key === key) || (plan.kind === "fail_on_remove_number" && kind === "remove" && plan.removeNumber === number) || (plan.kind === "fail_on_key_remove" && kind === "remove" && plan.key === key); if (fail) throw new Error(`Injected ${kind} failure for ${key}.`); }
}
export type FailurePlan =
  | { kind: "fail_on_write_number"; writeNumber: number }
  | { kind: "fail_on_key_write"; key: string }
  | { kind: "fail_on_key_write_occurrence"; key: string; occurrence: number }
  | { kind: "fail_on_read_number"; readNumber: number }
  | { kind: "fail_on_key_read"; key: string }
  | { kind: "fail_on_remove_number"; removeNumber: number }
  | { kind: "fail_on_key_remove"; key: string };

export function installKeyValueStorageForTests(storage: KeyValueStorage): void {
  closePublishedProfileStorage();
  client = storage;
  profileRouter = null;
  preparedStorage = null;
  activePreparedStorage = null;
  preparation = null;
  profileTransitionActive = false;
}

/** Test-only bootstrap seam for exercising the prepare/activate boundary. */
export function setProfileStoragePreparationFactoryForTests(factory: (() => Promise<PreparedStorage>) | null): void {
  closePublishedProfileStorage();
  preparedStorage = null;
  preparation = null;
  testPreparationFactory = factory;
}

/** Test-only seam that prevents selection tests from reloading the app process. */
export function setProfileTransitionReloadForTests(reload: (() => Promise<void>) | null): void {
  testProfileTransitionReload = reload;
}
