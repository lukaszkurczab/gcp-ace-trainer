import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { beforeEach } from "node:test";

import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import {
  CONTENT_IDENTITY_MIGRATION_NAMESPACE,
  CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION,
  CONTENT_IDENTITY_TARGET_RUNTIME_SCHEMA_VERSION,
  ContentIdentityMigrationError,
  captureContentIdentityMigrationSnapshot,
  cleanupContentIdentityMigration,
  createContentIdentityMigrationActivation,
  createContentIdentityMigrationVerifier,
  migrateContentIdentityStorage,
  planContentIdentityMigration,
  readContentIdentityMigrationState,
  recoverContentIdentityMigration,
  type ContentIdentityMigrationManifest,
  type ContentIdentityMigrationRawRecord,
} from "./contentIdentityMigration";

/**
 * These are synthetic transaction-engine tests only. They do not prove real
 * content migration, learning identity transformation, or production cutover.
 */

const sourceKey = "patternly:canonical:v1:synthetic:source";
const secondSourceKey = "patternly:canonical:v1:synthetic:second";
const targetKey = "patternly:canonical:v1:synthetic:target";
const untouchedKey = "patternly:other:v1:untouched";

let storage: MemoryKeyValueStorage;

beforeEach(() => {
  storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
});

function raw(label: string, revision = 1): string {
  return JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision, payload: { synthetic: label } });
}

function record(key: string, value: string): ContentIdentityMigrationRawRecord {
  return { key, raw: value };
}

function install(records: readonly ContentIdentityMigrationRawRecord[], extra: readonly ContentIdentityMigrationRawRecord[] = []): void {
  for (const entry of [...records, ...extra]) storage.setString(entry.key, entry.raw);
  storage.resetCounters();
}

function verifier(name = "synthetic-verifier", result: true | false = true) {
  return createContentIdentityMigrationVerifier({
    name,
    verify: (context) => {
      assert.equal(context.schemaIdentity, "patternly:migration:content-identity:v1");
      assert.equal(context.protocolVersion, 1);
      assert.equal(context.verifierVersion, 1);
      assert.equal(context.targetManifestDigest, context.targetManifest.aggregateDigest);
      assert.equal(Object.prototype.hasOwnProperty.call(context.storage, "setString"), false);
      assert.equal(Object.prototype.hasOwnProperty.call(context.storage, "remove"), false);
      return result;
    },
  });
}

function planFor(source: readonly ContentIdentityMigrationRawRecord[], target: readonly ContentIdentityMigrationRawRecord[] = source, selectedVerifier = verifier()) {
  return planContentIdentityMigration({
    source,
    target,
    verifier: selectedVerifier,
    targetRuntimeSchemaVersion: CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION,
  });
}

function activation() {
  return createContentIdentityMigrationActivation(CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION);
}

function codeOf(error: unknown): string | undefined {
  return error instanceof ContentIdentityMigrationError ? error.code : undefined;
}

function reservedStateRaw(): string | undefined {
  return storage.getString(`${CONTENT_IDENTITY_MIGRATION_NAMESPACE}state`);
}

test("empty synthetic source commits an exact empty target and keeps the engine dormant", () => {
  const selectedVerifier = verifier();
  const migrationPlan = planFor([], [], selectedVerifier);
  const result = migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() });
  assert.equal(result.kind, "committed");
  assert.equal(result.state.phase, "committed");
  assert.equal(result.state.sourceManifest.entries.length, 0);
  assert.equal(result.cleanup.status, "complete");
  assert.deepEqual(captureContentIdentityMigrationSnapshot(storage), []);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "remove"), []);
});

test("publishes raw target bytes, verifies them, and leaves unrelated namespaces untouched", () => {
  const source = [record(sourceKey, raw("one")), record(secondSourceKey, raw("two", 2))];
  const target = [record(sourceKey, raw("one-target", 3)), record(targetKey, raw("new-target", 4))];
  install(source, [record(untouchedKey, "opaque-other-namespace")]);
  const selectedVerifier = verifier();
  const result = migrateContentIdentityStorage({ storage, plan: planFor(source, target, selectedVerifier), verifier: selectedVerifier, activation: activation() });
  assert.equal(result.state.phase, "committed");
  assert.equal(result.cleanup.status, "complete");
  assert.equal(storage.getString(sourceKey), target[0]!.raw);
  assert.equal(storage.getString(targetKey), target[1]!.raw);
  assert.equal(storage.getString(secondSourceKey), undefined);
  assert.equal(storage.getString(untouchedKey), "opaque-other-namespace");
  assert.deepEqual(captureContentIdentityMigrationSnapshot(storage), [target[0], target[1]]);
});

