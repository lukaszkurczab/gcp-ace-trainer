import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { ContentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { NodePackageStorageIntegrityError, NodePackageStorageUnavailableError, verifyNodePackage, type BinaryPackageResponse, type NodePackageHash } from "./nodeContentPackage";
import { createExpoNodePackageFilePort, createNodePackageStore, inspectExpoNodePackageInventory, inspectExpoNodePackageRootReadiness, type NodePackageFilePort } from "./nodePackageStorage";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

const hash: NodePackageHash = { sha256Bytes: async (bytes) => createHash("sha256").update(bytes).digest("hex") };
const TRACK = "coding-interview-dsa-problem-solving", NODE = "storage-test-node";

test("Expo package file port observes an absent root without creating it and creates parents only for writes", async () => {
  const files = new Map<string, Uint8Array>();
  const directories = new Set<string>();
  const directoryCreateOptions: unknown[] = [];
  const fileCreateOptions: unknown[] = [];
  const moves: string[] = [];
  const pathOf = (parts: readonly (string | { path: string })[]) => parts.map((part) => typeof part === "string" ? part : part.path).join("/");
  class DirectoryFixture {
    readonly path: string;
    constructor(...parts: Array<string | { path: string }>) { this.path = pathOf(parts); }
    get name() { return this.path.split("/").at(-1)!; }
    get exists() { return directories.has(this.path); }
    create(options: unknown) { directoryCreateOptions.push(options); directories.add(this.path); }
    list() { if (!this.exists) throw new Error("missing_directory"); return []; }
  }
  class FileFixture {
    readonly path: string;
    constructor(...parts: Array<string | { path: string }>) { this.path = pathOf(parts); }
    get name() { return this.path.split("/").at(-1)!; }
    get exists() { return files.has(this.path); }
    get parentDirectory() { return new DirectoryFixture(this.path.split("/").slice(0, -1).join("/")); }
    create(options: unknown) { fileCreateOptions.push(options); files.set(this.path, new Uint8Array()); }
    write(bytes: Uint8Array) { files.set(this.path, new Uint8Array(bytes)); }
    bytes() { const value = files.get(this.path); if (!value) throw new Error("missing_file"); return Promise.resolve(new Uint8Array(value)); }
    async move(target: FileFixture) { moves.push(target.path); const value = files.get(this.path); if (!value) throw new Error("missing_source"); files.set(target.path, new Uint8Array(value)); files.delete(this.path); }
  }
  const fileSystem = { Paths: { document: "documents" }, Directory: DirectoryFixture, File: FileFixture } as unknown as typeof import("expo-file-system");
  const port = createExpoNodePackageFilePort(fileSystem);
  assert.equal(await port.read("artifacts/missing.bin"), null);
  assert.deepEqual(await port.list("artifacts/"), []);
  assert.deepEqual(directoryCreateOptions, [], "read and list do not create a missing root or child directory");
  assert.deepEqual(fileCreateOptions, []);

  await port.write("staging/package.tmp", new Uint8Array([1, 2, 3]));
  assert.deepEqual(fileCreateOptions, [{ intermediates: true, overwrite: false }]);
  await port.move("staging/package.tmp", "artifacts/package.bin");
  assert.deepEqual(directoryCreateOptions, [{ intermediates: true, idempotent: true }]);
  assert.deepEqual(moves, ["documents/patternly-content-node-packages-v1/artifacts/package.bin"]);
  assert.deepEqual(await port.read("artifacts/package.bin"), new Uint8Array([1, 2, 3]));
});

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
  return { store: createStore(), createStore, values, pointers, pointerPort, files };
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
  await assert.rejects(usable.store.activate(TRACK, NODE, third.identity), (error: unknown) => error instanceof NodePackageStorageUnavailableError && error.stage === "pointer_write" && error.effect === "not_applied");
  assert.deepEqual(await usable.store.getActive(TRACK, NODE), second.identity);
  assert.equal((await usable.store.listActive()).length, 2);
  const afterFailureOwner = new ContentPackageRuntimeOwner(() => "persisted-profile", async () => usable.createStore().listActive());
  assert.equal((await afterFailureOwner.resolveItem(oldRef)).questionId, oldRef.questionId);
  assert.equal((await afterFailureOwner.resolveItem(currentRef)).questionId, currentRef.questionId);
  await assert.rejects(afterFailureOwner.resolveItem({ ...currentRef, contentVersion: third.identity.contentVersion, artifactSha256: third.identity.artifactSha256, questionId: third.payload.items[0]!.questionId }));
});

