import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolvePersist13Entry } from "./persist13Entry";
import {
  arePersist13PhysicalSnapshotsEqual,
  createPersist13Manifest,
  fixtureModeAllowsManifest,
  fixtureStoreIds,
  isPersist13Manifest,
  isPersist13ScenarioSidecar,
  isPersist13ControlNamespace,
  PERSIST13_FIXTURE_MANIFEST_KEY,
  PERSIST13_FIXTURE_OWNER,
  PERSIST13_SCENARIO_SIDECAR_SCHEMA,
  PERSIST13_SCENARIO_SIDECAR_KEY,
  persist13FixturePhysicalKey,
  withPersist13ManifestState,
} from "./persist13ResetFixtureProtocol";
import { createProfileScopedStorage } from "../../infrastructure/storage/profileStorageRouter";
import { STORAGE_KEYS } from "../../storage/keys";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

const runId = "2e80bf94-ec48-4c07-a026-95743fb44e1e";

test("PERSIST-13 selects the regular root only when both compiled fixture values are absent", () => {
  assert.deepEqual(resolvePersist13Entry({}), { kind: "regular" });
  assert.deepEqual(resolvePersist13Entry({ runId }), { kind: "fixture_invalid", reason: "run_id_without_mode" });
  assert.deepEqual(resolvePersist13Entry({ mode: "other", runId }), { kind: "fixture_invalid", reason: "invalid_mode" });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId: "not-a-uuid" }), { kind: "fixture_invalid", reason: "invalid_run_id" });
  assert.deepEqual(resolvePersist13Entry({ mode: "recover", runId: runId.toUpperCase() }), { kind: "fixture", mode: "recover", scenario: "reset", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId }), { kind: "fixture", mode: "seed", scenario: "reset", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "recover", runId, scenario: "journal" }), { kind: "fixture", mode: "recover", scenario: "journal", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "draft" }), { kind: "fixture", mode: "seed", scenario: "draft", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "other" }), { kind: "fixture_invalid", reason: "invalid_scenario" });
  assert.deepEqual(resolvePersist13Entry({ scenario: "journal" }), { kind: "fixture_invalid", reason: "scenario_without_mode" });
});

test("PERSIST-13 manifest binds exact run stores, state, profile and closed target lists", () => {
  const allocated = createPersist13Manifest(runId, "allocated");
  assert.deepEqual(fixtureStoreIds(runId), {
    dataStoreId: `patternly-persist13-data-${runId}`,
    controlStoreId: `patternly-persist13-control-${runId}`,
  });
  assert.equal(isPersist13Manifest(allocated, runId), true);
  assert.equal(fixtureModeAllowsManifest("seed", allocated.state), true);
  assert.equal(fixtureModeAllowsManifest("recover", allocated.state), false);

  const paused = withPersist13ManifestState(allocated, "paused", {
    targets: [{ key: "patternly:canonical:v1:training.sessions", sha256: "a".repeat(64) }],
    preserved: [{ key: "patternly:canonical:v1:settings", sha256: "b".repeat(64) }],
  });
  assert.equal(isPersist13Manifest(paused, runId), true);
  assert.equal(fixtureModeAllowsManifest("recover", paused.state), true);
  assert.equal(isPersist13Manifest(paused, "b6d6c87c-8103-4b4c-9af9-77a0d7f002bf"), false);
  assert.equal(isPersist13Manifest({ ...paused, extra: true }, runId), false);
  assert.equal(isPersist13Manifest({ ...paused, targets: [...paused.targets, paused.targets[0]] }, runId), false);
});

test("PERSIST-13 physical snapshot equality includes exact key set and raw values", () => {
  const baseline = Object.freeze([["a", "raw-envelope"], ["b", undefined]] as const);
  assert.equal(arePersist13PhysicalSnapshotsEqual(baseline, Object.freeze([["a", "raw-envelope"], ["b", undefined]] as const)), true);
  assert.equal(arePersist13PhysicalSnapshotsEqual(baseline, Object.freeze([["a", "changed"], ["b", undefined]] as const)), false);
  assert.equal(arePersist13PhysicalSnapshotsEqual(baseline, Object.freeze([["a", "raw-envelope"]] as const)), false);
  assert.equal(arePersist13PhysicalSnapshotsEqual(baseline, Object.freeze([["b", undefined], ["a", "raw-envelope"]] as const)), false);
});

test("scenario fault key is the exact modern physical key produced by the profile router", () => {
  const values = new Map<string, string>();
  const base = {
    getString(key: string) { return values.get(key); },
    setString(key: string, value: string) { values.set(key, value); },
    remove(key: string) { values.delete(key); },
    contains(key: string) { return values.has(key); },
    getAllKeys() { return [...values.keys()]; },
  };
  const profile = { id: runId, kind: "guest" as const, accountId: null };
  createProfileScopedStorage(base, profile).setString(STORAGE_KEYS.ACTIVE_JOURNAL, "test-only");
  const exact = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  assert.deepEqual([...values.keys()], [exact]);
  assert.equal(exact, `patternly:profile:v1:${runId}:${encodeURIComponent(STORAGE_KEYS.ACTIVE_JOURNAL)}`);
});

