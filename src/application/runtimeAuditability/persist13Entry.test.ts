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
  withPersist13ManifestState,
} from "./persist13ResetFixtureProtocol";

const runId = "2e80bf94-ec48-4c07-a026-95743fb44e1e";

test("PERSIST-13 selects the regular root only when both compiled fixture values are absent", () => {
  assert.deepEqual(resolvePersist13Entry({}), { kind: "regular" });
  assert.deepEqual(resolvePersist13Entry({ runId }), { kind: "fixture_invalid", reason: "run_id_without_mode" });
  assert.deepEqual(resolvePersist13Entry({ mode: "other", runId }), { kind: "fixture_invalid", reason: "invalid_mode" });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId: "not-a-uuid" }), { kind: "fixture_invalid", reason: "invalid_run_id" });
  assert.deepEqual(resolvePersist13Entry({ mode: "recover", runId: runId.toUpperCase() }), { kind: "fixture", mode: "recover", runId });
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

test("fixture selector keeps ordinary providers behind a dynamic import boundary", () => {
  const selector = readFileSync("App.tsx", "utf8");
  const ordinaryRoot = readFileSync("src/RegularApplicationRoot.tsx", "utf8");
  assert.match(selector, /resolvePersist13Entry\(\{[\s\S]*?EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE[\s\S]*?EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID/u);
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
  assert.match(commit, /await materializeMutation\(prepared, beforeGoalPlanWrite\);\s*await pausePersist13ResetAfterMaterialization\(prepared\.operation\);\s*await updateMutationJournalPhase\(prepared, "materialized"\)/u);
  assert.match(hook, /process\.env\.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"[\s\S]*?process\.env\.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed"/u);
  assert.match(fixture, /journal\?\.operation !== "reset_learning_state" \|\| journal\.status !== "journal_durable"[\s\S]*?targetEntries\.some\(\(\{ key \}\) => storage\.getString\(key\) !== undefined\)/u);
  assert.match(fixture, /await assertRecoverableManifestAuthority\(manifest\);\s*writeManifest\(withPersist13ManifestState\(manifest, "recovering"\)\)/u);
  assert.match(fixture, /manifest\.state === "paused" \|\| !areFixtureTargetsAbsent\(manifest\) \|\| !areFixturePreservedEntriesEqual\(manifest\)/u);
  assert.match(fixture, /journal\.journalId === `journal:\$\{journal\.commandIdentity\.fingerprint\}`[\s\S]*?journal\.planFingerprint[\s\S]*?sameFixtureEntries\(manifest\.targets, targets\)[\s\S]*?sameFixtureEntries\(manifest\.preserved, write\.targetPlan\.preserved\)/u);
  assert.match(fixture, /publish\(\{ result: "pending", stage: "reset_pause"[\s\S]*?return new Promise<never>\(\(\) => undefined\)/u);
  assert.match(fixture, /const first = await runProductionBootstrap\(identity\);[\s\S]*?capturePhysicalSnapshot[\s\S]*?const second = await runProductionBootstrap\(identity\);[\s\S]*?arePersist13PhysicalSnapshotsEqual/u);
  assert.match(fixture, /testID="persist13-fixture-stage"/u);
});
