import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolvePersist13Entry } from "./persist13Entry";
import {
  areHashedSnapshotsEqual,
  arePersist13PhysicalSnapshotsEqual,
  arePersist13JournalPhysicalWriteTargetsExact,
  arePersist13JournalTargetDeltasScoped,
  arePersist13PracticeUiNextSnapshotsPreserved,
  isExactPersist13SessionCollectionAdvance,
  createPersist13Manifest,
  fixtureModeAllowsManifest,
  fixtureStoreIds,
  hasPersist13PhysicalJournal,
  hashPersist13PracticeUiSessionState,
  isPersist13MaterializedJournalSidecar,
  isPersist13VerifyClearSidecar,
  isPersist13SubmitClearNextSidecar,
  isPersist13AdvanceMaterializedSidecar,
  isPersist13PracticeUiProbeSidecar,
  isPersist13PracticeUiNextObservation,
  isPersist13PracticeUiNextObservationCore,
  isPersist13PracticeUiNextSidecar,
  writeAndVerifyPersist13AdvanceMaterializedSidecar,
  writeAndVerifyPersist13PracticeUiNextSidecar,
  writeAndVerifyPersist13PracticeUiProbeSidecar,
  beginPersist13SubmitClearNextRecovery,
  writeAndVerifyPersist13SubmitClearNextPhase,
  isPersist13Manifest,
  isPersist13ScenarioSidecar,
  isPersist13ControlNamespace,
  PERSIST13_FIXTURE_MANIFEST_KEY,
  PERSIST13_FIXTURE_OWNER,
  PERSIST13_SCENARIO_SIDECAR_SCHEMA,
  PERSIST13_SCENARIO_SIDECAR_KEY,
  PERSIST13_VERIFY_CLEAR_SIDECAR_SCHEMA,
  PERSIST13_SUBMIT_CLEAR_NEXT_SIDECAR_SCHEMA,
  PERSIST13_ADVANCE_MATERIALIZED_SIDECAR_SCHEMA,
  PERSIST13_PRACTICE_UI_PROBE_SIDECAR_SCHEMA,
  PERSIST13_PRACTICE_UI_NEXT_SIDECAR_SCHEMA,
  PERSIST13_PRACTICE_UI_NEXT_OBSERVATION_SCHEMA,
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
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "journal_materialized" }), { kind: "fixture", mode: "seed", scenario: "journal_materialized", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "verify_clear" }), { kind: "fixture", mode: "seed", scenario: "verify_clear", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "submit_clear_next" }), { kind: "fixture", mode: "seed", scenario: "submit_clear_next", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "advance_materialized" }), { kind: "fixture", mode: "seed", scenario: "advance_materialized", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "practice_ui_probe" }), { kind: "fixture", mode: "seed", scenario: "practice_ui_probe", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "practice_ui_next" }), { kind: "fixture", mode: "seed", scenario: "practice_ui_next", runId });
  const observation = "{}";
  assert.deepEqual(resolvePersist13Entry({ mode: "recover", runId, scenario: "practice_ui_next", observation }), { kind: "fixture", mode: "recover", scenario: "practice_ui_next", runId, observation });
  assert.deepEqual(resolvePersist13Entry({ mode: "recover", runId, scenario: "practice_ui_next" }), { kind: "fixture", mode: "recover", scenario: "practice_ui_next", runId });
  assert.deepEqual(resolvePersist13Entry({ mode: "seed", runId, scenario: "practice_ui_next", observation }), { kind: "fixture_invalid", reason: "observation_unexpected" });
  assert.deepEqual(resolvePersist13Entry({ mode: "recover", runId, scenario: "practice_ui_probe", observation }), { kind: "fixture_invalid", reason: "observation_unexpected" });
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

test("practice UI cold-pass snapshots require exact session and timer stability", () => {
  const before = Object.freeze([
    { key: "session", sha256: sha256Utf8("session-before") },
    { key: "timer", sha256: sha256Utf8("timer-before") },
  ]);
  const afterElapsedProgress = Object.freeze([
    { key: "session", sha256: sha256Utf8("session-before") },
    { key: "timer", sha256: sha256Utf8("timer-after") },
  ]);
  assert.equal(areHashedSnapshotsEqual(before, before), true);
  assert.equal(areHashedSnapshotsEqual(before, afterElapsedProgress), false);
});

