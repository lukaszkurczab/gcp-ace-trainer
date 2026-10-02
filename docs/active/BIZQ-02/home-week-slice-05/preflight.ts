import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import ts from "typescript";
import { createTrainingAttempt } from "../../../../src/domain";
import { addTrainingAttempt, getTrainingAttempts } from "../../../../src/storage/repositories";
import { installMemoryStorage } from "../../../../src/testing/journalTestSupport";
import { contentPackageRuntimeOwner } from "../../../../src/application/contentPackageRuntimeOwner";
import { modeLabel, relativeDay } from "../../../../src/features/home/tabs/activityPresentation";

// Executes the actual private Home functions from the pinned pre-change commit.
// React Native rendering and SDK/storage fidelity are not claimed by this probe.
const BASE = "1515a3191514552f93cac058fb6c2e46a47e68ce";
const source = execFileSync("git", ["show", `${BASE}:src/features/home/tabs/HomeTab.tsx`], { encoding: "utf8" });
const functions = source.slice(source.indexOf("function buildOverviewMetrics("), source.indexOf("const createStyles ="));
assert.ok(functions.includes("function startOfUtcWeek("));
const TRACK = "coding-interview-dsa-problem-solving";

async function recordedAnswer(id: string, answeredAt: string) {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK).track;
  const item = { trackId: TRACK, questionId: track.questions[0]!.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  await addTrainingAttempt(createTrainingAttempt({
    id, trackId: TRACK, sessionId: id, modeId: "coding-interview-guided-practice", occurrenceId: id,
    item, response: { answer: "fixture" }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt,
  }));
}

function currentHomeWeek(now: string, attempts: unknown[]) {
  class ControlledDate extends Date {
    constructor(value?: string | number) { super(value ?? now); }
    static now() { return Date.parse(now); }
  }
  const js = ts.transpile(functions, { target: ts.ScriptTarget.ES2022 });
  return vm.runInNewContext(`${js}; buildOverviewMetrics(trackId, [], attempts)[0].value`, {
    Date: ControlledDate, trackId: TRACK, attempts, modeLabel, relativeDay,
  });
}

test("actual Home counts Monday local answers before UTC Monday", async () => {
  installMemoryStorage();
  await recordedAnswer("local-monday", "2026-09-27T22:10:00.000Z");
  // Europe/Warsaw Monday 00:10; UTC still Sunday. Home uses UTC regardless of TZ.
  assert.equal(currentHomeWeek("2026-09-28T07:00:00.000Z", (await getTrainingAttempts()).value), "1 answered");
});

test("actual Home does not count a future answer in this week", async () => {
  installMemoryStorage();
  await recordedAnswer("future", "2026-10-03T12:00:00.000Z");
  assert.equal(currentHomeWeek("2026-10-02T12:00:00.000Z", (await getTrainingAttempts()).value), "No activity yet");
});