test("pointer activation accepts an exact write-then-throw and preserves state when read-back remains uncertain", async () => {
  let throwAfterWrite = false;
  let corruptNextReadback = false;
  let corruptReadbackAfterWrite = false;
  const setup = ports(undefined, () => false, () => {
    if (throwAfterWrite) { throwAfterWrite = false; return true; }
    if (corruptReadbackAfterWrite) { corruptReadbackAfterWrite = false; corruptNextReadback = true; }
    return false;
  }, () => corruptNextReadback);
  const first = await record("1.0.0");
  const second = await record("2.0.0");
  await setup.store.writeImmutable(first);
  await setup.store.activate(TRACK, NODE, first.identity);
  await setup.store.writeImmutable(second);
  throwAfterWrite = true;
  await setup.store.activate(TRACK, NODE, second.identity);
  assert.deepEqual(await setup.store.getActive(TRACK, NODE), second.identity, "a write-then-throw with exact read-back is verified as applied");
  const third = await record("3.0.0");
  await setup.store.writeImmutable(third);
  corruptReadbackAfterWrite = true;
  await assert.rejects(setup.store.activate(TRACK, NODE, third.identity), (error: unknown) => error instanceof NodePackageStorageUnavailableError && error.stage === "pointer_readback" && error.effect === "unknown");
  corruptNextReadback = false;
  assert.deepEqual(await setup.store.getActive(TRACK, NODE), third.identity, "an uncertain read-back must not blindly roll back the current pointer");
  assert.equal((await setup.store.listActive()).length, 3);
});

test("a stale async activation cannot overwrite a concurrent exact pointer revision", async () => {
  const setup = ports();
  const first = await record("1.0.0");
  const second = await record("2.0.0");
  const concurrent = await record("3.0.0");
  await setup.store.writeImmutable(first);
  await setup.store.writeImmutable(second);
  await setup.store.writeImmutable(concurrent);
  await setup.store.activate(TRACK, NODE, first.identity);

  const firstKey = sha256Utf8(`${TRACK}\u0000${NODE}\u0000${first.identity.contentVersion}\u0000${first.identity.artifactSha256}`);
  const delayedPath = `artifacts/${firstKey}.bin`;
  const originalRead = setup.files.read.bind(setup.files);
  let releaseRead!: () => void;
  let signalReadStarted!: () => void;
  let delayNextRead = true;
  const blocked = new Promise<void>((resolve) => { releaseRead = resolve; });
  const readStarted = new Promise<void>((resolve) => { signalReadStarted = resolve; });
  setup.files.read = async (path) => {
    if (delayNextRead && path === delayedPath) {
      delayNextRead = false;
      signalReadStarted();
      await blocked;
    }
    return originalRead(path);
  };

  const staleActivation = setup.store.activate(TRACK, NODE, second.identity);
  await readStarted;
  await setup.store.activate(TRACK, NODE, concurrent.identity);
  const pointerKey = `patternly.content-node.active.v1.${sha256Utf8(`${TRACK}\u0000${NODE}`)}`;
  const concurrentPointer = setup.pointers.get(pointerKey);
  assert.ok(concurrentPointer);
  releaseRead();
  await assert.rejects(staleActivation, (error: unknown) => error instanceof NodePackageStorageUnavailableError && error.stage === "pointer_readback" && error.effect === "unknown");
  assert.equal(setup.pointers.get(pointerKey), concurrentPointer, "the stale writer leaves the exact concurrent bytes untouched");
  assert.deepEqual(await setup.store.getActive(TRACK, NODE), concurrent.identity);
  assert.deepEqual((await setup.store.listActive()).map((entry) => entry.identity), [first.identity, concurrent.identity]);
});

test("retry preserves an inactive partial final after an interrupted file move", async () => {
  const failedArtifact = ports((_source, destination) => destination.startsWith("artifacts/"));
  const artifactMoveCandidate = await record("2.0.0");
  await assert.rejects(failedArtifact.store.writeImmutable(artifactMoveCandidate), (error: unknown) => error instanceof NodePackageStorageUnavailableError && error.stage === "artifact_move");
  assert.equal(await failedArtifact.store.getActive(TRACK, NODE), null);
  assert.ok([...failedArtifact.values.keys()].some((path) => path.startsWith("staging/")), "failed artifact move retains its staged evidence");

  let rejectManifestMove = true;
  const setup = ports((_source, destination) => rejectManifestMove && destination.startsWith("manifests/"));
  rejectManifestMove = false;
  const first = await record("1.0.0");
  await setup.store.writeImmutable(first);
  await setup.store.activate(TRACK, NODE, first.identity);
  rejectManifestMove = true;
  const value = await record("3.0.0");
  await assert.rejects(setup.store.writeImmutable(value), (error: unknown) => error instanceof NodePackageStorageUnavailableError && error.stage === "manifest_move");
  assert.deepEqual(await setup.store.getActive(TRACK, NODE), first.identity);
  assert.equal((await setup.store.listActive()).length, 1);
  const beforeRetry = [...setup.values].map(([path, bytes]) => [path, [...bytes]]);
  rejectManifestMove = false;
  await assert.rejects(setup.store.writeImmutable(value), (error: unknown) => error instanceof NodePackageStorageIntegrityError && error.code === "corrupt");
  assert.deepEqual([...setup.values].map(([path, bytes]) => [path, [...bytes]]), beforeRetry, "retry must not remove/overwrite the retained partial files");
  assert.deepEqual(await setup.store.getActive(TRACK, NODE), first.identity);
  assert.equal((await setup.store.listActive()).length, 1);
});

