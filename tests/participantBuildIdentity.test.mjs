import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import {
  buildParticipantBuildIdentity,
  isParticipantBuildInput,
  PARTICIPANT_BUILD_IDENTITY_SCHEMA_VERSION,
} from "../scripts/participantBuildIdentity.mjs";

test("user-testing evidence summary uses only the versioned participant-build identity", () => {
  const runner = readFileSync("scripts/runUserTestingReadinessEvidence.mjs", "utf8");

  assert.match(
    runner,
    /import \{ buildParticipantBuildIdentity \} from "\.\/participantBuildIdentity\.mjs";/,
  );
  assert.match(runner, /const sourceIdentity = buildParticipantBuildIdentity\(REPO_ROOT\);/);
  assert.match(runner, /schema_version: 2/);
  assert.doesNotMatch(
    runner,
    /source_tree_sha256|status_sha256|working_tree_clean|git", \["ls-files"/,
  );
});

test("participant-build boundary includes runtime inputs and excludes evidence records", () => {
  for (const path of [
    "App.tsx",
    "app.json",
    "metro.config.js",
    "package-lock.json",
    "plugins/withPrivacyBoundary.js",
    "src/features/Home.tsx",
    "src/assets/icon.svg",
    "integration/contracts/content-release/release.lock.json",
  ]) {
    assert.equal(isParticipantBuildInput(path), true, path);
  }
  for (const path of [
    "docs/user-testing/pre-recruitment-acceptance.md",
    "artifacts/user-testing-readiness/run/summary.json",
    "tests/participantBuildIdentity.test.mjs",
    ".maestro/user-testing/algorithms-core-journey.yaml",
    "src/.DS_Store",
    "../src/escaped.ts",
  ]) {
    assert.equal(isParticipantBuildInput(path), false, path);
  }
});

test("participant-build identity changes for runtime, release-lock, untracked, and deletion inputs but not docs", () => {
  const repository = mkdtempSync(join(tmpdir(), "patternly-participant-build-"));
  try {
    write(repository, "App.tsx", "export default function App() { return null; }\n");
    write(repository, "package.json", "{\"name\":\"patternly\"}\n");
    write(repository, "src/runtime.ts", "export const value = 1;\n");
    write(repository, "docs/acceptance.md", "not completed\n");
    write(
      repository,
      "integration/contracts/content-release/release.lock.json",
      "{\"releaseId\":\"patternly-core-0015\"}\n",
    );
    git(repository, "init");
    git(repository, "config", "user.email", "patternly-test@example.invalid");
    git(repository, "config", "user.name", "Patternly Test");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "fixture");

    const initial = buildParticipantBuildIdentity(repository);
    assert.equal(
      initial.identity_schema_version,
      PARTICIPANT_BUILD_IDENTITY_SCHEMA_VERSION,
    );

    write(repository, "docs/acceptance.md", "completed\n");
    assert.deepEqual(buildParticipantBuildIdentity(repository), initial);

    write(repository, "src/runtime.ts", "export const value = 2;\n");
    const runtimeChanged = buildParticipantBuildIdentity(repository);
    assert.notEqual(
      runtimeChanged.participant_build_inputs_sha256,
      initial.participant_build_inputs_sha256,
    );

    write(repository, "src/untracked.ts", "export const untracked = true;\n");
    const untrackedAdded = buildParticipantBuildIdentity(repository);
    assert.equal(untrackedAdded.input_count, runtimeChanged.input_count + 1);
    assert.notEqual(
      untrackedAdded.participant_build_inputs_sha256,
      runtimeChanged.participant_build_inputs_sha256,
    );

    unlinkSync(join(repository, "src/runtime.ts"));
    const trackedDeleted = buildParticipantBuildIdentity(repository);
    assert.notEqual(
      trackedDeleted.participant_build_inputs_sha256,
      untrackedAdded.participant_build_inputs_sha256,
    );

    write(
      repository,
      "integration/contracts/content-release/release.lock.json",
      "{\"releaseId\":\"patternly-core-0016\"}\n",
    );
    const releaseChanged = buildParticipantBuildIdentity(repository);
    assert.notEqual(
      releaseChanged.participant_build_inputs_sha256,
      trackedDeleted.participant_build_inputs_sha256,
    );
  } finally {
    rmSync(repository, { force: true, recursive: true });
  }
});

function git(repository, ...args) {
  execFileSync("git", args, { cwd: repository, stdio: "pipe" });
}

function write(repository, relativePath, contents) {
  const absolutePath = join(repository, relativePath);
  mkdirSync(join(absolutePath, ".."), { recursive: true });
  writeFileSync(absolutePath, contents, "utf8");
}