test("control namespace permits only the manifest, scenario sidecar and canonical router registry slots", () => {
  const registryA = "patternly.profile-root.v1.a";
  const registryB = "patternly.profile-root.v1.b";
  assert.equal(isPersist13ControlNamespace([PERSIST13_FIXTURE_MANIFEST_KEY, registryA], "reset"), true);
  assert.equal(isPersist13ControlNamespace([PERSIST13_FIXTURE_MANIFEST_KEY, registryA, registryB, PERSIST13_SCENARIO_SIDECAR_KEY], "journal"), true);
  assert.equal(isPersist13ControlNamespace([PERSIST13_FIXTURE_MANIFEST_KEY, PERSIST13_SCENARIO_SIDECAR_KEY, "foreign-control-key"], "journal"), false);
  assert.equal(isPersist13ControlNamespace([PERSIST13_FIXTURE_MANIFEST_KEY, PERSIST13_SCENARIO_SIDECAR_KEY], "draft"), false);
  assert.equal(isPersist13ControlNamespace([PERSIST13_FIXTURE_MANIFEST_KEY, registryA, PERSIST13_SCENARIO_SIDECAR_KEY], "reset"), false);
});

test("scenario sidecar is closed, run-bound and records only exact-key hashes", () => {
  const logicalKey = STORAGE_KEYS.ACTIVE_JOURNAL;
  const physicalKey = persist13FixturePhysicalKey(runId, logicalKey);
  const settingsKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.SETTINGS);
  const sidecar = Object.freeze({
    schema: PERSIST13_SCENARIO_SIDECAR_SCHEMA,
    owner: PERSIST13_FIXTURE_OWNER,
    runId,
    scenario: "journal" as const,
    phase: "faulted" as const,
    ...fixtureStoreIds(runId),
    fixtureProfileId: runId,
    faultLogicalKey: logicalKey,
    faultPhysicalKey: physicalKey,
    before: Object.freeze([{ key: settingsKey, sha256: sha256Utf8("settings") }]),
    after: Object.freeze([
      { key: physicalKey, sha256: sha256Utf8("journal") },
      { key: settingsKey, sha256: sha256Utf8("settings") },
    ].sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0)),
    sessionIdSha256: sha256Utf8("session-id"),
    occurrenceIdSha256: sha256Utf8("occurrence-id"),
    responseSha256: sha256Utf8("expected-response"),
    expectedAttemptSha256: sha256Utf8("whole-attempt-record"),
    expectedSessionSha256: sha256Utf8("whole-session-record"),
    expectedReviewSha256: Object.freeze([sha256Utf8("whole-review-record")]),
    baselineAttemptCount: 0,
    baselineSessionIndex: 0,
  });
  assert.equal(isPersist13ScenarioSidecar(sidecar, runId, "journal"), true);
  const { before: _before, ...missingBefore } = sidecar;
  assert.equal(isPersist13ScenarioSidecar(missingBefore, runId, "journal"), false);
  assert.equal(isPersist13ScenarioSidecar({ ...sidecar, faultPhysicalKey: `${physicalKey}:suffix` }, runId, "journal"), false);
  assert.equal(isPersist13ScenarioSidecar({ ...sidecar, sessionId: "raw-session-id" }, runId, "journal"), false);
  assert.equal(isPersist13ScenarioSidecar({ ...sidecar, expectedAttemptSha256: "raw-attempt" }, runId, "journal"), false);
  assert.equal(isPersist13ScenarioSidecar({ ...sidecar, expectedReviewSha256: ["raw-review"] }, runId, "journal"), false);
  assert.equal(isPersist13ScenarioSidecar(sidecar, "b6d6c87c-8103-4b4c-9af9-77a0d7f002bf", "journal"), false);
});

test("draft sidecar binds the expected canonical payload and codec-prepared envelope by hash", () => {
  const logicalKey = STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT;
  const physicalKey = persist13FixturePhysicalKey(runId, logicalKey);
  const unrelatedKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.SETTINGS);
  const sidecar = Object.freeze({
    schema: PERSIST13_SCENARIO_SIDECAR_SCHEMA,
    owner: PERSIST13_FIXTURE_OWNER,
    runId,
    scenario: "draft" as const,
    phase: "faulted" as const,
    ...fixtureStoreIds(runId),
    fixtureProfileId: runId,
    faultLogicalKey: logicalKey,
    faultPhysicalKey: physicalKey,
    before: Object.freeze([{ key: unrelatedKey, sha256: sha256Utf8("settings") }]),
    after: Object.freeze([
      { key: physicalKey, sha256: sha256Utf8("expected-envelope") },
      { key: unrelatedKey, sha256: sha256Utf8("settings") },
    ].sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0)),
    sessionIdSha256: sha256Utf8("session-id"),
    baselineAttemptCount: 0,
    baselineSessionIndex: 0,
    expectedDraftRevision: 2,
    expectedDraftPayloadSha256: sha256Utf8("expected-payload"),
    expectedDraftEnvelopeSha256: sha256Utf8("expected-envelope"),
  });
  assert.equal(isPersist13ScenarioSidecar(sidecar, runId, "draft"), true);
  assert.equal(isPersist13ScenarioSidecar({ ...sidecar, expectedDraftPayloadSha256: "raw-response" }, runId, "draft"), false);
  assert.equal(isPersist13ScenarioSidecar({ ...sidecar, expectedDraftEnvelopeSha256: undefined }, runId, "draft"), false);
});

