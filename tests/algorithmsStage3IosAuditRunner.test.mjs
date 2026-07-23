import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { canonicalIosCaptureEntries, collectUxUiAuditConfigErrors, readAuditConfig } from "../scripts/validateUxUiAuditConfig.mjs";
import {
  canonicalAuditSourcePaths,
  computeAuditSourceSha256,
  findAvailableIosSimulator,
  parseGitStatusPorcelainZ,
  parseRunnerArgs,
  pngDimensions,
  publishCapture,
  run,
} from "../scripts/runAlgorithmsStage3IosAudit.mjs";
import {
  collectAuditRenderGraph,
  computeCanonicalAuditSourceSha256,
} from "../scripts/auditRenderProvenance.mjs";

const root = process.cwd();
const udid = "57EE62FE-3589-43E9-A8BD-EB637F18B919";

test("iOS audit runner requires exactly one explicit, valid --udid argument", () => {
  assert.throws(() => parseRunnerArgs([]), /Usage:/);
  assert.throws(() => parseRunnerArgs(["--udid"]), /Usage:/);
  assert.throws(() => parseRunnerArgs(["--device", udid]), /Usage:/);
  assert.throws(() => parseRunnerArgs(["--udid", "booted"]), /Invalid iOS simulator UDID/);
  assert.throws(() => parseRunnerArgs(["--udid", udid, "extra"]), /Usage:/);
  assert.deepEqual(parseRunnerArgs(["--udid", udid.toLowerCase()]), { udid });
});

test("iOS audit runner rejects an unavailable or non-booted explicit simulator before capture", () => {
  const unavailable = () => ({ status: 0, stdout: JSON.stringify({ devices: {} }), stderr: "" });
  assert.throws(() => findAvailableIosSimulator(udid, unavailable), /is not available/);
  const shutdown = () => ({ status: 0, stdout: JSON.stringify({ devices: { "iOS-18-6": [{ name: "iPhone", udid, state: "Shutdown" }] } }), stderr: "" });
  assert.throws(() => findAvailableIosSimulator(udid, shutdown), /is Shutdown; boot it before capture/);
});

test("canonical config assigns 44 unique exact iOS flows without manual capture", () => {
  const config = readAuditConfig(root);
  assert.deepEqual(collectUxUiAuditConfigErrors(root, config), []);
  const states = config.screens.flatMap((screen) => screen.states);
  const iosFlows = config.flows.filter((flow) => flow.platform === "ios");
  assert.equal(states.length, 44);
  assert.equal(iosFlows.length, 44);
  assert.equal(new Set(iosFlows.map((flow) => flow.id)).size, 44);
  assert.equal(new Set(states.map((state) => state.capturedBy)).size, 44);
  assert.ok(states.every((state) => !Object.hasOwn(state, "manualCapture")));
});

