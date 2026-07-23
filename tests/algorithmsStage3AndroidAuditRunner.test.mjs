import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { canonicalIosCaptureEntries, readAuditConfig } from "../scripts/validateUxUiAuditConfig.mjs";
import { collectAuditRenderGraph } from "../scripts/auditRenderProvenance.mjs";
import { canonicalAuditSourcePaths } from "../scripts/runAlgorithmsStage3IosAudit.mjs";
import {
  EXPECTED_ANDROID_STATES,
  buildAndroidManifest,
  canonicalAndroidCaptureEntries,
  canonicalAndroidSourcePaths,
  captureAndroidStates,
  computeAndroidSourceSha256,
  parseAdbDevices,
  parseGitStatusPorcelainZ,
  parseRunnerArgs,
  pngDimensions,
  publishAndroidEvidence,
  readAndroidConfig,
  selectOnlineDevice,
  validateAndroidConfig,
} from "../scripts/runAlgorithmsStage3AndroidAudit.mjs";

const root = process.cwd();

test("requires one explicit emulator serial", () => {
  assert.deepEqual(parseRunnerArgs(["--serial", "emulator-5556"]), { serial: "emulator-5556" });
  assert.throws(() => parseRunnerArgs([]), /Usage/);
  assert.throws(() => parseRunnerArgs(["--serial", "device-default"]), /Invalid Android emulator serial/);
});

test("rejects missing, offline, and wrong serials", () => {
  const devices = "List of devices attached\nemulator-5554\toffline transport_id:1\nemulator-5556\tdevice product:sdk\n";
  assert.deepEqual(parseAdbDevices(devices), [
    { serial: "emulator-5554", state: "offline" },
    { serial: "emulator-5556", state: "device" },
  ]);
  assert.deepEqual(selectOnlineDevice(devices, "emulator-5556"), { serial: "emulator-5556", state: "device" });
  assert.throws(() => selectOnlineDevice(devices, "emulator-5554"), /offline/);
  assert.throws(() => selectOnlineDevice(devices, "emulator-5558"), /not attached/);
});

test("reads exact PNG dimensions and preserves exact porcelain XY bytes", () => {
  const png = pngBytes(1);
  assert.deepEqual(pngDimensions(png), { width: 1080, height: 2400 });
  assert.throws(() => pngDimensions(Buffer.from("not-png")), /not a valid PNG/);
  const status = parseGitStatusPorcelainZ(" M worktree-only.ts\0M  index-only.ts\0MM both.ts\0");
  assert.deepEqual(status, [" M worktree-only.ts", "M  index-only.ts", "MM both.ts"]);
});

test("Android static config owns exactly the canonical 44-state inventory without requiring a debug APK", () => {
  const android = readAndroidConfig(root);
  const entries = canonicalAndroidCaptureEntries(root, android);
  const iosConfig = readAuditConfig(root);
  const ios = canonicalIosCaptureEntries(root, iosConfig);
  assert.equal(entries.length, 44);
  assert.deepEqual(entries.map((entry) => entry.stateId), ios.map((entry) => entry.stateId));
  assert.deepEqual(entries.map((entry) => entry.screenshotName), ios.map((entry) => entry.screenshotName.replace("__ios-regular", "__android-regular")));
  assert.equal(new Set(entries.map((entry) => entry.flowPath)).size, 44);
  assert.equal(new Set(entries.map((entry) => entry.screenshotName)).size, 44);
  assert.ok(entries.every((entry) => entry.stateUri === `exp+patternly-algorithms-audit://audit?auditState=${entry.stateId}`));
  assert.equal(existsSync(path.join(root, ".audit/ux-ui/maestro/flows/algorithms-stage3-harness.android.yaml")), false);
  assert.equal(existsSync(path.join(root, "audit/algorithms-ui/s3-android-p01-capture-manifest.json")), false);
});

