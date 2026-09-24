import type { StorageManifestStore } from "./encryptedStorageBootstrap";

const CONTROL_KEY = "patternly.local-logout-control.v1";
const CONTROL_VERSION = 1 as const;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PendingRevoke = Readonly<{ operationId: string; uid: string }>;
export type LocalLogoutControlSnapshot = Readonly<{
  blocked: PendingRevoke | null;
  pending: readonly PendingRevoke[];
  version: typeof CONTROL_VERSION;
}>;

export class LocalLogoutControlError extends Error {
  public constructor(public readonly code: "local_logout_control_corrupt" | "local_logout_control_unavailable" | "local_logout_control_verification_failed") {
    super(code);
    this.name = "LocalLogoutControlError";
  }
}

function fail(code: LocalLogoutControlError["code"]): never {
  throw new LocalLogoutControlError(code);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validIdentity(value: unknown): value is PendingRevoke {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "operationId,uid") return false;
  return typeof value.uid === "string" && value.uid.trim().length > 0
    && typeof value.operationId === "string" && UUID_V4_PATTERN.test(value.operationId);
}

function pairKey(value: PendingRevoke): string {
  return `${value.uid.length}:${value.uid}${value.operationId}`;
}

function comparePairs(left: PendingRevoke, right: PendingRevoke): number {
  return left.uid.localeCompare(right.uid) || left.operationId.localeCompare(right.operationId);
}

function freezePair(value: PendingRevoke): PendingRevoke {
  return Object.freeze({ uid: value.uid, operationId: value.operationId });
}

function freezeSnapshot(blocked: PendingRevoke | null, pending: readonly PendingRevoke[]): LocalLogoutControlSnapshot {
  return Object.freeze({
    blocked: blocked ? freezePair(blocked) : null,
    pending: Object.freeze(pending.map(freezePair)),
    version: CONTROL_VERSION,
  });
}

const EMPTY_SNAPSHOT = freezeSnapshot(null, []);

function parseRecord(raw: string | null): LocalLogoutControlSnapshot {
  if (raw === null) return EMPTY_SNAPSHOT;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || Object.keys(value).sort().join(",") !== "blocked,pending,version" || value.version !== CONTROL_VERSION) {
      return fail("local_logout_control_corrupt");
    }
    if (value.blocked !== null && !validIdentity(value.blocked)) return fail("local_logout_control_corrupt");
    if (!Array.isArray(value.pending) || !value.pending.every(validIdentity)) return fail("local_logout_control_corrupt");

    const pending = (value.pending as PendingRevoke[]).map(freezePair);
    const seen = new Set<string>();
    for (const pair of pending) {
      const key = pairKey(pair);
      if (seen.has(key)) return fail("local_logout_control_corrupt");
      seen.add(key);
    }
    const blocked = value.blocked === null ? null : freezePair(value.blocked as PendingRevoke);
    if (blocked && !seen.has(pairKey(blocked))) return fail("local_logout_control_corrupt");
    const canonicalPending = [...pending].sort(comparePairs);
    return freezeSnapshot(blocked, canonicalPending);
  } catch (error) {
    if (error instanceof LocalLogoutControlError) throw error;
    return fail("local_logout_control_corrupt");
  }
}

function serialize(snapshot: LocalLogoutControlSnapshot): string {
  return JSON.stringify({
    blocked: snapshot.blocked,
    pending: snapshot.pending,
    version: snapshot.version,
  });
}

let mutationQueue: Promise<void> = Promise.resolve();

function serialized<T>(work: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(work, work);
  mutationQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function readFrom(store: StorageManifestStore): Promise<LocalLogoutControlSnapshot> {
  try {
    return parseRecord(await store.get(CONTROL_KEY));
  } catch (error) {
    if (error instanceof LocalLogoutControlError) throw error;
    return fail("local_logout_control_unavailable");
  }
}

async function writeVerified(store: StorageManifestStore, snapshot: LocalLogoutControlSnapshot): Promise<LocalLogoutControlSnapshot> {
  const encoded = serialize(snapshot);
  try {
    await store.set(CONTROL_KEY, encoded);
    const raw = await store.get(CONTROL_KEY);
    if (raw !== encoded) return fail("local_logout_control_verification_failed");
    return parseRecord(raw);
  } catch (error) {
    if (error instanceof LocalLogoutControlError) throw error;
    return fail("local_logout_control_unavailable");
  }
}

export type LocalLogoutControl = Readonly<{
  read(): Promise<LocalLogoutControlSnapshot>;
  blockAndQueueRevoke(uid: string, operationId: string): Promise<LocalLogoutControlSnapshot>;
  clearBlockForAuth(authUid: string | null, operationId: string, canClear?: () => boolean): Promise<LocalLogoutControlSnapshot>;
}>;

function requireIdentity(uid: string, operationId: string): void {
  if (!uid.trim() || !UUID_V4_PATTERN.test(operationId)) fail("local_logout_control_unavailable");
}

/**
 * Durable control metadata for local logout. The module-level queue serializes
 * read/modify/write transactions across instances in this JavaScript runtime.
 */
export function createLocalLogoutControl(store: StorageManifestStore): LocalLogoutControl {
  return Object.freeze({
    read: () => serialized(() => readFrom(store)),
    blockAndQueueRevoke: (uid: string, operationId: string) => serialized(async () => {
      requireIdentity(uid, operationId);
      const current = await readFrom(store);
      const pair = freezePair({ uid, operationId });
      const pending = new Map(current.pending.map((entry) => [pairKey(entry), entry]));
      pending.set(pairKey(pair), pair);
      return writeVerified(store, freezeSnapshot(pair, [...pending.values()].sort(comparePairs)));
    }),
    clearBlockForAuth: (authUid: string | null, operationId: string, canClear: () => boolean = () => true) => serialized(async () => {
      if (!canClear()) return readFrom(store);
      if (!UUID_V4_PATTERN.test(operationId)) fail("local_logout_control_unavailable");
      const current = await readFrom(store);
      const blocked = current.blocked;
      if (!blocked || blocked.operationId !== operationId || (authUid !== null && blocked.uid !== authUid)) return current;
      return writeVerified(store, freezeSnapshot(null, current.pending));
    }),
  });
}

type NativeStorageModule = typeof import("./encryptedStorageNative");

/** Loads the existing native manifest-store adapter only when called, keeping Node imports safe. */
export function createNativeLocalLogoutControl(): LocalLogoutControl {
  const nativeStorage = require("./encryptedStorageNative") as NativeStorageModule;
  return createLocalLogoutControl(nativeStorage.createNativeEncryptedStoragePlatform().manifestStore);
}
