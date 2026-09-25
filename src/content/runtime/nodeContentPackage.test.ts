import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { ContentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { createMemoryNodePackageStore, installNodePackage, NodePackageError, verifyNodePackage, type BinaryPackageResponse, type NodePackageHash } from "./nodeContentPackage";

const sha256Bytes = async (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const hash: NodePackageHash = { sha256Bytes };
const TRACK = "coding-interview-dsa-problem-solving";
const NODE = "package-test-node";
function source(version: string, questionId = `question-${version}`): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({ schemaVersion: "patternly-content-node-payload-v1", trackId: TRACK, nodeId: NODE, contentVersion: version, contentReleaseId: "fixture-release-1", items: [{ questionId, trackId: TRACK, nodeId: NODE, mentalUnitId: "mental-unit-1", prompt: "Choose the safe option.", interaction: { type: "choice_single", scoringMethod: "exact_selected_set", options: [{ optionId: "yes", text: "Yes" }, { optionId: "no", text: "No" }] }, answer: { type: "choice_single", optionId: "yes" }, feedback: { type: "choice_single", reason: "The contract defines the accepted result.", details: { rule: "safe" } }, difficulty: null }] }));
}
function response(artifact: Uint8Array, overrides: Record<string, string> = {}): BinaryPackageResponse {
  const compressed = gzipSync(artifact);
  const payload = JSON.parse(new TextDecoder().decode(artifact)) as { contentVersion: string };
  const headers = new Headers({
    "content-type": "application/gzip",
    "content-length": String(compressed.length),
    "x-content-package-sha256": createHash("sha256").update(compressed).digest("hex"),
    "x-content-artifact-sha256": createHash("sha256").update(artifact).digest("hex"),
    "x-content-version": payload.contentVersion,
    "x-content-release-id": "fixture-release-1",
    "x-content-minimum-app-version": "0.1.0",
    "x-content-artifact-size-bytes": String(artifact.length),
    ...overrides,
  });
  return { status: 200, headers, bytes: new Uint8Array(compressed) };
}

test("node package verifier enforces exact transport headers, hashes, schema and app minimum", async () => {
  const artifact = source("1.0.0");
  const good = response(artifact);
  const verified = await verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: good.bytes, headers: good.headers, appVersion: "0.1.0", hash });
  assert.equal(verified.payload.items.length, 1);
  const normalizedType = response(artifact, { "content-type": " Application/GZip " });
  await verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: normalizedType.bytes, headers: normalizedType.headers, appVersion: "0.1.0", hash });
  const badHeaders: readonly (readonly [string, string])[] = [["content-type", "application/gzip; charset=utf-8"], ["content-length", "1"], ["x-content-package-sha256", "f".repeat(64)], ["x-content-version", "2.0.0"]];
  for (const [key, value] of badHeaders) {
    const bad = response(artifact, { [key]: value });
    await assert.rejects(verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: bad.bytes, headers: bad.headers, appVersion: "0.1.0", hash }), NodePackageError);
  }
  await assert.rejects(verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: good.bytes, headers: good.headers, appVersion: "0.0.9", hash }), (error: unknown) => error instanceof NodePackageError && error.code === "minimum_app_version");
  const foreign = response(new TextEncoder().encode(JSON.stringify({ ...JSON.parse(new TextDecoder().decode(artifact)), nodeId: "other-node" })));
  await assert.rejects(verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: foreign.bytes, headers: foreign.headers, appVersion: "0.1.0", hash }), (error: unknown) => error instanceof NodePackageError && error.code === "package_identity_mismatch");
  const invalidMode = response(new TextEncoder().encode(JSON.stringify({ ...JSON.parse(new TextDecoder().decode(artifact)), modes: [] })));
  await assert.rejects(verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: invalidMode.bytes, headers: invalidMode.headers, appVersion: "0.1.0", hash }), NodePackageError);
});

