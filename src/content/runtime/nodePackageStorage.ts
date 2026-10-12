import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { MAX_ARTIFACT_BYTES, MAX_PACKAGE_BYTES, NodePackageError, NodePackageStorageIntegrityError, NodePackageStorageUnavailableError, validateNodePayload, type NodePackageIdentity, type NodePackageManifest, type NodePackageStore, type VerifiedNodePackage } from "./nodeContentPackage";
import { isCanonicalSafeIdentity } from "../../domain/identity/canonicalIdentity";

export interface NodePackageFilePort {
  write(path: string, bytes: Uint8Array, overwrite?: boolean): Promise<void>;
  read(path: string): Promise<Uint8Array | null>;
  move(source: string, destination: string, overwrite?: boolean): Promise<void>;
  remove(path: string): Promise<void>;
  list(prefix: string): Promise<readonly string[]>;
}
export type NodePackageRootReadiness = Readonly<{ kind: "observed"; exists: boolean } | { kind: "unavailable" }>;
export type Q13NodePackageInventory = Readonly<{
  kind: "observed" | "unavailable";
  pointerCount?: number;
  retainedIdentityCount?: number;
  pointerInventorySha256?: string;
  physicalFileCount?: number;
  physicalFileInventorySha256?: string;
  referencedPairCount?: number;
  orphanFileCount?: number;
  stagingFileCount?: number;
  reason?: "root_unavailable" | "pointer_source_unavailable" | "pointer_inventory_invalid" | "file_inventory_invalid" | "pointer_file_mismatch" | "manifest_invalid" | "identity_mismatch" | "artifact_invalid" | "read_failed";
}>;

export type Q13PackagePointerSource = Readonly<{
  profileIdSha256: string;
  entries: readonly Readonly<{ key: string; value: string }>[];
}>;

