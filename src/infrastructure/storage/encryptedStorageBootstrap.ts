import { sha256Utf8 } from "../identity/sha256";

export const LEGACY_STORAGE_ID = "patternly";
export const ENCRYPTED_STORAGE_IDS = ["patternly-secure-a", "patternly-secure-b"] as const;
export const STORAGE_MIGRATION_MARKER_KEY = "patternly:storage:migration-marker:v1";

const MANIFEST_KEYS = ["patternly.storage.manifest.a", "patternly.storage.manifest.b"] as const;
const SLOT_KEY_PREFIX = "patternly.storage.key.";
const QUARANTINE_KEY = "patternly.storage.quarantine-key";
const ROTATION_REQUEST_KEY = "patternly.storage.rotation-request";
const MANIFEST_VERSION = 1 as const;

export type EncryptedStorageFailureCode =
  | "secure_store_temporarily_unavailable"
  | "encrypted_storage_key_missing"
  | "encrypted_storage_unavailable"
  | "storage_manifest_corrupt"
  | "storage_migration_incomplete"
  | "legacy_cleanup_failed";

export class EncryptedStorageBootstrapError extends Error {
  public constructor(public readonly code: EncryptedStorageFailureCode, cause?: unknown) {
    super(code, cause === undefined ? undefined : { cause });
    this.name = "EncryptedStorageBootstrapError";
  }
}

export interface StorageSlot {
  readonly id: string;
  readonly isEncrypted: boolean;
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  remove(key: string): void;
  getAllKeys(): readonly string[];
  clearAll(): void;
  encrypt(key: string): void;
  trim(): void;
}

export interface StorageManifestStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface EncryptedStoragePlatform {
  readonly manifestStore: StorageManifestStore;
  createKey(): Promise<string>;
  exists(id: string): boolean;
  open(id: string, key?: string): StorageSlot;
  delete(id: string): void;
  bootId(): string;
}

type SlotName = "a" | "b";
type MigrationStage = "building" | "verified" | "active_reopen_pending" | "active_quarantine_pending" | "quarantine_verified" | "cleanup_pending" | "complete";
type SourceKind = "fresh" | "legacy" | "encrypted";

type ManifestBody = Readonly<{
  version: typeof MANIFEST_VERSION;
  generation: number;
  stage: MigrationStage;
  activeSlot: SlotName;
  targetKeyVersion: number;
  sourceKind: SourceKind;
  sourceSlot: SlotName | null;
  commitment: string;
  activationBootId: string;
  quarantinePresent: boolean;
  quarantineSlot: "legacy" | SlotName | null;
  quarantineKeyVersion: number | null;
  quarantineGeneration: number | null;
}>;
type StoredManifest = ManifestBody & Readonly<{ checksum: string }>;

export type EncryptedStorageOpenResult = Readonly<{
  storage: StorageSlot;
  migrated: boolean;
  cleanupPending: boolean;
}>;

const slotId = (slot: SlotName) => ENCRYPTED_STORAGE_IDS[slot === "a" ? 0 : 1];
const slotKeyName = (slot: SlotName) => `${SLOT_KEY_PREFIX}${slot}`;

function canonicalManifest(body: ManifestBody): string {
  return JSON.stringify(body);
}

function withChecksum(body: ManifestBody): StoredManifest {
  return Object.freeze({ ...body, checksum: sha256Utf8(canonicalManifest(body)) });
}

function isManifestBody(value: unknown): value is ManifestBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.version === MANIFEST_VERSION
    && Number.isSafeInteger(record.generation) && Number(record.generation) > 0
    && ["building", "verified", "active_reopen_pending", "active_quarantine_pending", "quarantine_verified", "cleanup_pending", "complete"].includes(String(record.stage))
    && (record.activeSlot === "a" || record.activeSlot === "b")
    && Number.isSafeInteger(record.targetKeyVersion) && Number(record.targetKeyVersion) > 0
    && (record.sourceKind === "fresh" || record.sourceKind === "legacy" || record.sourceKind === "encrypted")
    && (record.sourceSlot === null || record.sourceSlot === "a" || record.sourceSlot === "b")
    && typeof record.commitment === "string"
    && typeof record.activationBootId === "string"
    && typeof record.quarantinePresent === "boolean"
    && (record.quarantineSlot === null || record.quarantineSlot === "legacy" || record.quarantineSlot === "a" || record.quarantineSlot === "b")
    && (record.quarantineKeyVersion === null || (Number.isSafeInteger(record.quarantineKeyVersion) && Number(record.quarantineKeyVersion) > 0))
    && (record.quarantineGeneration === null || (Number.isSafeInteger(record.quarantineGeneration) && Number(record.quarantineGeneration) > 0));
}

