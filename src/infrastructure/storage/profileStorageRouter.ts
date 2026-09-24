import type { KeyValueStorage } from "./mmkvClient";
import type { StorageManifestStore } from "./encryptedStorageBootstrap";
import { STORAGE_NAMESPACE, STORAGE_KEYS } from "../../storage/keys";
import { installationIdentity, type GuestInstallationIdentityPort } from "../identity/installationIdentity";
import { sha256Utf8 } from "../identity/sha256";

const ROOT_KEYS = Object.freeze(["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"] as const);
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

export class ProfileStorageError extends Error {
  public constructor(public readonly code: "profile_registry_corrupt" | "legacy_profile_unidentified" | "profile_scope_unavailable" | "profile_transition_cancelled" | "prepared_guest_choice_required") {
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
  selectAccount(accountId: string, canContinue?: () => boolean): Promise<StorageProfile>;
  hasValidGuestAccess(profileId: string): boolean;
}>;

export async function openProfileStorageRouter(
  base: KeyValueStorage,
  control: StorageManifestStore,
  dependencies: Readonly<{ identity?: GuestInstallationIdentityPort; isTransitionActive?: () => boolean; onBeforeProfileCommit?: () => void }> = {},
): Promise<ProfileStorageRouter> {
  const identity = dependencies.identity ?? installationIdentity;
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