test("practice UI session stability permits only active foreground elapsed time", () => {
  const hashJson = (value: unknown) => sha256Utf8(JSON.stringify(value));
  const baseline = { id: "session", status: "active", currentItemIndex: 0, completedAt: null, activeForegroundMs: 50 };
  assert.equal(hashPersist13PracticeUiSessionState(baseline, hashJson), hashPersist13PracticeUiSessionState({ ...baseline, activeForegroundMs: 75 }, hashJson));
  assert.notEqual(hashPersist13PracticeUiSessionState(baseline, hashJson), hashPersist13PracticeUiSessionState({ ...baseline, completedAt: "unexpected" }, hashJson));
  assert.notEqual(hashPersist13PracticeUiSessionState(baseline, hashJson), hashPersist13PracticeUiSessionState({ ...baseline, status: "completed" }, hashJson));
  assert.notEqual(hashPersist13PracticeUiSessionState(baseline, hashJson), hashPersist13PracticeUiSessionState({ ...baseline, unexpectedMarker: true }, hashJson));
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

test("profile router resolves the exact logical outcome indexes and session that raw MMKV cannot read", () => {
  const values = new Map<string, string>();
  const base = {
    getString(key: string) { return values.get(key); },
    setString(key: string, value: string) { values.set(key, value); },
    remove(key: string) { values.delete(key); },
    contains(key: string) { return values.has(key); },
    getAllKeys() { return [...values.keys()]; },
  };
  const profile = { id: runId, kind: "guest" as const, accountId: null };
  const routed = createProfileScopedStorage(base, profile);
  const rows = [
    [STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, "attempt-index"],
    [STORAGE_KEYS.TRAINING_SESSION_INDEX, "session-index"],
    [STORAGE_KEYS.REVIEW_INDEX, "review-index"],
    [STORAGE_KEYS.trainingSession("fixture-session"), "session-record"],
  ] as const;
  for (const [logicalKey, value] of rows) routed.setString(logicalKey, value);
  for (const [logicalKey, expected] of rows) {
    assert.equal(base.getString(logicalKey), undefined);
    assert.equal(routed.getString(logicalKey), expected);
    assert.equal(values.get(persist13FixturePhysicalKey(runId, logicalKey)), expected);
  }
});

test("materialized recovery detects a physical journal even when a logical-key lookup misses it", () => {
  const values = new Map<string, string>();
  const base = {
    getString(key: string) { return values.get(key); },
    setString(key: string, value: string) { values.set(key, value); },
    remove(key: string) { values.delete(key); },
    contains(key: string) { return values.has(key); },
    getAllKeys() { return [...values.keys()]; },
  };
  const profile = { id: runId, kind: "guest" as const, accountId: null };
  createProfileScopedStorage(base, profile).setString(STORAGE_KEYS.ACTIVE_JOURNAL, "test-only-journal");
  assert.equal(base.getString(STORAGE_KEYS.ACTIVE_JOURNAL) ?? null, null);
  const physicalSnapshot = [...values].map(([key, value]) => [key, value] as const);
  assert.equal(hasPersist13PhysicalJournal(physicalSnapshot, runId), true);
  assert.equal(hasPersist13PhysicalJournal([], runId), false);
});

test("materialized journal guards reject missing, extra, and duplicate physical write targets", () => {
  const expected = new Set(["physical-attempt", "physical-session", "physical-review"]);
  assert.equal(arePersist13JournalPhysicalWriteTargetsExact(expected, [...expected]), true);
  assert.equal(arePersist13JournalPhysicalWriteTargetsExact(expected, ["physical-attempt", "physical-session"]), false);
  assert.equal(arePersist13JournalPhysicalWriteTargetsExact(expected, [...expected, "foreign-key"]), false);
  assert.equal(arePersist13JournalPhysicalWriteTargetsExact(expected, ["physical-attempt", "physical-session", "physical-review", "physical-review"]), false);
  assert.equal(arePersist13JournalPhysicalWriteTargetsExact(expected, [...expected, "physical-journal"]), false);
});

test("advance session-set guard permits only the current session change and rejects missing, extra, or duplicate rows", () => {
  const before = Object.freeze([{ id: "active", index: 0 }, { id: "history", index: 4 }]);
  const expected = Object.freeze({ id: "active", index: 1 });
  const equal = (left: Readonly<{ id: string; index: number }>, right: Readonly<{ id: string; index: number }>) => left.id === right.id && left.index === right.index;
  assert.equal(isExactPersist13SessionCollectionAdvance(before, [before[1]!, expected], "active", expected, equal), true);
  assert.equal(isExactPersist13SessionCollectionAdvance(before, [expected, { id: "history", index: 5 }], "active", expected, equal), false);
  assert.equal(isExactPersist13SessionCollectionAdvance(before, [expected], "active", expected, equal), false);
  assert.equal(isExactPersist13SessionCollectionAdvance(before, [expected, before[1]!, { id: "extra", index: 0 }], "active", expected, equal), false);
  assert.equal(isExactPersist13SessionCollectionAdvance(before, [expected, expected], "active", expected, equal), false);
});

test("materialized journal delta guard rejects a foreign non-target change", () => {
  const allowed = new Set(["physical-attempt", "physical-journal"]);
  const before = Object.freeze([
    { key: "physical-attempt", sha256: "a".repeat(64) },
    { key: "foreign-setting", sha256: "b".repeat(64) },
  ]);
  const expected = Object.freeze([
    { key: "physical-attempt", sha256: "c".repeat(64) },
    { key: "foreign-setting", sha256: "b".repeat(64) },
  ]);
  const foreignChanged = Object.freeze([
    { key: "physical-attempt", sha256: "c".repeat(64) },
    { key: "foreign-setting", sha256: "d".repeat(64) },
  ]);
  assert.equal(arePersist13JournalTargetDeltasScoped(before, expected, allowed), true);
  assert.equal(arePersist13JournalTargetDeltasScoped(before, foreignChanged, allowed), false);
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

test("materialized journal sidecar has its own closed schema and complete hash-only snapshots", () => {
  const attemptKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingAttempt("fixture-attempt"));
  const sessionKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingSession("fixture-session"));
  const before = Object.freeze([{ key: persist13FixturePhysicalKey(runId, STORAGE_KEYS.SETTINGS), sha256: "a".repeat(64) }]);
  const after = Object.freeze([
    ...before,
    { key: attemptKey, sha256: "b".repeat(64) },
    { key: sessionKey, sha256: "c".repeat(64) },
  ].sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0));
  const sidecar = Object.freeze({
    schema: "patternly:persist13-journal-materialized.v1" as const,
    owner: PERSIST13_FIXTURE_OWNER,
    runId,
    scenario: "journal_materialized" as const,
    phase: "materialized" as const,
    ...fixtureStoreIds(runId),
    fixtureProfileId: runId,
    before,
    after,
    sessionIdSha256: sha256Utf8("fixture-session"),
    occurrenceIdSha256: sha256Utf8("fixture-occurrence"),
    responseSha256: sha256Utf8("fixture-response"),
    expectedAttemptSha256: sha256Utf8("expected-attempt"),
    expectedSessionSha256: sha256Utf8("expected-session"),
    expectedReviewSha256: Object.freeze([sha256Utf8("expected-review")]),
    expectedReviewCount: 1,
    baselineAttemptCount: 1,
    baselineSessionIndex: 0,
  });
  assert.equal(isPersist13MaterializedJournalSidecar(sidecar, runId), true);
  assert.equal(isPersist13MaterializedJournalSidecar({ ...sidecar, extraTargetKeys: [attemptKey] }, runId), false);
  assert.equal(isPersist13MaterializedJournalSidecar({ ...sidecar, expectedReviewSha256: [] }, runId), false);
  assert.equal(isPersist13MaterializedJournalSidecar({ ...sidecar, expectedReviewCount: 1.5 }, runId), false);
  assert.equal(isPersist13MaterializedJournalSidecar({ ...sidecar, phase: "faulted" }, runId), false);
  assert.equal(isPersist13MaterializedJournalSidecar({ ...sidecar, runId: "b6d6c87c-8103-4b4c-9af9-77a0d7f002bf" }, runId), false);
});

test("verify-clear sidecar is scenario-specific, closed, run-bound and hash-only", () => {
  const journalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  const attemptKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingAttempt("fixture-attempt"));
  const sessionKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingSession("fixture-session"));
  const before = Object.freeze([{ key: persist13FixturePhysicalKey(runId, STORAGE_KEYS.SETTINGS), sha256: "a".repeat(64) }]);
  const after = Object.freeze([
    ...before,
    { key: attemptKey, sha256: "b".repeat(64) },
    { key: sessionKey, sha256: "c".repeat(64) },
    { key: journalKey, sha256: "d".repeat(64) },
  ].sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0));
  const sidecar = Object.freeze({
    schema: PERSIST13_VERIFY_CLEAR_SIDECAR_SCHEMA,
    owner: PERSIST13_FIXTURE_OWNER,
    runId,
    scenario: "verify_clear" as const,
    phase: "verified_pending_clear" as const,
    ...fixtureStoreIds(runId),
    fixtureProfileId: runId,
    before,
    after,
    sessionIdSha256: sha256Utf8("fixture-session"),
    occurrenceIdSha256: sha256Utf8("fixture-occurrence"),
    responseSha256: sha256Utf8("fixture-response"),
    expectedAttemptSha256: sha256Utf8("expected-attempt"),
    expectedSessionSha256: sha256Utf8("expected-session"),
    expectedReviewSha256: Object.freeze([sha256Utf8("expected-review")]),
    expectedReviewCount: 1,
    baselineAttemptCount: 1,
    baselineSessionIndex: 0,
  });
  assert.equal(isPersist13VerifyClearSidecar(sidecar, runId), true);
  assert.equal(isPersist13MaterializedJournalSidecar(sidecar, runId), false);
  assert.equal(isPersist13ScenarioSidecar(sidecar, runId, "journal"), false);
  assert.equal(isPersist13VerifyClearSidecar({ ...sidecar, phase: "materialized" }, runId), false);
  assert.equal(isPersist13VerifyClearSidecar({ ...sidecar, extra: true }, runId), false);
  assert.equal(isPersist13VerifyClearSidecar({ ...sidecar, sessionIdSha256: "raw-session-id" }, runId), false);
  assert.equal(isPersist13VerifyClearSidecar({ ...sidecar, after: after.filter((entry) => entry.key !== journalKey) }, runId), false);
  assert.equal(isPersist13VerifyClearSidecar(sidecar, "b6d6c87c-8103-4b4c-9af9-77a0d7f002bf"), false);
});

