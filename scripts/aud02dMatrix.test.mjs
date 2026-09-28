import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { parseAllDocuments } from "yaml";
import { AUD02D_CUSTOM_PRACTICE, AUD02D_ENTITLEMENT_SUITES, AUD02D_FEEDBACK_REFERENCES, AUD02D_TRACK_IDS, AUD02D_UDID, canonicalHash, readAud02dBindings } from "./aud02dMatrix.mjs";
import { createGenerationPinnedSmokeSession, readAuthorizationGeneration } from "./aud02dAuthEvidence.mjs";
import { validateAud02dExpoManifest } from "./aud02dExpoManifest.mjs";

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
    "CFBundleIdentifier", "CFBundleShortVersionString", "CFBundleVersion", "launchAssetSha256", "runCase(",
    "PATTERNLY_LOCAL_SMOKE_ENTITLEMENT_STATE", "startBackend(\"expired\")", "startBackend(\"active\")",
    "artifactPaths", "artifactDirectory", "backendObservations", "entitlementTransitions", "readBackendEvidence(auth)",
    "/ready", "/v1/entitlements", "maestroExecutions", "executedAssertions", "FEEDBACK_TIMING: feedbackTiming",
    "validateLocalProfile(\"smoke\"", "env: smokeEnvironment",
  ]) assert.ok(runner.includes(contract), `runner must preserve ${contract}`);
  assert.match(runner, /before\.launchAssetSha256 === after\.launchAssetSha256/u);
  assert.match(runner, /initialLaunchAssetSha256 = hash\(await fetchBundle\(expoManifest\.launchAsset\.url\)\)/u);
  assert.match(runner, /launchAssetSha256 !== initialLaunchAssetSha256/u);
  assert.match(runner, /currentRuntimeIdentity = \{ runtimeVersion: currentManifest\.runtimeVersion, launchAsset: currentManifest\.launchAsset \}/u);
  assert.match(runner, /canonicalHash\(currentRuntimeIdentity\) !== canonicalHash\(expoRuntimeIdentity\)/u);
  assert.doesNotMatch(runner, /canonicalHash\(currentManifest\)/u);
  assert.match(runner, /expoManifestResponseIdentity: currentManifest\.responseIdentity/u);
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

test("AUD-02D resolves and validates the exact local Expo iOS AppEntry launch asset", async () => {
  const manifestUrl = "http://[::1]:8081/";
  const launchAssetUrl = "http://[::1]:8081/node_modules/expo/AppEntry.bundle?platform=ios&dev=false&hot=false&minify=true";
  const manifest = {
    runtimeVersion: "exposdk:57.0.17",
    launchAsset: { url: launchAssetUrl, contentType: "application/javascript" },
  };
  assert.deepEqual(validateAud02dExpoManifest(manifest, manifestUrl), {
    runtimeVersion: "exposdk:57.0.17",
    launchAsset: { url: launchAssetUrl, contentType: "application/javascript" },
  });
  for (const badUrl of [
    launchAssetUrl.replace("AppEntry.bundle", "index.bundle"),
    launchAssetUrl.replace("[::1]:8081", "127.0.0.1:8082"),
    launchAssetUrl.replace("platform=ios", "platform=android"),
    launchAssetUrl.replace("hot=false", "hot=true"),
    launchAssetUrl.replace("minify=true", "minify=false"),
  ]) assert.throws(() => validateAud02dExpoManifest({ ...manifest, launchAsset: { ...manifest.launchAsset, url: badUrl } }, manifestUrl));
  assert.throws(() => validateAud02dExpoManifest({ ...manifest, runtimeVersion: "" }, manifestUrl));
  assert.throws(() => validateAud02dExpoManifest({ ...manifest, launchAsset: { ...manifest.launchAsset, contentType: "application/json" } }, manifestUrl));
  assert.notDeepEqual(
    { runtimeVersion: manifest.runtimeVersion, launchAsset: manifest.launchAsset },
    { runtimeVersion: "exposdk:57.0.18", launchAsset: manifest.launchAsset },
  );
  assert.notDeepEqual(
    { runtimeVersion: manifest.runtimeVersion, launchAsset: manifest.launchAsset },
    { runtimeVersion: manifest.runtimeVersion, launchAsset: { ...manifest.launchAsset, contentType: "application/json" } },
  );
  const runner = await readFile(path.join(ROOT, "scripts/runAud02dIos.mjs"), "utf8");
  assert.match(runner, /const METRO_ORIGIN = `http:\/\/\[::1\]:\$\{METRO_PORT\}`/u);
  assert.match(runner, /"expo-platform": "ios"/u);
  assert.match(runner, /accept: "application\/expo\+json, application\/json"/u);
  assert.match(runner, /fetchBundle\(currentManifest\.launchAsset\.url\)/u);
  assert.match(runner, /responseIdentity:[\s\S]*?sha256: hash\(bytes\)/u);
  assert.match(runner, /responseIdentity: expoManifest\.responseIdentity/u);
  assert.match(runner, /launchAssetSha256 !== initialLaunchAssetSha256/u);
  assert.doesNotMatch(runner, /index\.bundle/u);
});

