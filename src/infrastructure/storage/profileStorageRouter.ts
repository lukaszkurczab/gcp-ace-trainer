import type { KeyValueStorage } from "./mmkvClient";
import type { StorageManifestStore } from "./encryptedStorageBootstrap";
import { STORAGE_NAMESPACE, STORAGE_KEYS } from "../../storage/keys";
import { installationIdentity, type GuestInstallationIdentityPort } from "../identity/installationIdentity";
import { sha256Utf8 } from "../identity/sha256";
import { inspectQ13LocalLogoutControl } from "./localLogoutControl";

const ROOT_KEYS = Object.freeze(["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"] as const);
const ACCOUNT_BINDING_KEYS = Object.freeze(["patternly.account-binding.v1.a", "patternly.account-binding.v1.b"] as const);
const ACCOUNT_BINDING_SCHEMA = "patternly.account-binding.v1" as const;
const GUEST_REMOVAL_JOURNAL_KEY = "patternly.profile-removal.v1";
const LOCAL_LOGOUT_CONTROL_KEY = "patternly.local-logout-control.v2";
const ROOT_VERSION = 1 as const;
const PROFILE_PREFIX = "patternly:profile:v1:";
const CANONICAL_ENVELOPE = "patternly:canonical:v1";

export type ProfileKind = "legacy_owner" | "legacy_guest" | "account" | "guest";
export type StorageProfile = Readonly<{ id: string; kind: ProfileKind; accountId: string | null }>;
export type ProfileRegistry = Readonly<{
  version: typeof ROOT_VERSION;
  generation: number;
  profiles: readonly StorageProfile[];
  legacyProfileId: string | null;
  selectedProfileId: string;
  checksum: string;
}>;

export type AccountIdentityBinding = Readonly<{
  schema: typeof ACCOUNT_BINDING_SCHEMA;
  profileId: string;
  profileKind: "account" | "legacy_owner";
  accountId: string;
  firebaseUid: string;
  verified: true;
  verificationRevision: number;
  checksum: string;
}>;

export type AccountIdentityBindingRead = Readonly<{ kind: "verified"; binding: AccountIdentityBinding } | { kind: "missing" | "invalidated" }>;

export type AccountIdentityProofBarrierReceipt = Readonly<{
  schema: "patternly.account-identity-proof-barrier.v1";
  profileId: string;
  profileKind: "account" | "legacy_owner";
  accountId: string;
  firebaseUid: string;
  previousBindingChecksum: string;
  previousVerificationRevision: number;
  tombstoneChecksum: string;
  tombstoneVerificationRevision: number;
  envelopeChecksum: string;
  envelopeGeneration: number;
}>;

type AccountIdentityBindingEntry = Readonly<{
  schema: typeof ACCOUNT_BINDING_SCHEMA;
  profileId: string;
  profileKind: "account" | "legacy_owner";
  accountId: string | null;
  firebaseUid: string | null;
  verified: boolean;
  verificationRevision: number;
  checksum: string;
}>;

type AccountIdentityBindingEnvelope = Readonly<{
  schema: typeof ACCOUNT_BINDING_SCHEMA;
  generation: number;
  bindings: readonly AccountIdentityBindingEntry[];
  checksum: string;
}>;

export type GuestRemoval34Receipt = Readonly<{
  schemaVersion: "bizq01-guest-removal-34-v1";
  result: "passed" | "failed";
  stage: string;
  replacementProfileIdSha256?: string;
  removedProfileIdSha256?: string;
  protectedAccountStateSha256?: string;
  protectedGlobalStateSha256?: string;
  logoutControlSha256?: string;
  removedKeyCount?: number;
}>;

export type GuestRemoval34ExpectedState = Readonly<{
  datasetIdSha256: string;
  installationIdSha256: string;
  profileIdentityInventorySha256: string;
  accountStateSha256: string;
  globalStateSha256: string;
  pendingPairInventorySha256: string;
  pendingUidInventorySha256: string;
  guestKeyCount: number;
}>;

type GuestRemoval34Journal = Readonly<{
  schemaVersion: "bizq01-guest-removal-34-journal-v1";
  stage: "intent" | "replacement_markers" | "registry_first" | "registry_both" | "cleanup";
  targetProfileId: string;
  targetInstallationId: string;
  replacementProfileId: string;
  replacementInstallationId: string;
  expectedDatasetIdSha256: string;
  expectedInstallationIdSha256: string;
  expectedProfileIdentityInventorySha256: string;
  expectedAccountStateSha256: string;
  expectedGlobalStateSha256: string;
  expectedPendingPairInventorySha256: string;
  expectedPendingUidInventorySha256: string;
  originalRegistryGeneration: number;
  originalRegistryChecksum: string;
  targetKeyCount: number;
  retainedProfiles: readonly StorageProfile[];
  accountStateSha256: string;
  globalStateSha256: string;
  otherProfileStateSha256: string;
  logoutControlSha256: string;
  checksum: string;
}>;

export class ProfileStorageError extends Error {
  public constructor(public readonly code: "profile_registry_corrupt" | "legacy_profile_unidentified" | "profile_scope_unavailable" | "profile_transition_cancelled" | "prepared_guest_choice_required" | "profile_removal_recovery_required" | "account_binding_corrupt" | "account_binding_ambiguous" | "account_binding_conflict" | "account_binding_commit_unverified") {
    super(code);
    this.name = "ProfileStorageError";
  }
}

export class ProfileTransitionActiveError extends Error {
  public constructor() { super("profile_transition_active"); this.name = "ProfileTransitionActiveError"; }
}

function uuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function bodyOf(value: Omit<ProfileRegistry, "checksum">): Omit<ProfileRegistry, "checksum"> {
  return value;
}

function withChecksum(value: Omit<ProfileRegistry, "checksum">): ProfileRegistry {
  return Object.freeze({ ...value, checksum: sha256Utf8(JSON.stringify(bodyOf(value))) });
}

function parseRegistry(raw: string | null): ProfileRegistry | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (Object.keys(value).sort().join(",") !== "checksum,generation,legacyProfileId,profiles,selectedProfileId,version") return null;
    const { checksum, ...body } = value;
    if (body.version !== ROOT_VERSION || !Number.isSafeInteger(body.generation) || Number(body.generation) < 1 || typeof checksum !== "string") return null;
    if (!Array.isArray(body.profiles) || typeof body.selectedProfileId !== "string" || (body.legacyProfileId !== null && typeof body.legacyProfileId !== "string")) return null;
    const profiles: StorageProfile[] = [];
    const ids = new Set<string>();
    for (const candidate of body.profiles) {
      if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) return null;
      const profile = candidate as Record<string, unknown>;
      if (Object.keys(profile).sort().join(",") !== "accountId,id,kind") return null;
      if (!uuid(profile.id) || ids.has(profile.id) || !["legacy_owner", "legacy_guest", "account", "guest"].includes(String(profile.kind))) return null;
      if (profile.kind === "legacy_owner" || profile.kind === "account") {
        if (typeof profile.accountId !== "string" || !profile.accountId.trim()) return null;
      } else if (profile.accountId !== null) return null;
      ids.add(profile.id);
      profiles.push(Object.freeze({ id: profile.id, kind: profile.kind as ProfileKind, accountId: profile.accountId as string | null }));
    }
    if (!ids.has(body.selectedProfileId) || (body.legacyProfileId !== null && !ids.has(body.legacyProfileId))) return null;
    if (profiles.filter((profile) => profile.kind.startsWith("legacy_")).length !== (body.legacyProfileId === null ? 0 : 1)) return null;
    if (body.legacyProfileId !== null && !profiles.some((profile) => profile.id === body.legacyProfileId && profile.kind.startsWith("legacy_"))) return null;
    const clean = { version: ROOT_VERSION, generation: Number(body.generation), profiles, legacyProfileId: body.legacyProfileId as string | null, selectedProfileId: body.selectedProfileId };
    const expected = withChecksum(clean);
    return checksum === expected.checksum ? expected : null;
  } catch { return null; }
}

function bindingBody(value: Omit<AccountIdentityBindingEntry, "checksum">): Omit<AccountIdentityBindingEntry, "checksum"> {
  return value;
}

function withBindingChecksum(value: Omit<AccountIdentityBindingEntry, "checksum">): AccountIdentityBindingEntry {
  return Object.freeze({ ...value, checksum: sha256Utf8(JSON.stringify(bindingBody(value))) });
}

function withBindingEnvelopeChecksum(value: Omit<AccountIdentityBindingEnvelope, "checksum">): AccountIdentityBindingEnvelope {
  return Object.freeze({ ...value, checksum: sha256Utf8(JSON.stringify(value)) });
}

