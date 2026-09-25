import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { MAX_ARTIFACT_BYTES, MAX_PACKAGE_BYTES, validateNodePayload, type NodePackageIdentity, type NodePackageManifest, type NodePackageStore, type VerifiedNodePackage } from "./nodeContentPackage";
import { isCanonicalSafeIdentity } from "../canonical";

export interface NodePackageFilePort {
  write(path: string, bytes: Uint8Array, overwrite?: boolean): Promise<void>;
  read(path: string): Promise<Uint8Array | null>;
  move(source: string, destination: string, overwrite?: boolean): Promise<void>;
  remove(path: string): Promise<void>;
  list(prefix: string): Promise<readonly string[]>;
}
export interface NodePackagePointerPort { getString(key: string): string | undefined; setString(key: string, value: string): void; remove(key: string): void; getAllKeys(): readonly string[]; }
export interface NodePackageStorageIds { createId(): string; }
type ActivePointer = Readonly<{ schemaVersion: 1; current: NodePackageIdentity; retained: readonly NodePackageIdentity[] }>;

export function createNodePackageStore(input: Readonly<{ files: NodePackageFilePort; pointers: NodePackagePointerPort; ids: NodePackageStorageIds }>): NodePackageStore {
  const artifactPath = (identity: NodePackageIdentity) => `artifacts/${recordKey(identity)}.bin`;
  const manifestPath = (identity: NodePackageIdentity) => `manifests/${recordKey(identity)}.json`;
  const pointerKey = (trackId: string, nodeId: string) => `patternly.content-node.active.v1.${sha256Utf8(`${trackId}\u0000${nodeId}`)}`;
  async function read(identity: NodePackageIdentity): Promise<VerifiedNodePackage | null> {
    const [bytes, manifestBytes] = await Promise.all([input.files.read(artifactPath(identity)), input.files.read(manifestPath(identity))]);
    if (!bytes || !manifestBytes) return null;
    try {
      const manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(manifestBytes)) as NodePackageManifest;
      if (!isManifest(manifest) || !sameIdentity(manifest, identity) || manifest.artifactSize !== bytes.length || await contentHasher.sha256Bytes(bytes) !== identity.artifactSha256) return null;
      const payload = validateNodePayload(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), { trackId: identity.trackId, nodeId: identity.nodeId, contentVersion: identity.contentVersion, contentReleaseId: manifest.contentReleaseId });
      return Object.freeze({ identity: Object.freeze({ ...identity }), payload, manifest: Object.freeze({ ...manifest }), artifactBytes: new Uint8Array(bytes) });
    } catch { return null; }
  }
  return Object.freeze({
    async writeImmutable(record) {
      const key = recordKey(record.identity);
      const finalArtifact = artifactPath(record.identity), finalManifest = manifestPath(record.identity);
      const existing = await read(record.identity);
      if (existing) return;
      const current = await activePointer(record.identity.trackId, record.identity.nodeId);
      if (current && current.retained.some((identity) => sameIdentity(identity, record.identity))) throw new Error("active_node_package_corrupt");
      await removeIfPresent(input.files, finalArtifact);
      await removeIfPresent(input.files, finalManifest);
      const stageArtifact = `staging/${key}.${input.ids.createId()}.bin`;
      const stageManifest = `staging/${key}.${input.ids.createId()}.json`;
      try {
        await input.files.write(stageArtifact, record.artifactBytes);
        const staged = await input.files.read(stageArtifact);
        if (!staged || staged.length !== record.artifactBytes.length || await contentHasher.sha256Bytes(staged) !== record.identity.artifactSha256) throw new Error("staged_node_package_corrupt");
        const manifestBytes = new TextEncoder().encode(JSON.stringify(record.manifest));
        await input.files.write(stageManifest, manifestBytes);
        const manifestRead = await input.files.read(stageManifest);
        if (!manifestRead || !sameBytes(manifestRead, manifestBytes)) throw new Error("staged_node_manifest_corrupt");
        await input.files.move(stageArtifact, finalArtifact);
        await input.files.move(stageManifest, finalManifest);
        const final = await read(record.identity);
        if (!final || !sameBytes(final.artifactBytes, record.artifactBytes)) throw new Error("final_node_package_corrupt");
      } catch (error) {
        await removeIfPresent(input.files, stageArtifact);
        await removeIfPresent(input.files, stageManifest);
        throw error;
      }
    },
    read,
    async getActive(trackId, nodeId) { return (await activePointer(trackId, nodeId))?.current ?? null; },
    async activate(trackId, nodeId, identity) {
      if (identity.trackId !== trackId || identity.nodeId !== nodeId || !(await read(identity))) throw new Error("node_package_not_verified");
      // One canonical MMKV value atomically records the current version and every identity that was previously activated.
      const key = pointerKey(trackId, nodeId), previous = input.pointers.getString(key), oldPointer = previous === undefined ? null : parseActivePointer(previous);
      if (previous !== undefined && !oldPointer) throw new Error("active_pointer_corrupt");
      const retained = new Map((oldPointer?.retained ?? []).map((entry) => [identityKey(entry), entry]));
      if (oldPointer) retained.set(identityKey(oldPointer.current), oldPointer.current);
      retained.set(identityKey(identity), Object.freeze({ ...identity }));
      const next = JSON.stringify({ schemaVersion: 1, current: identity, retained: [...retained.values()] } satisfies ActivePointer);
      try {
        input.pointers.setString(key, next);
        if (input.pointers.getString(key) !== next) throw new Error("active_pointer_readback_failed");
      } catch (error) {
        if (previous === undefined) input.pointers.remove(key); else input.pointers.setString(key, previous);
        throw error;
      }
    },
    async listActive() {
      const records: VerifiedNodePackage[] = [];
      const seen = new Set<string>();
      for (const key of input.pointers.getAllKeys().filter((value) => value.startsWith(POINTER_PREFIX))) {
        const pointer = parseActivePointer(input.pointers.getString(key));
        if (!pointer || key !== pointerKey(pointer.current.trackId, pointer.current.nodeId)) continue;
        for (const identity of pointer.retained) {
          const identityKeyValue = identityKey(identity);
          if (seen.has(identityKeyValue)) continue;
          seen.add(identityKeyValue);
          const record = await read(identity);
          if (record) records.push(record);
        }
      }
      return Object.freeze(records);
    },
  });
  async function activePointer(trackId: string, nodeId: string): Promise<ActivePointer | null> {
    const value = input.pointers.getString(pointerKey(trackId, nodeId));
    const pointer = parseActivePointer(value);
    return pointer && pointer.current.trackId === trackId && pointer.current.nodeId === nodeId ? pointer : null;
  }
}