test("submit-clear-next sidecar is its own hash-only closed schema and cannot claim a surviving journal", () => {
  const attemptKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingAttempt("fixture-attempt"));
  const sessionKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingSession("fixture-session"));
  const reviewKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.reviewEntry("fixture-review"));
  const settingsKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.SETTINGS);
  const before = Object.freeze([{ key: settingsKey, sha256: "a".repeat(64) }]);
  const after = Object.freeze([
    { key: attemptKey, sha256: "b".repeat(64) },
    { key: reviewKey, sha256: "c".repeat(64) },
    { key: sessionKey, sha256: "d".repeat(64) },
    before[0]!,
  ].sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0));
  const sidecar = Object.freeze({
    schema: PERSIST13_SUBMIT_CLEAR_NEXT_SIDECAR_SCHEMA,
    owner: PERSIST13_FIXTURE_OWNER,
    runId,
    scenario: "submit_clear_next" as const,
    phase: "postclear" as const,
    ...fixtureStoreIds(runId),
    fixtureProfileId: runId,
    before,
    after,
    sessionIdSha256: sha256Utf8("session"),
    occurrenceIdSha256: sha256Utf8("occurrence"),
    responseSha256: sha256Utf8("response"),
    expectedAttemptSha256: sha256Utf8("attempt"),
    expectedSessionSha256: sha256Utf8("session-record"),
    sessionPinsSha256: sha256Utf8("session-pins"),
    expectedReviewSha256: Object.freeze([sha256Utf8("review")]),
    expectedReviewCount: 1,
    baselineAttemptCount: 0,
    baselineReviewCount: 0,
    baselineSessionIndex: 0,
    timerSha256: sha256Utf8("timer"),
    expectedAdvancedSessionSha256: sha256Utf8("advanced-session"),
  });
  assert.equal(isPersist13SubmitClearNextSidecar(sidecar, runId), true);
  assert.equal(isPersist13VerifyClearSidecar(sidecar, runId), false);
  assert.equal(isPersist13ScenarioSidecar(sidecar, runId, "journal"), false);
  assert.equal(isPersist13SubmitClearNextSidecar({ ...sidecar, phase: "faulted" }, runId), false);
  assert.equal(isPersist13SubmitClearNextSidecar({ ...sidecar, response: "raw answer" }, runId), false);
  assert.equal(isPersist13SubmitClearNextSidecar({ ...sidecar, runId: "b6d6c87c-8103-4b4c-9af9-77a0d7f002bf" }, runId), false);
  const journalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  assert.equal(isPersist13SubmitClearNextSidecar({ ...sidecar, after: Object.freeze([...after, { key: journalKey, sha256: "e".repeat(64) }].sort((left, right) => left.key < right.key ? -1 : 1)) }, runId), false);
  const controlValues = new Map<string, string>();
  const writableControl = { getString: (key: string) => controlValues.get(key), set: (key: string, value: string) => { controlValues.set(key, value); } };
  const barrier = Object.freeze({ ...sidecar, phase: "advance_started" as const });
  assert.equal(writeAndVerifyPersist13SubmitClearNextPhase(writableControl, barrier), true);
  assert.equal(writeAndVerifyPersist13SubmitClearNextPhase({ getString: (key) => controlValues.get(key), set() {} }, Object.freeze({ ...sidecar, phase: "advanced" as const })), false);
  let writes = 0;
  const persisted = new Map<string, string>([[PERSIST13_SCENARIO_SIDECAR_KEY, JSON.stringify(barrier)]]);
  const criticalControl = { getString: (key: string) => persisted.get(key), set: (key: string, value: string) => { writes += 1; persisted.set(key, value); } };
  let nextCalls = 0;
  for (let invocation = 0; invocation < 2; invocation += 1) {
    const current = JSON.parse(persisted.get(PERSIST13_SCENARIO_SIDECAR_KEY)!);
    if (beginPersist13SubmitClearNextRecovery(criticalControl, current, 0)) nextCalls += 1;
    assert.equal(JSON.parse(persisted.get(PERSIST13_SCENARIO_SIDECAR_KEY)!).phase, "advance_started");
  }
  assert.equal(nextCalls, 0);
  assert.equal(writes, 0);
});