function parseAccountBindingEnvelope(raw: string | null): AccountIdentityBindingEnvelope | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (Object.keys(value).sort().join(",") !== "bindings,checksum,generation,schema"
      || value.schema !== ACCOUNT_BINDING_SCHEMA || !Number.isSafeInteger(value.generation) || Number(value.generation) < 1
      || typeof value.checksum !== "string" || !Array.isArray(value.bindings)) return null;
    const ids = new Set<string>();
    const bindings: AccountIdentityBindingEntry[] = [];
    for (const candidate of value.bindings) {
      if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) return null;
      const entry = candidate as Record<string, unknown>;
      if (Object.keys(entry).sort().join(",") !== "accountId,checksum,firebaseUid,profileId,profileKind,schema,verificationRevision,verified"
        || entry.schema !== ACCOUNT_BINDING_SCHEMA || !uuid(entry.profileId) || ids.has(String(entry.profileId))
        || (entry.profileKind !== "account" && entry.profileKind !== "legacy_owner")
        || !Number.isSafeInteger(entry.verificationRevision) || Number(entry.verificationRevision) < 1
        || typeof entry.verified !== "boolean" || typeof entry.checksum !== "string") return null;
      ids.add(entry.profileId);
      const verified = entry.verified === true;
      if (verified ? (typeof entry.accountId !== "string" || !entry.accountId.trim() || typeof entry.firebaseUid !== "string" || !entry.firebaseUid.trim())
        : (entry.accountId !== null || entry.firebaseUid !== null)) return null;
      const profileKind = entry.profileKind as "account" | "legacy_owner";
      const body = {
        schema: ACCOUNT_BINDING_SCHEMA,
        profileId: entry.profileId,
        profileKind,
        accountId: entry.accountId as string | null,
        firebaseUid: entry.firebaseUid as string | null,
        verified,
        verificationRevision: Number(entry.verificationRevision),
      };
      const parsed = withBindingChecksum(body);
      if (parsed.checksum !== entry.checksum) return null;
      bindings.push(parsed);
    }
    const envelope = withBindingEnvelopeChecksum({ schema: ACCOUNT_BINDING_SCHEMA, generation: Number(value.generation), bindings });
    return envelope.checksum === value.checksum ? envelope : null;
  } catch { return null; }
}

let bindingMutationTail: Promise<void> = Promise.resolve();

function serializeBindingMutation<T>(operation: () => Promise<T>): Promise<T> {
  const current = bindingMutationTail.then(operation, operation);
  bindingMutationTail = current.then(() => undefined, () => undefined);
  return current;
}

async function readAccountBindingSlots(control: StorageManifestStore): Promise<Readonly<{ raw: readonly (string | null)[]; envelope: AccountIdentityBindingEnvelope | null }>> {
  const raw = await Promise.all(ACCOUNT_BINDING_KEYS.map((key) => control.get(key)));
  const parsed = raw.map(parseAccountBindingEnvelope);
  if (raw.some((entry, index) => entry !== null && parsed[index] === null)) throw new ProfileStorageError("account_binding_corrupt");
  const valid = parsed.filter((entry): entry is AccountIdentityBindingEnvelope => entry !== null);
  if (valid.length === 2 && valid[0]!.generation === valid[1]!.generation) throw new ProfileStorageError("account_binding_ambiguous");
  const envelope = valid.sort((left, right) => right.generation - left.generation)[0] ?? null;
  return Object.freeze({ raw: Object.freeze(raw), envelope });
}

async function commitAccountBindingEnvelope(
  control: StorageManifestStore,
  previous: Readonly<{ raw: readonly (string | null)[]; envelope: AccountIdentityBindingEnvelope | null }>,
  next: AccountIdentityBindingEnvelope,
): Promise<void> {
  const latest = await readAccountBindingSlots(control);
  if (latest.raw.some((value, index) => value !== previous.raw[index])) throw new ProfileStorageError("account_binding_conflict");
  const targetIndex = latest.raw.findIndex((raw) => raw === null || parseAccountBindingEnvelope(raw)?.generation !== latest.envelope?.generation);
  if (targetIndex < 0) throw new ProfileStorageError("account_binding_conflict");
  const serialized = JSON.stringify(next);
  await control.set(ACCOUNT_BINDING_KEYS[targetIndex]!, serialized);
  const readBack = await control.get(ACCOUNT_BINDING_KEYS[targetIndex]!);
  const verified = parseAccountBindingEnvelope(readBack);
  if (readBack !== serialized || verified?.generation !== next.generation || verified.checksum !== next.checksum) {
    throw new ProfileStorageError("account_binding_commit_unverified");
  }
}

function bindingEntryFor(envelope: AccountIdentityBindingEnvelope | null, profileId: string): AccountIdentityBindingEntry | null {
  return envelope?.bindings.find((entry) => entry.profileId === profileId) ?? null;
}

type StoredGuestInstallation = Readonly<{
  installationId: string;
  localDatasetId: string;
  bindingState: "guest" | "adoption_pending" | "account_bound";
  accountId: string | null;
}>;

function parseStoredGuestInstallation(raw: string | undefined): StoredGuestInstallation | null {
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw) as Record<string, unknown>;
    const payload = envelope.payload as Record<string, unknown> | undefined;
    if (Object.keys(envelope).sort().join(",") !== "payload,revision,schemaIdentity" || envelope.schemaIdentity !== CANONICAL_ENVELOPE || !Number.isSafeInteger(envelope.revision) || Number(envelope.revision) < 1 || !payload || typeof payload !== "object" || Array.isArray(payload)) return null;
    if (Object.keys(payload).sort().join(",") !== "accountId,bindingState,installationId,localDatasetId") return null;
    if (!uuid(payload.installationId) || !uuid(payload.localDatasetId) || payload.installationId === payload.localDatasetId) return null;
    if (payload.bindingState === "account_bound" && typeof payload.accountId === "string" && payload.accountId.trim()) {
      return { installationId: payload.installationId as string, localDatasetId: payload.localDatasetId as string, bindingState: "account_bound", accountId: payload.accountId };
    }
    if ((payload.bindingState === "guest" || payload.bindingState === "adoption_pending") && payload.accountId === null) {
      return { installationId: payload.installationId as string, localDatasetId: payload.localDatasetId as string, bindingState: payload.bindingState, accountId: null };
    }
    return null;
  } catch { return null; }
}

function storedGuestInstallation(storage: KeyValueStorage): StoredGuestInstallation | null {
  return parseStoredGuestInstallation(storage.getString(STORAGE_KEYS.GUEST_INSTALLATION));
}

function physicalKey(profileId: string, key: string, legacy: boolean): string {
  return legacy ? key : `${PROFILE_PREFIX}${profileId}:${encodeURIComponent(key)}`;
}

