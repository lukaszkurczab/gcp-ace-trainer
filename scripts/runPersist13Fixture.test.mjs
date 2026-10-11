import assert from "node:assert/strict";
import test from "node:test";
import { createPersist13FixtureEnvironment, parsePersist13FixtureArgs, PERSIST13_FIXTURE_PORT } from "./runPersist13Fixture.mjs";

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
  for (const args of [["other", "seed", runId], ["draft", "other", runId], ["reset", "recover", "not-uuid"], ["draft", "seed", runId, "extra"]]) {
    assert.throws(() => parsePersist13FixtureArgs(args), /Usage:/u);
  }
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
  assert.equal(PERSIST13_FIXTURE_PORT, "8082");
  assert.throws(() => createPersist13FixtureEnvironment(invocation, {}, smokeProfile.replace("EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY=test-api-key\n", "")), /requires EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY/u);
});