function parseManifest(value: string | null): StoredManifest | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const { checksum, ...body } = parsed;
    if (typeof checksum !== "string" || !isManifestBody(body)) return null;
    if (sha256Utf8(canonicalManifest(body)) !== checksum || !isSemanticallyValidManifest(body)) return null;
    return Object.freeze({ ...body, checksum });
  } catch {
    return null;
  }
}

function isSemanticallyValidManifest(body: ManifestBody): boolean {
  if (body.sourceKind === "encrypted" && (body.sourceSlot === body.activeSlot || (body.sourceSlot === null && body.stage !== "complete"))) return false;
  if (body.sourceKind !== "encrypted" && body.sourceSlot !== null) return false;
  if (body.stage === "building") return body.commitment === "" && !body.quarantinePresent;
  if (!/^[a-f0-9]{64}$/.test(body.commitment)) return false;
  if ((body.stage === "quarantine_verified" || body.stage === "cleanup_pending") !== body.quarantinePresent) return false;
  if (body.quarantinePresent !== (body.quarantineSlot !== null && body.quarantineKeyVersion !== null && body.quarantineGeneration !== null)) return false;
  return true;
}

async function secure<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) { throw new EncryptedStorageBootstrapError("secure_store_temporarily_unavailable", error); }
}

async function readManifest(platform: EncryptedStoragePlatform): Promise<StoredManifest | null> {
  const raw = await secure(() => Promise.all(MANIFEST_KEYS.map((key) => platform.manifestStore.get(key))));
  const parsed = raw.map(parseManifest).filter((value): value is StoredManifest => value !== null);
  if (parsed.length === 0) {
    if (raw.some((value) => value !== null)) throw new EncryptedStorageBootstrapError("storage_manifest_corrupt");
    return null;
  }
  return parsed.sort((left, right) => right.generation - left.generation)[0]!;
}

async function writeManifest(platform: EncryptedStoragePlatform, body: ManifestBody): Promise<StoredManifest> {
  const { checksum: _discardedChecksum, ...cleanBody } = body as ManifestBody & Partial<Pick<StoredManifest, "checksum">>;
  const stored = withChecksum(cleanBody);
  const target = MANIFEST_KEYS[body.generation % 2]!;
  const serialized = JSON.stringify(stored);
  await secure(() => platform.manifestStore.set(target, serialized));
  const readBack = await secure(() => platform.manifestStore.get(target));
  if (readBack !== serialized || parseManifest(readBack)?.checksum !== stored.checksum) throw new EncryptedStorageBootstrapError("storage_manifest_corrupt");
  return stored;
}

async function readRequiredKey(platform: EncryptedStoragePlatform, name: string): Promise<string> {
  const value = await secure(() => platform.manifestStore.get(name));
  if (!value) throw new EncryptedStorageBootstrapError("encrypted_storage_key_missing");
  return value;
}

async function createStoredKey(platform: EncryptedStoragePlatform, name: string): Promise<string> {
  const key = await secure(() => platform.createKey());
  if (key.length !== 32) throw new EncryptedStorageBootstrapError("storage_manifest_corrupt");
  await secure(() => platform.manifestStore.set(name, key));
  if (await secure(() => platform.manifestStore.get(name)) !== key) throw new EncryptedStorageBootstrapError("storage_manifest_corrupt");
  return key;
}

function dataKeys(slot: StorageSlot): string[] {
  return [...slot.getAllKeys()].filter((key) => key !== STORAGE_MIGRATION_MARKER_KEY).sort();
}

function snapshotCommitment(slot: StorageSlot): string {
  let rolling = sha256Utf8("patternly-storage-snapshot-v1");
  for (const key of dataKeys(slot)) {
    const value = slot.getString(key);
    if (value === undefined) throw new EncryptedStorageBootstrapError("storage_migration_incomplete");
    rolling = sha256Utf8(`${rolling}:${key.length}:${key}:${value.length}:${value}`);
  }
  return rolling;
}

function copyAndVerify(source: StorageSlot, target: StorageSlot): string {
  target.clearAll();
  for (const key of dataKeys(source)) {
    const value = source.getString(key);
    if (value === undefined) throw new EncryptedStorageBootstrapError("storage_migration_incomplete");
    target.setString(key, value);
  }
  const commitment = snapshotCommitment(source);
  target.setString(STORAGE_MIGRATION_MARKER_KEY, commitment);
  if (snapshotCommitment(target) !== commitment || target.getString(STORAGE_MIGRATION_MARKER_KEY) !== commitment) throw new EncryptedStorageBootstrapError("storage_migration_incomplete");
  return commitment;
}

function verifyTransfer(slot: StorageSlot, commitment: string, fullSnapshot: boolean): void {
  if (slot.getString(STORAGE_MIGRATION_MARKER_KEY) !== commitment) throw new EncryptedStorageBootstrapError("storage_migration_incomplete");
  if (fullSnapshot && snapshotCommitment(slot) !== commitment) throw new EncryptedStorageBootstrapError("storage_migration_incomplete");
}

