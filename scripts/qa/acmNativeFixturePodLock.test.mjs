import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { resolveCocoaPodsRuntime } from "./acmNativeFixtureCocoaPods.mjs";
import { assertRemotePodLockUnchanged } from "./acmNativeFixturePodLock.mjs";

const require = createRequire(import.meta.url);
const yaml = require("yaml");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("resolves the verified Ruby and CocoaPods versions in one private command environment", () => {
  const runtime = resolveCocoaPodsRuntime(root);
  assert.match(runtime.command, /\/versions\/3\.3\.6\/bin\/ruby$/u);
  assert.equal(runtime.env.RBENV_VERSION, "3.3.6");
  assert.equal(runtime.env.GEM_HOME?.includes("cocoapods"), true);
  assert.match(runtime.args[0], /\/pod$/u);
});

function baselineLock() {
  return {
    PODS: [
      "React-Core (0.86.3)",
      { "PatternlyForegroundClock (1.0.0)": ["NitroMmkv (= 4.3.2)", "NitroModules (= 0.36.1)"] },
    ],
    DEPENDENCIES: ["PatternlyForegroundClock (from `../native/foreground-clock`)", "PatternlyForegroundClockExtra (= 1.0.0)", "React-Core (= 0.86.3)"],
    "EXTERNAL SOURCES": { PatternlyForegroundClock: { path: "../native/foreground-clock" } },
    "SPEC CHECKSUMS": { PatternlyForegroundClock: "local-before", "React-Core": "remote-core", NitroMmkv: "remote-mmkv" },
    "SPEC REPOS": { trunk: { "React-Core": ["0.86.3"], NitroMmkv: ["4.3.2"] } },
    COCOAPODS: "1.16.2",
  };
}

function withFixtureCoreDependency(lock) {
  const updated = structuredClone(lock);
  updated.PODS.find((entry) => entry && typeof entry === "object" && Object.hasOwn(entry, "PatternlyForegroundClock (1.0.0)"))["PatternlyForegroundClock (1.0.0)"].push("React-Core");
  updated["SPEC CHECKSUMS"].PatternlyForegroundClock = "local-after";
  return updated;
}

function assertLockPasses(before, after) {
  assert.doesNotThrow(() => assertRemotePodLockUnchanged(yaml.stringify(before), yaml.stringify(after)));
}

test("accepts only the pinned React-Core addition on the versioned fixture pod", () => {
  const before = baselineLock();
  assertLockPasses(before, withFixtureCoreDependency(before));
});

test("rejects any remote spec checksum change", () => {
  const before = baselineLock();
  const after = withFixtureCoreDependency(before);
  after["SPEC CHECKSUMS"]["React-Core"] = "changed-remote-core";
  assert.throws(() => assertRemotePodLockUnchanged(yaml.stringify(before), yaml.stringify(after)), /changed a remote Pod/u);
});

test("rejects duplicate versioned fixture pod entries", () => {
  const before = baselineLock();
  const after = withFixtureCoreDependency(before);
  after.PODS.push({ "PatternlyForegroundClock (1.0.0)": ["React-Core"] });
  assert.throws(() => assertRemotePodLockUnchanged(yaml.stringify(before), yaml.stringify(after)), /local foreground-clock/u);
});

test("rejects a changed fixture pod version", () => {
  const before = baselineLock();
  const after = withFixtureCoreDependency(before);
  after.PODS = after.PODS.map((entry) => entry && typeof entry === "object" && Object.hasOwn(entry, "PatternlyForegroundClock (1.0.0)")
    ? { "PatternlyForegroundClock (2.0.0)": entry["PatternlyForegroundClock (1.0.0)"] }
    : entry);
  assert.throws(() => assertRemotePodLockUnchanged(yaml.stringify(before), yaml.stringify(after)), /local foreground-clock/u);
});

test("does not treat a remote pod with a shared name prefix as the fixture pod", () => {
  const before = baselineLock();
  const after = withFixtureCoreDependency(before);
  after.DEPENDENCIES[1] = "PatternlyForegroundClockExtra (= 2.0.0)";
  assert.throws(() => assertRemotePodLockUnchanged(yaml.stringify(before), yaml.stringify(after)), /changed a remote Pod/u);
});