function signRemovalJournal(body: Omit<GuestRemoval34Journal, "checksum">): GuestRemoval34Journal {
  return Object.freeze({ ...body, checksum: sha256Utf8(JSON.stringify(body)) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDigest(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function areDigestFields<T extends Record<string, unknown>>(value: T): value is T & { [K in keyof T]: string } {
  return Object.values(value).every(isDigest);
}

function isRemovalStage(value: unknown): value is GuestRemoval34Journal["stage"] {
  return value === "intent" || value === "replacement_markers" || value === "registry_first" || value === "registry_both" || value === "cleanup";
}

function isRetainedAccountProfile(value: unknown): value is StorageProfile {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "accountId,id,kind") return false;
  return value.kind === "account" && uuid(value.id) && typeof value.accountId === "string" && value.accountId.trim().length > 0;
}

function parseRemovalJournal(raw: string | null): GuestRemoval34Journal | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const value = parsed;
    const keys = ["accountStateSha256","checksum","expectedAccountStateSha256","expectedDatasetIdSha256","expectedGlobalStateSha256","expectedInstallationIdSha256","expectedPendingPairInventorySha256","expectedPendingUidInventorySha256","expectedProfileIdentityInventorySha256","globalStateSha256","logoutControlSha256","originalRegistryChecksum","originalRegistryGeneration","otherProfileStateSha256","replacementInstallationId","replacementProfileId","retainedProfiles","schemaVersion","stage","targetInstallationId","targetKeyCount","targetProfileId"];
    if (Object.keys(value).sort().join(",") !== [...keys].sort().join(",") || value.schemaVersion !== "bizq01-guest-removal-34-journal-v1"
      || !isRemovalStage(value.stage) || !uuid(value.targetProfileId) || !uuid(value.targetInstallationId)
      || !uuid(value.replacementProfileId) || !uuid(value.replacementInstallationId)
      || typeof value.originalRegistryGeneration !== "number" || !Number.isSafeInteger(value.originalRegistryGeneration) || value.originalRegistryGeneration < 1
      || typeof value.targetKeyCount !== "number" || !Number.isSafeInteger(value.targetKeyCount) || value.targetKeyCount < 1
      || !Array.isArray(value.retainedProfiles) || value.retainedProfiles.length !== 9) return null;
    const targetProfileId = value.targetProfileId;
    const targetInstallationId = value.targetInstallationId;
    const replacementProfileId = value.replacementProfileId;
    const replacementInstallationId = value.replacementInstallationId;
    const stage = value.stage;
    const originalRegistryGeneration = value.originalRegistryGeneration;
    const targetKeyCount = value.targetKeyCount;
    const retainedProfiles: StorageProfile[] = [];
    for (const profile of value.retainedProfiles) {
      if (!isRetainedAccountProfile(profile)) return null;
      retainedProfiles.push(profile);
    }
    const hashes = {
      expectedDatasetIdSha256: value.expectedDatasetIdSha256, expectedInstallationIdSha256: value.expectedInstallationIdSha256,
      expectedProfileIdentityInventorySha256: value.expectedProfileIdentityInventorySha256, expectedAccountStateSha256: value.expectedAccountStateSha256,
      expectedGlobalStateSha256: value.expectedGlobalStateSha256, expectedPendingPairInventorySha256: value.expectedPendingPairInventorySha256,
      expectedPendingUidInventorySha256: value.expectedPendingUidInventorySha256, originalRegistryChecksum: value.originalRegistryChecksum,
      accountStateSha256: value.accountStateSha256, globalStateSha256: value.globalStateSha256,
      otherProfileStateSha256: value.otherProfileStateSha256, logoutControlSha256: value.logoutControlSha256, checksum: value.checksum,
    };
    if (!areDigestFields(hashes)
      || targetProfileId === replacementProfileId || targetProfileId === targetInstallationId || replacementProfileId === replacementInstallationId
      || new Set(retainedProfiles.map((profile) => profile.id)).size !== retainedProfiles.length
      || retainedProfiles.some((profile) => profile.id === targetProfileId || profile.id === replacementProfileId || profile.id === replacementInstallationId)
      || sha256Utf8(targetProfileId) !== hashes.expectedDatasetIdSha256 || sha256Utf8(targetInstallationId) !== hashes.expectedInstallationIdSha256
      || hashes.expectedAccountStateSha256 !== hashes.accountStateSha256 || hashes.expectedGlobalStateSha256 !== hashes.globalStateSha256
      || profileIdentityInventory([...retainedProfiles, { id: targetProfileId, kind: "guest", accountId: null }]) !== hashes.expectedProfileIdentityInventorySha256) return null;
    const body: Omit<GuestRemoval34Journal, "checksum"> = {
      schemaVersion: "bizq01-guest-removal-34-journal-v1", stage, targetProfileId, targetInstallationId,
      replacementProfileId, replacementInstallationId, expectedDatasetIdSha256: hashes.expectedDatasetIdSha256,
      expectedInstallationIdSha256: hashes.expectedInstallationIdSha256, expectedProfileIdentityInventorySha256: hashes.expectedProfileIdentityInventorySha256,
      expectedAccountStateSha256: hashes.expectedAccountStateSha256, expectedGlobalStateSha256: hashes.expectedGlobalStateSha256,
      expectedPendingPairInventorySha256: hashes.expectedPendingPairInventorySha256, expectedPendingUidInventorySha256: hashes.expectedPendingUidInventorySha256,
      originalRegistryGeneration, originalRegistryChecksum: hashes.originalRegistryChecksum, targetKeyCount,
      retainedProfiles: Object.freeze(retainedProfiles.map((profile) => Object.freeze({ ...profile }))),
      accountStateSha256: hashes.accountStateSha256, globalStateSha256: hashes.globalStateSha256,
      otherProfileStateSha256: hashes.otherProfileStateSha256, logoutControlSha256: hashes.logoutControlSha256,
    };
    if (hashes.checksum !== sha256Utf8(JSON.stringify(body))) return null;
    return Object.freeze({ ...body, checksum: hashes.checksum });
  } catch { return null; }
}

function profileIdentityInventory(profiles: readonly StorageProfile[]): string {
  const identities = profiles.map((profile) => ({ idSha256: sha256Utf8(profile.id), kind: profile.kind, accountIdSha256: profile.accountId === null ? null : sha256Utf8(profile.accountId) }))
    .sort((left, right) => left.idSha256.localeCompare(right.idSha256));
  return sha256Utf8(JSON.stringify(identities));
}

function hashPhysicalEntries(base: KeyValueStorage, keys: readonly string[]): string {
  const entries = [...keys].sort().map((key) => {
    const value = base.getString(key);
    if (value === undefined) throw new ProfileStorageError("profile_removal_recovery_required");
    return [sha256Utf8(key), sha256Utf8(value)];
  });
  return sha256Utf8(JSON.stringify(entries));
}

type GuestRemovalProtectedSnapshot = Readonly<{
  accountStateSha256: string;
  globalStateSha256: string;
  otherProfileStateSha256: string;
  logoutControlSha256: string;
}>;

function pendingLogoutInventories(raw: string | null): Readonly<{ valueSha256: string; pairsSha256: string; uidsSha256: string }> | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (Object.keys(value).sort().join(",") !== "blocked,completed,pending,version" || value.version !== 2 || value.blocked !== null
      || !Array.isArray(value.pending) || !Array.isArray(value.completed) || value.completed.length !== 0) return null;
    const pairHashes = value.pending.map((pair) => {
      if (!pair || typeof pair !== "object" || Array.isArray(pair)) throw new Error();
      const item = pair as Record<string, unknown>;
      if (Object.keys(item).sort().join(",") !== "operationId,uid" || typeof item.uid !== "string" || typeof item.operationId !== "string") throw new Error();
      return sha256Utf8(JSON.stringify({ uid: item.uid, operationId: item.operationId }));
    }).sort();
    const uidHashes = value.pending.map((pair) => sha256Utf8((pair as { uid: string }).uid)).sort();
    return Object.freeze({ valueSha256: sha256Utf8(raw), pairsSha256: sha256Utf8(JSON.stringify(pairHashes)), uidsSha256: sha256Utf8(JSON.stringify(uidHashes)) });
  } catch { return null; }
}

function guestRemovalProtectedSnapshot(base: KeyValueStorage, profiles: readonly StorageProfile[], targetProfileId: string, replacementProfileId: string, logoutRaw: string | null): GuestRemovalProtectedSnapshot {
  const keys = [...base.getAllKeys()];
  if (keys.some((key) => typeof key !== "string") || new Set(keys).size !== keys.length) throw new ProfileStorageError("profile_removal_recovery_required");
  const accountPrefixes = profiles.filter((profile) => profile.kind === "account").map((profile) => `${PROFILE_PREFIX}${profile.id}:`);
  const targetPrefix = `${PROFILE_PREFIX}${targetProfileId}:`;
  const replacementPrefix = `${PROFILE_PREFIX}${replacementProfileId}:`;
  const accountKeys = keys.filter((key) => accountPrefixes.some((prefix) => key.startsWith(prefix)));
  const globalKeys = keys.filter((key) => !key.startsWith(PROFILE_PREFIX));
  const otherProfileKeys = keys.filter((key) => key.startsWith(PROFILE_PREFIX) && !key.startsWith(targetPrefix) && !key.startsWith(replacementPrefix)
    && !accountPrefixes.some((prefix) => key.startsWith(prefix)));
  const logout = pendingLogoutInventories(logoutRaw);
  if (!logout) throw new ProfileStorageError("profile_removal_recovery_required");
  return Object.freeze({
    accountStateSha256: hashPhysicalEntries(base, accountKeys),
    globalStateSha256: hashPhysicalEntries(base, globalKeys),
    otherProfileStateSha256: hashPhysicalEntries(base, otherProfileKeys),
    logoutControlSha256: logout.valueSha256,
  });
}

async function storeRemovalJournal(control: StorageManifestStore, body: Omit<GuestRemoval34Journal, "checksum">): Promise<GuestRemoval34Journal> {
  const journal = signRemovalJournal(body);
  const raw = JSON.stringify(journal);
  await control.set(GUEST_REMOVAL_JOURNAL_KEY, raw);
  if (await control.get(GUEST_REMOVAL_JOURNAL_KEY) !== raw || !parseRemovalJournal(raw)) throw new ProfileStorageError("profile_removal_recovery_required");
  return journal;
}

async function updateRemovalJournal(control: StorageManifestStore, journal: GuestRemoval34Journal, stage: GuestRemoval34Journal["stage"]): Promise<GuestRemoval34Journal> {
  const { checksum: _checksum, ...body } = journal;
  return storeRemovalJournal(control, { ...body, stage });
}

const REMOVAL_STAGE_ORDER: readonly GuestRemoval34Journal["stage"][] = Object.freeze(["intent", "replacement_markers", "registry_first", "registry_both", "cleanup"]);

async function advanceRemovalJournal(control: StorageManifestStore, journal: GuestRemoval34Journal, next: GuestRemoval34Journal["stage"]): Promise<GuestRemoval34Journal> {
  const currentIndex = REMOVAL_STAGE_ORDER.indexOf(journal.stage);
  const nextIndex = REMOVAL_STAGE_ORDER.indexOf(next);
  if (currentIndex < 0 || nextIndex < 0) throw new ProfileStorageError("profile_removal_recovery_required");
  return nextIndex <= currentIndex ? journal : updateRemovalJournal(control, journal, next);
}

async function readRegistrySlots(control: StorageManifestStore): Promise<readonly [ProfileRegistry, ProfileRegistry]> {
  const raw = await Promise.all(ROOT_KEYS.map((key) => control.get(key)));
  const parsed = raw.map(parseRegistry);
  if (parsed.some((registry) => registry === null) || parsed[0]!.generation === parsed[1]!.generation) throw new ProfileStorageError("profile_registry_corrupt");
  return parsed as [ProfileRegistry, ProfileRegistry];
}

function assertRemovalRegistryMatches(journal: GuestRemoval34Journal, registry: ProfileRegistry): readonly StorageProfile[] {
  const profiles = registry.profiles;
  const target = profiles.find((profile) => profile.id === journal.targetProfileId);
  const replacement = profiles.find((profile) => profile.id === journal.replacementProfileId);
  const retained = profiles.filter((profile) => profile.id !== journal.targetProfileId && profile.id !== journal.replacementProfileId);
  if (registry.legacyProfileId !== null || (target && (registry.generation > journal.originalRegistryGeneration
      || (registry.generation === journal.originalRegistryGeneration && (registry.selectedProfileId !== target.id || registry.checksum !== journal.originalRegistryChecksum))))
    || (replacement && registry.selectedProfileId !== replacement.id)
    || profiles.some((profile) => profile.kind === "legacy_guest" || profile.kind === "legacy_owner")
    || retained.length !== journal.retainedProfiles.length
    || sha256Utf8(JSON.stringify(retained)) !== sha256Utf8(JSON.stringify(journal.retainedProfiles))
    || (target && (target.kind !== "guest" || target.accountId !== null))
    || (replacement && (replacement.kind !== "guest" || replacement.accountId !== null))
    || Boolean(target) === Boolean(replacement)) throw new ProfileStorageError("profile_removal_recovery_required");
  return Object.freeze([...journal.retainedProfiles, Object.freeze({ id: journal.replacementProfileId, kind: "guest" as const, accountId: null })]);
}