function openSlot(platform: EncryptedStoragePlatform, id: string, key?: string): StorageSlot {
  try { return platform.open(id, key); }
  catch (error) { throw new EncryptedStorageBootstrapError("encrypted_storage_unavailable", error); }
}

async function beginFresh(platform: EncryptedStoragePlatform): Promise<StoredManifest> {
  return writeManifest(platform, {
    version: MANIFEST_VERSION, generation: 1, stage: "building", activeSlot: "a", targetKeyVersion: 1,
    sourceKind: "fresh", sourceSlot: null, commitment: "", activationBootId: platform.bootId(), quarantinePresent: false,
    quarantineSlot: null, quarantineKeyVersion: null, quarantineGeneration: null,
  });
}

function hasAnyStorageArtifact(platform: EncryptedStoragePlatform): boolean {
  return platform.exists(LEGACY_STORAGE_ID) || ENCRYPTED_STORAGE_IDS.some((id) => platform.exists(id));
}

async function beginLegacyMigration(platform: EncryptedStoragePlatform): Promise<StoredManifest> {
  return writeManifest(platform, {
    version: MANIFEST_VERSION, generation: 1, stage: "building", activeSlot: "a", targetKeyVersion: 1,
    sourceKind: "legacy", sourceSlot: null, commitment: "", activationBootId: platform.bootId(), quarantinePresent: false,
    quarantineSlot: null, quarantineKeyVersion: null, quarantineGeneration: null,
  });
}

async function beginRotation(platform: EncryptedStoragePlatform, current: StoredManifest): Promise<StoredManifest> {
  const targetSlot: SlotName = current.activeSlot === "a" ? "b" : "a";
  return writeManifest(platform, {
    version: MANIFEST_VERSION,
    generation: current.generation + 1,
    stage: "building",
    activeSlot: targetSlot,
    targetKeyVersion: current.targetKeyVersion + 1,
    sourceKind: "encrypted",
    sourceSlot: current.activeSlot,
    commitment: "",
    activationBootId: platform.bootId(),
    quarantinePresent: false,
    quarantineSlot: null,
    quarantineKeyVersion: null,
    quarantineGeneration: null,
  });
}