test("install keeps old exact package resolvable after new activation and rolls back on failed reread or activation", async () => {
  const store = createMemoryNodePackageStore();
  const installed: string[] = [];
  const runtimeOwner = new ContentPackageRuntimeOwner(() => "profile-test", () => store.listActive());
  const activateRuntime = (record: Awaited<ReturnType<typeof verifyNodePackage>>) => { runtimeOwner.registerInstalledNodePackage(record, "profile-test"); installed.push(record.identity.contentVersion); };
  const install = (version: string) => installNodePackage({ trackId: TRACK, nodeId: NODE, appVersion: "0.1.0", transport: { getNodePackage: async () => response(source(version)) }, hash, store, activateRuntime });
  const first = await install("1.0.0");
  const oldRef = { trackId: TRACK, contentVersion: first.identity.contentVersion, artifactSha256: first.identity.artifactSha256, questionId: first.payload.items[0]!.questionId } as const;
  const second = await install("2.0.0");
  assert.deepEqual(await store.getActive(TRACK, NODE), second.identity);
  assert.equal((await runtimeOwner.resolveItem(oldRef)).questionId, oldRef.questionId);
  const newRef = { trackId: TRACK, contentVersion: second.identity.contentVersion, artifactSha256: second.identity.artifactSha256, questionId: second.payload.items[0]!.questionId } as const;
  assert.equal((await store.listActive()).length, 2);
  const orphanResponse = response(source("3.0.0"));
  const orphan = await verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: orphanResponse.bytes, headers: orphanResponse.headers, appVersion: "0.1.0", hash });
  await store.writeImmutable(orphan);
  assert.equal((await store.listActive()).length, 2);
  const failedActivationResponse = response(source("4.0.0"));
  const failedActivation = await verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: failedActivationResponse.bytes, headers: failedActivationResponse.headers, appVersion: "0.1.0", hash });
  const refusingStore = { ...store, async activate() { throw new Error("injected_pointer_failure"); } };
  await assert.rejects(installNodePackage({ trackId: TRACK, nodeId: NODE, appVersion: "0.1.0", transport: { getNodePackage: async () => failedActivationResponse }, hash, store: refusingStore, activateRuntime }));
  assert.equal((await store.listActive()).length, 2);
  const restartedOwner = new ContentPackageRuntimeOwner(() => "profile-test", () => store.listActive());
  assert.equal((await restartedOwner.resolveItem(oldRef)).questionId, oldRef.questionId);
  assert.equal((await restartedOwner.resolveItem(newRef)).questionId, newRef.questionId);
  await assert.rejects(restartedOwner.resolveItem({ ...newRef, contentVersion: orphan.identity.contentVersion, artifactSha256: orphan.identity.artifactSha256, questionId: orphan.payload.items[0]!.questionId }));
  await assert.rejects(restartedOwner.resolveItem({ ...newRef, contentVersion: failedActivation.identity.contentVersion, artifactSha256: failedActivation.identity.artifactSha256, questionId: failedActivation.payload.items[0]!.questionId }));
  const before = await store.getActive(TRACK, NODE);
  const originalRead = store.read;
  const corruptingStore = { ...store, async read(identity: Parameters<typeof originalRead>[0]) { const value = await originalRead(identity); return value ? { ...value, artifactBytes: new Uint8Array([0]) } : null; } };
  await assert.rejects(installNodePackage({ trackId: TRACK, nodeId: NODE, appVersion: "0.1.0", transport: { getNodePackage: async () => response(source("3.0.0")) }, hash, store: corruptingStore, activateRuntime }), (error: unknown) => error instanceof NodePackageError && error.code === "package_storage_failed");
  assert.deepEqual(await store.getActive(TRACK, NODE), before);
  assert.deepEqual(installed, ["1.0.0", "2.0.0"]);
});