function writeExactValue(base: KeyValueStorage, key: string, value: string): void {
  const current = base.getString(key);
  if (current !== undefined && current !== value) throw new ProfileStorageError("profile_removal_recovery_required");
  if (current === undefined) base.setString(key, value);
  if (base.getString(key) !== value) throw new ProfileStorageError("profile_removal_recovery_required");
}

function createRemovalGuestMarkers(base: KeyValueStorage, journal: GuestRemoval34Journal): void {
  const profile: StorageProfile = Object.freeze({ id: journal.replacementProfileId, kind: "guest", accountId: null });
  const installation = JSON.stringify({ schemaIdentity: CANONICAL_ENVELOPE, revision: 1, payload: { installationId: journal.replacementInstallationId, localDatasetId: journal.replacementProfileId, bindingState: "guest", accountId: null } });
  const access = JSON.stringify({ schemaIdentity: CANONICAL_ENVELOPE, revision: 1, payload: { mode: "guest" } });
  writeExactValue(base, physicalKey(profile.id, STORAGE_KEYS.GUEST_INSTALLATION, false), installation);
  writeExactValue(base, physicalKey(profile.id, STORAGE_KEYS.GUEST_ACCESS, false), access);
}

async function commitDesiredRemovalRegistry(control: StorageManifestStore, journal: GuestRemoval34Journal, onFirstCommit: () => Promise<void>): Promise<void> {
  const slots = await readRegistrySlots(control);
  const latest = [...slots].sort((left, right) => right.generation - left.generation)[0]!;
  const desiredProfiles = assertRemovalRegistryMatches(journal, latest);
  const replacement = latest.profiles.some((profile) => profile.id === journal.replacementProfileId);
  if (!replacement) {
    const next = withChecksum({ version: ROOT_VERSION, generation: latest.generation + 1, profiles: desiredProfiles, legacyProfileId: null, selectedProfileId: journal.replacementProfileId });
    await commitRegistry(control, latest, next);
    await onFirstCommit();
  }
  const afterFirst = await readRegistrySlots(control);
  const current = [...afterFirst].sort((left, right) => right.generation - left.generation)[0]!;
  assertRemovalRegistryMatches(journal, current);
  if (current.profiles.some((profile) => profile.id === journal.targetProfileId) || current.selectedProfileId !== journal.replacementProfileId) throw new ProfileStorageError("profile_removal_recovery_required");
  const stale = afterFirst.find((registry) => registry.profiles.some((profile) => profile.id === journal.targetProfileId));
  if (stale) {
    const next = withChecksum({ version: ROOT_VERSION, generation: current.generation + 1, profiles: desiredProfiles, legacyProfileId: null, selectedProfileId: journal.replacementProfileId });
    await commitRegistry(control, current, next);
  }
  const finalSlots = await readRegistrySlots(control);
  for (const registry of finalSlots) {
    assertRemovalRegistryMatches(journal, registry);
    if (registry.profiles.some((profile) => profile.id === journal.targetProfileId) || registry.selectedProfileId !== journal.replacementProfileId) throw new ProfileStorageError("profile_removal_recovery_required");
  }
}

async function resumeGuestRemoval34(base: KeyValueStorage, control: StorageManifestStore): Promise<GuestRemoval34Receipt | null> {
  const raw = await control.get(GUEST_REMOVAL_JOURNAL_KEY);
  if (raw === null) return null;
  const journal = parseRemovalJournal(raw);
  if (!journal) throw new ProfileStorageError("profile_removal_recovery_required");
  const logoutRaw = await control.get(LOCAL_LOGOUT_CONTROL_KEY);
  const logout = pendingLogoutInventories(logoutRaw);
  if (!logout || logout.pairsSha256 !== journal.expectedPendingPairInventorySha256 || logout.uidsSha256 !== journal.expectedPendingUidInventorySha256) throw new ProfileStorageError("profile_removal_recovery_required");
  let protectedState = guestRemovalProtectedSnapshot(base, [...journal.retainedProfiles, { id: journal.targetProfileId, kind: "guest", accountId: null }], journal.targetProfileId, journal.replacementProfileId, logoutRaw);
  if (protectedState.accountStateSha256 !== journal.accountStateSha256 || protectedState.globalStateSha256 !== journal.globalStateSha256
    || protectedState.otherProfileStateSha256 !== journal.otherProfileStateSha256 || protectedState.logoutControlSha256 !== journal.logoutControlSha256) throw new ProfileStorageError("profile_removal_recovery_required");
  const slotsBefore = await readRegistrySlots(control);
  for (const registry of slotsBefore) assertRemovalRegistryMatches(journal, registry);
  const targetInstallationRaw = base.getString(physicalKey(journal.targetProfileId, STORAGE_KEYS.GUEST_INSTALLATION, false));
  const targetInstallation = storedGuestInstallation(createProfileScopedStorage(base, { id: journal.targetProfileId, kind: "guest", accountId: null }));
  const targetAccessRaw = base.getString(physicalKey(journal.targetProfileId, STORAGE_KEYS.GUEST_ACCESS, false));
  if ((targetInstallationRaw === undefined || !targetInstallation || targetInstallation.installationId !== journal.targetInstallationId || targetInstallation.localDatasetId !== journal.targetProfileId || targetInstallation.bindingState !== "guest" || targetInstallation.accountId !== null)
    && journal.stage !== "cleanup") throw new ProfileStorageError("profile_removal_recovery_required");
  if ((targetAccessRaw === undefined || !validGuestAccess(targetAccessRaw)) && journal.stage !== "cleanup") throw new ProfileStorageError("profile_removal_recovery_required");
  if (targetInstallationRaw !== undefined && (!targetInstallation || targetInstallation.installationId !== journal.targetInstallationId || targetInstallation.localDatasetId !== journal.targetProfileId || targetInstallation.bindingState !== "guest" || targetInstallation.accountId !== null)) throw new ProfileStorageError("profile_removal_recovery_required");
  if (targetAccessRaw !== undefined && !validGuestAccess(targetAccessRaw)) throw new ProfileStorageError("profile_removal_recovery_required");
  createRemovalGuestMarkers(base, journal);
  let progress = await advanceRemovalJournal(control, journal, "replacement_markers");
  await commitDesiredRemovalRegistry(control, progress, async () => { progress = await advanceRemovalJournal(control, progress, "registry_first"); });
  progress = await advanceRemovalJournal(control, progress, "registry_both");
  const marked = await advanceRemovalJournal(control, progress, "cleanup");
  const targetPrefix = `${PROFILE_PREFIX}${journal.targetProfileId}:`;
  const targetKeys = base.getAllKeys().filter((key) => key.startsWith(targetPrefix));
  if (targetKeys.length > marked.targetKeyCount) throw new ProfileStorageError("profile_removal_recovery_required");
  for (const key of targetKeys) {
    if (!key.startsWith(targetPrefix)) throw new ProfileStorageError("profile_removal_recovery_required");
    base.remove(key);
  }
  if (base.getAllKeys().some((key) => key.startsWith(targetPrefix))) throw new ProfileStorageError("profile_removal_recovery_required");
  const finalLogoutRaw = await control.get(LOCAL_LOGOUT_CONTROL_KEY);
  protectedState = guestRemovalProtectedSnapshot(base, [...marked.retainedProfiles, { id: marked.replacementProfileId, kind: "guest", accountId: null }], marked.targetProfileId, marked.replacementProfileId, finalLogoutRaw);
  if (protectedState.accountStateSha256 !== marked.accountStateSha256 || protectedState.globalStateSha256 !== marked.globalStateSha256
    || protectedState.otherProfileStateSha256 !== marked.otherProfileStateSha256 || protectedState.logoutControlSha256 !== marked.logoutControlSha256) throw new ProfileStorageError("profile_removal_recovery_required");
  const finalSlots = await readRegistrySlots(control);
  for (const registry of finalSlots) {
    if (registry.profiles.some((profile) => profile.id === marked.targetProfileId) || !registry.profiles.some((profile) => profile.id === marked.replacementProfileId)) throw new ProfileStorageError("profile_removal_recovery_required");
  }
  await control.remove(GUEST_REMOVAL_JOURNAL_KEY);
  if (await control.get(GUEST_REMOVAL_JOURNAL_KEY) !== null) throw new ProfileStorageError("profile_removal_recovery_required");
  return Object.freeze({
    schemaVersion: "bizq01-guest-removal-34-v1",
    result: "passed",
    stage: "complete",
    replacementProfileIdSha256: sha256Utf8(marked.replacementProfileId),
    removedProfileIdSha256: sha256Utf8(marked.targetProfileId),
    protectedAccountStateSha256: marked.accountStateSha256,
    protectedGlobalStateSha256: marked.globalStateSha256,
    logoutControlSha256: marked.logoutControlSha256,
    removedKeyCount: marked.targetKeyCount,
  });
}

