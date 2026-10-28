import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createPersist13FixtureEnvironment, parsePersist13FixtureArgs, PERSIST13_FIXTURE_PORT, readPracticeUiNextObservationInput } from "./runPersist13Fixture.mjs";
import { outputPathForRun } from "./qa/readPersist13UiNextState.mjs";

const runId = "2e80bf94-ec48-4c07-a026-95743fb44e1e";
const smokeProfile = `EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY=test-api-key
EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID=test-app-id
EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN=patternly-app-sandbox.firebaseapp.com
EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID=patternly-app-sandbox
EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID=test-android-client
EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID=test-ios-client
EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID=test-web-client
EXPO_PUBLIC_PATTERNLY_BACKEND_E2E=true
EXPO_PUBLIC_PATTERNLY_API_ORIGIN=http://127.0.0.1:8080
EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN=http://127.0.0.1:9099
PATTERNLY_RUNTIME_MODE=smoke
EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE=smoke`;

test("fixture launcher accepts only closed scenario/mode and a UUIDv4 run", () => {
  assert.deepEqual(parsePersist13FixtureArgs(["journal", "seed", runId.toUpperCase()]), { scenario: "journal", mode: "seed", runId });
  assert.deepEqual(parsePersist13FixtureArgs(["journal_materialized", "recover", runId]), { scenario: "journal_materialized", mode: "recover", runId });
  assert.deepEqual(parsePersist13FixtureArgs(["verify_clear", "seed", runId]), { scenario: "verify_clear", mode: "seed", runId });
  assert.deepEqual(parsePersist13FixtureArgs(["submit_clear_next", "seed", runId]), { scenario: "submit_clear_next", mode: "seed", runId });
  assert.deepEqual(parsePersist13FixtureArgs(["advance_materialized", "recover", runId]), { scenario: "advance_materialized", mode: "recover", runId });
  assert.deepEqual(parsePersist13FixtureArgs(["practice_ui_probe", "seed", runId]), { scenario: "practice_ui_probe", mode: "seed", runId });
  assert.deepEqual(parsePersist13FixtureArgs(["practice_ui_next", "recover", runId]), { scenario: "practice_ui_next", mode: "recover", runId });
  assert.deepEqual(parsePersist13FixtureArgs(["practice_ui_next", "recover", runId, "--ui-observation", `.agent/private/persist13-ui-next-state/next-observation-${runId}.json`]), {
    scenario: "practice_ui_next", mode: "recover", runId, observationPath: `.agent/private/persist13-ui-next-state/next-observation-${runId}.json`,
  });
  for (const args of [["other", "seed", runId], ["draft", "other", runId], ["reset", "recover", "not-uuid"], ["draft", "seed", runId, "extra"]]) {
    assert.throws(() => parsePersist13FixtureArgs(args), /Usage:/u);
  }
  assert.throws(() => parsePersist13FixtureArgs(["practice_ui_probe", "recover", runId, "--ui-observation", "receipt"]), /Usage:/u);
  assert.throws(() => parsePersist13FixtureArgs(["practice_ui_next", "seed", runId, "--ui-observation", "receipt"]), /Usage:/u);
});

test("fixture launcher keeps smoke validation, pins fixture flags and a private Expo port", () => {
  const invocation = parsePersist13FixtureArgs(["draft", "recover", runId]);
  const environment = createPersist13FixtureEnvironment(invocation, {
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: "seed",
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID: "11111111-1111-4111-8111-111111111111",
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO: "reset",
  }, smokeProfile);
  assert.equal(environment.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE, "smoke");
  assert.equal(environment.EXPO_NO_DOTENV, "1");
  assert.equal(environment.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE, "recover");
  assert.equal(environment.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID, runId);
  assert.equal(environment.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO, "draft");
  assert.equal(environment.EXPO_PUBLIC_PATTERNLY_PERSIST13_UI_OBSERVATION, undefined);
  assert.equal(PERSIST13_FIXTURE_PORT, "8082");
  assert.throws(() => createPersist13FixtureEnvironment(invocation, {}, smokeProfile.replace("EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY=test-api-key\n", "")), /requires EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY/u);
});