test("planner is pure, deterministic, sealed, and does not retain a public raw payload", () => {
  const source = [record(sourceKey, raw("one"))];
  const selectedVerifier = verifier();
  storage.setString(sourceKey, source[0]!.raw);
  storage.resetCounters();
  const first = planFor(source, [record(targetKey, raw("target"))], selectedVerifier);
  const second = planFor(source, [record(targetKey, raw("target"))], selectedVerifier);
  assert.deepEqual(first, second);
  assert.equal("source" in first, false);
  assert.equal("target" in first, false);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.sourceManifest), true);
});

test("failure during publishing leaves a recoverable phase and rollback restores exact raw bytes", () => {
  const source = [record(sourceKey, raw("original"))];
  const target = [record(targetKey, raw("published"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, target, selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: targetKey });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }), (error: unknown) => codeOf(error) === "storage_write_failed");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "publishing");
  storage.setFailurePlan(null);
  const recovery = recoverContentIdentityMigration({ storage, verifier: selectedVerifier });
  assert.equal(recovery.kind, "rolled_back");
  assert.equal(storage.getString(sourceKey), source[0]!.raw);
  assert.equal(storage.getString(targetKey), undefined);
  assert.equal(reservedStateRaw(), undefined);
});

test("rollback cleanup retries after the first backup removal fails without another canonical restore", () => {
  const source = [record(sourceKey, raw("original")), record(secondSourceKey, raw("second", 2))];
  const target = [record(targetKey, raw("published"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, target, selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: targetKey });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }));
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}backup:00000000` });
  const first = recoverContentIdentityMigration({ storage, verifier: selectedVerifier });
  assert.equal(first.kind, "rolled_back");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "rollback_verified");
  assert.equal(storage.getString(sourceKey), source[0]!.raw);
  assert.equal(storage.getString(secondSourceKey), source[1]!.raw);
  assert.equal(storage.getString(targetKey), undefined);
  storage.setFailurePlan(null);
  storage.resetCounters();
  assert.equal(recoverContentIdentityMigration({ storage, verifier: selectedVerifier }).kind, "rolled_back");
  assert.equal(readContentIdentityMigrationState(storage), null);
  assert.deepEqual(storage.operations.filter((operation) => (operation.kind === "write" || operation.kind === "remove") && operation.key.startsWith("patternly:canonical:")), []);
  assert.equal(storage.getString(sourceKey), source[0]!.raw);
  assert.equal(storage.getString(secondSourceKey), source[1]!.raw);
});

test("rollback cleanup retries after a middle backup removal fails and keeps earlier cleanup idempotent", () => {
  const thirdSourceKey = "patternly:canonical:v1:synthetic:third";
  const source = [record(sourceKey, raw("original")), record(secondSourceKey, raw("second", 2)), record(thirdSourceKey, raw("third", 3))];
  const target = [record(targetKey, raw("published"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, target, selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: targetKey });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }));
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}backup:00000001` });
  assert.equal(recoverContentIdentityMigration({ storage, verifier: selectedVerifier }).kind, "rolled_back");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "rollback_verified");
  storage.setFailurePlan(null);
  storage.resetCounters();
  assert.equal(recoverContentIdentityMigration({ storage, verifier: selectedVerifier }).kind, "rolled_back");
  assert.equal(readContentIdentityMigrationState(storage), null);
  assert.deepEqual(storage.operations.filter((operation) => (operation.kind === "write" || operation.kind === "remove") && operation.key.startsWith("patternly:canonical:")), []);
  assert.equal(storage.getString(sourceKey), source[0]!.raw);
  assert.equal(storage.getString(secondSourceKey), source[1]!.raw);
  assert.equal(storage.getString(thirdSourceKey), source[2]!.raw);
});