async function startGuestRemoval34(
  base: KeyValueStorage,
  control: StorageManifestStore,
  registry: ProfileRegistry,
  profile: StorageProfile,
  identity: GuestInstallationIdentityPort,
  expected: GuestRemoval34ExpectedState,
  claimTransition: () => void,
): Promise<GuestRemoval34Receipt> {
  let stage = "preflight";
  const failed = (): GuestRemoval34Receipt => Object.freeze({ schemaVersion: "bizq01-guest-removal-34-v1", result: "failed", stage });
  try {
    const hashes = [expected.datasetIdSha256, expected.installationIdSha256, expected.profileIdentityInventorySha256, expected.accountStateSha256,
      expected.globalStateSha256, expected.pendingPairInventorySha256, expected.pendingUidInventorySha256];
    if (hashes.some((hash) => !/^[a-f0-9]{64}$/u.test(hash)) || !Number.isSafeInteger(expected.guestKeyCount) || expected.guestKeyCount < 1) return failed();
    if (profile.kind !== "guest" || profile.accountId !== null || profile.id !== registry.selectedProfileId || sha256Utf8(profile.id) !== expected.datasetIdSha256
      || registry.legacyProfileId !== null || registry.profiles.length !== 10 || registry.profiles.filter((candidate) => candidate.kind === "account").length !== 9
      || registry.profiles.filter((candidate) => candidate.kind === "guest").length !== 1 || profileIdentityInventory(registry.profiles) !== expected.profileIdentityInventorySha256) return failed();
    const targetMarker = storedGuestInstallation(createProfileScopedStorage(base, profile));
    if (!targetMarker || targetMarker.installationId === profile.id || targetMarker.localDatasetId !== profile.id || targetMarker.bindingState !== "guest"
      || targetMarker.accountId !== null || sha256Utf8(targetMarker.installationId) !== expected.installationIdSha256
      || !validGuestAccess(base.getString(physicalKey(profile.id, STORAGE_KEYS.GUEST_ACCESS, false)))) return failed();
    const activeKeys = [STORAGE_KEYS.ACTIVE_TRAINING_SESSION, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, STORAGE_KEYS.ACTIVE_JOURNAL];
    if (activeKeys.some((key) => base.getString(physicalKey(profile.id, key, false)) !== undefined)) { stage = "active_learning_work_present"; return failed(); }
    const currentPrefix = `${PROFILE_PREFIX}${profile.id}:`;
    const targetKeyCount = base.getAllKeys().filter((key) => key.startsWith(currentPrefix)).length;
    if (targetKeyCount !== expected.guestKeyCount) { stage = "guest_baseline_mismatch"; return failed(); }
    claimTransition();
    if (await control.get(GUEST_REMOVAL_JOURNAL_KEY) !== null) { stage = "pending_journal"; return failed(); }
    stage = "registry_preflight";
    const slots = await readRegistrySlots(control);
    const latest = [...slots].sort((left, right) => right.generation - left.generation)[0]!;
    if (slots.some((entry) => entry.legacyProfileId !== null || profileIdentityInventory(entry.profiles) !== expected.profileIdentityInventorySha256)
      || latest.selectedProfileId !== profile.id || latest.generation !== registry.generation || latest.checksum !== registry.checksum) return failed();
    const logoutRaw = await control.get(LOCAL_LOGOUT_CONTROL_KEY);
    const logout = pendingLogoutInventories(logoutRaw);
    if (!logout || logout.pairsSha256 !== expected.pendingPairInventorySha256 || logout.uidsSha256 !== expected.pendingUidInventorySha256) { stage = "logout_baseline_mismatch"; return failed(); }
    const replacementIdentity = await identity.create();
    if (!uuid(replacementIdentity.installationId) || !uuid(replacementIdentity.localDatasetId) || replacementIdentity.installationId === replacementIdentity.localDatasetId
      || registry.profiles.some((candidate) => candidate.id === replacementIdentity.localDatasetId || candidate.id === replacementIdentity.installationId)
      || replacementIdentity.installationId === profile.id
      || base.getAllKeys().some((key) => key.startsWith(`${PROFILE_PREFIX}${replacementIdentity.localDatasetId}:`))) { stage = "replacement_identity_invalid"; return failed(); }
    const retainedProfiles = registry.profiles.filter((candidate) => candidate.id !== profile.id);
    const protectedState = guestRemovalProtectedSnapshot(base, registry.profiles, profile.id, replacementIdentity.localDatasetId, logoutRaw);
    if (protectedState.accountStateSha256 !== expected.accountStateSha256 || protectedState.globalStateSha256 !== expected.globalStateSha256) { stage = "protected_baseline_mismatch"; return failed(); }
    const body: Omit<GuestRemoval34Journal, "checksum"> = {
      schemaVersion: "bizq01-guest-removal-34-journal-v1", stage: "intent", targetProfileId: profile.id, targetInstallationId: targetMarker.installationId,
      replacementProfileId: replacementIdentity.localDatasetId, replacementInstallationId: replacementIdentity.installationId,
      expectedDatasetIdSha256: expected.datasetIdSha256, expectedInstallationIdSha256: expected.installationIdSha256,
      expectedProfileIdentityInventorySha256: expected.profileIdentityInventorySha256, expectedAccountStateSha256: expected.accountStateSha256,
      expectedGlobalStateSha256: expected.globalStateSha256, expectedPendingPairInventorySha256: expected.pendingPairInventorySha256,
      expectedPendingUidInventorySha256: expected.pendingUidInventorySha256, originalRegistryGeneration: latest.generation, originalRegistryChecksum: latest.checksum,
      targetKeyCount, retainedProfiles: Object.freeze(retainedProfiles.map((candidate) => Object.freeze({ ...candidate }))),
      accountStateSha256: protectedState.accountStateSha256, globalStateSha256: protectedState.globalStateSha256,
      otherProfileStateSha256: protectedState.otherProfileStateSha256, logoutControlSha256: protectedState.logoutControlSha256,
    };
    stage = "journal_persist_failed";
    await storeRemovalJournal(control, body);
    stage = "recovery_failed";
    const receipt = await resumeGuestRemoval34(base, control);
    if (!receipt || receipt.result !== "passed") return failed();
    return receipt;
  } catch {
    return failed();
  }
}

function validGuestAccess(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const envelope = JSON.parse(raw) as Record<string, unknown>;
    const payload = envelope.payload as Record<string, unknown> | undefined;
    return Object.keys(envelope).sort().join(",") === "payload,revision,schemaIdentity"
      && envelope.schemaIdentity === CANONICAL_ENVELOPE
      && Number.isSafeInteger(envelope.revision) && Number(envelope.revision) >= 1
      && payload !== undefined && typeof payload === "object" && !Array.isArray(payload)
      && Object.keys(payload).join(",") === "mode" && payload.mode === "guest";
  } catch { return false; }
}

function ensureGuestAccess(base: KeyValueStorage, profile: StorageProfile): void {
  const key = physicalKey(profile.id, STORAGE_KEYS.GUEST_ACCESS, profile.kind === "legacy_guest");
  const existing = base.getString(key);
  if (existing !== undefined) {
    if (!validGuestAccess(existing)) throw new ProfileStorageError("profile_scope_unavailable");
    return;
  }
  const value = JSON.stringify({ schemaIdentity: CANONICAL_ENVELOPE, revision: 1, payload: { mode: "guest" } });
  base.setString(key, value);
  if (base.getString(key) !== value) throw new ProfileStorageError("profile_scope_unavailable");
}

async function ensureGuestInstallation(base: KeyValueStorage, profile: StorageProfile, identity: GuestInstallationIdentityPort): Promise<void> {
  const key = physicalKey(profile.id, STORAGE_KEYS.GUEST_INSTALLATION, profile.kind === "legacy_guest");
  const existing = parseStoredGuestInstallation(base.getString(key));
  if (existing) {
    // Older guest provisioning generated a dataset ID independently of the
    // router's physical scope ID. Keep that identity and its scoped data.
    if (existing.accountId !== null || (existing.bindingState !== "guest" && existing.bindingState !== "adoption_pending")) {
      throw new ProfileStorageError("profile_scope_unavailable");
    }
    return;
  }
  if (base.getString(key) !== undefined) throw new ProfileStorageError("profile_scope_unavailable");
  const generated = await identity.create();
  if (!uuid(generated.installationId) || generated.installationId === profile.id) throw new ProfileStorageError("profile_scope_unavailable");
  const value = JSON.stringify({
    schemaIdentity: CANONICAL_ENVELOPE,
    revision: 1,
    payload: { installationId: generated.installationId, localDatasetId: profile.id, bindingState: "guest", accountId: null },
  });
  base.setString(key, value);
  const verified = parseStoredGuestInstallation(base.getString(key));
  if (!verified || verified.installationId !== generated.installationId || verified.localDatasetId !== profile.id || verified.bindingState !== "guest" || verified.accountId !== null) {
    throw new ProfileStorageError("profile_scope_unavailable");
  }
}

export function createProfileScopedStorage(base: KeyValueStorage, profile: StorageProfile, isTransitionActive: () => boolean = () => false): KeyValueStorage {
  const legacy = profile.kind === "legacy_owner" || profile.kind === "legacy_guest";
  const map = (key: string) => physicalKey(profile.id, key, legacy);
  const check = () => { if (isTransitionActive()) throw new ProfileTransitionActiveError(); };
  return Object.freeze({
    getString(key: string) { check(); return base.getString(map(key)); },
    setString(key: string, value: string) { check(); base.setString(map(key), value); },
    remove(key: string) { check(); base.remove(map(key)); },
    contains(key: string) { check(); return base.contains(map(key)); },
    getAllKeys() {
      check();
      if (legacy) return Object.freeze(base.getAllKeys().filter((key) => !key.startsWith(PROFILE_PREFIX)));
      const prefix = `${PROFILE_PREFIX}${profile.id}:`;
      return Object.freeze(base.getAllKeys().filter((key) => key.startsWith(prefix)).map((key) => decodeURIComponent(key.slice(prefix.length))));
    },
  });
}