test("launcher accepts only a run-scoped private Next observation and wires that closed receipt", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "persist13-ui-next-runner-")));
  try {
    const outputDirectory = join(root, ".agent", "private", "persist13-ui-next-state");
    mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
    chmodSync(outputDirectory, 0o700);
    const physical = (logical) => `patternly:profile:v1:${runId}:${encodeURIComponent(`patternly:canonical:v1:${logical}`)}`;
    const sessionKey = physical("training-session:session-1");
    const timerKey = physical("active-foreground-timer");
    const rows = [sessionKey, timerKey, physical("training-session-index"), physical("active-training-session")]
      .sort().map((key) => ({ key, sha256: createHash("sha256").update(key).digest("hex") }));
    const observation = {
      schema: "patternly:persist13-practice-ui-next-observation.v1", owner: "persist13-reset-fixture", runId,
      scenario: "practice_ui_next", phase: "ui_armed", sessionIdSha256: "a".repeat(64),
      sessionPhysicalKeySha256: createHash("sha256").update(sessionKey).digest("hex"), occurrenceIdSha256: "b".repeat(64),
      sessionStableSha256: "c".repeat(64), otherSessionsSha256: "d".repeat(64), attemptSetSha256: "e".repeat(64),
      reviewSetSha256: "f".repeat(64), resultSetSha256: "1".repeat(64), timerIdentitySha256: "2".repeat(64),
      sessionCount: 1, attemptCount: 1, reviewCount: 1, resultCount: 0, currentItemIndex: 1, projectionKind: "unanswered",
      sessionElapsedMs: 10, timerAccumulatedMs: 10, timerCheckpointRevision: 2,
      beforeSnapshot: rows, afterSnapshot: rows, authCold: true,
    };
    const path = outputPathForRun(root, runId);
    writeFileSync(path, `${JSON.stringify(observation)}\n`, { mode: 0o600 });
    const invocation = parsePersist13FixtureArgs(["practice_ui_next", "recover", runId, "--ui-observation", `.agent/private/persist13-ui-next-state/next-observation-${runId}.json`]);
    assert.deepEqual(readPracticeUiNextObservationInput(root, invocation), observation);
    const wired = createPersist13FixtureEnvironment(invocation, {}, smokeProfile, observation);
    assert.equal(wired.EXPO_PUBLIC_PATTERNLY_PERSIST13_UI_OBSERVATION, JSON.stringify(observation));
    const foreignReceipt = { ...observation, runId: "b6d6c87c-8103-4b4c-9af9-77a0d7f002bf" };
    writeFileSync(path, `${JSON.stringify(foreignReceipt)}\n`, { mode: 0o600 });
    assert.throws(() => readPracticeUiNextObservationInput(root, invocation), /receipt failed its closed schema/u);
    writeFileSync(path, `${JSON.stringify(observation)}\n`, { mode: 0o600 });
    chmodSync(path, 0o644);
    assert.throws(() => readPracticeUiNextObservationInput(root, invocation), /private-file checks/u);
    assert.throws(() => createPersist13FixtureEnvironment(invocation, {}, smokeProfile), /receipt is required/u);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("start capability/recovery has a closed explicit stage and clears inherited authority", () => {
  for (const startStage of ["before_start_journal_write", "after_start_journal_durable_before_materialization"]) {
    const invocation = parsePersist13FixtureArgs(["start_cutpoint", "seed", runId, "--start-stage", startStage]);
    assert.deepEqual(invocation, { scenario: "start_cutpoint", mode: "seed", runId, startStage });
    assert.equal(createPersist13FixtureEnvironment(invocation, {}, smokeProfile).EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE, startStage);
    assert.equal(parsePersist13FixtureArgs(["start_cutpoint", "recover", runId, "--start-stage", startStage]).mode, "recover");
  }
  for (const args of [["start_cutpoint", "seed", runId], ["journal", "seed", runId, "--start-stage", "before_start_journal_write"], ["start_cutpoint", "seed", runId, "--start-stage", "anything"]]) assert.throws(() => parsePersist13FixtureArgs(args), /Usage:/u);
  const ordinary = parsePersist13FixtureArgs(["journal", "seed", runId]);
  assert.equal(createPersist13FixtureEnvironment(ordinary, { EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE: "before_start_journal_write" }, smokeProfile).EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE, undefined);
});