test("advance-materialized sidecar is a separate closed hash-only schema bound to a physical journal", () => {
  const journalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  const settingsKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.SETTINGS);
  const before = Object.freeze([{ key: settingsKey, sha256: "a".repeat(64) }]);
  const after = Object.freeze([
    { key: journalKey, sha256: "b".repeat(64) },
    { key: settingsKey, sha256: "a".repeat(64) },
  ].sort((left, right) => left.key < right.key ? -1 : 1));
  const sidecar = Object.freeze({
    schema: PERSIST13_ADVANCE_MATERIALIZED_SIDECAR_SCHEMA, owner: PERSIST13_FIXTURE_OWNER, runId,
    scenario: "advance_materialized" as const, phase: "materialized" as const, ...fixtureStoreIds(runId),
    fixtureProfileId: runId, before, after,
    sessionIdSha256: sha256Utf8("session"), expectedSessionSha256: sha256Utf8("advanced-session"),
    expectedSessionsSha256: sha256Utf8("all-sessions"),
    sessionPinsSha256: sha256Utf8("pins"), attemptSetSha256: sha256Utf8("attempts"),
    reviewSetSha256: sha256Utf8("reviews"), timerSha256: sha256Utf8("timer"), attemptCount: 1, reviewCount: 1,
  });
  assert.equal(isPersist13AdvanceMaterializedSidecar(sidecar, runId), true);
  assert.equal(isPersist13AdvanceMaterializedSidecar({ ...sidecar, extra: true }, runId), false);
  assert.equal(isPersist13AdvanceMaterializedSidecar({ ...sidecar, phase: "faulted" }, runId), false);
  assert.equal(isPersist13AdvanceMaterializedSidecar({ ...sidecar, scenario: "verify_clear" }, runId), false);
  assert.equal(isPersist13AdvanceMaterializedSidecar({ ...sidecar, sessionIdSha256: "raw-session-id" }, runId), false);
  assert.equal(isPersist13AdvanceMaterializedSidecar({ ...sidecar, after: after.filter((entry) => entry.key !== journalKey) }, runId), false);
  assert.equal(isPersist13AdvanceMaterializedSidecar({ ...sidecar, before: Object.freeze([...before, { key: journalKey, sha256: "f".repeat(64) }].sort((left, right) => left.key < right.key ? -1 : 1)) }, runId), false);
  assert.equal(isPersist13AdvanceMaterializedSidecar({ ...sidecar, runId: "b6d6c87c-8103-4b4c-9af9-77a0d7f002bf" }, runId), false);
  const control = new Map<string, string>();
  assert.equal(writeAndVerifyPersist13AdvanceMaterializedSidecar({ getString: (key) => control.get(key), set: (key, value) => { control.set(key, value); } }, sidecar), true);
  assert.equal(writeAndVerifyPersist13AdvanceMaterializedSidecar({ getString: (key) => control.get(key), set() {} }, Object.freeze({ ...sidecar, phase: "recovering" as const })), false);
});

