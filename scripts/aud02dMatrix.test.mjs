import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { parseAllDocuments } from "yaml";
import { AUD02D_CUSTOM_PRACTICE, AUD02D_ENTITLEMENT_SUITES, AUD02D_FEEDBACK_REFERENCES, AUD02D_TRACK_IDS, AUD02D_UDID, canonicalHash, readAud02dBindings } from "./aud02dMatrix.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

test("AUD-02D matrix is exactly bound to the nine-track candidate lock", async () => {
  const lock = JSON.parse(await readFile(path.join(ROOT, "integration/contracts/content-release/release.lock.json"), "utf8"));
  assert.deepEqual([...AUD02D_TRACK_IDS].sort(), lock.artifacts.map(({ trackId }) => trackId).sort());
  assert.equal(AUD02D_TRACK_IDS.length, 9);
  assert.equal(AUD02D_UDID, "7F315654-3175-4F3C-BB24-B0263F59360C");
  const bindings = await readAud02dBindings(ROOT);
  assert.equal(bindings.candidateId, lock.candidateId);
  assert.match(bindings.appLockSha256, /^[a-f0-9]{64}$/u);
  assert.match(bindings.bundledContentLockSha256, /^[a-f0-9]{64}$/u);
  assert.deepEqual(Object.keys(bindings.contentBindings).sort(), ["admissionEvidenceSha256", "candidateManifestSha256", "readinessEvidenceSha256", "releaseManifestSha256"].sort());
});

test("Custom Practice matrix includes every 10/20/40 by timing combination", () => {
  assert.deepEqual(AUD02D_CUSTOM_PRACTICE, [
    { length: 10, feedbackTiming: "afterEachAnswer" },
    { length: 10, feedbackTiming: "atSessionEnd" },
    { length: 20, feedbackTiming: "afterEachAnswer" },
    { length: 20, feedbackTiming: "atSessionEnd" },
    { length: 40, feedbackTiming: "afterEachAnswer" },
    { length: 40, feedbackTiming: "atSessionEnd" },
  ]);
  assert.deepEqual(AUD02D_FEEDBACK_REFERENCES, [".maestro/aud02d-feedback-at-session-end.yaml", ".maestro/aud02d-feedback-after-each-answer.yaml"]);
});

test("coordinating runner binds every case to clean sources, one install, native identity and stable bundle bytes", async () => {
  const runner = await readFile(path.join(ROOT, "scripts/runAud02dIos.mjs"), "utf8");
  for (const contract of [
    "--no-dev", "--minify", "--port", "8081", "status", "origin/${branch}", "simctl", "get_app_container",
    "CFBundleIdentifier", "CFBundleShortVersionString", "CFBundleVersion", "bundleSha256", "runCase(",
    "PATTERNLY_LOCAL_SMOKE_ENTITLEMENT_STATE", "startBackend(\"expired\")", "startBackend(\"active\")",
    "artifactPaths", "artifactDirectory", "backendObservations", "entitlementTransitions", "readBackendEvidence(auth)",
    "/ready", "/v1/entitlements", "maestroExecutions", "executedAssertions", "FEEDBACK_TIMING: feedbackTiming",
    "validateLocalProfile(\"smoke\"", "env: smokeEnvironment",
  ]) assert.ok(runner.includes(contract), `runner must preserve ${contract}`);
  assert.match(runner, /before\.bundleSha256 === after\.bundleSha256/u);
  assert.match(runner, /states\[0\] !== "expired" \|\| !states\.includes\("active"\)/u);
  assert.match(runner, /artifactPaths: \[\]/u);
  assert.match(runner, /Refusing to stop it|refusing to stop it/u);
  assert.equal(canonicalHash({ b: 2, a: 1 }), canonicalHash({ a: 1, b: 2 }));
});

