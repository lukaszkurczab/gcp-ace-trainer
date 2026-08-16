import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const root = process.cwd();

function run(enforce = false) {
  try {
    return {
      status: 0,
      output: execFileSync("node", ["scripts/releaseGate.mjs", ...(enforce ? ["--enforce"] : [])], { cwd: root, encoding: "utf8" }),
    };
  } catch (error) {
    return { status: error.status, output: error.stdout };
  }
}

test("launch readiness report is deterministic and exposes the unresolved release blockers", () => {
  const first = run();
  const second = run();
  assert.equal(first.status, 0);
  assert.equal(first.output, second.output);
  const report = JSON.parse(first.output);
  assert.equal(report.schemaVersion, "patternly-launch-readiness-v1");
  assert.equal(report.status, "not_ready");
  assert.equal(report.launchTrackIds.length, 8);
  assert.ok(report.blockers.some((blocker) => blocker.kind === "unreadable_content_readiness_report")
    || report.blockers.some((blocker) => blocker.kind === "canonical_source_not_ready" && blocker.trackId === "microsoft-azure-administrator-associate-az-104")
    || report.blockers.some((blocker) => blocker.kind === "human_editorial_approval_missing" && blocker.trackId === "microsoft-azure-administrator-associate-az-104"));
  assert.ok(report.blockers.some((blocker) => blocker.kind === "application_release_lock_scope_mismatch"));
  assert.ok(report.blockers.some((blocker) => blocker.kind === "external_release_evidence_missing"));
});

test("release gate fails while the readiness report contains blockers", () => {
  const result = run(true);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.output).status, "not_ready");
});