test("practice UI probe sidecar arms exactly once from a hash-only committed-feedback baseline", () => {
  const settingsKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.SETTINGS);
  const readySnapshot = Object.freeze([{ key: settingsKey, sha256: "a".repeat(64) }]);
  const sidecar = Object.freeze({
    schema: PERSIST13_PRACTICE_UI_PROBE_SIDECAR_SCHEMA, owner: PERSIST13_FIXTURE_OWNER, runId,
    scenario: "practice_ui_probe" as const, phase: "ready" as const, ...fixtureStoreIds(runId),
    fixtureProfileId: runId, readySnapshot,
    sessionIdSha256: sha256Utf8("session"), occurrenceIdSha256: sha256Utf8("occurrence"),
    expectedFeedbackSha256: sha256Utf8("feedback"), sessionPinsSha256: sha256Utf8("pins"),
    sessionStateSha256: sha256Utf8("session-state"),
    otherSessionsSha256: sha256Utf8("other-sessions"), attemptSetSha256: sha256Utf8("attempts"),
    reviewSetSha256: sha256Utf8("reviews"), resultSetSha256: sha256Utf8("results"),
    timerIdentitySha256: sha256Utf8("timer-identity"), sessionCount: 3, attemptCount: 2, reviewCount: 1,
    resultCount: 2, currentItemIndex: 0 as const, initialSessionElapsedMs: 0,
    initialTimerAccumulatedMs: 0, initialTimerCheckpointRevision: 1,
  });
  assert.equal(isPersist13PracticeUiProbeSidecar(sidecar, runId), true);
  assert.equal(isPersist13PracticeUiProbeSidecar({ ...sidecar, rawSessionId: "session" }, runId), false);
  assert.equal(isPersist13PracticeUiProbeSidecar({ ...sidecar, phase: "recovered" }, runId), false);
  assert.equal(isPersist13PracticeUiProbeSidecar({ ...sidecar, readySnapshot: [...readySnapshot, { key: persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL), sha256: "b".repeat(64) }] }, runId), false);
  const control = new Map<string, string>();
  const store = { getString: (key: string) => control.get(key), set: (key: string, value: string) => { control.set(key, value); } };
  assert.equal(writeAndVerifyPersist13PracticeUiProbeSidecar(store, sidecar), true);
  const armed = Object.freeze({ ...sidecar, phase: "ui_armed" as const });
  assert.equal(writeAndVerifyPersist13PracticeUiProbeSidecar(store, armed), true);
  assert.equal(writeAndVerifyPersist13PracticeUiProbeSidecar(store, armed), false);
  assert.equal(writeAndVerifyPersist13PracticeUiProbeSidecar({ ...store, set() {} }, Object.freeze({ ...armed, expectedFeedbackSha256: sha256Utf8("different") })), false);
});