test("AUD-02D validates smoke profile for Metro and owns active backend through pre-premium runtime cases", async () => {
  const runner = await readFile(path.join(ROOT, "scripts/runAud02dIos.mjs"), "utf8");
  const profile = await readFile(path.join(ROOT, "scripts/runLocalProfile.mjs"), "utf8");
  assert.match(runner, /smokeEnvironment = loadSmokeEnvironment\(\)/u);
  assert.match(runner, /return validateLocalProfile\("smoke", \{ \.\.\.process\.env, \.\.\.profile \}\)/u);
  assert.match(runner, /env: smokeEnvironment/u);
  assert.match(profile, /EXPO_NO_DOTENV: "1"/u);
  assert.match(runner, /sharedBackend = startBackend\("active"\)/u);
  assert.match(runner, /sharedBackendReady = await waitForBackendReady\(sharedBackend\)/u);
  assert.match(runner, /startupEntitlement: sharedObservation/u);
  assert.ok(runner.indexOf('sharedBackend = startBackend("active")') < runner.indexOf("await launchBundledApp()"));
  assert.ok(runner.indexOf("await waitForPortAvailable();") < runner.indexOf("for (const suite of AUD02D_ENTITLEMENT_SUITES)"));
  assert.match(runner, /finally \{ if \(metro\) await stopMetro\(metro\); \}/u);
  assert.match(runner, /manifest\.failure = error/u);
  assert.match(runner, /await writeFile\(path\.join\(OUTPUT_ROOT, "aud02d-manifest\.json"\)/u);
});

test("AUD-02D Maestro flows cover track readiness and all setup selectors before session start", async () => {
  const readiness = await readFile(path.join(ROOT, ".maestro/aud02d-track-readiness.yaml"), "utf8");
  const custom = await readFile(path.join(ROOT, ".maestro/aud02d-custom-practice-configuration.yaml"), "utf8");
  assert.match(readiness, /track-card:\$\{TRACK_ID\}/u);
  assert.match(readiness, /practice:hub:root/u);
  assert.match(custom, /session-length:\$\{LENGTH\}/u);
  assert.match(custom, /feedback-timing:\$\{FEEDBACK_TIMING\}/u);
  assert.match(custom, /session:configuration:[\s\S]*?length:\$\{LENGTH\}:feedback-timing:\$\{FEEDBACK_TIMING_ID\}/u);
  assert.ok(custom.indexOf("patternly:practice:start-session") < custom.indexOf("patternly:session:question:"));
  assert.equal(AUD02D_ENTITLEMENT_SUITES.length, 3);
});

test("feedback cases compose relaunch/resume with completed result and review, not truncated M3/M4 alone", async () => {
  const [atSessionEndPath, afterEachPath] = AUD02D_FEEDBACK_REFERENCES;
  const atSessionEnd = await readFile(path.join(ROOT, atSessionEndPath), "utf8");
  const afterEach = await readFile(path.join(ROOT, afterEachPath), "utf8");
  const completion = await readFile(path.join(ROOT, ".maestro/aud02d-feedback-complete-session.yaml"), "utf8");
  const m3 = await readFile(path.join(ROOT, ".maestro/m3-custom-at-session-end.yaml"), "utf8");
  const m4 = await readFile(path.join(ROOT, ".maestro/m4-custom-after-each-answer.yaml"), "utf8");
  assert.match(atSessionEnd, /runFlow: m3-custom-at-session-end\.yaml/u);
  assert.match(afterEach, /runFlow: m4-custom-after-each-answer\.yaml/u);
  for (const flow of [atSessionEnd, afterEach]) assert.match(flow, /runFlow: aud02d-feedback-complete-session\.yaml/u);
  assert.match(completion, /patternly:summary:root:[\s\S]*?timeout: 30000/u);
  assert.match(completion, /runFlow: coding-practice-result-review\.yaml/u);
  assert.match(completion, /patternly:session:question:alg-complexity-amortized-010/u);
  assert.match(afterEach, /patternly:session:feedback:alg-complexity-amortized-001/u);
  for (const truncated of [m3, m4]) {
    assert.doesNotMatch(truncated, /patternly:summary:root|coding-practice-result-review\.yaml/u);
  }
  assert.ok(!AUD02D_FEEDBACK_REFERENCES.includes(".maestro/m3-custom-at-session-end.yaml"));
  assert.ok(!AUD02D_FEEDBACK_REFERENCES.includes(".maestro/m4-custom-after-each-answer.yaml"));
});

test("all new AUD-02D Maestro YAML documents parse and contain executable assertion commands", async () => {
  const flows = [
    ...AUD02D_FEEDBACK_REFERENCES,
    ".maestro/aud02d-feedback-complete-session.yaml",
    ".maestro/aud02d-track-readiness.yaml",
    ".maestro/aud02d-custom-practice-configuration.yaml",
  ];
  for (const relativePath of flows) {
    const source = await readFile(path.join(ROOT, relativePath), "utf8");
    const documents = parseAllDocuments(source);
    assert.ok(documents.length >= 2, `${relativePath} must have Maestro metadata and a flow document`);
    assert.deepEqual(documents.flatMap((document) => document.errors.map(String)), [], `${relativePath} YAML must parse`);
    const commands = documents[1].toJSON();
    assert.ok(Array.isArray(commands), `${relativePath} must be an executable command list`);
    assert.ok(commands.some((command) => ["assertVisible", "assertNotVisible", "extendedWaitUntil"].some((key) => key in command)), `${relativePath} must contain executable assertions/waits`);
  }
});