test("installed exact cache is isolated across profile changes and lazily rehydrates on return", async () => {
  let scope: string | null = "profile-a";
  let transitionActive = false;
  const recordsByScope = new Map<string, Awaited<ReturnType<typeof verifyNodePackage>>[]>([["profile-a", []], ["profile-b", []]]);
  const owner = new ContentPackageRuntimeOwner(() => transitionActive ? null : scope, async (scopeKey) => recordsByScope.get(scopeKey) ?? []);
  const installFor = async (version: string, scopeKey: string) => {
    const store = createMemoryNodePackageStore();
    const installed = await installNodePackage({
      trackId: TRACK,
      nodeId: NODE,
      appVersion: "0.1.0",
      transport: { getNodePackage: async () => response(source(version)) },
      hash,
      store,
      activateRuntime: (record) => { recordsByScope.get(scopeKey)!.push(record); owner.registerInstalledNodePackage(record, scopeKey); },
    });
    return { ...installed, ref: { trackId: TRACK, contentVersion: installed.identity.contentVersion, artifactSha256: installed.identity.artifactSha256, questionId: installed.payload.items[0]!.questionId } as const };
  };
  const installedA = await installFor("profile-a-1.0.0", "profile-a");
  assert.equal((await owner.resolveItem(installedA.ref)).questionId, installedA.ref.questionId);
  transitionActive = true;
  await assert.rejects(owner.resolveItem(installedA.ref));
  scope = "profile-b";
  transitionActive = false;
  const installedB = await installFor("profile-b-1.0.0", "profile-b");
  assert.equal((await owner.resolveItem(installedB.ref)).questionId, installedB.ref.questionId);
  scope = "profile-a";
  assert.equal((await owner.resolveItem(installedA.ref)).questionId, installedA.ref.questionId);
  await assert.rejects(owner.resolveItem(installedB.ref));
});

test("stale profile hydration cannot register records after an in-flight profile switch", async () => {
  let scope: string | null = "profile-a";
  let notifyLoadStarted!: () => void;
  const loadStarted = new Promise<void>((resolve) => { notifyLoadStarted = resolve; });
  let finishFirstLoad!: (records: readonly Awaited<ReturnType<typeof verifyNodePackage>>[]) => void;
  const firstLoad = new Promise<readonly Awaited<ReturnType<typeof verifyNodePackage>>[]>((resolve) => { finishFirstLoad = resolve; });
  let loadCount = 0;
  const result = response(source("profile-a-race"));
  const installed = await verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: result.bytes, headers: result.headers, appVersion: "0.1.0", hash });
  const ref = { trackId: TRACK, contentVersion: installed.identity.contentVersion, artifactSha256: installed.identity.artifactSha256, questionId: installed.payload.items[0]!.questionId } as const;
  const owner = new ContentPackageRuntimeOwner(() => scope, async (scopeKey) => {
    loadCount += 1;
    if (scopeKey !== "profile-a") return [];
    if (loadCount === 1) { notifyLoadStarted(); return firstLoad; }
    return [installed];
  });
  const firstResolution = owner.resolveItem(ref);
  await loadStarted;
  scope = "profile-b";
  finishFirstLoad([installed]);
  await assert.rejects(firstResolution);
  scope = "profile-a";
  assert.equal((await owner.resolveItem(ref)).questionId, ref.questionId);
  assert.equal(loadCount, 2);
});

test("package hash and gzip output size reject corrupt, oversized, and truncated packages", async () => {
  const good = response(source("1.0.0"));
  const changed = new Uint8Array(good.bytes); const changedByteIndex = changed.length - 5; changed[changedByteIndex] = changed[changedByteIndex]! ^ 1;
  await assert.rejects(verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: changed, headers: good.headers, appVersion: "0.1.0", hash }), NodePackageError);
  const wrongSize = response(source("1.0.0"), { "x-content-artifact-size-bytes": "8388609" });
  await assert.rejects(verifyNodePackage({ trackId: TRACK, nodeId: NODE, packageBytes: wrongSize.bytes, headers: wrongSize.headers, appVersion: "0.1.0", hash }), NodePackageError);
});

test("404 and interrupted downloads do not replace an active package", async () => {
  const store = createMemoryNodePackageStore();
  const install = (transport: { getNodePackage: (trackId: string, nodeId: string) => Promise<BinaryPackageResponse> }) => installNodePackage({ trackId: TRACK, nodeId: NODE, appVersion: "0.1.0", transport, hash, store, activateRuntime: () => {} });
  const active = await install({ getNodePackage: async () => response(source("1.0.0")) });
  const notFound = response(source("2.0.0"));
  await assert.rejects(install({ getNodePackage: async () => ({ ...notFound, status: 404 }) }), (error: unknown) => error instanceof NodePackageError && error.code === "invalid_response");
  await assert.rejects(install({ getNodePackage: async () => { throw new Error("interrupted"); } }), (error: unknown) => error instanceof NodePackageError && error.code === "package_unavailable");
  assert.deepEqual(await store.getActive(TRACK, NODE), active.identity);
  assert.equal((await store.listActive()).length, 1);
});