test("practice UI Next sidecar arms once and its observation rejects journal or unrelated physical changes", () => {
  const physical = (logical: string) => persist13FixturePhysicalKey(runId, `patternly:canonical:v1:${logical}`);
  const sessionKey = physical("training-session:session-1");
  const timerKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
  const indexKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.TRAINING_SESSION_INDEX);
  const pointerKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
  const rows = [sessionKey, timerKey, indexKey, pointerKey].sort().map((key) => Object.freeze({ key, sha256: sha256Utf8(`raw:${key}`) }));
  const sidecar = Object.freeze({
    schema: PERSIST13_PRACTICE_UI_NEXT_SIDECAR_SCHEMA, owner: PERSIST13_FIXTURE_OWNER, runId,
    scenario: "practice_ui_next" as const, phase: "ready" as const, ...fixtureStoreIds(runId), fixtureProfileId: runId,
    readySnapshot: Object.freeze(rows), sessionIdSha256: sha256Utf8("session-1"),
    sessionPhysicalKeySha256: sha256Utf8(sessionKey), occurrenceIdSha256: sha256Utf8("occurrence-1"),
    nextOccurrenceIdSha256: sha256Utf8("occurrence-2"), expectedFeedbackSha256: sha256Utf8("feedback"),
    sessionPinsSha256: sha256Utf8("pins"), expectedSessionZeroSha256: sha256Utf8("session-0"),
    expectedSessionOneSha256: sha256Utf8("session-1"), otherSessionsSha256: sha256Utf8("other-sessions"),
    attemptSetSha256: sha256Utf8("attempts"), reviewSetSha256: sha256Utf8("reviews"), resultSetSha256: sha256Utf8("results"),
    timerIdentitySha256: sha256Utf8("timer"), sessionCount: 1, attemptCount: 1, reviewCount: 1, resultCount: 0,
    currentItemIndex: 0 as const, initialSessionElapsedMs: 0, initialTimerAccumulatedMs: 0, initialTimerCheckpointRevision: 1,
  });
  assert.equal(isPersist13PracticeUiNextSidecar(sidecar, runId), true);
  assert.equal(isPersist13PracticeUiNextSidecar({ ...sidecar, extra: true }, runId), false);
  assert.equal(isPersist13PracticeUiNextSidecar({ ...sidecar, phase: "recovered" }, runId), false);

  const observation = Object.freeze({
    schema: PERSIST13_PRACTICE_UI_NEXT_OBSERVATION_SCHEMA, owner: PERSIST13_FIXTURE_OWNER, runId,
    scenario: "practice_ui_next" as const, phase: "ui_armed" as const, sessionIdSha256: sidecar.sessionIdSha256,
    sessionPhysicalKeySha256: sidecar.sessionPhysicalKeySha256, occurrenceIdSha256: sidecar.nextOccurrenceIdSha256,
    sessionStableSha256: sidecar.expectedSessionOneSha256, otherSessionsSha256: sidecar.otherSessionsSha256,
    attemptSetSha256: sidecar.attemptSetSha256, reviewSetSha256: sidecar.reviewSetSha256, resultSetSha256: sidecar.resultSetSha256,
    timerIdentitySha256: sidecar.timerIdentitySha256, sessionCount: 1, attemptCount: 1, reviewCount: 1, resultCount: 0,
    currentItemIndex: 1 as const, projectionKind: "unanswered" as const, sessionElapsedMs: 1, timerAccumulatedMs: 1,
    timerCheckpointRevision: 2, beforeSnapshot: Object.freeze(rows), afterSnapshot: Object.freeze(rows),
  });
  assert.equal(isPersist13PracticeUiNextObservationCore(observation, runId), true);
  assert.equal(isPersist13PracticeUiNextObservation({ ...observation, authCold: true }, runId), true);
  const journal = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  const withJournal = Object.freeze([...rows, Object.freeze({ key: journal, sha256: sha256Utf8("journal") })].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)));
  assert.equal(isPersist13PracticeUiNextObservationCore({ ...observation, afterSnapshot: withJournal }, runId), false);
  const changedPointer = Object.freeze(rows.map((row) => row.key === pointerKey ? Object.freeze({ ...row, sha256: sha256Utf8("changed") }) : row));
  assert.equal(isPersist13PracticeUiNextObservationCore({ ...observation, afterSnapshot: changedPointer }, runId), false);

  const control = new Map<string, string>();
  const store = { getString: (key: string) => control.get(key), set: (key: string, value: string) => { control.set(key, value); } };
  assert.equal(writeAndVerifyPersist13PracticeUiNextSidecar(store, sidecar), true);
  const armed = Object.freeze({ ...sidecar, phase: "ui_armed" as const });
  assert.equal(writeAndVerifyPersist13PracticeUiNextSidecar(store, armed), true);
  assert.equal(writeAndVerifyPersist13PracticeUiNextSidecar(store, armed), false);
});