test("validator rejects duplicate IDs and every mutated exact-state invariant", () => {
  const fixtureRoot = makeFixtureRoot();
  try {
    const original = readAuditConfig(fixtureRoot);
    const cases = [
      {
        expected: /duplicate flow id algorithms-ios-p-01/,
        mutate: (config) => config.flows.push(structuredClone(config.flows[0])),
      },
      {
        expected: /state P-01 must map to exact flow algorithms-ios-p-01/,
        mutate: (config) => { config.screens[0].states[0].capturedBy = "algorithms-ios-p-02"; },
      },
      {
        expected: /flow algorithms-ios-p-01 must use platform ios/,
        mutate: (config) => { config.flows.find((flow) => flow.id === "algorithms-ios-p-01").platform = "android"; },
      },
      {
        expected: /flow algorithms-ios-p-01 must use exact path/,
        mutate: (config) => { config.flows.find((flow) => flow.id === "algorithms-ios-p-01").path = ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-states/p-02.yaml"; },
      },
      {
        expected: /states\[P-01\] must not use manualCapture/,
        mutate: (config) => { config.screens[0].states[0].manualCapture = "audit/algorithms-ui/fixtureCatalog.ts"; },
      },
    ];
    for (const testCase of cases) {
      const config = structuredClone(original);
      testCase.mutate(config);
      assert.match(collectUxUiAuditConfigErrors(fixtureRoot, config).join("\n"), testCase.expected);
    }

    mutateFlow(fixtureRoot, "p-01.yaml", (source) => source.replace("auditState=P-01", "auditState=P-99"));
    assert.match(collectUxUiAuditConfigErrors(fixtureRoot, original).join("\n"), /must deep-link exact auditState P-01/);
    restoreFlow(fixtureRoot, "p-01.yaml");

    mutateFlow(fixtureRoot, "p-01.yaml", (source) => source.replaceAll("algorithms-audit-current-P-01", "algorithms-audit-current-P-99"));
    assert.match(collectUxUiAuditConfigErrors(fixtureRoot, original).join("\n"), /must assert exact selector for P-01/);
    restoreFlow(fixtureRoot, "p-01.yaml");

    mutateFlow(fixtureRoot, "p-01.yaml", (source) => source.replace("- extendedWaitUntil:", "- runFlow: conditional-bootstrap.yaml\n- extendedWaitUntil:"));
    assert.match(collectUxUiAuditConfigErrors(fixtureRoot, original).join("\n"), /must contain only exact state deep-link, selector wait, and screenshot commands/);
    restoreFlow(fixtureRoot, "p-01.yaml");

    const bootstrapPath = path.join(fixtureRoot, ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-bootstrap.yaml");
    writeFileSync(bootstrapPath, readFileSync(bootstrapPath, "utf8").replace("- extendedWaitUntil:", "- runFlow: optional-overlay.yaml\n- extendedWaitUntil:"));
    assert.match(collectUxUiAuditConfigErrors(fixtureRoot, original).join("\n"), /iosBootstrapFlow must only launch the audit host and wait for exact P-01 readiness/);
    cpSync(path.join(root, ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-bootstrap.yaml"), bootstrapPath);

    const p01Name = screenshotName(fixtureRoot, "p-01.yaml");
    mutateFlow(fixtureRoot, "p-02.yaml", (source) => source.replace(/^- takeScreenshot: ".*"$/m, `- takeScreenshot: "${p01Name}"`));
    assert.match(collectUxUiAuditConfigErrors(fixtureRoot, original).join("\n"), /duplicate screenshot name/);
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test("runner failure does not publish a success manifest", () => {
  const fixtureRoot = makeFixtureRoot();
  let maestroCalls = 0;
  const spawn = (command) => {
    if (command === "xcrun") return { status: 0, stdout: JSON.stringify({ devices: { "iOS-18-6": [{ name: "iPhone 16 Pro", udid, state: "Booted" }] } }), stderr: "" };
    if (command === "maestro") {
      maestroCalls += 1;
      return { status: maestroCalls === 1 ? 0 : 7, stdout: "", stderr: "" };
    }
    throw new Error(`Unexpected command ${command}`);
  };
  try {
    assert.throws(() => run(["--udid", udid], fixtureRoot, spawn), /Capture failed for P-01.*success manifest was not published/);
    assert.equal(maestroCalls, 2);
    assert.throws(() => readFileSync(path.join(fixtureRoot, "audit/algorithms-ui/s3-ios-capture-manifest.json")), /ENOENT/);
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test("PNG dimensions are read from the canonical IHDR fields", () => {
  const bytes = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes, 0);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(402, 16);
  bytes.writeUInt32BE(874, 20);
  assert.deepEqual(pngDimensions(bytes), { width: 402, height: 874 });
  assert.throws(() => pngDimensions(Buffer.alloc(24)), /not a valid PNG/);
});

test("NUL-delimited porcelain status preserves exact index and worktree XY bytes", () => {
  const parsed = parseGitStatusPorcelainZ(" M worktree-only.ts\0M  index-only.ts\0MM both.ts\0?? untracked.ts\0");
  assert.deepEqual(parsed, [" M worktree-only.ts", "M  index-only.ts", "MM both.ts", "?? untracked.ts"]);
  assert.notEqual(parsed[0], parsed[1]);
  assert.equal(JSON.parse(JSON.stringify(parsed))[0], " M worktree-only.ts");
});

test("audit source provenance covers the exact executable capture path", () => {
  const config = readAuditConfig(root);
  const entries = canonicalIosCaptureEntries(root, config);
  const paths = canonicalAuditSourcePaths(root, config, entries);
  const required = [
    "scripts/auditRenderProvenance.mjs",
    "scripts/runAlgorithmsStage3IosAudit.mjs",
    "scripts/validateUxUiAuditConfig.mjs",
    "package.json",
    ".audit/ux-ui/audit.config.json",
    ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-bootstrap.yaml",
    "audit/algorithms-ui/AlgorithmsVisualHarness.tsx",
    "audit/algorithms-ui/App.tsx",
    "audit/algorithms-ui/fixtureCatalog.ts",
    "audit/algorithms-ui/index.ts",
    "src/components/Button.tsx",
    "src/components/Screen.tsx",
    "src/assets/icons/alert-triangle.svg",
    "src/features/algorithms/session/SessionShell.tsx",
    "src/features/algorithms/session/sessionAccessibility.ts",
    "src/features/practice/PracticeSessionSurface.tsx",
    "src/features/practice/PracticeResponseControls.tsx",
    "src/features/practice/PracticeFeedbackBlock.tsx",
    "src/features/simulation/SimulationSessionSurface.tsx",
    ...entries.map((entry) => entry.flowPath),
  ];
  assert.ok(required.every((sourcePath) => paths.includes(sourcePath)));
  assert.equal(new Set(paths).size, paths.length);
  assert.match(computeAuditSourceSha256(root, config, entries), /^[0-9a-f]{64}$/);
});

test("shared render graph is deterministic, cycle-safe, and parses type-only imports, re-exports, require, and dynamic import", () => {
  const fixtureRoot = makeProvenanceFixture();
  try {
    writeFileSync(path.join(fixtureRoot, "entry.ts"), [
      'import type { Model } from "./types";',
      'export * from "./cycle/a";',
      'const required = require("./required");',
      'void import("./dynamic");',
      "export const model: Model = { id: 1 };",
      "void required;",
      "",
    ].join("\n"));
    writeFileSync(path.join(fixtureRoot, "types.ts"), "export type Model = { id: number };\n");
    writeFileSync(path.join(fixtureRoot, "required.js"), "module.exports = {};\n");
    writeFileSync(path.join(fixtureRoot, "dynamic.mjs"), "export {};\n");
    mkdirSync(path.join(fixtureRoot, "cycle"), { recursive: true });
    writeFileSync(path.join(fixtureRoot, "cycle/a.ts"), 'export * from "./b";\n');
    writeFileSync(path.join(fixtureRoot, "cycle/b.ts"), 'export * from "./a";\n');
    const first = collectAuditRenderGraph(fixtureRoot, ["entry.ts"]);
    const second = collectAuditRenderGraph(fixtureRoot, ["entry.ts"]);
    assert.deepEqual(first, ["cycle/a.ts", "cycle/b.ts", "dynamic.mjs", "entry.ts", "required.js", "types.ts"]);
    assert.deepEqual(second, first);
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test("shared provenance hash changes only for reachable canonical inputs", () => {
  const fixtureRoot = makeCanonicalProvenanceFixture();
  try {
    const platformInputs = ["platform/config.json"];
    const initial = computeCanonicalAuditSourceSha256(fixtureRoot, platformInputs);
    writeFileSync(path.join(fixtureRoot, "docs/unrelated.md"), "changed but unreachable\n");
    assert.equal(computeCanonicalAuditSourceSha256(fixtureRoot, platformInputs), initial);
    writeFileSync(path.join(fixtureRoot, "src/reachable.ts"), "export const reachable = 2;\n");
    assert.notEqual(computeCanonicalAuditSourceSha256(fixtureRoot, platformInputs), initial);
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test("shared render graph fails explicitly for missing and ambiguous relative imports", () => {
  const fixtureRoot = makeProvenanceFixture();
  try {
    writeFileSync(path.join(fixtureRoot, "entry.ts"), 'import "./missing";\n');
    assert.throws(() => collectAuditRenderGraph(fixtureRoot, ["entry.ts"]), /Missing relative import "\.\/missing" from entry\.ts/);
    writeFileSync(path.join(fixtureRoot, "entry.ts"), 'import "./duplicate";\n');
    writeFileSync(path.join(fixtureRoot, "duplicate.ts"), "export {};\n");
    writeFileSync(path.join(fixtureRoot, "duplicate.js"), "export {};\n");
    assert.throws(
      () => collectAuditRenderGraph(fixtureRoot, ["entry.ts"]),
      /Ambiguous relative import "\.\/duplicate" from entry\.ts; candidates: duplicate\.js, duplicate\.ts/,
    );
    writeFileSync(path.join(fixtureRoot, "entry.ts"), 'import "./unsupported.css";\n');
    writeFileSync(path.join(fixtureRoot, "unsupported.css"), "body {}\n");
    assert.throws(
      () => collectAuditRenderGraph(fixtureRoot, ["entry.ts"]),
      /Unsupported relative import extension "\.css" in entry\.ts: \.\/unsupported\.css/,
    );
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test("shared render graph rejects wrong-case directory segments on every filesystem", () => {
  const fixtureRoot = makeProvenanceFixture();
  try {
    mkdirSync(path.join(fixtureRoot, "Source"), { recursive: true });
    writeFileSync(path.join(fixtureRoot, "Source/value.ts"), "export {};\n");
    writeFileSync(path.join(fixtureRoot, "entry.ts"), 'import "./source/value";\n');
    assert.throws(
      () => collectAuditRenderGraph(fixtureRoot, ["entry.ts"]),
      /Case mismatch in relative import "\.\/source\/value" from entry\.ts: source must use Source/,
    );
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test("shared render graph rejects symlinks outside the real repository root and preserves internal lexical symlinks", () => {
  const fixtureRoot = makeProvenanceFixture();
  const outsideRoot = mkdtempSync(path.join(os.tmpdir(), "patternly-provenance-outside-"));
  try {
    writeFileSync(path.join(outsideRoot, "value.ts"), "export {};\n");
    symlinkSync(outsideRoot, path.join(fixtureRoot, "outside-link"), "dir");
    writeFileSync(path.join(fixtureRoot, "entry.ts"), 'import "./outside-link/value";\n');
    assert.throws(
      () => collectAuditRenderGraph(fixtureRoot, ["entry.ts"]),
      /outside-link resolves outside the real repository root/,
    );

    mkdirSync(path.join(fixtureRoot, "Source"), { recursive: true });
    writeFileSync(path.join(fixtureRoot, "Source/value.ts"), "export {};\n");
    symlinkSync(path.join(fixtureRoot, "Source"), path.join(fixtureRoot, "inside-link"), "dir");
    writeFileSync(path.join(fixtureRoot, "entry.ts"), 'import "./inside-link/value";\n');
    assert.deepEqual(collectAuditRenderGraph(fixtureRoot, ["entry.ts"]), ["entry.ts", "inside-link/value.ts"]);
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
    rmSync(outsideRoot, { force: true, recursive: true });
  }
});

test("publication restores the prior pair when screenshot swap fails", () => {
  const fixture = makePublicationFixture();
  try {
    assert.throws(() => publishCapture(fixture.root, fixture.outputRoot, fixture.stagedScreenshots, fixture.newManifest, {
      rename: (source, destination) => {
        if (source === fixture.stagedScreenshots) throw new Error("injected screenshot swap failure");
        renameSync(source, destination);
      },
    }), /injected screenshot swap failure; prior canonical pair restored/);
    assertPublicationPair(fixture, "old");
    assert.equal(existsSync(fixture.stagedScreenshots), true);
    assert.deepEqual(publicationResidue(fixture), []);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("publication restores the prior pair when manifest publish fails", () => {
  const fixture = makePublicationFixture();
  try {
    assert.throws(() => publishCapture(fixture.root, fixture.outputRoot, fixture.stagedScreenshots, fixture.newManifest, {
      rename: (source, destination) => {
        if (source.includes(".tmp-") && destination === fixture.manifestPath) throw new Error("injected manifest publish failure");
        renameSync(source, destination);
      },
    }), /injected manifest publish failure; prior canonical pair restored/);
    assertPublicationPair(fixture, "old");
    assert.equal(existsSync(fixture.stagedScreenshots), false);
    assert.deepEqual(publicationResidue(fixture), []);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("post-commit backup cleanup failure keeps the new pair and reports residue", () => {
  const fixture = makePublicationFixture();
  try {
    assert.throws(() => publishCapture(fixture.root, fixture.outputRoot, fixture.stagedScreenshots, fixture.newManifest, {
      remove: (target, options) => {
        if (target.includes(".screenshots-backup-")) throw new Error("injected backup cleanup failure");
        rmSync(target, options);
      },
    }), /pair was committed.*backup cleanup failed.*not rolled back.*injected backup cleanup failure/);
    assertPublicationPair(fixture, "new");
    assert.deepEqual(publicationResidue(fixture).map((entry) => entry.replace(/\d+$/, "PID")), [".screenshots-backup-PID"]);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});

test("historical iOS packet maps all exact flows but is explicitly stale", () => {
  const config = readAuditConfig(root);
  const expected = canonicalIosCaptureEntries(root, config);
  const manifest = JSON.parse(readFileSync(path.join(root, "audit/algorithms-ui/s3-ios-capture-manifest.json"), "utf8"));
  assert.equal(manifest.status, "stale_recapture_required");
  assert.deepEqual(manifest.visualReview, { approvedPacketComparison: "not_comparable", accepted: false });
  assert.equal(manifest.capture.serialProcessCount, 44);
  assert.equal(manifest.capture.bootstrapProcessCount, 1);
  assert.equal(manifest.screenshots.length, 44);
  assert.deepEqual(manifest.screenshots.map(({ stateId, flowId, flowPath }) => ({ stateId, flowId, flowPath })), expected.map(({ stateId, flowId, flowPath }) => ({ stateId, flowId, flowPath })));
  assert.equal(new Set(manifest.screenshots.map((entry) => entry.screenshotPath)).size, 44);
  assert.equal(new Set(manifest.screenshots.map((entry) => entry.sha256)).size, 44);
  assert.ok(manifest.screenshots.every((entry) => /^[0-9a-f]{64}$/.test(entry.sha256) && entry.width === 1206 && entry.height === 2622));
  assert.match(manifest.source.auditSourceSha256, /^[0-9a-f]{64}$/);
  assert.notEqual(manifest.source.auditSourceSha256, computeAuditSourceSha256(root, config, expected));
  assert.equal(manifest.source.worktreeStatusFormat, "git status --porcelain=v1 -z");
  assert.ok(manifest.source.worktreeStatus.every((entry) => /^[ MADRCU?!]{2} /.test(entry)));
});

function makeFixtureRoot() {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "patternly-ios-audit-"));
  cpSync(path.join(root, ".audit"), path.join(fixtureRoot, ".audit"), { recursive: true });
  mkdirSync(path.join(fixtureRoot, "audit/algorithms-ui"), { recursive: true });
  cpSync(path.join(root, "audit/algorithms-ui/fixtureCatalog.ts"), path.join(fixtureRoot, "audit/algorithms-ui/fixtureCatalog.ts"));
  cpSync(path.join(root, "package.json"), path.join(fixtureRoot, "package.json"));
  return fixtureRoot;
}

function makeProvenanceFixture() {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "patternly-provenance-"));
  mkdirSync(path.join(fixtureRoot, "docs"), { recursive: true });
  return fixtureRoot;
}

function makeCanonicalProvenanceFixture() {
  const fixtureRoot = makeProvenanceFixture();
  for (const relativePath of [
    "audit/algorithms-ui/index.ts",
    "audit/algorithms-ui/App.tsx",
    "audit/algorithms-ui/AlgorithmsVisualHarness.tsx",
    "audit/algorithms-ui/fixtureCatalog.ts",
    "audit/algorithms-ui/app.json",
    "audit/algorithms-ui/metro.config.js",
    "scripts/auditRenderProvenance.mjs",
    "platform/config.json",
    "src/reachable.ts",
  ]) mkdirSync(path.dirname(path.join(fixtureRoot, relativePath)), { recursive: true });
  writeFileSync(path.join(fixtureRoot, "audit/algorithms-ui/index.ts"), 'import "../../src/reachable";\n');
  writeFileSync(path.join(fixtureRoot, "audit/algorithms-ui/App.tsx"), "export {};\n");
  writeFileSync(path.join(fixtureRoot, "audit/algorithms-ui/AlgorithmsVisualHarness.tsx"), "export {};\n");
  writeFileSync(path.join(fixtureRoot, "audit/algorithms-ui/fixtureCatalog.ts"), "export {};\n");
  writeFileSync(path.join(fixtureRoot, "audit/algorithms-ui/app.json"), "{}\n");
  writeFileSync(path.join(fixtureRoot, "audit/algorithms-ui/metro.config.js"), "module.exports = {};\n");
  writeFileSync(path.join(fixtureRoot, "scripts/auditRenderProvenance.mjs"), "canonical provenance module\n");
  writeFileSync(path.join(fixtureRoot, "platform/config.json"), "{}\n");
  writeFileSync(path.join(fixtureRoot, "src/reachable.ts"), "export const reachable = 1;\n");
  writeFileSync(path.join(fixtureRoot, "docs/unrelated.md"), "unrelated\n");
  return fixtureRoot;
}

function mutateFlow(fixtureRoot, filename, mutate) {
  const flowPath = path.join(fixtureRoot, ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-states", filename);
  writeFileSync(flowPath, mutate(readFileSync(flowPath, "utf8")));
}

function restoreFlow(fixtureRoot, filename) {
  cpSync(path.join(root, ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-states", filename), path.join(fixtureRoot, ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-states", filename));
}

function screenshotName(fixtureRoot, filename) {
  const source = readFileSync(path.join(fixtureRoot, ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-states", filename), "utf8");
  return source.match(/^- takeScreenshot: "([^"]+)"$/m)[1];
}

function makePublicationFixture() {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "patternly-ios-publish-"));
  const outputRoot = path.join(fixtureRoot, "docs/audit/maestro");
  const canonicalScreenshots = path.join(outputRoot, "screenshots");
  const stagedScreenshots = path.join(fixtureRoot, "staging/screenshots");
  const manifestPath = path.join(fixtureRoot, "audit/algorithms-ui/s3-ios-capture-manifest.json");
  mkdirSync(canonicalScreenshots, { recursive: true });
  mkdirSync(stagedScreenshots, { recursive: true });
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(path.join(canonicalScreenshots, "generation.txt"), "old");
  writeFileSync(path.join(stagedScreenshots, "generation.txt"), "new");
  writeFileSync(manifestPath, `${JSON.stringify({ generation: "old" })}\n`);
  return { root: fixtureRoot, outputRoot, canonicalScreenshots, stagedScreenshots, manifestPath, newManifest: { generation: "new" } };
}

function assertPublicationPair(fixture, generation) {
  assert.equal(JSON.parse(readFileSync(fixture.manifestPath, "utf8")).generation, generation);
  assert.equal(readFileSync(path.join(fixture.canonicalScreenshots, "generation.txt"), "utf8"), generation);
}

function publicationResidue(fixture) {
  return [
    ...readdirSync(fixture.outputRoot).filter((entry) => entry.includes("backup") || entry.includes("tmp")),
    ...readdirSync(path.dirname(fixture.manifestPath)).filter((entry) => entry.includes("backup") || entry.includes("tmp")),
  ].sort();
}
