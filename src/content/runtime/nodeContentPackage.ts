import { gunzipSync } from "fflate";
import { assertValidQuestion, isCanonicalSafeIdentity, type Question } from "../canonical";
import { isRegisteredTrackId } from "../../domain/tracks/trackRegistry";

export const NODE_PACKAGE_SCHEMA = "patternly-content-node-payload-v1" as const;
export const MAX_PACKAGE_BYTES = 2 * 1024 * 1024;
export const MAX_ARTIFACT_BYTES = 8 * 1024 * 1024;
export const MINIMUM_SUPPORTED_APP_VERSION = "0.1.0";

export type NodePackageIdentity = Readonly<{ trackId: string; nodeId: string; contentVersion: string; artifactSha256: string }>;
export type NodeContentPayload = Readonly<{
  schemaVersion: typeof NODE_PACKAGE_SCHEMA;
  trackId: string;
  nodeId: string;
  contentVersion: string;
  contentReleaseId: string;
  items: readonly Question[];
}>;
export type NodePackageManifest = NodePackageIdentity & Readonly<{
  packageSha256: string;
  contentReleaseId: string;
  minimumAppVersion: string;
  packageSize: number;
  artifactSize: number;
}>;
export type VerifiedNodePackage = Readonly<{ identity: NodePackageIdentity; payload: NodeContentPayload; manifest: NodePackageManifest; artifactBytes: Uint8Array }>;

export type NodePackageFailureCode = "invalid_response" | "package_unavailable" | "package_identity_mismatch" | "package_corrupt" | "minimum_app_version" | "package_storage_failed" | "entitlement_required" | "entitlement_unavailable" | "not_found" | "authentication_required" | "app_check_unavailable" | "reauthentication_required";

export class NodePackageError extends Error {
  constructor(readonly code: NodePackageFailureCode, cause?: unknown) {
    super(code, cause === undefined ? undefined : { cause });
    this.name = "NodePackageError";
  }
}

export type NodePackageHash = Readonly<{ sha256Bytes(bytes: Uint8Array): Promise<string> }>;
export type NodePackageStore = Readonly<{
  writeImmutable(record: VerifiedNodePackage): Promise<void>;
  read(identity: NodePackageIdentity): Promise<VerifiedNodePackage | null>;
  getActive(trackId: string, nodeId: string): Promise<NodePackageIdentity | null>;
  activate(trackId: string, nodeId: string, identity: NodePackageIdentity): Promise<void>;
  listActive(): Promise<readonly VerifiedNodePackage[]>;
}>;

export type BinaryPackageResponse = Readonly<{ status: number; headers: Headers; bytes: Uint8Array; serverCode?: string }>;
export type NodePackageTransport = Readonly<{ getNodePackage(trackId: string, nodeId: string): Promise<BinaryPackageResponse> }>;

const SHA256 = /^[a-f0-9]{64}$/u;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;

export async function verifyNodePackage(input: Readonly<{ trackId: string; nodeId: string; packageBytes: Uint8Array; headers: Headers; appVersion: string; hash: NodePackageHash }>): Promise<VerifiedNodePackage> {
  try {
    const { trackId, nodeId, packageBytes, headers, hash } = input;
    if (!isRegisteredTrackId(trackId) || !isCanonicalSafeIdentity(nodeId) || packageBytes.length < 1 || packageBytes.length > MAX_PACKAGE_BYTES) throw new NodePackageError("invalid_response");
    const contentType = headers.get("content-type")?.trim().toLowerCase();
    const packageSize = decimal(headers.get("content-length"));
    const declaredArtifactSize = decimal(headers.get("x-content-artifact-size-bytes"));
    const packageSha256 = headers.get("x-content-package-sha256");
    const artifactSha256 = headers.get("x-content-artifact-sha256");
    const contentVersion = headers.get("x-content-version");
    const contentReleaseId = headers.get("x-content-release-id");
    const minimumAppVersion = headers.get("x-content-minimum-app-version");
    if (contentType !== "application/gzip" || packageSize !== packageBytes.length || packageSize > MAX_PACKAGE_BYTES || declaredArtifactSize === null || declaredArtifactSize < 1 || declaredArtifactSize > MAX_ARTIFACT_BYTES || !SHA256.test(packageSha256 ?? "") || !SHA256.test(artifactSha256 ?? "") || !isCanonicalSafeIdentity(contentVersion) || !isCanonicalSafeIdentity(contentReleaseId) || !isSemver(minimumAppVersion) || !isSemver(input.appVersion)) throw new NodePackageError("invalid_response");
    if (compareSemver(input.appVersion, minimumAppVersion) < 0) throw new NodePackageError("minimum_app_version");
    if (await hash.sha256Bytes(packageBytes) !== packageSha256) throw new NodePackageError("package_corrupt");
    const artifactBytes = boundedGunzip(packageBytes);
    if (artifactBytes.length !== declaredArtifactSize || await hash.sha256Bytes(artifactBytes) !== artifactSha256) throw new NodePackageError("package_corrupt");
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(artifactBytes);
    const parsed = JSON.parse(decoded) as unknown;
    const payload = validateNodePayload(parsed, { trackId, nodeId, contentVersion, contentReleaseId });
    const identity = Object.freeze({ trackId, nodeId, contentVersion, artifactSha256 });
    const manifest = Object.freeze({ ...identity, packageSha256, contentReleaseId, minimumAppVersion, packageSize, artifactSize: artifactBytes.length });
    return Object.freeze({ identity, payload, manifest, artifactBytes: new Uint8Array(artifactBytes) });
  } catch (error) {
    if (error instanceof NodePackageError) throw error;
    throw new NodePackageError("invalid_response", error);
  }
}