test("practice UI Next cold snapshot guard rejects a stable unauthorized key change and permits only session/timer progress", () => {
  const sessionKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingSession("session-1"));
  const timerKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
  const indexKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.TRAINING_SESSION_INDEX);
  const pointerKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
  const settingsKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.SETTINGS);
  const row = (key: string, value: string) => Object.freeze({ key, sha256: sha256Utf8(value) });
  const expected = Object.freeze([row(sessionKey, "session-before"), row(timerKey, "timer-before"), row(indexKey, "index"), row(pointerKey, "pointer"), row(settingsKey, "settings")]
    .sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0)));
  const sessionAndTimerAdvanced = Object.freeze([row(sessionKey, "session-after"), row(timerKey, "timer-after"), row(indexKey, "index"), row(pointerKey, "pointer"), row(settingsKey, "settings")]
    .sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0)));
  const sessionKeyHash = sha256Utf8(sessionKey);
  assert.equal(arePersist13PracticeUiNextSnapshotsPreserved(expected, sessionAndTimerAdvanced, runId, sessionKeyHash), true);

  const stableForeignChange = Object.freeze(sessionAndTimerAdvanced.map((entry) => entry.key === settingsKey ? row(settingsKey, "changed-settings") : entry));
  assert.equal(arePersist13PracticeUiNextSnapshotsPreserved(expected, stableForeignChange, runId, sessionKeyHash), false);
  assert.equal(arePersist13PracticeUiNextSnapshotsPreserved(expected, Object.freeze(sessionAndTimerAdvanced.filter((entry) => entry.key !== indexKey)), runId, sessionKeyHash), false);
  const withJournal = Object.freeze([...sessionAndTimerAdvanced, row(persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL), "journal")]
    .sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0)));
  assert.equal(arePersist13PracticeUiNextSnapshotsPreserved(expected, withJournal, runId, sessionKeyHash), false);
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