test("smoke entitlement probe exchanges ordinary auth for a generation-pinned token without persisting secrets", async () => {
  const ordinaryIdToken = "ordinary-sensitive-id-token";
  const customToken = "custom-sensitive-token";
  const pinnedIdToken = `header.${Buffer.from(JSON.stringify({ authorizationGeneration: 12, sub: "private-user" })).toString("base64url")}.signature`;
  const calls = [];
  const replies = [
    { status: 200, body: { idToken: ordinaryIdToken } },
    { status: 200, body: { customToken } },
    { status: 200, body: { idToken: pinnedIdToken } },
  ];
  const auth = await createGenerationPinnedSmokeSession({
    email: "private@example.test", password: "private-password", appCheck: "private-app-check",
    apiOrigin: "http://127.0.0.1:8080", authOrigin: "http://127.0.0.1:19099",
    fetchImplementation: async (url, options) => {
      calls.push({ url: new URL(url), options });
      const reply = replies.shift();
      return { ok: reply.status === 200, status: reply.status, json: async () => reply.body };
    },
  });
  assert.match(calls[0].url.pathname, /accounts:signInWithPassword/u);
  assert.equal(calls[0].url.searchParams.get("key"), "fake-api-key");
  assert.match(calls[1].url.pathname, /\/v1\/account\/session\/exchange$/u);
  assert.deepEqual(JSON.parse(calls[1].options.body), {});
  assert.equal(calls[1].options.headers.authorization, `Bearer ${ordinaryIdToken}`);
  assert.equal(calls[1].options.headers["x-firebase-appcheck"], "private-app-check");
  assert.match(calls[2].url.pathname, /accounts:signInWithCustomToken/u);
  assert.equal(JSON.parse(calls[2].options.body).token, customToken);
  assert.equal(auth.idToken, pinnedIdToken);
  assert.deepEqual(auth.evidence, {
    passwordSignInHttpStatus: 200,
    sessionExchangeHttpStatus: 200,
    customTokenSignInHttpStatus: 200,
    customTokenPresent: true,
    authorizationGeneration: 12,
  });
  const serializedEvidence = JSON.stringify(auth.evidence);
  for (const secret of [ordinaryIdToken, customToken, pinnedIdToken, "private@example.test", "private-user", "private-password", "private-app-check"]) assert.ok(!serializedEvidence.includes(secret));
  assert.equal(readAuthorizationGeneration(pinnedIdToken), 12);
  assert.throws(() => readAuthorizationGeneration(`header.${Buffer.from(JSON.stringify({ authorizationGeneration: "12" })).toString("base64url")}.signature`), /numeric authorizationGeneration/u);
});