/** Enumerates existing package pointers and physical files without creating the root or changing pointers. */
export async function inspectExpoNodePackageInventory(
  sources: readonly Q13PackagePointerSource[],
  fileSystem?: typeof import("expo-file-system"),
): Promise<Q13NodePackageInventory> {
  try {
    const fs = fileSystem ?? require("expo-file-system") as typeof import("expo-file-system");
    const root = new fs.Directory(fs.Paths.document, "patternly-content-node-packages-v1");
    const pointers: Array<Readonly<{ profileIdSha256: string; keySha256: string; identity: NodePackageIdentity; isCurrent: boolean }>> = [];
    const pointerKeys = new Set<string>();
    for (const source of sources) {
      if (!/^[a-f0-9]{64}$/u.test(source.profileIdSha256) || !Array.isArray(source.entries)) return { kind: "unavailable", reason: "pointer_inventory_invalid" };
      for (const entry of source.entries) {
        if (!entry.key.startsWith(POINTER_PREFIX)) continue;
        let pointer: ActivePointer;
        try { pointer = parseActivePointer(entry.value, entry.key); }
        catch { return { kind: "unavailable", reason: "pointer_inventory_invalid" }; }
        pointerKeys.add(`${source.profileIdSha256}:${sha256Utf8(entry.key)}`);
        for (const identity of pointer.retained) {
          pointers.push(Object.freeze({ profileIdSha256: source.profileIdSha256, keySha256: sha256Utf8(entry.key), identity, isCurrent: sameIdentity(identity, pointer.current) }));
        }
      }
    }
    const pointerIdentity = pointers.map((entry) => [entry.profileIdSha256, entry.keySha256, identityKey(entry.identity), entry.isCurrent]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const pointerInventorySha256 = sha256Utf8(JSON.stringify(pointerIdentity));
    if (!root.exists) return pointers.length === 0
      ? Object.freeze({ kind: "observed", pointerCount: 0, retainedIdentityCount: 0, pointerInventorySha256, physicalFileCount: 0, physicalFileInventorySha256: sha256Utf8("[]"), referencedPairCount: 0, orphanFileCount: 0, stagingFileCount: 0 })
      : Object.freeze({ kind: "unavailable", reason: "pointer_file_mismatch", pointerCount: pointerKeys.size, retainedIdentityCount: pointers.length, pointerInventorySha256 });

    const listFiles = async (): Promise<Array<Readonly<{ path: string; bytes: Uint8Array }>>> => {
      const files: Array<Readonly<{ path: string; bytes: Uint8Array }>> = [];
      const walk = async (directory: InstanceType<typeof fs.Directory>, prefix: string): Promise<void> => {
        for (const child of directory.list()) {
          if (child instanceof fs.File) files.push(Object.freeze({ path: `${prefix}${child.name}`, bytes: await child.bytes() }));
          else if (child instanceof fs.Directory) await walk(child, `${prefix}${child.name}/`);
        }
      };
      await walk(root, "");
      return files;
    };
    const files = await listFiles();
    const names = files.map((entry) => entry.path);
    if (new Set(names).size !== names.length || names.some((path) => path.startsWith("/") || path.split("/").some((part) => part === ".." || part === ""))) return { kind: "unavailable", reason: "file_inventory_invalid" };
    const fileHashes = await Promise.all(files.map(async ({ path, bytes }) => Object.freeze({ pathSha256: sha256Utf8(path), byteLength: bytes.length, bytesSha256: await contentHasher.sha256Bytes(bytes) })));
    const fileInventorySha256 = sha256Utf8(JSON.stringify(fileHashes.sort((a, b) => a.pathSha256.localeCompare(b.pathSha256))));
    const referenced = new Set<string>();
    for (const entry of pointers) {
      const identity = entry.identity;
      const artifact = artifactPath(identity), manifest = manifestPath(identity);
      const artifactBytes = files.find((file) => file.path === artifact)?.bytes;
      const manifestBytes = files.find((file) => file.path === manifest)?.bytes;
      if (!artifactBytes || !manifestBytes) return Object.freeze({ kind: "unavailable", reason: "pointer_file_mismatch", pointerCount: pointerKeys.size, retainedIdentityCount: pointers.length, pointerInventorySha256, physicalFileCount: files.length, physicalFileInventorySha256: fileInventorySha256 });
      try { await verifyStoredPackageContents(identity, artifactBytes, manifestBytes); }
      catch {
        return Object.freeze({ kind: "unavailable", reason: "pointer_file_mismatch", pointerCount: pointerKeys.size, retainedIdentityCount: pointers.length, pointerInventorySha256, physicalFileCount: files.length, physicalFileInventorySha256: fileInventorySha256 });
      }
      referenced.add(artifact); referenced.add(manifest);
    }
    const orphanFileCount = names.filter((path) => !referenced.has(path)).length;
    const filesAfter = await listFiles();
    const afterInventory = await Promise.all(filesAfter.map(async ({ path, bytes }) => Object.freeze({ pathSha256: sha256Utf8(path), byteLength: bytes.length, bytesSha256: await contentHasher.sha256Bytes(bytes) })));
    const afterInventorySha256 = sha256Utf8(JSON.stringify(afterInventory.sort((a, b) => a.pathSha256.localeCompare(b.pathSha256))));
    if (afterInventorySha256 !== fileInventorySha256 || !root.exists) return Object.freeze({ kind: "unavailable", reason: "file_inventory_invalid", pointerCount: pointerKeys.size, retainedIdentityCount: pointers.length, pointerInventorySha256, physicalFileCount: files.length, physicalFileInventorySha256: fileInventorySha256 });
    return Object.freeze({ kind: "observed", pointerCount: pointerKeys.size, retainedIdentityCount: pointers.length, pointerInventorySha256, physicalFileCount: files.length, physicalFileInventorySha256: fileInventorySha256, referencedPairCount: referenced.size / 2, orphanFileCount, stagingFileCount: names.filter((path) => path.startsWith("staging/")).length });
  } catch {
    return Object.freeze({ kind: "unavailable", reason: "read_failed" });
  }
}

/** Reads only the fixed package-directory existence bit; constructing a Directory never creates it. */
export function inspectExpoNodePackageRootReadiness(
  fileSystem?: typeof import("expo-file-system"),
): NodePackageRootReadiness {
  try {
    const fs = fileSystem ?? require("expo-file-system") as typeof import("expo-file-system");
    const root = new fs.Directory(fs.Paths.document, "patternly-content-node-packages-v1");
    return Object.freeze({ kind: "observed", exists: root.exists });
  } catch {
    return Object.freeze({ kind: "unavailable" });
  }
}

export interface NodePackagePointerPort { getString(key: string): string | undefined; setString(key: string, value: string): void; remove(key: string): void; getAllKeys(): readonly string[]; }
export interface NodePackageStorageIds { createId(): string; }
type ActivePointer = Readonly<{ schemaVersion: 1; current: NodePackageIdentity; retained: readonly NodePackageIdentity[] }>;

export function createNodePackageStore(input: Readonly<{ files: NodePackageFilePort; pointers: NodePackagePointerPort; ids: NodePackageStorageIds }>): NodePackageStore {
  const artifactPath = (identity: NodePackageIdentity) => `artifacts/${recordKey(identity)}.bin`;
  const manifestPath = (identity: NodePackageIdentity) => `manifests/${recordKey(identity)}.json`;
  const pointerKey = (trackId: string, nodeId: string) => `patternly.content-node.active.v1.${sha256Utf8(`${trackId}\u0000${nodeId}`)}`;
  async function readPair(identity: NodePackageIdentity): Promise<VerifiedNodePackage | null> {
    let bytes: Uint8Array | null, manifestBytes: Uint8Array | null;
    try { [bytes, manifestBytes] = await Promise.all([input.files.read(artifactPath(identity)), input.files.read(manifestPath(identity))]); }
    catch { throw new NodePackageStorageUnavailableError("package_read"); }
    if (!bytes && !manifestBytes) return null;
    if (!bytes || !manifestBytes) throw new NodePackageStorageIntegrityError("corrupt", "package_read");
    return verifyStoredPackageContents(identity, bytes, manifestBytes);
  }
  async function read(identity: NodePackageIdentity): Promise<VerifiedNodePackage | null> {
    const record = await readPair(identity);
    if (record) return record;
    const key = pointerKey(identity.trackId, identity.nodeId);
    let before: string | undefined;
    try { before = input.pointers.getString(key); } catch { throw new NodePackageStorageUnavailableError("pointer_read"); }
    if (before === undefined) return null;
    const pointer = parseActivePointer(before, key);
    if (pointer.retained.some((entry) => sameIdentity(entry, identity))) throw new NodePackageStorageIntegrityError("corrupt", "package_read");
    let after: string | undefined;
    try { after = input.pointers.getString(key); } catch { throw new NodePackageStorageUnavailableError("pointer_readback"); }
    if (after !== before) throw new NodePackageStorageUnavailableError("pointer_readback", "unknown");
    return null;
  }
  async function capturePointerSnapshot(): Promise<readonly (readonly [string, string])[]> {
    let keys: readonly string[];
    try { keys = input.pointers.getAllKeys(); } catch { throw new NodePackageStorageUnavailableError("inventory_read"); }
    const entries: Array<readonly [string, string]> = [];
    for (const key of keys.filter((value) => value.startsWith(POINTER_PREFIX)).sort()) {
      let value: string | undefined;
      try { value = input.pointers.getString(key); } catch { throw new NodePackageStorageUnavailableError("pointer_read"); }
      if (value === undefined) throw new NodePackageStorageIntegrityError("corrupt", "pointer_read");
      entries.push(Object.freeze([key, value] as const));
    }
    return Object.freeze(entries);
  }
  return Object.freeze({
    async writeImmutable(record) {
      const key = recordKey(record.identity);
      const finalArtifact = artifactPath(record.identity), finalManifest = manifestPath(record.identity);
      const existing = await read(record.identity);
      if (existing) {
        if (!sameBytes(existing.artifactBytes, record.artifactBytes) || !sameManifest(existing.manifest, record.manifest)) throw new NodePackageStorageIntegrityError("identity_mismatch", "package_readback");
        return;
      }
      const current = await activePointer(record.identity.trackId, record.identity.nodeId);
      if (current && current.retained.some((identity) => sameIdentity(identity, record.identity))) throw new Error("active_node_package_corrupt");
      const stageArtifact = `staging/${key}.${input.ids.createId()}.bin`;
      const stageManifest = `staging/${key}.${input.ids.createId()}.json`;
      try { await input.files.write(stageArtifact, record.artifactBytes); }
      catch { throw new NodePackageStorageUnavailableError("package_write"); }
      const staged = await readFile(input.files, stageArtifact, "package_readback");
      if (!staged || staged.length !== record.artifactBytes.length || await contentHasher.sha256Bytes(staged) !== record.identity.artifactSha256 || !sameBytes(staged, record.artifactBytes)) throw new NodePackageStorageIntegrityError("corrupt", "package_readback");
      const manifestBytes = new TextEncoder().encode(JSON.stringify(record.manifest));
      try { await input.files.write(stageManifest, manifestBytes); }
      catch { throw new NodePackageStorageUnavailableError("package_write"); }
      const manifestRead = await readFile(input.files, stageManifest, "package_readback");
      if (!manifestRead || !sameBytes(manifestRead, manifestBytes)) throw new NodePackageStorageIntegrityError("corrupt", "package_readback");
      try { await input.files.move(stageArtifact, finalArtifact); }
      catch { throw new NodePackageStorageUnavailableError("artifact_move"); }
      try { await input.files.move(stageManifest, finalManifest); }
      catch { throw new NodePackageStorageUnavailableError("manifest_move"); }
      const final = await read(record.identity);
      if (!final || !sameBytes(final.artifactBytes, record.artifactBytes) || !sameManifest(final.manifest, record.manifest)) throw new NodePackageStorageIntegrityError("corrupt", "package_readback");
    },
    read,
    async getActive(trackId, nodeId) { return (await activePointer(trackId, nodeId))?.current ?? null; },
    async activate(trackId, nodeId, identity) {
      if (identity.trackId !== trackId || identity.nodeId !== nodeId || !(await readPair(identity))) throw new Error("node_package_not_verified");
      // One canonical MMKV value atomically records the current version and every identity that was previously activated.
      const key = pointerKey(trackId, nodeId);
      let previous: string | undefined;
      try { previous = input.pointers.getString(key); } catch { throw new NodePackageStorageUnavailableError("pointer_read"); }
      const oldPointer = previous === undefined ? null : parseActivePointer(previous, key);
      if (oldPointer) for (const retainedIdentity of oldPointer.retained) if (!(await readPair(retainedIdentity))) throw new NodePackageStorageIntegrityError("corrupt", "package_read");
      const retained = new Map((oldPointer?.retained ?? []).map((entry) => [identityKey(entry), entry]));
      if (oldPointer) retained.set(identityKey(oldPointer.current), oldPointer.current);
      retained.set(identityKey(identity), Object.freeze({ ...identity }));
      const next = JSON.stringify({ schemaVersion: 1, current: identity, retained: [...retained.values()] } satisfies ActivePointer);
      // readPair() above yields. Recheck the exact pointer snapshot immediately
      // before the synchronous MMKV write so a concurrent activation cannot be
      // overwritten with a stale retained set.
      let currentBeforeWrite: string | undefined;
      try { currentBeforeWrite = input.pointers.getString(key); }
      catch { throw new NodePackageStorageUnavailableError("pointer_readback", "unknown"); }
      if (currentBeforeWrite !== previous) throw new NodePackageStorageUnavailableError("pointer_readback", "unknown");
      let writeFailed = false;
      try {
        input.pointers.setString(key, next);
      } catch { writeFailed = true; }
      if (!writeFailed) {
        try { if (input.pointers.getString(key) === next) return; writeFailed = true; }
        catch { writeFailed = true; }
      }
      let observed: string | undefined;
      try { observed = input.pointers.getString(key); } catch { throw new NodePackageStorageUnavailableError("pointer_readback", "unknown"); }
      if (observed === next) return;
      if (observed === previous) throw new NodePackageStorageUnavailableError("pointer_write", "not_applied");
      if (observed !== undefined) parseActivePointer(observed, key);
      throw new NodePackageStorageUnavailableError("pointer_readback", "unknown");
    },
    async listActive() {
      const records: VerifiedNodePackage[] = [];
      const seen = new Set<string>();
      const before = await capturePointerSnapshot();
      for (const [key, value] of before) {
        const pointer = parseActivePointer(value, key);
        for (const identity of pointer.retained) {
          const identityKeyValue = identityKey(identity);
          if (seen.has(identityKeyValue)) throw new NodePackageStorageIntegrityError("corrupt", "pointer_identity");
          seen.add(identityKeyValue);
          const record = await readPair(identity);
          if (!record) throw new NodePackageStorageIntegrityError("corrupt", "package_read");
          records.push(record);
        }
      }
      const after = await capturePointerSnapshot();
      if (JSON.stringify(after) !== JSON.stringify(before)) throw new NodePackageStorageUnavailableError("inventory_read", "unknown");
      return Object.freeze(records);
    },
  });
  async function activePointer(trackId: string, nodeId: string): Promise<ActivePointer | null> {
    const key = pointerKey(trackId, nodeId);
    let value: string | undefined;
    try { value = input.pointers.getString(key); } catch { throw new NodePackageStorageUnavailableError("pointer_read"); }
    if (value === undefined) return null;
    const pointer = parseActivePointer(value, key);
    if (pointer.current.trackId !== trackId || pointer.current.nodeId !== nodeId) throw new NodePackageStorageIntegrityError("identity_mismatch", "pointer_identity");
    for (const identity of pointer.retained) if (!(await readPair(identity))) throw new NodePackageStorageIntegrityError("corrupt", "package_read");
    let after: string | undefined;
    try { after = input.pointers.getString(key); } catch { throw new NodePackageStorageUnavailableError("pointer_readback"); }
    if (after !== value) throw new NodePackageStorageUnavailableError("pointer_readback", "unknown");
    return pointer;
  }
}

const POINTER_PREFIX = "patternly.content-node.active.v1.";

export function createExpoNodePackageFilePort(fileSystem?: typeof import("expo-file-system")): NodePackageFilePort {
  const fs = fileSystem ?? require("expo-file-system") as typeof import("expo-file-system");
  const root = new fs.Directory(fs.Paths.document, "patternly-content-node-packages-v1");
  const fileAt = (path: string) => new fs.File(root, ...path.split("/"));
  const port: NodePackageFilePort = {
    async write(path, bytes, overwrite = false) { const file = fileAt(path); file.create({ intermediates: true, overwrite }); file.write(bytes); },
    async read(path) { const file = fileAt(path); if (!file.exists) return null; return file.bytes(); },
    async move(source, destination, overwrite = false) { const target = fileAt(destination); target.parentDirectory.create({ intermediates: true, idempotent: true }); await fileAt(source).move(target, { overwrite }); },
    async remove(path) { const file = fileAt(path); if (file.exists) file.delete(); },
    async list(prefix) { const directory = new fs.Directory(root, ...prefix.replace(/\/$/u, "").split("/")); if (!directory.exists) return []; return Object.freeze(directory.list().filter((entry): entry is InstanceType<typeof fs.File> => entry instanceof fs.File).map((entry) => `${prefix}${entry.name}`)); },
  };
  return Object.freeze(port);
}

function recordKey(identity: NodePackageIdentity): string { return sha256Utf8(`${identity.trackId}\u0000${identity.nodeId}\u0000${identity.contentVersion}\u0000${identity.artifactSha256}`); }
function artifactPath(identity: NodePackageIdentity): string { return `artifacts/${recordKey(identity)}.bin`; }
function manifestPath(identity: NodePackageIdentity): string { return `manifests/${recordKey(identity)}.json`; }
async function verifyStoredPackageContents(identity: NodePackageIdentity, bytes: Uint8Array, manifestBytes: Uint8Array): Promise<VerifiedNodePackage> {
  let manifest: unknown;
  try { manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(manifestBytes)); }
  catch { throw new NodePackageStorageIntegrityError("corrupt", "manifest_decode"); }
  if (!plain(manifest)) throw new NodePackageStorageIntegrityError("corrupt", "manifest_decode");
  const manifestKeys = ["trackId", "nodeId", "contentVersion", "artifactSha256", "packageSha256", "contentReleaseId", "minimumAppVersion", "packageSize", "artifactSize"];
  const hasRequiredManifestKeys = manifestKeys.every((key) => Object.hasOwn(manifest, key));
  if (hasRequiredManifestKeys && Object.keys(manifest).some((key) => !manifestKeys.includes(key))) throw new NodePackageStorageIntegrityError("unsupported", "manifest_decode");
  if (!isManifest(manifest)) throw new NodePackageStorageIntegrityError("corrupt", "manifest_decode");
  if (!sameIdentity(manifest, identity)) throw new NodePackageStorageIntegrityError("identity_mismatch", "pointer_identity");
  if (manifest.artifactSize !== bytes.length) throw new NodePackageStorageIntegrityError("corrupt", "artifact_verify");
  if (await contentHasher.sha256Bytes(bytes) !== identity.artifactSha256) throw new NodePackageStorageIntegrityError("corrupt", "artifact_verify");
  let decoded: unknown;
  try { decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new NodePackageStorageIntegrityError("corrupt", "artifact_verify"); }
  if (plain(decoded) && Object.hasOwn(decoded, "schemaVersion") && decoded.schemaVersion !== "patternly-content-node-payload-v1") throw new NodePackageStorageIntegrityError("unsupported", "artifact_verify");
  let payload;
  try { payload = validateNodePayload(decoded, { trackId: identity.trackId, nodeId: identity.nodeId, contentVersion: identity.contentVersion, contentReleaseId: manifest.contentReleaseId }); }
  catch (error) {
    if (error instanceof NodePackageError && error.code === "package_identity_mismatch") throw new NodePackageStorageIntegrityError("identity_mismatch", "artifact_verify");
    throw new NodePackageStorageIntegrityError("corrupt", "artifact_verify");
  }
  return Object.freeze({ identity: Object.freeze({ ...identity }), payload, manifest: Object.freeze({ ...manifest }), artifactBytes: new Uint8Array(bytes) });
}
function identityKey(identity: NodePackageIdentity): string { return JSON.stringify([identity.trackId, identity.nodeId, identity.contentVersion, identity.artifactSha256]); }
function isIdentity(value: unknown): value is NodePackageIdentity { return exactKeys(value, ["trackId", "nodeId", "contentVersion", "artifactSha256"]) && isCanonicalSafeIdentity(value.trackId) && isCanonicalSafeIdentity(value.nodeId) && isCanonicalSafeIdentity(value.contentVersion) && /^[a-f0-9]{64}$/u.test(value.artifactSha256); }
function parseActivePointer(value: string, key?: string): ActivePointer {
  try {
    const parsed: unknown = JSON.parse(value);
    if (isIdentity(parsed)) throw new NodePackageStorageIntegrityError("unsupported", "pointer_decode");
    if (plain(parsed) && Object.hasOwn(parsed, "schemaVersion") && parsed.schemaVersion !== 1) throw new NodePackageStorageIntegrityError("unsupported", "pointer_decode");
    if (!exactKeys(parsed, ["schemaVersion", "current", "retained"]) || parsed.schemaVersion !== 1 || !isIdentity(parsed.current) || !Array.isArray(parsed.retained) || !parsed.retained.every(isIdentity)) throw new NodePackageStorageIntegrityError("corrupt", "pointer_decode");
    if (!parsed.retained.some((entry: NodePackageIdentity) => sameIdentity(entry, parsed.current as NodePackageIdentity)) || parsed.retained.some((entry: NodePackageIdentity) => entry.trackId !== parsed.current.trackId || entry.nodeId !== parsed.current.nodeId)) throw new NodePackageStorageIntegrityError("identity_mismatch", "pointer_identity");
    const retained = new Map<string, NodePackageIdentity>();
    for (const entry of parsed.retained) {
      if (retained.has(identityKey(entry))) throw new NodePackageStorageIntegrityError("corrupt", "pointer_decode");
      retained.set(identityKey(entry), Object.freeze({ ...entry }));
    }
    const current = Object.freeze({ ...parsed.current });
    if (key !== undefined && key !== `${POINTER_PREFIX}${sha256Utf8(`${current.trackId}\u0000${current.nodeId}`)}`) throw new NodePackageStorageIntegrityError("identity_mismatch", "pointer_identity");
    return Object.freeze({ schemaVersion: 1, current, retained: Object.freeze([...retained.values()]) });
  } catch (error) {
    if (error instanceof NodePackageStorageIntegrityError) throw error;
    throw new NodePackageStorageIntegrityError("corrupt", "pointer_decode");
  }
}
function isManifest(value: unknown): value is NodePackageManifest { return exactKeys(value, ["trackId", "nodeId", "contentVersion", "artifactSha256", "packageSha256", "contentReleaseId", "minimumAppVersion", "packageSize", "artifactSize"]) && isIdentity({ trackId: value.trackId, nodeId: value.nodeId, contentVersion: value.contentVersion, artifactSha256: value.artifactSha256 }) && /^[a-f0-9]{64}$/u.test(value.packageSha256) && isCanonicalSafeIdentity(value.contentReleaseId) && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(value.minimumAppVersion) && Number.isSafeInteger(value.packageSize) && value.packageSize > 0 && value.packageSize <= MAX_PACKAGE_BYTES && Number.isSafeInteger(value.artifactSize) && value.artifactSize > 0 && value.artifactSize <= MAX_ARTIFACT_BYTES; }
function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype && Object.keys(value).sort().join("\u0000") === [...keys].sort().join("\u0000"); }
function sameIdentity(a: NodePackageIdentity, b: NodePackageIdentity): boolean { return a.trackId === b.trackId && a.nodeId === b.nodeId && a.contentVersion === b.contentVersion && a.artifactSha256 === b.artifactSha256; }
async function readFile(files: NodePackageFilePort, path: string, stage: "package_readback"): Promise<Uint8Array | null> {
  try { return await files.read(path); } catch { throw new NodePackageStorageUnavailableError(stage); }
}
function sameManifest(a: NodePackageManifest, b: NodePackageManifest): boolean { return JSON.stringify(a) === JSON.stringify(b); }
function plain(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function sameBytes(a: Uint8Array, b: Uint8Array): boolean { return a.length === b.length && a.every((value, index) => value === b[index]); }