export type ProfileStorageRouter = Readonly<{
  registry: ProfileRegistry;
  profile: StorageProfile;
  isFreshInstallation: boolean;
  storage: KeyValueStorage;
  refresh(): Promise<ProfileStorageRouter>;
  selectGuest(canContinue?: () => boolean): Promise<StorageProfile>;
  selectExistingGuest(profileId: string, canContinue?: () => boolean): Promise<StorageProfile>;
  promoteSelectedBoundGuest(accountId: string, canContinue?: () => boolean): Promise<StorageProfile | null>;
  selectAccount(accountId: string, canContinue?: () => boolean): Promise<StorageProfile>;
  hasValidGuestAccess(profileId: string): boolean;
  hasExactUnboundModernGuest(profileId: string, installationIdSha256: string, datasetIdSha256: string): boolean;
  readSelectedAccountIdentityBinding(): Promise<AccountIdentityBindingRead>;
  writeVerifiedSelectedAccountIdentityBinding(input: Readonly<{ firebaseUid: string; accountId: string; canContinue: () => boolean }>): Promise<AccountIdentityBinding>;
  invalidateSelectedAccountIdentityBinding(canContinue: () => boolean): Promise<void>;
  beginSelectedAccountIdentityProofBarrier(input: Readonly<{ firebaseUid: string; accountId: string; verificationRevision: number; canContinue: () => boolean }>): Promise<AccountIdentityProofBarrierReceipt | null>;
  resolveSelectedAccountIdentityProofBarrier(input: Readonly<{ receipt: AccountIdentityProofBarrierReceipt; canContinue: () => boolean }>): Promise<AccountIdentityBinding>;
  removeOriginalGuest34(expected: GuestRemoval34ExpectedState): Promise<GuestRemoval34Receipt>;
  inspectQ13ControlInventory(actorUidSha256?: string | null): Promise<Readonly<{ kind: "observed"; slotCount: number; slotInventorySha256: string; accountBindingState: "absent" | "present"; journalState: "absent" | "present"; logoutState: "absent" | "present"; logoutGlobalStatus: "clear" | "pending" | "unavailable"; logoutActorStatus: "clear" | "pending" | "unavailable" } | { kind: "unavailable" }>>;
}>;