test("smoke auth errors persist only HTTP status and safe error.code", async () => {
  const leaked = "do-not-leak-custom-token";
  let callCount = 0;
  await assert.rejects(createGenerationPinnedSmokeSession({
    email: "person@example.test", password: "private-password", appCheck: "private-app-check",
    apiOrigin: "http://127.0.0.1:8080", authOrigin: "http://127.0.0.1:19099",
    fetchImplementation: async () => {
      callCount += 1;
      if (callCount === 1) return { ok: true, status: 200, json: async () => ({ idToken: "ordinary-id-token" }) };
      return { ok: false, status: 401, json: async () => ({ error: { code: "recent_reauthentication_required" }, customToken: leaked }) };
    },
  }), (error) => {
    assert.match(error.message, /HTTP 401/u);
    assert.match(error.message, /error\.code=recent_reauthentication_required/u);
    assert.ok(!error.message.includes(leaked));
    assert.ok(!error.message.includes("ordinary-id-token"));
    return true;
  });
  assert.equal(callCount, 2);
  await assert.rejects(createGenerationPinnedSmokeSession({
    email: "person@example.test", password: "private-password", appCheck: "private-app-check",
    apiOrigin: "http://127.0.0.1:8080", authOrigin: "http://127.0.0.1:19099",
    fetchImplementation: async () => ({ status: 201, ok: true, json: async () => ({ idToken: "should-not-be-accepted" }) }),
  }), /HTTP 201/u);
  const helper = await readFile(path.join(ROOT, "scripts/aud02dAuthEvidence.mjs"), "utf8");
  const runner = await readFile(path.join(ROOT, "scripts/runAud02dIos.mjs"), "utf8");
  assert.match(helper, /\/v1\/account\/session\/exchange/u);
  assert.match(helper, /accounts:signInWithCustomToken/u);
  assert.match(helper, /authorization: `Bearer \$\{ordinaryIdToken\}`/u);
  assert.match(runner, /authorization: "Bearer " \+ auth\.idToken/u);
  assert.match(runner, /auth: auth\.evidence/u);
});

test("AUD-02D Maestro flows cover track readiness and all setup selectors before session start", async () => {
  const readiness = await readFile(path.join(ROOT, ".maestro/aud02d-track-readiness.yaml"), "utf8");
  const readinessCommands = parseAllDocuments(readiness)[1].toJSON();
  const custom = await readFile(path.join(ROOT, ".maestro/aud02d-custom-practice-configuration.yaml"), "utf8");
  assert.deepEqual(readinessCommands[0].runFlow.commands[1], {
    tapOn: { id: "patternly:home:select-track:${TRACK_ID}" },
  });
  assert.deepEqual(readinessCommands[4], {
    scrollUntilVisible: {
      element: { id: "patternly:home:select-track:${TRACK_ID}" },
      direction: "DOWN",
      centerElement: false,
      visibilityPercentage: 50,
    },
  });
  assert.deepEqual(readinessCommands[5], { waitForAnimationToEnd: { timeout: 5000 } });
  assert.deepEqual(readinessCommands[6], {
    tapOn: { id: "patternly:home:select-track:${TRACK_ID}" },
  });
  assert.equal(Object.hasOwn(readinessCommands[6].tapOn, "retryTapIfNoChange"), false);
  assert.match(readiness, /track-card:\$\{TRACK_ID\}/u);
  assert.match(readiness, /practice:hub:root/u);
  assert.match(custom, /patternly:practice:open-setup/u);
  assert.match(custom, /patternly:practice:custom-entry/u);
  assert.doesNotMatch(custom, /patternly:practice:mode-card:coding-interview-custom-practice/u);
  assert.match(custom, /session-length:\$\{LENGTH\}/u);
  assert.match(custom, /feedback-timing:\$\{FEEDBACK_TIMING\}/u);
  assert.match(custom, /session:configuration:[\s\S]*?length:\$\{LENGTH\}:feedback-timing:\$\{FEEDBACK_TIMING_ID\}/u);
  assert.ok(custom.indexOf("patternly:practice:start-session") < custom.indexOf("patternly:session:question:"));
  assert.equal(AUD02D_ENTITLEMENT_SUITES.length, 3);
});