async function advance(platform: EncryptedStoragePlatform, initial: StoredManifest): Promise<EncryptedStorageOpenResult> {
  let manifest = initial;
  const targetKeyName = slotKeyName(manifest.activeSlot);
  const existingTargetKey = await secure(() => platform.manifestStore.get(targetKeyName));
  const targetKey = existingTargetKey ?? (manifest.stage === "building"
    ? await createStoredKey(platform, targetKeyName)
    : await readRequiredKey(platform, targetKeyName));
  let target = openSlot(platform, slotId(manifest.activeSlot), targetKey);

  if (manifest.stage === "building") {
    const source = manifest.sourceKind === "fresh"
      ? openSlot(platform, slotId(manifest.activeSlot), targetKey)
      : manifest.sourceKind === "legacy"
        ? openSlot(platform, LEGACY_STORAGE_ID)
        : openSlot(platform, slotId(manifest.sourceSlot!), await readRequiredKey(platform, slotKeyName(manifest.sourceSlot!)));
    const commitment = copyAndVerify(source, target);
    manifest = await writeManifest(platform, { ...manifest, generation: manifest.generation + 1, stage: "verified", commitment });
  }
  if (manifest.stage === "verified") {
    verifyTransfer(target, manifest.commitment, true);
    target.trim();
    target = openSlot(platform, slotId(manifest.activeSlot), targetKey);
    verifyTransfer(target, manifest.commitment, true);
    manifest = await writeManifest(platform, { ...manifest, generation: manifest.generation + 1, stage: "active_reopen_pending", activationBootId: platform.bootId() });
  }
  if (manifest.stage === "active_reopen_pending") {
    verifyTransfer(target, manifest.commitment, true);
    manifest = await writeManifest(platform, { ...manifest, generation: manifest.generation + 1, stage: "active_quarantine_pending" });
  }
  if (manifest.stage === "active_quarantine_pending") {
    if (manifest.sourceKind === "fresh") {
      manifest = await writeManifest(platform, { ...manifest, generation: manifest.generation + 1, stage: "complete" });
      return Object.freeze({ storage: target, migrated: false, cleanupPending: false });
    }
    if (manifest.sourceKind === "legacy") {
      let quarantineKey = await secure(() => platform.manifestStore.get(QUARANTINE_KEY));
      if (!quarantineKey) quarantineKey = await createStoredKey(platform, QUARANTINE_KEY);
      const legacy = openSlot(platform, LEGACY_STORAGE_ID);
      if (!legacy.isEncrypted) {
        legacy.setString(STORAGE_MIGRATION_MARKER_KEY, manifest.commitment);
        legacy.encrypt(quarantineKey);
      }
      const quarantine = openSlot(platform, LEGACY_STORAGE_ID, quarantineKey);
      verifyTransfer(quarantine, manifest.commitment, true);
    } else {
      const source = openSlot(platform, slotId(manifest.sourceSlot!), await readRequiredKey(platform, slotKeyName(manifest.sourceSlot!)));
      source.setString(STORAGE_MIGRATION_MARKER_KEY, manifest.commitment);
      verifyTransfer(source, manifest.commitment, true);
    }
    manifest = await writeManifest(platform, {
      ...manifest,
      generation: manifest.generation + 1,
      stage: "quarantine_verified",
      quarantinePresent: true,
      quarantineSlot: manifest.sourceKind === "legacy" ? "legacy" : manifest.sourceSlot,
      quarantineKeyVersion: manifest.sourceKind === "legacy" ? 1 : Math.max(1, manifest.targetKeyVersion - 1),
      quarantineGeneration: manifest.generation + 1,
    });
  }
  if (manifest.stage === "quarantine_verified" && manifest.activationBootId !== platform.bootId()) {
    verifyTransfer(target, manifest.commitment, false);
    manifest = await writeManifest(platform, { ...manifest, generation: manifest.generation + 1, stage: "cleanup_pending" });
  }
  if (manifest.stage === "cleanup_pending") {
    try {
      if (manifest.sourceKind === "legacy") platform.delete(LEGACY_STORAGE_ID);
      else if (manifest.sourceSlot) platform.delete(slotId(manifest.sourceSlot));
      await secure(() => platform.manifestStore.remove(manifest.sourceKind === "legacy" ? QUARANTINE_KEY : slotKeyName(manifest.sourceSlot!)));
    } catch (error) {
      throw new EncryptedStorageBootstrapError("legacy_cleanup_failed", error);
    }
    manifest = await writeManifest(platform, {
      ...manifest,
      generation: manifest.generation + 1,
      stage: "complete",
      quarantinePresent: false,
      quarantineSlot: null,
      quarantineKeyVersion: null,
      quarantineGeneration: null,
      sourceSlot: null,
    });
    await secure(() => platform.manifestStore.remove(ROTATION_REQUEST_KEY));
  }
  if (manifest.stage === "complete") verifyTransfer(target, manifest.commitment, false);
  return Object.freeze({ storage: target, migrated: initial.sourceKind === "legacy", cleanupPending: manifest.stage !== "complete" });
}

export async function openEncryptedStorage(platform: EncryptedStoragePlatform): Promise<EncryptedStorageOpenResult> {
  let manifest = await readManifest(platform);
  if (!manifest) {
    const secureArtifacts = await secure(() => Promise.all([
      platform.manifestStore.get(slotKeyName("a")),
      platform.manifestStore.get(slotKeyName("b")),
      platform.manifestStore.get(QUARANTINE_KEY),
      platform.manifestStore.get(ROTATION_REQUEST_KEY),
    ]));
    if (!hasAnyStorageArtifact(platform) && secureArtifacts.every((value) => value === null)) return advance(platform, await beginFresh(platform));
    if (!platform.exists(LEGACY_STORAGE_ID) || ENCRYPTED_STORAGE_IDS.some((id) => platform.exists(id)) || secureArtifacts.some((value) => value !== null)) throw new EncryptedStorageBootstrapError("storage_manifest_corrupt");
    return advance(platform, await beginLegacyMigration(platform));
  }
  if (manifest.stage === "complete" && await secure(() => platform.manifestStore.get(ROTATION_REQUEST_KEY)) === "requested") {
    manifest = await beginRotation(platform, manifest);
  }
  if (manifest.stage !== "building" && !platform.exists(slotId(manifest.activeSlot))) throw new EncryptedStorageBootstrapError("encrypted_storage_key_missing");
  return advance(platform, manifest);
}

/** Requests an A/B key rotation which is performed before repositories open on the next bootstrap. */
export async function requestEncryptedStorageKeyRotation(platform: EncryptedStoragePlatform): Promise<void> {
  await secure(() => platform.manifestStore.set(ROTATION_REQUEST_KEY, "requested"));
}

export async function resetUnavailableEncryptedStorage(platform: EncryptedStoragePlatform): Promise<void> {
  for (const id of [LEGACY_STORAGE_ID, ...ENCRYPTED_STORAGE_IDS]) if (platform.exists(id)) platform.delete(id);
  for (const key of [...MANIFEST_KEYS, slotKeyName("a"), slotKeyName("b"), QUARANTINE_KEY, ROTATION_REQUEST_KEY]) await secure(() => platform.manifestStore.remove(key));
}