export function validateNodePayload(value: unknown, expected?: Readonly<{ trackId: string; nodeId: string; contentVersion: string; contentReleaseId: string }>): NodeContentPayload {
  if (!plain(value) || !exactKeys(value, ["schemaVersion", "trackId", "nodeId", "contentVersion", "contentReleaseId", "items"]) || value.schemaVersion !== NODE_PACKAGE_SCHEMA || !isRegisteredTrackId(value.trackId) || !isCanonicalSafeIdentity(value.nodeId) || !isCanonicalSafeIdentity(value.contentVersion) || !isCanonicalSafeIdentity(value.contentReleaseId) || !Array.isArray(value.items) || value.items.length === 0) throw new NodePackageError("invalid_response");
  if (expected && (value.trackId !== expected.trackId || value.nodeId !== expected.nodeId || value.contentVersion !== expected.contentVersion || value.contentReleaseId !== expected.contentReleaseId)) throw new NodePackageError("package_identity_mismatch");
  const ids = new Set<string>();
  for (const item of value.items) {
    assertValidQuestion(item);
    if (item.trackId !== value.trackId || item.nodeId !== value.nodeId || ids.has(item.questionId)) throw new NodePackageError("package_identity_mismatch");
    ids.add(item.questionId);
  }
  return Object.freeze({ schemaVersion: NODE_PACKAGE_SCHEMA, trackId: value.trackId, nodeId: value.nodeId, contentVersion: value.contentVersion, contentReleaseId: value.contentReleaseId, items: Object.freeze([...value.items]) });
}

export function createMemoryNodePackageStore(): NodePackageStore {
  const records = new Map<string, VerifiedNodePackage>();
  const active = new Map<string, Readonly<{ current: NodePackageIdentity; retained: ReadonlyMap<string, NodePackageIdentity> }>>();
  return Object.freeze({
    async writeImmutable(record) { const key = identityKey(record.identity); const previous = records.get(key); if (previous && !sameBytes(previous.artifactBytes, record.artifactBytes)) throw new NodePackageError("package_storage_failed"); if (!previous) records.set(key, cloneVerified(record)); },
    async read(identity) { const record = records.get(identityKey(identity)); return record ? cloneVerified(record) : null; },
    async getActive(trackId, nodeId) { const value = active.get(pointerKey(trackId, nodeId))?.current; return value ? Object.freeze({ ...value }) : null; },
    async activate(trackId, nodeId, identity) { if (identity.trackId !== trackId || identity.nodeId !== nodeId || !records.has(identityKey(identity))) throw new NodePackageError("package_storage_failed"); const previous = active.get(pointerKey(trackId, nodeId)); const retained = new Map(previous?.retained ?? []); if (previous) retained.set(identityKey(previous.current), previous.current); retained.set(identityKey(identity), Object.freeze({ ...identity })); active.set(pointerKey(trackId, nodeId), Object.freeze({ current: Object.freeze({ ...identity }), retained })); },
    async listActive() {
      const exact = new Map<string, VerifiedNodePackage>();
      for (const state of active.values()) for (const identity of state.retained.values()) {
        const record = records.get(identityKey(identity));
        if (record) exact.set(identityKey(identity), cloneVerified(record));
      }
      return Object.freeze([...exact.values()]);
    },
  });
}