test("validator rejects any extra command, altered state entry, or alternate state-flow inventory", () => {
  const fixture = makeConfigFixture();
  try {
    assert.equal(validateAndroidConfig(fixture.root, fixture.config), fixture.config);
    const p01 = fixture.config.states[0];
    writeFileSync(path.join(fixture.root, p01.flowPath), `${readFileSync(path.join(fixture.root, p01.flowPath), "utf8")}- tapOn: "Continue"\n`);
    assert.throws(() => validateAndroidConfig(fixture.root, fixture.config), /non-canonical commands or metadata/);

    writeFileSync(path.join(fixture.root, p01.flowPath), readFileSync(path.join(root, p01.flowPath)));
    const altered = structuredClone(fixture.config);
    altered.states[0].stateUri = "exp+patternly-algorithms-audit://audit?auditState=P-02";
    assert.throws(() => validateAndroidConfig(fixture.root, altered), /exact canonical entry for P-01/);

    writeFileSync(path.join(fixture.root, fixture.config.statesDirectory, "alternate.yaml"), "appId: x\n");
    assert.throws(() => validateAndroidConfig(fixture.root, fixture.config), /exactly the 44 canonical YAML files/);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("source provenance covers every exact Android state flow and no retired harness", () => {
  const config = readAndroidConfig(root);
  const paths = canonicalAndroidSourcePaths(root, config);
  for (const entry of EXPECTED_ANDROID_STATES) assert.ok(paths.includes(entry.flowPath));
  const renderGraph = collectAuditRenderGraph(root);
  const iosConfig = readAuditConfig(root);
  const iosPaths = canonicalAuditSourcePaths(root, iosConfig, canonicalIosCaptureEntries(root, iosConfig));
  for (const renderPath of renderGraph) {
    assert.ok(paths.includes(renderPath), `Android provenance is missing ${renderPath}`);
    assert.ok(iosPaths.includes(renderPath), `iOS provenance is missing ${renderPath}`);
  }
  for (const required of [
    "scripts/auditRenderProvenance.mjs",
    "src/assets/icons/alert-triangle.svg",
    "src/components/Button.tsx",
    "src/components/Screen.tsx",
    "src/features/algorithms/session/SessionShell.tsx",
    "src/features/algorithms/session/sessionAccessibility.ts",
    "src/features/practice/PracticeSessionSurface.tsx",
    "src/features/practice/PracticeResponseControls.tsx",
    "src/features/practice/PracticeFeedbackBlock.tsx",
    "src/features/simulation/SimulationSessionSurface.tsx",
  ]) assert.ok(paths.includes(required));
  assert.equal(paths.includes(".audit/ux-ui/maestro/flows/algorithms-stage3-harness.android.yaml"), false);
  assert.match(computeAndroidSourceSha256(root, config), /^[0-9a-f]{64}$/);
});

test("state capture is serial and fail-fast after the first exact flow failure", () => {
  const calls = [];
  const config = {
    appActivity: "com.lkurczab.gcpacetrainer/.MainActivity",
    states: EXPECTED_ANDROID_STATES.slice(0, 3),
  };
  assert.throws(() => captureAndroidStates(root, "/sdk/adb", "emulator-5556", config, "/staging", {
    launch(adb, serial, component, uri) {
      calls.push(["launch", adb, serial, component, uri]);
    },
    capture(captureRoot, serial, flowPath, stagingRoot) {
      calls.push(["capture", captureRoot, serial, flowPath, stagingRoot]);
      if (flowPath.endsWith("p-02.yaml")) throw new Error("injected exact selector failure");
    },
  }), /injected exact selector failure/);
  assert.deepEqual(calls.map((call) => [call[0], call[0] === "launch" ? call[4] : call[3]]), [
    ["launch", EXPECTED_ANDROID_STATES[0].stateUri],
    ["capture", EXPECTED_ANDROID_STATES[0].flowPath],
    ["launch", EXPECTED_ANDROID_STATES[1].stateUri],
    ["capture", EXPECTED_ANDROID_STATES[1].flowPath],
  ]);
});

test("manifest builder requires 44 unique screenshots and records current full provenance", () => {
  const config = readAndroidConfig(root);
  const screenshots = makeScreenshotFixture(config);
  try {
    const manifest = buildAndroidManifest({
      root,
      config,
      device: { serial: "emulator-5556" },
      screenshotDirectory: screenshots.directory,
      startedAt: new Date("2026-07-19T20:00:00.000Z"),
      completedAt: new Date("2026-07-19T20:01:00.000Z"),
    });
    assert.equal(manifest.capture.serialProcessCount, 44);
    assert.equal(manifest.capture.bootstrapProcessCount, 1);
    assert.equal(manifest.screenshots.length, 44);
    assert.equal(new Set(manifest.screenshots.map((entry) => entry.sha256)).size, 44);
    assert.ok(manifest.screenshots.every((entry) => entry.width === 1080 && entry.height === 2400));
    assert.equal(manifest.source.androidAuditSourceSha256, computeAndroidSourceSha256(root, config));

    writeFileSync(path.join(screenshots.directory, `${config.states[1].screenshotName}.png`), pngBytes(1));
    assert.throws(() => buildAndroidManifest({
      root,
      config,
      device: { serial: "emulator-5556" },
      screenshotDirectory: screenshots.directory,
      startedAt: new Date(),
      completedAt: new Date(),
    }), /duplicate screenshot bytes/);
  } finally {
    rmSync(screenshots.root, { force: true, recursive: true });
  }
});

test("publication restores the prior Android pair when screenshot swap fails", () => {
  const fixture = makePublicationFixture();
  try {
    assert.throws(() => publishAndroidEvidence(fixture.root, fixture.config, fixture.stagedScreenshots, fixture.newManifest, {
      rename(source, destination) {
        if (source === fixture.stagedScreenshots && destination === fixture.canonicalScreenshots) throw new Error("injected screenshot swap failure");
        renameSync(source, destination);
      },
    }), /injected screenshot swap failure; prior canonical pair restored/);
    assertPriorPair(fixture);
    assert.deepEqual(publicationResidue(fixture), []);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("publication restores the prior Android pair when manifest publish fails", () => {
  const fixture = makePublicationFixture();
  try {
    assert.throws(() => publishAndroidEvidence(fixture.root, fixture.config, fixture.stagedScreenshots, fixture.newManifest, {
      rename(source, destination) {
        if (source.includes(".tmp-") && destination === fixture.manifestPath) throw new Error("injected manifest publish failure");
        renameSync(source, destination);
      },
    }), /injected manifest publish failure; prior canonical pair restored/);
    assertPriorPair(fixture);
    assert.deepEqual(publicationResidue(fixture), []);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("post-commit Android backup cleanup failure keeps the new pair and reports residue", () => {
  const fixture = makePublicationFixture();
  try {
    assert.throws(() => publishAndroidEvidence(fixture.root, fixture.config, fixture.stagedScreenshots, fixture.newManifest, {
      remove(target, options) {
        if (target.includes(".screenshots-backup-")) throw new Error("injected backup cleanup failure");
        rmSync(target, options);
      },
    }), /pair was committed.*backup cleanup failed.*not rolled back.*transaction residue remains.*injected backup cleanup failure/);
    assert.equal(readFileSync(path.join(fixture.canonicalScreenshots, "capture.png"), "utf8"), "new screenshot");
    assert.deepEqual(JSON.parse(readFileSync(fixture.manifestPath, "utf8")), fixture.newManifest);
    assert.deepEqual(publicationResidue(fixture).map((entry) => entry.replace(/\d+$/, "PID")), [".screenshots-backup-PID"]);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("historical Android packet maps all 44 exact flows but is explicitly stale", () => {
  const config = readAndroidConfig(root);
  const manifest = JSON.parse(readFileSync(path.join(root, config.manifestPath), "utf8"));
  assert.equal(manifest.status, "stale_recapture_required");
  assert.deepEqual(manifest.visualReview, { approvedPacketComparison: "not_comparable", accepted: false });
  assert.equal(manifest.capture.serialProcessCount, 44);
  assert.equal(manifest.screenshots.length, 44);
  assert.deepEqual(manifest.screenshots.map((entry) => entry.stateId), config.states.map((entry) => entry.stateId));
  assert.deepEqual(manifest.screenshots.map((entry) => entry.flowPath), config.states.map((entry) => entry.flowPath));
  assert.equal(new Set(manifest.screenshots.map((entry) => entry.sha256)).size, 44);
  assert.ok(manifest.screenshots.every((entry) => entry.width === 1080 && entry.height === 2400));
  assert.match(manifest.source.androidAuditSourceSha256, /^[0-9a-f]{64}$/);
  assert.notEqual(manifest.source.androidAuditSourceSha256, computeAndroidSourceSha256(root, config));
  assert.ok(manifest.screenshots.every((entry) => entry.screenshotPath.startsWith(`${config.outputDirectory}/screenshots/`)));
});

function makeConfigFixture() {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "patternly-android-config-"));
  const config = structuredClone(readAndroidConfig(root));
  for (const relativePath of [config.bootstrapFlow, ...config.states.map((entry) => entry.flowPath)]) {
    const destination = path.join(fixtureRoot, relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, readFileSync(path.join(root, relativePath)));
  }
  return { root: fixtureRoot, config };
}

function makeScreenshotFixture(config) {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "patternly-android-screenshots-"));
  const directory = path.join(fixtureRoot, "screenshots");
  mkdirSync(directory, { recursive: true });
  config.states.forEach((entry, index) => writeFileSync(path.join(directory, `${entry.screenshotName}.png`), pngBytes(index + 1)));
  return { root: fixtureRoot, directory };
}

function pngBytes(uniqueByte) {
  const png = Buffer.alloc(25);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png);
  Buffer.from("IHDR").copy(png, 12);
  png.writeUInt32BE(1080, 16);
  png.writeUInt32BE(2400, 20);
  png[24] = uniqueByte;
  return png;
}

function makePublicationFixture() {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "patternly-android-publish-"));
  const config = {
    outputDirectory: "evidence/android",
    manifestPath: "audit/android-manifest.json",
  };
  const outputRoot = path.join(fixtureRoot, config.outputDirectory);
  const canonicalScreenshots = path.join(outputRoot, "screenshots");
  const manifestPath = path.join(fixtureRoot, config.manifestPath);
  const stagedScreenshots = path.join(fixtureRoot, "staging", "screenshots");
  mkdirSync(canonicalScreenshots, { recursive: true });
  mkdirSync(stagedScreenshots, { recursive: true });
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(path.join(canonicalScreenshots, "capture.png"), "prior screenshot");
  writeFileSync(manifestPath, `${JSON.stringify({ evidence: "prior" })}\n`);
  writeFileSync(path.join(stagedScreenshots, "capture.png"), "new screenshot");
  return {
    root: fixtureRoot,
    config,
    outputRoot,
    canonicalScreenshots,
    manifestPath,
    stagedScreenshots,
    newManifest: { evidence: "new" },
  };
}

function assertPriorPair(fixture) {
  assert.equal(readFileSync(path.join(fixture.canonicalScreenshots, "capture.png"), "utf8"), "prior screenshot");
  assert.deepEqual(JSON.parse(readFileSync(fixture.manifestPath, "utf8")), { evidence: "prior" });
}

function publicationResidue(fixture) {
  return [
    ...readdirSync(fixture.outputRoot).filter((entry) => entry.includes("backup") || entry.includes("tmp")),
    ...readdirSync(path.dirname(fixture.manifestPath)).filter((entry) => entry.includes("backup") || entry.includes("tmp")),
  ].sort();
}
