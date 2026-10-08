import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { ContentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { verifyNodePackage, type BinaryPackageResponse, type NodePackageHash } from "./nodeContentPackage";
import { createNodePackageStore, inspectExpoNodePackageInventory, inspectExpoNodePackageRootReadiness, type NodePackageFilePort } from "./nodePackageStorage";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

const hash: NodePackageHash = { sha256Bytes: async (bytes) => createHash("sha256").update(bytes).digest("hex") };
const TRACK = "coding-interview-dsa-problem-solving", NODE = "storage-test-node";

test("read-only Expo package-root readiness checks the fixed path without creating it", () => {
  let constructorArguments: readonly unknown[] = [];
  let createCalls = 0;
  class DirectoryFixture {
    readonly exists = false;
    constructor(...args: unknown[]) { constructorArguments = args; }
    create() { createCalls += 1; }
  }
  const fileSystem = { Paths: { document: "documents" }, Directory: DirectoryFixture } as unknown as typeof import("expo-file-system");

  assert.deepEqual(inspectExpoNodePackageRootReadiness(fileSystem), { kind: "observed", exists: false });
  assert.deepEqual(constructorArguments, ["documents", "patternly-content-node-packages-v1"]);
  assert.equal(createCalls, 0);
});

test("Q13 package receipt validates every profile pointer and hashes referenced, orphan and staging files read-only", async () => {
  const verified = await record("1.0.0");
  const artifact = verified.artifactBytes;
  const identity = verified.identity;
  const recordKey = sha256Utf8(`${identity.trackId}\u0000${identity.nodeId}\u0000${identity.contentVersion}\u0000${identity.artifactSha256}`);
  const manifest = new TextEncoder().encode(JSON.stringify(verified.manifest));
  const files = new Map<string, Uint8Array>([
    [`artifacts/${recordKey}.bin`, artifact],
    [`manifests/${recordKey}.json`, manifest],
    ["staging/interrupted.bin", new Uint8Array([1, 2, 3])],
  ]);
  class FileFixture {
    constructor(readonly path: string) {}
    get name() { return this.path.split("/").at(-1)!; }
    bytes() { return Promise.resolve(files.get(this.path)!); }
  }
  class DirectoryFixture {
    exists = true;
    constructor(...segments: string[]) { this.path = segments.length > 1 ? "" : segments[0] ?? ""; }
    readonly path: string;
    get name() { return this.path.split("/").at(-1)!; }
    list() {
      const prefix = this.path ? `${this.path}/` : "";
      const direct = new Map<string, FileFixture | DirectoryFixture>();
      for (const path of files.keys()) {
        if (!path.startsWith(prefix)) continue;
        const remainder = path.slice(prefix.length);
        const slash = remainder.indexOf("/");
        if (slash < 0) direct.set(remainder, new FileFixture(path));
        else direct.set(remainder.slice(0, slash), new DirectoryFixture(`${this.path ? `${this.path}/` : ""}${remainder.slice(0, slash)}`));
      }
      return [...direct.values()];
    }
  }
  const fileSystem = { Paths: { document: "documents" }, File: FileFixture, Directory: DirectoryFixture } as unknown as typeof import("expo-file-system");
  const pointerBytesBefore = JSON.stringify([...files].map(([path, bytes]) => [path, [...bytes]]));
  const receipt = await inspectExpoNodePackageInventory([{
    profileIdSha256: "b".repeat(64),
    entries: [{ key: `patternly.content-node.active.v1.${sha256Utf8(`${TRACK}\u0000${NODE}`)}`, value: JSON.stringify({ schemaVersion: 1, current: identity, retained: [identity] }) }],
  }], fileSystem);

  assert.equal(receipt.kind, "observed");
  assert.equal(receipt.pointerCount, 1);
  assert.equal(receipt.referencedPairCount, 1);
  assert.equal(receipt.physicalFileCount, 3);
  assert.equal(receipt.orphanFileCount, 1);
  assert.equal(receipt.stagingFileCount, 1);
  assert.equal(JSON.stringify([...files].map(([path, bytes]) => [path, [...bytes]])), pointerBytesBefore);
});

test("Q13 package receipt refuses malformed and dangling pointers without skipping them", async () => {
  const fileSystem = { Paths: { document: "documents" }, Directory: class { exists = true; list() { return []; } }, File: class {} } as unknown as typeof import("expo-file-system");
  const malformed = await inspectExpoNodePackageInventory([{ profileIdSha256: "a".repeat(64), entries: [{ key: `patternly.content-node.active.v1.${"b".repeat(64)}`, value: "not-json" }] }], fileSystem);
  const dangling = await inspectExpoNodePackageInventory([{ profileIdSha256: "a".repeat(64), entries: [{ key: `patternly.content-node.active.v1.${sha256Utf8(`${TRACK}\u0000${NODE}`)}`, value: JSON.stringify({ schemaVersion: 1, current: { trackId: TRACK, nodeId: NODE, contentVersion: "1.0.0", artifactSha256: "a".repeat(64) }, retained: [{ trackId: TRACK, nodeId: NODE, contentVersion: "1.0.0", artifactSha256: "a".repeat(64) }] }) }] }], fileSystem);
  assert.deepEqual(malformed, { kind: "unavailable", reason: "pointer_inventory_invalid" });
  assert.equal(dangling.kind, "unavailable");
  assert.equal(dangling.reason, "pointer_file_mismatch");
});

function response(version: string): BinaryPackageResponse {
  const artifact = new TextEncoder().encode(JSON.stringify({ schemaVersion: "patternly-content-node-payload-v1", trackId: TRACK, nodeId: NODE, contentVersion: version, contentReleaseId: "release-1", items: [{ questionId: `question-${version}`, trackId: TRACK, nodeId: NODE, mentalUnitId: "unit-1", prompt: "Select an option.", interaction: { type: "choice_single", scoringMethod: "exact_selected_set", options: [{ optionId: "a", text: "A" }, { optionId: "b", text: "B" }] }, answer: { type: "choice_single", optionId: "a" }, feedback: { type: "choice_single", reason: "Reason", details: {} }, difficulty: null }] }));
  const packed = gzipSync(artifact);
  return { status: 200, bytes: new Uint8Array(packed), headers: new Headers({ "content-type": "application/gzip", "content-length": String(packed.length), "x-content-package-sha256": createHash("sha256").update(packed).digest("hex"), "x-content-artifact-sha256": createHash("sha256").update(artifact).digest("hex"), "x-content-version": version, "x-content-release-id": "release-1", "x-content-minimum-app-version": "0.1.0", "x-content-artifact-size-bytes": String(artifact.length) }) };
}
function ports(failMove?: (source: string, destination: string) => boolean, failSet = () => false, failAfterSet = () => false, failReadback = () => false) {
  const values = new Map<string, Uint8Array>(), pointers = new Map<string, string>(); let idCounter = 0;
  const files: NodePackageFilePort = {
    async write(path, bytes, overwrite = false) { if (!overwrite && values.has(path)) throw new Error("exists"); values.set(path, new Uint8Array(bytes)); },
    async read(path) { const value = values.get(path); return value ? new Uint8Array(value) : null; },
    async move(source, destination, overwrite = false) { if (failMove?.(source, destination)) throw new Error("injected_move_failure"); if (!values.has(source) || (!overwrite && values.has(destination))) throw new Error("move_invalid"); values.set(destination, values.get(source)!); values.delete(source); },
    async remove(path) { values.delete(path); },
    async list(prefix) { return [...values.keys()].filter((path) => path.startsWith(prefix)); },
  };
  const pointerPort = { getString(key: string) { const value = pointers.get(key); return failReadback() && value ? `${value} ` : value; }, setString(key: string, value: string) { if (failSet()) throw new Error("injected_pointer_failure"); pointers.set(key, value); if (failAfterSet()) throw new Error("injected_pointer_failure_after_write"); }, remove(key: string) { pointers.delete(key); }, getAllKeys: () => [...pointers.keys()] };
  const ids = { createId: () => `stage-${++idCounter}` };
  const createStore = () => createNodePackageStore({ files, pointers: pointerPort, ids });
  return { store: createStore(), createStore, values, pointers, files };
}
async function record(version: string) { const result = response(version); return verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: result.bytes, headers: result.headers, appVersion: "0.1.0", hash }); }