test("rollback cleanup retries final state removal through cleanup without canonical mutation", () => {
  const source = [record(sourceKey, raw("original"))];
  const target = [record(targetKey, raw("published"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, target, selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: targetKey });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }));
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}state` });
  assert.equal(recoverContentIdentityMigration({ storage, verifier: selectedVerifier }).kind, "rolled_back");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "rollback_verified");
  assert.deepEqual(storage.getAllKeys().filter((key) => key.startsWith(`${CONTENT_IDENTITY_MIGRATION_NAMESPACE}backup:`)), []);
  storage.setFailurePlan(null);
  storage.resetCounters();
  assert.equal(cleanupContentIdentityMigration(storage).status, "complete");
  assert.equal(readContentIdentityMigrationState(storage), null);
  assert.deepEqual(storage.operations.filter((operation) => (operation.kind === "write" || operation.kind === "remove") && operation.key.startsWith("patternly:canonical:")), []);
  assert.equal(storage.getString(sourceKey), source[0]!.raw);
  assert.equal(storage.getString(targetKey), undefined);
});

test("forged rollback_verified after partial publish blocks recover and cleanup before reserved mutation", () => {
  const source = [record(sourceKey, raw("original"))];
  const target = [record(targetKey, raw("published"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, target, selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: sourceKey });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }));
  storage.setFailurePlan(null);
  const stateKey = `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}state`;
  const forgedState = JSON.parse(storage.getString(stateKey)!) as Record<string, unknown>;
  forgedState.phase = "rollback_verified";
  storage.setString(stateKey, canonicalSerialize(forgedState));
  storage.resetCounters();
  assert.throws(() => recoverContentIdentityMigration({ storage, verifier: selectedVerifier }), (error: unknown) => codeOf(error) === "blocked_recovery");
  assert.throws(() => cleanupContentIdentityMigration(storage), (error: unknown) => codeOf(error) === "blocked_recovery");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "rollback_verified");
  assert.equal(storage.getString(sourceKey), source[0]!.raw);
  assert.equal(storage.getString(targetKey), target[0]!.raw);
  assert.ok(storage.getAllKeys().some((key) => key.startsWith(`${CONTENT_IDENTITY_MIGRATION_NAMESPACE}backup:`)));
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("target verification failure never marks committed and can be rolled back", () => {
  const source = [record(sourceKey, raw("original"))];
  const target = [record(targetKey, raw("published"))];
  install(source);
  const selectedVerifier = verifier("rejecting-verifier", false);
  const migrationPlan = planFor(source, target, selectedVerifier);
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }), (error: unknown) => codeOf(error) === "target_verification_failed");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "publishing");
  const recovery = recoverContentIdentityMigration({ storage, verifier: selectedVerifier });
  assert.equal(recovery.kind, "rolled_back");
  assert.equal(storage.getString(sourceKey), source[0]!.raw);
});

test("commit-marker failure leaves target_verified and recovery rolls back", () => {
  const source = [record(sourceKey, raw("original"))];
  const target = [record(targetKey, raw("published"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, target, selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_write_occurrence", key: `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}state`, occurrence: 4 });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }), (error: unknown) => codeOf(error) === "storage_write_failed");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "target_verified");
  storage.setFailurePlan(null);
  assert.equal(recoverContentIdentityMigration({ storage, verifier: selectedVerifier }).kind, "rolled_back");
  assert.equal(storage.getString(sourceKey), source[0]!.raw);
  assert.equal(storage.getString(targetKey), undefined);
});

test("forged, stale, and wrong-version plans or verifiers are rejected before canonical mutation", () => {
  const source = [record(sourceKey, raw("original"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, [record(targetKey, raw("target"))], selectedVerifier);
  const forgedPlan = Object.freeze({ ...migrationPlan });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: forgedPlan, verifier: selectedVerifier, activation: activation() }), (error: unknown) => codeOf(error) === "invalid_plan");
  const wrongVerifier = verifier("different-verifier");
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: wrongVerifier, activation: activation() }), (error: unknown) => codeOf(error) === "invalid_verifier");
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: { ...selectedVerifier } as never, activation: activation() }), (error: unknown) => codeOf(error) === "invalid_verifier");
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: { targetRuntimeSchemaVersion: 2 } as never }), (error: unknown) => codeOf(error) === "activation_required");
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("stale source is detected before any protocol or canonical mutation", () => {
  const source = [record(sourceKey, raw("original"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, [record(targetKey, raw("target"))], selectedVerifier);
  storage.setString(sourceKey, raw("changed", 9));
  storage.resetCounters();
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }), (error: unknown) => codeOf(error) === "stale_source");
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("corrupt state manifest blocks recovery without canonical writes or removes", () => {
  const source = [record(sourceKey, raw("original"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, [record(targetKey, raw("target"))], selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: targetKey });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }));
  storage.setFailurePlan(null);
  const stateKey = `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}state`;
  const parsed = JSON.parse(storage.getString(stateKey)!) as Record<string, unknown>;
  const manifest = parsed.sourceManifest as Record<string, unknown>;
  parsed.sourceManifest = { ...manifest, aggregateDigest: sha256Utf8(canonicalSerialize({ corrupted: true })) };
  storage.setString(stateKey, canonicalSerialize(parsed));
  storage.resetCounters();
  assert.throws(() => recoverContentIdentityMigration({ storage, verifier: selectedVerifier }), (error: unknown) => codeOf(error) === "protocol_state_invalid");
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("corrupt backup blocks recovery before canonical mutation", () => {
  const source = [record(sourceKey, raw("original"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, [record(targetKey, raw("target"))], selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: targetKey });
  assert.throws(() => migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() }));
  storage.setFailurePlan(null);
  const backupKey = `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}backup:00000000`;
  storage.setString(backupKey, "corrupted-backup");
  storage.resetCounters();
  assert.throws(() => recoverContentIdentityMigration({ storage, verifier: selectedVerifier }), (error: unknown) => codeOf(error) === "backup_incomplete");
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
});

test("committed cleanup reports an error and then completes on a retry without rollback", () => {
  const source = [record(sourceKey, raw("original"))];
  const target = [record(targetKey, raw("target"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, target, selectedVerifier);
  storage.setFailurePlan({ kind: "fail_on_key_remove", key: `${CONTENT_IDENTITY_MIGRATION_NAMESPACE}backup:00000000` });
  const first = migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() });
  assert.equal(first.state.phase, "committed");
  assert.equal(first.cleanup.status, "error");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "committed");
  assert.equal(storage.getString(targetKey), target[0]!.raw);
  storage.setFailurePlan(null);
  const second = cleanupContentIdentityMigration(storage);
  assert.equal(second.status, "complete");
  assert.equal(readContentIdentityMigrationState(storage)?.phase, "committed");
  assert.deepEqual(storage.getAllKeys().filter((key) => key.startsWith(`${CONTENT_IDENTITY_MIGRATION_NAMESPACE}backup:`)), []);
  assert.equal(cleanupContentIdentityMigration(storage).status, "complete");
});

test("committed recovery never rolls back a target and reports manual recovery on target failure", () => {
  const source = [record(sourceKey, raw("original"))];
  const target = [record(targetKey, raw("target"))];
  install(source);
  const selectedVerifier = verifier();
  const migrationPlan = planFor(source, target, selectedVerifier);
  const result = migrateContentIdentityStorage({ storage, plan: migrationPlan, verifier: selectedVerifier, activation: activation() });
  assert.equal(result.state.phase, "committed");
  storage.setString(targetKey, raw("tampered"));
  storage.resetCounters();
  assert.throws(() => recoverContentIdentityMigration({ storage, verifier: selectedVerifier }), (error: unknown) => codeOf(error) === "manual_recovery_required");
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
  assert.equal(storage.getString(targetKey), raw("tampered"));
});

test("manifest digests are semantic and deterministic while raw bytes remain opaque", () => {
  const source = [record(sourceKey, raw("one"))];
  const selectedVerifier = verifier();
  const first = planFor(source, [record(targetKey, raw("target"))], selectedVerifier);
  const second = planFor(source, [record(targetKey, raw("target"))], selectedVerifier);
  assert.equal(first.planId, second.planId);
  assert.equal(first.sourceManifest.aggregateDigest, sha256Utf8(canonicalSerialize({ schemaIdentity: "patternly:migration:content-identity:v1", entries: first.sourceManifest.entries })));
  assert.equal(Object.isFrozen(first.sourceManifest.entries), true);
  assert.equal(Object.isFrozen(first.targetManifest.entries), true);
  assert.equal(canonicalSerialize(first.sourceManifest.entries), canonicalSerialize(second.sourceManifest.entries));
});

test("legacy public entry points stay dormant: no bootstrap or barrel import exists", () => {
  const bootstrap = readFileSync("src/application/bootstrap/applicationBootstrap.ts", "utf8");
  const barrel = readFileSync("src/storage/repositories/index.ts", "utf8");
  assert.equal(bootstrap.includes("contentIdentityMigration"), false);
  assert.equal(barrel.includes("contentIdentityMigration"), false);
  const moduleSource = readFileSync("src/storage/repositories/contentIdentityMigration.ts", "utf8");
  assert.equal(moduleSource.includes("readCanonicalJson"), false);
  assert.equal(moduleSource.includes("activeArtifacts"), false);
  assert.equal(moduleSource.includes("packagePin"), false);
  assert.equal(moduleSource.includes("itemId"), false);
  assert.equal(CONTENT_IDENTITY_TARGET_RUNTIME_SCHEMA_VERSION, CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION);
});

test("read-only snapshots ignore the reserved migration namespace", () => {
  const source = [record(sourceKey, raw("one"))];
  install(source, [record(untouchedKey, "outside")]);
  storage.setString(`${CONTENT_IDENTITY_MIGRATION_NAMESPACE}foreign`, "reserved-but-not-source");
  assert.deepEqual(captureContentIdentityMigrationSnapshot(storage), source);
});

test("manifest type remains digest-only and cannot expose synthetic raw payloads", () => {
  const selectedVerifier = verifier();
  const migrationPlan = planFor([record(sourceKey, raw("one"))], [record(targetKey, raw("two"))], selectedVerifier);
  const manifest: ContentIdentityMigrationManifest = migrationPlan.targetManifest;
  assert.equal("raw" in manifest, false);
  assert.ok(manifest.aggregateDigest.length === 64);
});