test("the raw fixture supplies its explicit timer CAS at the existing preparation boundary", () => {
  const fixture = readFileSync("src/application/runtimeAuditability/Persist13ResetFixtureRoot.tsx", "utf8");
  assert.match(fixture, /foregroundTimerCasForTests\(before, after\)[\s\S]*?applySynchronousForegroundTimerRaw\(stores\.base,\s*persist13FixturePhysicalKey\(manifest\.fixtureProfileId, STORAGE_KEYS\.ACTIVE_FOREGROUND_TIMER\), before, after\)/u);
});

test("start cutpoint seed/recover entry requires an exact stage before stores open", () => {
  const runId = "921c535a-011e-42dc-b452-bd6f912eb1a3";
  for (const startStage of ["before_start_journal_write", "after_start_journal_durable_before_materialization"]) {
    const entry = resolvePersist13Entry({ mode: "seed", scenario: "start_cutpoint", runId, startStage });
    assert.equal(entry.kind, "fixture");
    assert.equal(resolvePersist13Entry({ mode: "recover", scenario: "start_cutpoint", runId, startStage }).kind, "fixture");
  }
  assert.equal(resolvePersist13Entry({ mode: "seed", scenario: "start_cutpoint", runId }).kind, "fixture_invalid");
  assert.equal(resolvePersist13Entry({ mode: "seed", scenario: "start_cutpoint", runId, startStage: "wrong" }).kind, "fixture_invalid");
  assert.equal(resolvePersist13Entry({ mode: "seed", scenario: "journal", runId, startStage: "before_start_journal_write" }).kind, "fixture_invalid");
});