test("filesystem adapter leaves the old MMKV pointer on move or pointer-write failure and keeps valid history", async () => {
  const failedMove = ports((_source, destination) => destination.startsWith("manifests/") && destination.includes(".") && destination.endsWith(".json"));
  const first = await record("1.0.0");
  await failedMove.store.writeImmutable(first).catch(() => undefined);
  assert.equal(await failedMove.store.getActive(TRACK, NODE), null);
  let rejectPointerWrite = false;
  const usable = ports(undefined, () => rejectPointerWrite);
  await usable.store.writeImmutable(first);
  await usable.store.activate(TRACK, NODE, first.identity);
  const second = await record("2.0.0");
  await usable.store.writeImmutable(second);
  await usable.store.activate(TRACK, NODE, second.identity);
  const restartedStore = usable.createStore();
  assert.deepEqual(await restartedStore.getActive(TRACK, NODE), second.identity);
  const restartedRecords = await restartedStore.listActive();
  assert.equal(restartedRecords.length, 2);
  const restartedOwner = new ContentPackageRuntimeOwner(() => "persisted-profile", async () => restartedStore.listActive());
  const oldRef = { trackId: TRACK, contentVersion: first.identity.contentVersion, artifactSha256: first.identity.artifactSha256, questionId: first.payload.items[0]!.questionId } as const;
  const currentRef = { trackId: TRACK, contentVersion: second.identity.contentVersion, artifactSha256: second.identity.artifactSha256, questionId: second.payload.items[0]!.questionId } as const;
  assert.equal((await restartedOwner.resolveItem(oldRef)).questionId, oldRef.questionId);
  assert.equal((await restartedOwner.resolveItem(currentRef)).questionId, currentRef.questionId);
  const third = await record("3.0.0");
  await usable.store.writeImmutable(third);
  rejectPointerWrite = true;
  await assert.rejects(usable.store.activate(TRACK, NODE, third.identity), /injected_pointer_failure/);
  assert.deepEqual(await usable.store.getActive(TRACK, NODE), second.identity);
  assert.equal((await usable.store.listActive()).length, 2);
  const afterFailureOwner = new ContentPackageRuntimeOwner(() => "persisted-profile", async () => usable.createStore().listActive());
  assert.equal((await afterFailureOwner.resolveItem(oldRef)).questionId, oldRef.questionId);
  assert.equal((await afterFailureOwner.resolveItem(currentRef)).questionId, currentRef.questionId);
  await assert.rejects(afterFailureOwner.resolveItem({ ...currentRef, contentVersion: third.identity.contentVersion, artifactSha256: third.identity.artifactSha256, questionId: third.payload.items[0]!.questionId }));
});