test("fixture selector keeps ordinary providers behind a dynamic import boundary", () => {
  const selector = readFileSync("App.tsx", "utf8");
  const ordinaryRoot = readFileSync("src/RegularApplicationRoot.tsx", "utf8");
  assert.match(selector, /resolvePersist13Entry\(\{[\s\S]*?EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE[\s\S]*?EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID/u);
  assert.match(selector, /EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO/u);
  assert.match(selector, /require\("\.\/src\/RegularApplicationRoot"\)/u);
  assert.match(selector, /require\("\.\/src\/application\/runtimeAuditability\/Persist13ResetFixtureRoot"\)/u);
  assert.doesNotMatch(selector, /from "\.\/src\/(?:application\/account|navigation|content\/application|preferences)/u);
  assert.match(ordinaryRoot, /<ProfileStoragePreparationGate>[\s\S]*?<PatternlyAccountProvider>[\s\S]*?<ContentPreparationGate/u);
});

test("recovery baseline grants only the explicit PERSIST-13 fixture its isolated MMKV test boundary", () => {
  const checker = readFileSync("scripts/checkRecoveryBaseline.mjs", "utf8");
  assert.match(checker, /const persist13FixtureRootPath = join\(root, "src\/application\/runtimeAuditability\/Persist13ResetFixtureRoot\.tsx"\)/u);
  assert.match(checker, /const productionSourcePaths = sourcePaths\.filter\(\(path\) => path !== persist13FixtureRootPath\)/u);
  assert.match(checker, /productionMMKVConsumers\.length !== 1[\s\S]*?mmkvConsumers\.length !== 2[\s\S]*?mmkvConsumers\.includes\(persist13FixtureRootPath\)/u);
  assert.match(checker, /fixtureSource\.match\(\/createMMKV[\s\S]*?EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"/u);
  assert.match(checker, /path !== persist13FixtureRootPath/u);
});

test("fixture pauses only after the durable reset materialization and exact native postconditions", () => {
  const commit = readFileSync("src/application/learningMutations/commitMutation.ts", "utf8");
  const hook = readFileSync("src/application/runtimeAuditability/persist13ResetPauseHook.ts", "utf8");
  const fixture = readFileSync("src/application/runtimeAuditability/Persist13ResetFixtureRoot.tsx", "utf8");
  assert.match(commit, /await materializeMutation\(prepared, beforeGoalPlanWrite\);\s*await pausePersist13ResetAfterMaterialization\(prepared\.operation\);\s*await updateMutationJournalPhase\(prepared, "materialized", productionLearningDataAdmissionContext\)/u);
  assert.match(hook, /process\.env\.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"[\s\S]*?process\.env\.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed"/u);
  assert.match(fixture, /journal\?\.operation !== "reset_learning_state" \|\| journal\.status !== "journal_durable"[\s\S]*?targetEntries\.some\(\(\{ key \}\) => storage\.getString\(key\) !== undefined\)/u);
  assert.match(fixture, /await assertRecoverableManifestAuthority\(manifest\);\s*writeManifest\(withPersist13ManifestState\(manifest, "recovering"\)\)/u);
  assert.match(fixture, /manifest\.state === "paused" \|\| !areFixtureTargetsAbsent\(manifest\) \|\| !areFixturePreservedEntriesEqual\(manifest\)/u);
  assert.match(fixture, /journal\.journalId === `journal:\$\{journal\.commandIdentity\.fingerprint\}`[\s\S]*?journal\.planFingerprint[\s\S]*?sameFixtureEntries\(manifest\.targets, targets\)[\s\S]*?sameFixtureEntries\(manifest\.preserved, write\.targetPlan\.preserved\)/u);
  assert.match(fixture, /publish\(\{ result: "pending", stage: "reset_pause"[\s\S]*?return new Promise<never>\(\(\) => undefined\)/u);
  assert.match(fixture, /const first = await runProductionBootstrap\(identity\);[\s\S]*?capturePhysicalSnapshot[\s\S]*?const second = await runProductionBootstrap\(identity\);[\s\S]*?arePersist13PhysicalSnapshotsEqual/u);
  assert.match(fixture, /testID="persist13-fixture-stage"/u);
});