const POINTER_PREFIX = "patternly.content-node.active.v1.";

export function createExpoNodePackageFilePort(): NodePackageFilePort {
  const fs = require("expo-file-system") as typeof import("expo-file-system");
  const root = new fs.Directory(fs.Paths.document, "patternly-content-node-packages-v1");
  root.create({ intermediates: true, idempotent: true });
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
function identityKey(identity: NodePackageIdentity): string { return JSON.stringify([identity.trackId, identity.nodeId, identity.contentVersion, identity.artifactSha256]); }
function isIdentity(value: unknown): value is NodePackageIdentity { return exactKeys(value, ["trackId", "nodeId", "contentVersion", "artifactSha256"]) && isCanonicalSafeIdentity(value.trackId) && isCanonicalSafeIdentity(value.nodeId) && isCanonicalSafeIdentity(value.contentVersion) && /^[a-f0-9]{64}$/u.test(value.artifactSha256); }
function parseActivePointer(value: string | undefined): ActivePointer | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (isIdentity(parsed)) return Object.freeze({ schemaVersion: 1, current: Object.freeze({ ...parsed }), retained: Object.freeze([Object.freeze({ ...parsed })]) });
    if (!exactKeys(parsed, ["schemaVersion", "current", "retained"]) || parsed.schemaVersion !== 1 || !isIdentity(parsed.current) || !Array.isArray(parsed.retained) || !parsed.retained.every(isIdentity) || !parsed.retained.some((entry: NodePackageIdentity) => sameIdentity(entry, parsed.current as NodePackageIdentity)) || parsed.retained.some((entry: NodePackageIdentity) => entry.trackId !== parsed.current.trackId || entry.nodeId !== parsed.current.nodeId)) return null;
    const retained = new Map<string, NodePackageIdentity>();
    for (const entry of parsed.retained) retained.set(identityKey(entry), Object.freeze({ ...entry }));
    const current = Object.freeze({ ...parsed.current });
    return Object.freeze({ schemaVersion: 1, current, retained: Object.freeze([...retained.values()]) });
  } catch { return null; }
}
function isManifest(value: unknown): value is NodePackageManifest { return exactKeys(value, ["trackId", "nodeId", "contentVersion", "artifactSha256", "packageSha256", "contentReleaseId", "minimumAppVersion", "packageSize", "artifactSize"]) && isIdentity({ trackId: value.trackId, nodeId: value.nodeId, contentVersion: value.contentVersion, artifactSha256: value.artifactSha256 }) && /^[a-f0-9]{64}$/u.test(value.packageSha256) && isCanonicalSafeIdentity(value.contentReleaseId) && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(value.minimumAppVersion) && Number.isSafeInteger(value.packageSize) && value.packageSize > 0 && value.packageSize <= MAX_PACKAGE_BYTES && Number.isSafeInteger(value.artifactSize) && value.artifactSize > 0 && value.artifactSize <= MAX_ARTIFACT_BYTES; }
function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype && Object.keys(value).sort().join("\u0000") === [...keys].sort().join("\u0000"); }
function sameIdentity(a: NodePackageIdentity, b: NodePackageIdentity): boolean { return a.trackId === b.trackId && a.nodeId === b.nodeId && a.contentVersion === b.contentVersion && a.artifactSha256 === b.artifactSha256; }
async function removeIfPresent(files: NodePackageFilePort, path: string): Promise<void> { if (await files.read(path)) await files.remove(path); }
function sameBytes(a: Uint8Array, b: Uint8Array): boolean { return a.length === b.length && a.every((value, index) => value === b[index]); }