test("pointer activation rolls back after a write-then-throw and a mismatching read-back", async () => {
  let throwAfterWrite = false;
  let corruptNextReadback = false;
  let corruptReadbackAfterWrite = false;
  const setup = ports(undefined, () => false, () => {
    if (throwAfterWrite) { throwAfterWrite = false; return true; }
    if (corruptReadbackAfterWrite) { corruptReadbackAfterWrite = false; corruptNextReadback = true; }
    return false;
  }, () => { if (!corruptNextReadback) return false; corruptNextReadback = false; return true; });
  const first = await record("1.0.0");
  const second = await record("2.0.0");
  await setup.store.writeImmutable(first);
  await setup.store.activate(TRACK, NODE, first.identity);
  await setup.store.writeImmutable(second);
  throwAfterWrite = true;
  await assert.rejects(setup.store.activate(TRACK, NODE, second.identity), /injected_pointer_failure_after_write/);
  assert.deepEqual(await setup.store.getActive(TRACK, NODE), first.identity);
  corruptReadbackAfterWrite = true;
  await assert.rejects(setup.store.activate(TRACK, NODE, second.identity), /active_pointer_readback_failed/);
  assert.deepEqual(await setup.store.getActive(TRACK, NODE), first.identity);
  assert.equal((await setup.store.listActive()).length, 1);
});

test("retry replaces only an inactive partial final left by an interrupted file move", async () => {
  let rejectManifestMove = true;
  const setup = ports((_source, destination) => rejectManifestMove && destination.startsWith("manifests/"));
  const value = await record("3.0.0");
  await assert.rejects(setup.store.writeImmutable(value), /injected_move_failure/);
  assert.equal(await setup.store.getActive(TRACK, NODE), null);
  rejectManifestMove = false;
  await setup.store.writeImmutable(value);
  const reread = await setup.store.read(value.identity);
  assert.ok(reread);
  assert.deepEqual([...reread.artifactBytes], [...value.artifactBytes]);
  assert.equal(await setup.store.getActive(TRACK, NODE), null);
  assert.equal((await setup.store.listActive()).length, 0);
});