test("runtime package hydration does not collapse a persisted malformed pointer into exact absence", async () => {
  const setup = ports();
  const verified = await record("p12-corrupt-pointer");
  await setup.store.writeImmutable(verified);
  await setup.store.activate(TRACK, NODE, verified.identity);
  const key = `patternly.content-node.active.v1.${sha256Utf8(`${TRACK}\u0000${NODE}`)}`;
  const beforeBytes = new Map([...setup.values].map(([path, bytes]) => [path, [...bytes]]));
  setup.pointers.set(key, "{stored but malformed");
  const rawPointer = setup.pointers.get(key);
  const owner = new ContentPackageRuntimeOwner(() => "p12-profile", async () => setup.createStore().listActive());

  await assert.rejects(owner.resolveExactArtifact(verified.identity), (error: unknown) =>
    error instanceof Error && error.name === "NodePackageStorageIntegrityError");

  assert.equal(setup.pointers.get(key), rawPointer, "reading corrupt inventory must not repair or remove its raw pointer");
  assert.deepEqual([...setup.values].map(([path, bytes]) => [path, [...bytes]]), [...beforeBytes]);
});

test("a pointer-referenced package missing both files is corrupt, not absent", async () => {
  const setup = ports();
  const verified = await record("p12-missing-referenced-pair");
  await setup.store.writeImmutable(verified);
  await setup.store.activate(TRACK, NODE, verified.identity);
  const recordKey = sha256Utf8(`${TRACK}\u0000${NODE}\u0000${verified.identity.contentVersion}\u0000${verified.identity.artifactSha256}`);
  await setup.files.remove(`artifacts/${recordKey}.bin`);
  await setup.files.remove(`manifests/${recordKey}.json`);

  for (const read of [
    () => setup.store.read(verified.identity),
    () => setup.store.getActive(TRACK, NODE),
    () => setup.store.listActive(),
  ]) await assert.rejects(read(), (error: unknown) => error instanceof NodePackageStorageIntegrityError && error.code === "corrupt");
});