export async function installNodePackage(input: Readonly<{ trackId: string; nodeId: string; appVersion: string; expectedContentVersion?: string; expectedArtifactSha256?: string; transport: NodePackageTransport; hash: NodePackageHash; store: NodePackageStore; assertActivationAllowed?: () => void; activateRuntime: (record: VerifiedNodePackage) => void }>): Promise<VerifiedNodePackage> {
  let response: BinaryPackageResponse;
  try { response = await input.transport.getNodePackage(input.trackId, input.nodeId); } catch (error) { throw mapTransportFailure(error); }
  if (response.status !== 200) throw mapPackageResponseFailure(response.status, response.serverCode);
  const verified = await verifyNodePackage({ trackId: input.trackId, nodeId: input.nodeId, packageBytes: response.bytes, headers: response.headers, appVersion: input.appVersion, hash: input.hash });
  if ((input.expectedContentVersion !== undefined && verified.identity.contentVersion !== input.expectedContentVersion) || (input.expectedArtifactSha256 !== undefined && verified.identity.artifactSha256 !== input.expectedArtifactSha256)) throw new NodePackageError("package_identity_mismatch");
  try {
    await input.store.writeImmutable(verified);
    const stored = await input.store.read(verified.identity);
    if (!stored || await input.hash.sha256Bytes(stored.artifactBytes) !== verified.manifest.artifactSha256 || !sameBytes(stored.artifactBytes, verified.artifactBytes)) throw new NodePackageError("package_storage_failed");
    input.assertActivationAllowed?.();
    await input.store.activate(input.trackId, input.nodeId, verified.identity);
    input.activateRuntime(stored);
    return stored;
  } catch (error) { throw error instanceof NodePackageError ? error : new NodePackageError("package_storage_failed", error); }
}

function mapTransportFailure(error: unknown): NodePackageError {
  if (error instanceof NodePackageError) return error;
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  if (value.code === "app_check_unavailable") return new NodePackageError("app_check_unavailable", error);
  if (value.code === "authentication_required") return new NodePackageError("authentication_required", error);
  if (value.code === "server_error" && typeof value.status === "number") return mapPackageResponseFailure(value.status, typeof value.serverCode === "string" ? value.serverCode : undefined);
  if (value.code === "request_timeout" || value.code === "transport_failed") return new NodePackageError("package_unavailable", error);
  return new NodePackageError("package_unavailable", error);
}

function mapPackageResponseFailure(status: number, serverCode?: string): NodePackageError {
  if (status === 401) {
    if (serverCode === "app_check_required" || serverCode === "app_check_invalid" || serverCode === "app_check_not_configured") return new NodePackageError("app_check_unavailable");
    if (serverCode === "authorization_generation_stale" || serverCode === "recent_reauthentication_required" || serverCode === "reauthentication_required") return new NodePackageError("reauthentication_required");
    return new NodePackageError("authentication_required");
  }
  if (status === 403 && serverCode === "entitlement_required") return new NodePackageError("entitlement_required");
  if (status === 404 && serverCode === "not_found") return new NodePackageError("not_found");
  if (status === 503 && serverCode === "entitlement_unavailable") return new NodePackageError("entitlement_unavailable");
  if (status === 503 && serverCode === "package_unavailable") return new NodePackageError("package_unavailable");
  return new NodePackageError(status >= 500 ? "package_unavailable" : "invalid_response");
}

function boundedGunzip(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 18) throw new NodePackageError("package_corrupt");
  const declared = new DataView(bytes.buffer, bytes.byteOffset + bytes.byteLength - 4, 4).getUint32(0, true);
  if (declared > MAX_ARTIFACT_BYTES) throw new NodePackageError("package_corrupt");
  const output = gunzipSync(bytes, { out: new Uint8Array(MAX_ARTIFACT_BYTES + 1) });
  if (output.length > MAX_ARTIFACT_BYTES) throw new NodePackageError("package_corrupt");
  return output;
}
function decimal(value: string | null): number | null { return value !== null && /^(0|[1-9]\d*)$/u.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null; }
function isSemver(value: string | null): value is string { return typeof value === "string" && SEMVER.test(value); }
function compareSemver(left: string, right: string): number { const a = left.split(".").map(Number), b = right.split(".").map(Number); for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i]! < b[i]! ? -1 : 1; return 0; }
function plain(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { return Object.keys(value).sort().join("\u0000") === [...keys].sort().join("\u0000"); }
function identityKey(value: NodePackageIdentity): string { return `${value.trackId}\u0000${value.nodeId}\u0000${value.contentVersion}\u0000${value.artifactSha256}`; }
function pointerKey(trackId: string, nodeId: string): string { return `${trackId}\u0000${nodeId}`; }
function sameBytes(a: Uint8Array, b: Uint8Array): boolean { return a.length === b.length && a.every((value, index) => value === b[index]); }
function cloneVerified(record: VerifiedNodePackage): VerifiedNodePackage { return Object.freeze({ ...record, identity: Object.freeze({ ...record.identity }), manifest: Object.freeze({ ...record.manifest }), payload: Object.freeze({ ...record.payload, items: Object.freeze([...record.payload.items]) }), artifactBytes: new Uint8Array(record.artifactBytes) }); }