test("auth preflight extended waits are recorded and flows without assertions remain rejected", async () => {
  const runner = await readFile(path.join(ROOT, "scripts/runAud02dIos.mjs"), "utf8");
  const preflight = await readFile(path.join(ROOT, ".maestro/rc-auth-preflight.yaml"), "utf8");
  assert.match(runner, /assertVisible\|assertNotVisible\|assertTrue\|assertCondition\|extendedWaitUntil/u);
  assert.match(runner, /if \(assertions\.length === 0\) throw new Error\(`AUD-02D flow \$\{flow\} has no executable Maestro assertions/u);
  assert.match(runner, /if \(assertions\.length === 0\) throw new Error\(`AUD-02D child flow \$\{flow\} has no executable Maestro assertions/u);

  const commands = parseAllDocuments(preflight)[1].toJSON();
  const waits = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    if (Object.hasOwn(value, "extendedWaitUntil")) waits.push(value.extendedWaitUntil);
    Object.values(value).forEach(visit);
  }
  visit(commands);
  assert.equal(waits.length, 7);

  assert.deepEqual(commands[0], {
    runFlow: {
      when: { visible: { id: "patternly:content:unavailable" } },
      commands: [
        { tapOn: "Try again" },
        { extendedWaitUntil: { visible: { id: "patternly:content:ready" }, timeout: 120000 } },
      ],
    },
  });
  assert.ok(commands.indexOf(commands[0]) < commands.findIndex((command) => command.runFlow?.when?.visible?.id === "account-revoked-session"), "content retry must precede account recovery");

  const resumeBranchIndex = commands.findIndex((command) => command.runFlow?.when?.visible?.id === "account-sync-resume-required");
  const finalHomeTapIndex = commands.findIndex((command, index) => index > resumeBranchIndex && command.runFlow?.when?.visible?.id === "main-tab-bar-home");
  assert.ok(resumeBranchIndex >= 0, "resume-required recovery branch must be present");
  assert.ok(finalHomeTapIndex > resumeBranchIndex, "resume recovery must precede final Home stabilization");
  const resumeBranch = commands[resumeBranchIndex].runFlow.commands;
  assert.deepEqual(resumeBranch.slice(0, 2), [
    { tapOn: "Go back" },
    { extendedWaitUntil: { visible: { id: "main-tab-bar-home" }, timeout: 30000 } },
  ]);
  assert.doesNotMatch(JSON.stringify(resumeBranch), /account-sign-out|sync.*retry|retry.*sync|clear.*data/iu);
  assert.deepEqual(commands.slice(-2), [
    { extendedWaitUntil: { visible: { id: "main-tab-bar-home" }, timeout: 30000 } },
    { assertVisible: { id: "main-tab-bar-home" } },
  ]);
  assert.equal(finalHomeTapIndex, commands.length - 3, "conditional Home tap must immediately precede final stabilization");
});