test("persisted manifest, artifact, missing-file, and I/O faults are classified without changing raw evidence", async () => {
  const bytesSnapshot = (values: Map<string, Uint8Array>) => [...values].map(([path, bytes]) => [path, [...bytes]] as const);
  const jsonBytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
  const identityDigest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
  const storageKey = (identity: { trackId: string; nodeId: string; contentVersion: string; artifactSha256: string }) =>
    sha256Utf8(`${identity.trackId}\u0000${identity.nodeId}\u0000${identity.contentVersion}\u0000${identity.artifactSha256}`);
  const expectReadFailure = async (setup: ReturnType<typeof ports>, identity: Awaited<ReturnType<typeof record>>["identity"], code: string, stage?: string) => {
    const before = bytesSnapshot(setup.values);
    await assert.rejects(setup.store.read(identity), (error: unknown) => error instanceof NodePackageStorageIntegrityError && error.code === code && (stage === undefined || error.stage === stage));
    assert.deepEqual(bytesSnapshot(setup.values), before, "reads never repair or remove invalid stored bytes");
  };

  {
    const setup = ports();
    const verified = await record("p12-manifest-json");
    await setup.store.writeImmutable(verified);
    const key = storageKey(verified.identity);
    setup.values.set(`manifests/${key}.json`, new TextEncoder().encode("not-json"));
    await expectReadFailure(setup, verified.identity, "corrupt", "manifest_decode");
  }
  {
    const setup = ports();
    const verified = await record("p12-manifest-extra");
    await setup.store.writeImmutable(verified);
    const key = storageKey(verified.identity);
    setup.values.set(`manifests/${key}.json`, jsonBytes({ ...verified.manifest, futureField: true }));
    await expectReadFailure(setup, verified.identity, "unsupported", "manifest_decode");
  }
  {
    const setup = ports();
    const verified = await record("p12-manifest-identity");
    await setup.store.writeImmutable(verified);
    const key = storageKey(verified.identity);
    setup.values.set(`manifests/${key}.json`, jsonBytes({ ...verified.manifest, nodeId: "another-node" }));
    await expectReadFailure(setup, verified.identity, "identity_mismatch", "pointer_identity");
  }
  {
    const setup = ports();
    const verified = await record("p12-artifact-hash");
    await setup.store.writeImmutable(verified);
    const key = storageKey(verified.identity);
    const changed = new Uint8Array(verified.artifactBytes);
    changed[0] = changed[0]! ^ 1;
    setup.values.set(`artifacts/${key}.bin`, changed);
    await expectReadFailure(setup, verified.identity, "corrupt", "artifact_verify");
  }
  for (const malformedPayload of [
    (payload: Record<string, unknown>) => { payload.schemaVersion = "patternly-content-node-payload-v2"; },
    (payload: Record<string, unknown>) => { payload.trackId = "object-oriented-design-interview"; },
  ]) {
    const setup = ports();
    const verified = await record("p12-artifact-payload");
    const payload = JSON.parse(new TextDecoder().decode(verified.artifactBytes)) as Record<string, unknown>;
    malformedPayload(payload);
    const artifactBytes = jsonBytes(payload);
    const artifactSha256 = identityDigest(artifactBytes);
    const identity = { ...verified.identity, artifactSha256 };
    const manifest = { ...verified.manifest, artifactSha256, artifactSize: artifactBytes.length };
    const key = storageKey(identity);
    setup.values.set(`artifacts/${key}.bin`, artifactBytes);
    setup.values.set(`manifests/${key}.json`, jsonBytes(manifest));
    await expectReadFailure(setup, identity, payload.schemaVersion === "patternly-content-node-payload-v2" ? "unsupported" : "identity_mismatch", "artifact_verify");
  }
  {
    const setup = ports();
    const verified = await record("p12-single-file-missing");
    await setup.store.writeImmutable(verified);
    const key = storageKey(verified.identity);
    await setup.files.remove(`artifacts/${key}.bin`);
    await expectReadFailure(setup, verified.identity, "corrupt", "package_read");
  }
  {
    const setup = ports();
    const verified = await record("p12-file-read-io");
    await setup.store.writeImmutable(verified);
    const originalRead = setup.files.read.bind(setup.files);
    const key = storageKey(verified.identity);
    setup.files.read = async (path) => { if (path === `manifests/${key}.json`) throw new Error("injected_io"); return originalRead(path); };
    const before = bytesSnapshot(setup.values);
    await assert.rejects(setup.store.read(verified.identity), (error: unknown) => error instanceof NodePackageStorageUnavailableError && error.stage === "package_read");
    assert.deepEqual(bytesSnapshot(setup.values), before);
  }
  {
    const setup = ports();
    setup.pointerPort.getAllKeys = () => { throw new Error("injected_inventory_io"); };
    await assert.rejects(setup.store.listActive(), (error: unknown) => error instanceof NodePackageStorageUnavailableError && error.stage === "inventory_read");
  }
});

test("installed pointer format and identity mismatches are explicit and preserve the original bytes", async () => {
  const setup = ports();
  const verified = await record("p12-pointer-shapes");
  await setup.store.writeImmutable(verified);
  const key = `patternly.content-node.active.v1.${sha256Utf8(`${TRACK}\u0000${NODE}`)}`;
  const expectedEnvelope = JSON.stringify({ schemaVersion: 1, current: verified.identity, retained: [verified.identity] });

  setup.pointers.set(key, JSON.stringify(verified.identity));
  await assert.rejects(setup.store.getActive(TRACK, NODE), (error: unknown) => error instanceof NodePackageStorageIntegrityError && error.code === "unsupported");
  const legacyBytes = setup.pointers.get(key);
  assert.equal(legacyBytes, JSON.stringify(verified.identity));

  setup.pointers.set(key, JSON.stringify({ schemaVersion: 2, current: verified.identity, retained: [verified.identity] }));
  await assert.rejects(setup.store.listActive(), (error: unknown) => error instanceof NodePackageStorageIntegrityError && error.code === "unsupported");

  setup.pointers.set(key, expectedEnvelope);
  const alienKey = `patternly.content-node.active.v1.${sha256Utf8(`${TRACK}\u0000another-node`)}`;
  setup.pointers.set(alienKey, expectedEnvelope);
  await assert.rejects(setup.store.listActive(), (error: unknown) => error instanceof NodePackageStorageIntegrityError && error.code === "identity_mismatch");
  assert.equal(setup.pointers.get(key), expectedEnvelope);
  assert.equal(setup.pointers.get(alienKey), expectedEnvelope);
});