export async function openProfileStorageRouter(
  base: KeyValueStorage,
  control: StorageManifestStore,
  dependencies: Readonly<{ identity?: GuestInstallationIdentityPort; isTransitionActive?: () => boolean; onBeforeProfileCommit?: () => void }> = {},
): Promise<ProfileStorageRouter> {
  const identity = dependencies.identity ?? installationIdentity;
  try { await resumeGuestRemoval34(base, control); }
  catch { throw new ProfileStorageError("profile_removal_recovery_required"); }
  const readSlots = async () => Promise.all(ROOT_KEYS.map((key) => control.get(key)));
  const raw = await readSlots();
  const parsed = raw.map(parseRegistry);
  let isFreshInstallation = false;
  let registry: ProfileRegistry;
  if (raw.every((value) => value === null)) {
    const keys = base.getAllKeys();
    const hasCanonical = keys.some((key) => key.startsWith(STORAGE_NAMESPACE));
    if (keys.some((key) => key.startsWith(PROFILE_PREFIX))) throw new ProfileStorageError("profile_registry_corrupt");
    isFreshInstallation = keys.length === 0;
    if (hasCanonical) {
      const marker = storedGuestInstallation(base);
      if (!marker) throw new ProfileStorageError("legacy_profile_unidentified");
      const profile: StorageProfile = Object.freeze({ id: marker.localDatasetId, kind: marker.bindingState === "account_bound" ? "legacy_owner" : "legacy_guest", accountId: marker.accountId });
      registry = withChecksum({ version: ROOT_VERSION, generation: 1, profiles: [profile], legacyProfileId: profile.id, selectedProfileId: profile.id });
    } else {
      const guest = Object.freeze({ id: (await identity.create()).localDatasetId, kind: "guest" as const, accountId: null });
      registry = withChecksum({ version: ROOT_VERSION, generation: 1, profiles: [guest], legacyProfileId: null, selectedProfileId: guest.id });
    }
    const key = ROOT_KEYS[registry.generation % 2]!;
    await control.set(key, JSON.stringify(registry));
    if (await control.get(key) !== JSON.stringify(registry) || !parseRegistry(await control.get(key))) throw new ProfileStorageError("profile_registry_corrupt");
  } else {
    if (raw.some((value, index) => value !== null && !parsed[index])) throw new ProfileStorageError("profile_registry_corrupt");
    const valid = parsed.filter((value): value is ProfileRegistry => value !== null);
    if (valid.length === 2 && valid[0]!.generation === valid[1]!.generation) throw new ProfileStorageError("profile_registry_corrupt");
    registry = valid.sort((left, right) => right.generation - left.generation)[0]!;
    if (!registry) throw new ProfileStorageError("profile_registry_corrupt");
    isFreshInstallation = isUnchosenFreshGuestRegistry(registry, base.getAllKeys());
  }
  const profile = registry.profiles.find((candidate) => candidate.id === registry.selectedProfileId);
  if (!profile) throw new ProfileStorageError("profile_registry_corrupt");
  let transitionClaimed = false;
  const claimTransition = () => {
    if (transitionClaimed || dependencies.isTransitionActive?.()) throw new ProfileStorageError("profile_transition_cancelled");
    transitionClaimed = true;
    dependencies.onBeforeProfileCommit?.();
  };
  const assertCurrentSelectedAccountProfile = async (canContinue: () => boolean): Promise<void> => {
    if (!canContinue() || dependencies.isTransitionActive?.() || (profile.kind !== "account" && profile.kind !== "legacy_owner") || profile.accountId === null) {
      throw new ProfileStorageError("profile_transition_cancelled");
    }
    const currentRaw = await Promise.all(ROOT_KEYS.map((key) => control.get(key)));
    const currentParsed = currentRaw.map(parseRegistry);
    if (currentRaw.some((value, index) => value !== null && currentParsed[index] === null)) throw new ProfileStorageError("profile_registry_corrupt");
    const current = currentParsed.filter((entry): entry is ProfileRegistry => entry !== null).sort((left, right) => right.generation - left.generation)[0];
    if (!current || current.generation !== registry.generation || current.checksum !== registry.checksum || current.selectedProfileId !== profile.id
      || !current.profiles.some((candidate) => candidate.id === profile.id && candidate.kind === profile.kind && candidate.accountId === profile.accountId)
      || !canContinue() || dependencies.isTransitionActive?.()) throw new ProfileStorageError("profile_transition_cancelled");
  };
  const selectExistingGuest = async (profileId: string, canContinue: () => boolean = () => true): Promise<StorageProfile> => {
    const guest = registry.profiles.find((candidate) => candidate.id === profileId && (candidate.kind === "guest" || candidate.kind === "legacy_guest"));
    if (!guest) throw new ProfileStorageError("profile_scope_unavailable");
    if (!canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
    await ensureGuestInstallation(base, guest, identity);
    ensureGuestAccess(base, guest);
    if (guest.id === registry.selectedProfileId) return guest;
    claimTransition();
    const next = withChecksum({ ...registryBody(registry, registry.generation + 1), selectedProfileId: guest.id });
    await commitRegistry(control, registry, next);
    return guest;
  };
  return Object.freeze({
    registry,
    profile,
    isFreshInstallation,
    storage: createProfileScopedStorage(base, profile, dependencies.isTransitionActive),
    async refresh() {
      return openProfileStorageRouter(base, control, { identity, ...dependencies });
    },
    hasValidGuestAccess(profileId) {
      if (registry.selectedProfileId !== profileId) return false;
      const candidate = registry.profiles.find((entry) => entry.id === profileId);
      if (!candidate || (candidate.kind !== "guest" && candidate.kind !== "legacy_guest")) return false;
      const legacy = candidate.kind === "legacy_guest";
      const guestInstallation = storedGuestInstallation(createProfileScopedStorage(base, candidate));
      return validGuestAccess(base.getString(physicalKey(candidate.id, STORAGE_KEYS.GUEST_ACCESS, legacy)))
        && guestInstallation !== null
        && guestInstallation.accountId === null
        && (guestInstallation.bindingState === "guest" || guestInstallation.bindingState === "adoption_pending");
    },
    hasExactUnboundModernGuest(profileId, installationIdSha256, datasetIdSha256) {
      if (registry.selectedProfileId !== profileId) return false;
      const candidate = registry.profiles.find((entry) => entry.id === profileId && entry.kind === "guest" && entry.accountId === null);
      if (!candidate) return false;
      const scoped = createProfileScopedStorage(base, candidate);
      const guestInstallation = storedGuestInstallation(scoped);
      return guestInstallation !== null
        && guestInstallation.bindingState === "guest"
        && guestInstallation.accountId === null
        && guestInstallation.localDatasetId === candidate.id
        && sha256Utf8(guestInstallation.installationId) === installationIdSha256
        && sha256Utf8(guestInstallation.localDatasetId) === datasetIdSha256
        && validGuestAccess(base.getString(physicalKey(candidate.id, STORAGE_KEYS.GUEST_ACCESS, false)));
    },
    async readSelectedAccountIdentityBinding() {
      await assertCurrentSelectedAccountProfile(() => true);
      const snapshot = await readAccountBindingSlots(control);
      await assertCurrentSelectedAccountProfile(() => true);
      const entry = bindingEntryFor(snapshot.envelope, profile.id);
      if (!entry) return Object.freeze({ kind: "missing" as const });
      if (!entry.verified) return Object.freeze({ kind: "invalidated" as const });
      if (entry.profileKind !== profile.kind || entry.accountId !== profile.accountId || typeof entry.firebaseUid !== "string") {
        throw new ProfileStorageError("account_binding_corrupt");
      }
      const accountId = entry.accountId;
      const firebaseUid = entry.firebaseUid;
      if (accountId === null) throw new ProfileStorageError("account_binding_corrupt");
      const { checksum, ...binding } = entry;
      return Object.freeze({ kind: "verified" as const, binding: Object.freeze({ ...binding, verified: true as const, accountId, firebaseUid, checksum }) });
    },
    async writeVerifiedSelectedAccountIdentityBinding(input) {
      return serializeBindingMutation(async () => {
        if (!input.firebaseUid.trim() || !input.accountId.trim() || profile.accountId !== input.accountId) throw new ProfileStorageError("profile_scope_unavailable");
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const previous = await readAccountBindingSlots(control);
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const existing = bindingEntryFor(previous.envelope, profile.id);
        const nextEntry = withBindingChecksum({
          schema: ACCOUNT_BINDING_SCHEMA,
          profileId: profile.id,
          profileKind: profile.kind as "account" | "legacy_owner",
          accountId: input.accountId,
          firebaseUid: input.firebaseUid,
          verified: true,
          verificationRevision: (existing?.verificationRevision ?? 0) + 1,
        });
        const bindings = [...(previous.envelope?.bindings ?? []).filter((entry) => entry.profileId !== profile.id), nextEntry]
          .sort((left, right) => left.profileId.localeCompare(right.profileId));
        const next = withBindingEnvelopeChecksum({ schema: ACCOUNT_BINDING_SCHEMA, generation: (previous.envelope?.generation ?? 0) + 1, bindings });
        await assertCurrentSelectedAccountProfile(input.canContinue);
        await commitAccountBindingEnvelope(control, previous, next);
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const verify = await readAccountBindingSlots(control);
        const persisted = bindingEntryFor(verify.envelope, profile.id);
        if (verify.envelope?.generation !== next.generation || persisted?.checksum !== nextEntry.checksum || !persisted?.verified
          || persisted.firebaseUid !== input.firebaseUid || persisted.accountId !== input.accountId || persisted.verificationRevision !== nextEntry.verificationRevision) {
          throw new ProfileStorageError("account_binding_commit_unverified");
        }
        const { checksum, ...binding } = persisted;
        return Object.freeze({ ...binding, verified: true as const, accountId: persisted.accountId!, firebaseUid: persisted.firebaseUid!, checksum });
      });
    },
    async invalidateSelectedAccountIdentityBinding(canContinue) {
      await serializeBindingMutation(async () => {
        await assertCurrentSelectedAccountProfile(canContinue);
        const previous = await readAccountBindingSlots(control);
        const existing = bindingEntryFor(previous.envelope, profile.id);
        if (!existing || !existing.verified) return;
        const tombstone = withBindingChecksum({
          schema: ACCOUNT_BINDING_SCHEMA,
          profileId: profile.id,
          profileKind: profile.kind as "account" | "legacy_owner",
          accountId: null,
          firebaseUid: null,
          verified: false,
          verificationRevision: existing.verificationRevision + 1,
        });
        const bindings = [...(previous.envelope?.bindings ?? []).filter((entry) => entry.profileId !== profile.id), tombstone]
          .sort((left, right) => left.profileId.localeCompare(right.profileId));
        const next = withBindingEnvelopeChecksum({ schema: ACCOUNT_BINDING_SCHEMA, generation: (previous.envelope?.generation ?? 0) + 1, bindings });
        await assertCurrentSelectedAccountProfile(canContinue);
        await commitAccountBindingEnvelope(control, previous, next);
        await assertCurrentSelectedAccountProfile(canContinue);
        if (bindingEntryFor((await readAccountBindingSlots(control)).envelope, profile.id)?.checksum !== tombstone.checksum) {
          throw new ProfileStorageError("account_binding_commit_unverified");
        }
      });
    },
    async beginSelectedAccountIdentityProofBarrier(input) {
      return serializeBindingMutation(async () => {
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const previous = await readAccountBindingSlots(control);
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const existing = bindingEntryFor(previous.envelope, profile.id);
        if (!existing || !existing.verified) return null;
        if (existing.accountId !== input.accountId || existing.firebaseUid !== input.firebaseUid
          || existing.profileKind !== profile.kind || existing.verificationRevision !== input.verificationRevision) {
          throw new ProfileStorageError("account_binding_conflict");
        }
        const tombstone = withBindingChecksum({
          schema: ACCOUNT_BINDING_SCHEMA,
          profileId: profile.id,
          profileKind: profile.kind as "account" | "legacy_owner",
          accountId: null,
          firebaseUid: null,
          verified: false,
          verificationRevision: existing.verificationRevision + 1,
        });
        const bindings = [...(previous.envelope?.bindings ?? []).filter((entry) => entry.profileId !== profile.id), tombstone]
          .sort((left, right) => left.profileId.localeCompare(right.profileId));
        const next = withBindingEnvelopeChecksum({ schema: ACCOUNT_BINDING_SCHEMA, generation: (previous.envelope?.generation ?? 0) + 1, bindings });
        await assertCurrentSelectedAccountProfile(input.canContinue);
        await commitAccountBindingEnvelope(control, previous, next);
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const verified = await readAccountBindingSlots(control);
        const persisted = bindingEntryFor(verified.envelope, profile.id);
        if (verified.envelope?.generation !== next.generation || verified.envelope.checksum !== next.checksum
          || persisted?.checksum !== tombstone.checksum || persisted.verified
          || persisted.verificationRevision !== tombstone.verificationRevision) {
          throw new ProfileStorageError("account_binding_commit_unverified");
        }
        return Object.freeze({
          schema: "patternly.account-identity-proof-barrier.v1" as const,
          profileId: profile.id,
          profileKind: profile.kind as "account" | "legacy_owner",
          accountId: input.accountId,
          firebaseUid: input.firebaseUid,
          previousBindingChecksum: existing.checksum,
          previousVerificationRevision: existing.verificationRevision,
          tombstoneChecksum: tombstone.checksum,
          tombstoneVerificationRevision: tombstone.verificationRevision,
          envelopeChecksum: next.checksum,
          envelopeGeneration: next.generation,
        });
      });
    },
    async resolveSelectedAccountIdentityProofBarrier(input) {
      return serializeBindingMutation(async () => {
        const receipt = input.receipt;
        if (receipt.schema !== "patternly.account-identity-proof-barrier.v1" || receipt.profileId !== profile.id
          || receipt.profileKind !== profile.kind || !/^[a-f0-9]{64}$/u.test(receipt.previousBindingChecksum)
          || !/^[a-f0-9]{64}$/u.test(receipt.tombstoneChecksum) || !/^[a-f0-9]{64}$/u.test(receipt.envelopeChecksum)
          || !Number.isSafeInteger(receipt.previousVerificationRevision) || receipt.previousVerificationRevision < 1
          || receipt.tombstoneVerificationRevision !== receipt.previousVerificationRevision + 1
          || !Number.isSafeInteger(receipt.envelopeGeneration) || receipt.envelopeGeneration < 1
          || !receipt.accountId.trim() || !receipt.firebaseUid.trim()) throw new ProfileStorageError("account_binding_conflict");
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const previous = await readAccountBindingSlots(control);
        const tombstone = bindingEntryFor(previous.envelope, profile.id);
        if (!previous.envelope || previous.envelope.generation !== receipt.envelopeGeneration
          || previous.envelope.checksum !== receipt.envelopeChecksum || !tombstone
          || tombstone.checksum !== receipt.tombstoneChecksum || tombstone.verified
          || tombstone.profileKind !== receipt.profileKind || tombstone.accountId !== null || tombstone.firebaseUid !== null
          || tombstone.verificationRevision !== receipt.tombstoneVerificationRevision) throw new ProfileStorageError("account_binding_conflict");
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const restored = withBindingChecksum({
          schema: ACCOUNT_BINDING_SCHEMA,
          profileId: receipt.profileId,
          profileKind: receipt.profileKind,
          accountId: receipt.accountId,
          firebaseUid: receipt.firebaseUid,
          verified: true,
          verificationRevision: receipt.tombstoneVerificationRevision + 1,
        });
        const bindings = [...previous.envelope.bindings.filter((entry) => entry.profileId !== receipt.profileId), restored]
          .sort((left, right) => left.profileId.localeCompare(right.profileId));
        const next = withBindingEnvelopeChecksum({ schema: ACCOUNT_BINDING_SCHEMA, generation: previous.envelope.generation + 1, bindings });
        await assertCurrentSelectedAccountProfile(input.canContinue);
        await commitAccountBindingEnvelope(control, previous, next);
        await assertCurrentSelectedAccountProfile(input.canContinue);
        const verify = await readAccountBindingSlots(control);
        const persisted = bindingEntryFor(verify.envelope, receipt.profileId);
        if (verify.envelope?.generation !== next.generation || verify.envelope.checksum !== next.checksum
          || persisted?.checksum !== restored.checksum || !persisted.verified
          || persisted.firebaseUid !== receipt.firebaseUid || persisted.accountId !== receipt.accountId
          || persisted.verificationRevision !== restored.verificationRevision) throw new ProfileStorageError("account_binding_commit_unverified");
        const { checksum, ...binding } = persisted;
        return Object.freeze({ ...binding, verified: true as const, accountId: persisted.accountId!, firebaseUid: persisted.firebaseUid!, checksum });
      });
    },
    async inspectQ13ControlInventory(actorUidSha256?: string | null) {
      try {
        const keys = [...ROOT_KEYS, ...ACCOUNT_BINDING_KEYS, GUEST_REMOVAL_JOURNAL_KEY, LOCAL_LOGOUT_CONTROL_KEY];
        const values = await Promise.all(keys.map((key) => control.get(key)));
        if (values.some((value) => value !== null && typeof value !== "string")) return Object.freeze({ kind: "unavailable" as const });
        const slotInventorySha256 = sha256Utf8(JSON.stringify(keys.map((key, index) => [sha256Utf8(key), values[index] === null ? null : sha256Utf8(values[index]!)])));
        const journalIndex = ROOT_KEYS.length + ACCOUNT_BINDING_KEYS.length;
        const logoutIndex = journalIndex + 1;
        const logout = inspectQ13LocalLogoutControl(values[logoutIndex] ?? null, actorUidSha256);
        return Object.freeze({ kind: "observed" as const, slotCount: keys.length, slotInventorySha256,
          accountBindingState: values.slice(ROOT_KEYS.length, journalIndex).some((value) => value !== null) ? "present" as const : "absent" as const,
          journalState: values[journalIndex] === null ? "absent" as const : "present" as const,
          logoutState: values[logoutIndex] === null ? "absent" as const : "present" as const,
          logoutGlobalStatus: logout.globalStatus, logoutActorStatus: logout.actorStatus });
      } catch { return Object.freeze({ kind: "unavailable" as const }); }
    },
    async removeOriginalGuest34(expected) {
      return startGuestRemoval34(base, control, registry, profile, identity, expected, claimTransition);
    },
    async selectGuest(canContinue: () => boolean = () => true) {
      if (!canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
      const selected = registry.profiles.find((candidate) => candidate.id === registry.selectedProfileId);
      if (!selected) throw new ProfileStorageError("profile_registry_corrupt");
      if (selected.kind === "guest" || selected.kind === "legacy_guest") {
        await ensureGuestInstallation(base, selected, identity);
        ensureGuestAccess(base, selected);
        return selected;
      }

      const guests = registry.profiles.filter((candidate) => candidate.kind === "guest" || candidate.kind === "legacy_guest");
      if (guests.length === 1) return selectExistingGuest(guests[0]!.id, canContinue);
      if (guests.length > 1) throw new ProfileStorageError("prepared_guest_choice_required");

      const generated = await identity.create();
      const guest = Object.freeze({ id: generated.localDatasetId, kind: "guest" as const, accountId: null });
      if (!canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
      if (registry.profiles.some((candidate) => candidate.id === guest.id)) throw new ProfileStorageError("profile_scope_unavailable");
      claimTransition();
      const next = withChecksum({ ...registryBody(registry, registry.generation + 1), profiles: [...registry.profiles, guest], selectedProfileId: guest.id });
      const guestKey = physicalKey(guest.id, STORAGE_KEYS.GUEST_INSTALLATION, false);
      const installation = JSON.stringify({ schemaIdentity: CANONICAL_ENVELOPE, revision: 1, payload: { installationId: generated.installationId, localDatasetId: guest.id, bindingState: "guest", accountId: null } });
      if (!uuid(generated.installationId) || generated.installationId === guest.id) throw new ProfileStorageError("profile_scope_unavailable");
      base.setString(guestKey, installation);
      const verifiedInstallation = parseStoredGuestInstallation(base.getString(guestKey));
      if (!verifiedInstallation || verifiedInstallation.installationId !== generated.installationId || verifiedInstallation.localDatasetId !== guest.id || verifiedInstallation.bindingState !== "guest" || verifiedInstallation.accountId !== null) throw new ProfileStorageError("profile_scope_unavailable");
      ensureGuestAccess(base, guest);
      await commitRegistry(control, registry, next);
      return guest;
    },
    selectExistingGuest,
    async promoteSelectedBoundGuest(accountId: string, canContinue: () => boolean = () => true) {
      if (!accountId.trim() || !canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
      const selected = registry.profiles.find((candidate) => candidate.id === registry.selectedProfileId);
      if (!selected || (selected.kind !== "guest" && selected.kind !== "legacy_guest")) return null;
      const marker = storedGuestInstallation(createProfileScopedStorage(base, selected));
      if (!marker || marker.bindingState !== "account_bound" || marker.accountId !== accountId) return null;
      if (registry.profiles.some((candidate) => candidate.id !== selected.id && candidate.accountId === accountId)) throw new ProfileStorageError("profile_scope_unavailable");
      if (!canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
      claimTransition();
      const promoted: StorageProfile = Object.freeze({ ...selected, kind: selected.kind === "legacy_guest" ? "legacy_owner" : "account", accountId });
      const profiles = registry.profiles.map((candidate) => candidate.id === selected.id ? promoted : candidate);
      const next = withChecksum({ ...registryBody(registry, registry.generation + 1), profiles });
      await commitRegistry(control, registry, next);
      return promoted;
    },
    async selectAccount(accountId: string, canContinue: () => boolean = () => true) {
      if (transitionClaimed || dependencies.isTransitionActive?.()) throw new ProfileStorageError("profile_transition_cancelled");
      if (!accountId.trim()) throw new ProfileStorageError("profile_scope_unavailable");
      const selectedProfile = registry.profiles.find((candidate) => candidate.id === registry.selectedProfileId);
      if (!selectedProfile) throw new ProfileStorageError("profile_registry_corrupt");
      // A legacy guest marker can carry an adopted-account identity that is not
      // yet represented in the registry. Never inspect a selected account scope
      // or a modern guest scope while switching to another authenticated account.
      const currentMarker = selectedProfile.kind === "legacy_guest"
        ? storedGuestInstallation(createProfileScopedStorage(base, selectedProfile))
        : null;
      if (currentMarker?.bindingState === "account_bound" && currentMarker.accountId === accountId && selectedProfile.accountId !== accountId) {
        if (!canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
        claimTransition();
        const promoted: StorageProfile = Object.freeze({ ...selectedProfile, kind: selectedProfile.kind === "legacy_guest" ? "legacy_owner" : "account", accountId });
        const profiles = registry.profiles.map((candidate) => candidate.id === selectedProfile.id ? promoted : candidate);
        const next = withChecksum({ ...registryBody(registry, registry.generation + 1), profiles });
        await commitRegistry(control, registry, next);
        return promoted;
      }
      const existing = registry.profiles.find((candidate) => candidate.accountId === accountId && (candidate.kind === "legacy_owner" || candidate.kind === "account"));
      if (existing?.id === registry.selectedProfileId) return existing;
      const account = existing ?? Object.freeze({ id: (await identity.create()).localDatasetId, kind: "account" as const, accountId });
      if (account.id !== registry.selectedProfileId) {
        if (!canContinue()) throw new ProfileStorageError("profile_transition_cancelled");
        claimTransition();
        const profiles = existing ? registry.profiles : [...registry.profiles, account];
        const next = withChecksum({ ...registryBody(registry, registry.generation + 1), profiles, selectedProfileId: account.id });
        await commitRegistry(control, registry, next);
      }
      return account;
    },
  });
}

export async function commitProfileSelection(control: StorageManifestStore, previous: ProfileRegistry, selectedProfileId: string): Promise<void> {
  if (!previous.profiles.some((profile) => profile.id === selectedProfileId)) throw new ProfileStorageError("profile_scope_unavailable");
  const next = withChecksum({ ...registryBody(previous, previous.generation + 1), selectedProfileId });
  await commitRegistry(control, previous, next);
}

function registryBody(registry: ProfileRegistry, generation: number): Omit<ProfileRegistry, "checksum"> {
  return { version: ROOT_VERSION, generation, profiles: registry.profiles, legacyProfileId: registry.legacyProfileId, selectedProfileId: registry.selectedProfileId };
}

function isUnchosenFreshGuestRegistry(registry: ProfileRegistry, storageKeys: readonly string[]): boolean {
  if (storageKeys.length !== 0 || registry.generation !== 1 || registry.legacyProfileId !== null || registry.profiles.length !== 1) return false;
  const [profile] = registry.profiles;
  return profile?.kind === "guest" && profile.id === registry.selectedProfileId;
}

async function commitRegistry(control: StorageManifestStore, previous: ProfileRegistry, next: ProfileRegistry): Promise<void> {
  const slots = await Promise.all(ROOT_KEYS.map((key) => control.get(key)));
  const parsed = slots.map(parseRegistry);
  if (slots.some((value, index) => value !== null && !parsed[index])) throw new ProfileStorageError("profile_registry_corrupt");
  if (!parsed.some((entry) => entry?.generation === previous.generation && entry.checksum === previous.checksum)) throw new ProfileStorageError("profile_registry_corrupt");
  const targetIndex = slots.findIndex((value) => value === null || parseRegistry(value)?.generation !== previous.generation);
  if (targetIndex < 0) throw new ProfileStorageError("profile_registry_corrupt");
  const serialized = JSON.stringify(next);
  await control.set(ROOT_KEYS[targetIndex]!, serialized);
  const verify = await control.get(ROOT_KEYS[targetIndex]!);
  if (verify !== serialized || !parseRegistry(verify)) throw new ProfileStorageError("profile_registry_corrupt");
}