test("feedback lifecycle flows resume, complete ten answers and open the result review", async () => {
  const [atSessionEndPath, afterEachPath] = AUD02D_FEEDBACK_REFERENCES;
  const atSessionEnd = await readFile(path.join(ROOT, atSessionEndPath), "utf8");
  const afterEach = await readFile(path.join(ROOT, afterEachPath), "utf8");
  const m3 = await readFile(path.join(ROOT, ".maestro/m3-custom-at-session-end.yaml"), "utf8");
  const m4 = await readFile(path.join(ROOT, ".maestro/m4-custom-after-each-answer.yaml"), "utf8");
  for (const [source, inheritedFlow] of [[atSessionEnd, "m3-custom-at-session-end.yaml"], [afterEach, "m4-custom-after-each-answer.yaml"]]) {
    const commands = parseAllDocuments(source)[1].toJSON();
    assert.deepEqual(commands.slice(0, 4), [
      { assertVisible: { id: "patternly:practice:hub:root" } },
      { assertVisible: { id: "main-tab-bar-home" } },
      { tapOn: { id: "main-tab-bar-home" } },
      { extendedWaitUntil: { visible: { id: "patternly:home:track-card:coding-interview-dsa-problem-solving" }, timeout: 30000 } },
    ]);
    assert.deepEqual(commands[4], { runFlow: inheritedFlow });
    assert.match(source, /patternly:summary:root:[\s\S]*?timeout: 30000/u);
    assert.match(source, /patternly:summary:configuration:[\s\S]*?:1:10:(?:at-session-end|after-each-answer)/u);
    assert.match(source, /patternly:session:counter:coding-interview-dsa-problem-solving:coding-interview-custom-practice:1:ordinal:11:length:10/u);
    assert.match(source, /takeScreenshot: "aud02d-custom-feedback-result-/u);
    const reviewCall = commands.at(-1).runFlow;
    assert.deepEqual(reviewCall, {
      file: "coding-practice-result-review.yaml",
      env: { REVIEW_QUESTION_ID: "alg-complexity-reject-001" },
    });
    assert.doesNotMatch(source, /aud02d-feedback-complete-session\.yaml/u);
  }
  assert.match(atSessionEnd, /runFlow: m3-custom-at-session-end\.yaml/u);
  assert.match(afterEach, /runFlow: m4-custom-after-each-answer\.yaml/u);
  const options = (source) => [...source.matchAll(/id: "patternly:session:option:([^"]+):([^"]+)"/gu)].map(([, questionId, optionId]) => [questionId, optionId]);
  assert.deepEqual(options(atSessionEnd), [
    ["alg-complexity-output-001", "omega_k"], ["alg-complexity-preprocess-001", "p_plus_q"],
    ["alg-complexity-reject-001", "avoid_wrong_growth"], ["alg-complexity-review-001", "executed_work"],
    ["alg-complexity-scaling-001", "model_dependent"], ["alg-complexity-space-001", "working_memory"],
    ["alg-complexity-time-001", "linear"], ["alg-complexity-time-002", "product"],
    ["alg-complexity-output-002", "different_contract"],
  ]);
  assert.deepEqual(options(afterEach), [
    ["alg-complexity-output-001", "omega_k"], ["alg-complexity-preprocess-001", "p_plus_q"],
    ["alg-complexity-reject-001", "avoid_wrong_growth"], ["alg-complexity-amortized-001", "sequence_average"],
    ["alg-complexity-scaling-001", "model_dependent"], ["alg-complexity-space-001", "working_memory"],
    ["alg-complexity-time-001", "linear"], ["alg-complexity-time-002", "product"],
    ["alg-complexity-output-002", "different_contract"],
  ]);
  assert.match(afterEach, /ordinal:5:length:10/u);
  assert.equal((afterEach.match(/- runFlow:\n    when:/gu) ?? []).length, 9);
  assert.match(atSessionEnd, /patternly:session:feedback:alg-complexity-output-001/u);
  for (const truncated of [m3, m4]) {
    assert.doesNotMatch(truncated, /patternly:summary:root|coding-practice-result-review\.yaml/u);
  }
  assert.ok(!AUD02D_FEEDBACK_REFERENCES.includes(".maestro/m3-custom-at-session-end.yaml"));
  assert.ok(!AUD02D_FEEDBACK_REFERENCES.includes(".maestro/m4-custom-after-each-answer.yaml"));
  await assert.rejects(readFile(path.join(ROOT, ".maestro/aud02d-feedback-complete-session.yaml")));
});

test("result review selects the caller-provided question while retaining its occurrence root", async () => {
  const shared = await readFile(path.join(ROOT, ".maestro/coding-practice-result-review.yaml"), "utf8");
  const completed = await readFile(path.join(ROOT, ".maestro/completed-practice-result-review.yaml"), "utf8");
  const sharedCommands = parseAllDocuments(shared)[1].toJSON();
  const completedCommands = parseAllDocuments(completed)[1].toJSON();
  assert.ok(sharedCommands.some((command) => command.extendedWaitUntil?.visible?.id === "patternly:practice-review:root:coding-interview-dsa-problem-solving:coding-interview-custom-practice:1:coding-interview-dsa-problem-solving:coding-interview-custom-practice:1:occurrence:3"));
  assert.ok(sharedCommands.some((command) => command.assertVisible?.id === "patternly:session:question:${REVIEW_QUESTION_ID}"));
  assert.ok(sharedCommands.some((command) => command.assertNotVisible?.id === "patternly:session:submit:${REVIEW_QUESTION_ID}"));
  assert.deepEqual(completedCommands.at(-1).runFlow, {
    file: "coding-practice-result-review.yaml",
    env: { REVIEW_QUESTION_ID: "alg-complexity-amortized-004" },
  });
});

test("all new AUD-02D Maestro YAML documents parse and contain executable assertion commands", async () => {
  const flows = [
    ...AUD02D_FEEDBACK_REFERENCES,
    ".maestro/aud02d-track-readiness.yaml",
    ".maestro/aud02d-custom-practice-configuration.yaml",
    ".maestro/rc-certification-exam-free.yaml",
  ];
  for (const relativePath of flows) {
    const source = await readFile(path.join(ROOT, relativePath), "utf8");
    const documents = parseAllDocuments(source);
    assert.ok(documents.length >= 2, `${relativePath} must have Maestro metadata and a flow document`);
    assert.deepEqual(documents.flatMap((document) => document.errors.map(String)), [], `${relativePath} YAML must parse`);
    const commands = documents[1].toJSON();
    assert.ok(Array.isArray(commands), `${relativePath} must be an executable command list`);
    assert.ok(commands.some((command) => ["assertVisible", "assertNotVisible", "extendedWaitUntil"].some((key) => key in command)), `${relativePath} must contain executable assertions/waits`);
    if (relativePath === ".maestro/aud02d-track-readiness.yaml") {
      const selectorSequences = [];
      function inspectSequence(sequence) {
        const warningIndex = sequence.findIndex((command) => command.runFlow?.when?.visible === ".*Open debugger to view warnings.*");
        if (warningIndex >= 0) selectorSequences.push(sequence.slice(warningIndex + 1));
        sequence.forEach((command) => {
          const commands = command.runFlow?.commands;
          if (Array.isArray(commands)) {
            inspectSequence(commands);
          }
        });
      }
      inspectSequence(commands);
      assert.equal(selectorSequences.length, 2, "both selector branches must stabilize selection idempotently");
      const continueGuard = {
        runFlow: {
          when: { visible: { id: "patternly:home:select-track:continue" } },
          commands: [
            { tapOn: { id: "patternly:home:select-track:continue" } },
            { extendedWaitUntil: { notVisible: { id: "patternly:home:select-track:root" }, timeout: 30000 } },
          ],
        },
      };
      const selectorBackGuard = {
        runFlow: {
          when: { visible: { id: "patternly:home:select-track:root" } },
          commands: [{ tapOn: "Go back" }],
        },
      };
      assert.deepEqual(selectorSequences.map((sequence) => sequence.slice(0, 2)), [
        [continueGuard, selectorBackGuard],
        [continueGuard, selectorBackGuard],
      ]);
      assert.equal(selectorSequences.filter((sequence) => sequence.length === 2).length, 1, "nested selector branch must end after the two guarded actions");
      const resumedFlow = selectorSequences.find((sequence) => sequence.length > 2);
      assert.deepEqual(resumedFlow[2], {
        extendedWaitUntil: { visible: { id: "patternly:home:track-card:${TRACK_ID}" }, timeout: 30000 },
      });
      assert.ok(commands.some((command) => command.extendedWaitUntil?.visible?.id === "patternly:home:track-card:${TRACK_ID}"));
      assert.ok(commands.some((command) => command.extendedWaitUntil?.visible?.id === "patternly:practice:hub:root"));
      assert.ok(commands.some((command) => command.assertVisible?.id === "patternly:practice:open-setup"));
      function assertGoBackGuarded(sequence, selectorRootGuarded = false) {
        for (const command of sequence) {
          assert.notEqual(command.tapOn === "Go back" && !selectorRootGuarded, true, "Go back must only run under a visible selector-root guard");
          if (Array.isArray(command.runFlow?.commands)) {
            const guarded = command.runFlow.when?.visible?.id === "patternly:home:select-track:root";
            assertGoBackGuarded(command.runFlow.commands, guarded);
          }
        }
      }
      assertGoBackGuarded(commands);
    }
    if (relativePath === ".maestro/rc-certification-exam-free.yaml") {
      const selectionIndex = commands.findIndex((command, index) =>
        index > 0 && commands[index - 1].tapOn?.id === "patternly:home:select-track:google-cloud-associate-cloud-engineer",
      );
      assert.ok(selectionIndex >= 0, "RC flow must select the GCP track before its guarded Continue");
      const warningDismissal = {
        runFlow: {
          when: { visible: ".*Open debugger to view warnings.*" },
          commands: [
            { tapOn: { point: "92%,93%" } },
            { extendedWaitUntil: { notVisible: ".*Open debugger to view warnings.*", timeout: 5000 } },
          ],
        },
      };
      assert.deepEqual(commands.slice(selectionIndex, selectionIndex + 3), [
        warningDismissal,
        { tapOn: { id: "patternly:home:select-track:continue" } },
        { runFlow: { when: { visible: "Not now" }, commands: [{ tapOn: "Not now" }] } },
      ]);
      assert.doesNotMatch(source, /tapOn:\s*"Go back"/u);
    }
  }
});
