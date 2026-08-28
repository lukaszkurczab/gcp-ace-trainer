import assert from "node:assert/strict";
import test from "node:test";

import { CodingInterviewFamilyRuntime } from "../../application/coding-interview";
import { getCodingPackageTestCatalog } from "../../testing/contentPackageRuntimeTestSupport";
import { prepareBundledTestPackages } from "../../testing/contentPackageRuntimeTestSupport";
import { createTrainingAttempt, type TrainingSession } from "../../domain";
import { resolveAlgorithmsConditionalReinsertPlan } from "./";

const NOW = "2026-01-08T00:00:00.000Z";

async function prepareCustomPractice() {
  await prepareBundledTestPackages();
  const catalog = getCodingPackageTestCatalog();
  const runtime = new CodingInterviewFamilyRuntime(catalog, undefined, "coding-interview-taxonomy-v2");
  const prepared = await runtime.prepare({
    attempts: [],
    modeId: "coding-interview-custom-practice",
    now: NOW,
    request: {
      feedbackMode: "afterEachAnswer",
      requestedLength: 10,
      scope: { roadmapNodeId: catalog.getItems()[0]!.taxonomy.roadmapNodeId },
      sessionId: "custom-practice-reinsert",
    },
    reviews: [],
    trackId: "coding-interview-dsa-problem-solving",
  });
  return { catalog, runtime, session: prepared.session };
}

function durableAttempt(session: TrainingSession, index: number, result: "correct" | "incorrect") {
  const occurrence = session.itemOrder[index]!;
  return createTrainingAttempt({
    answeredAt: NOW,
    committedAt: NOW,
    id: `${session.id}:attempt:${index}`,
    item: occurrence.item,
    modeId: session.modeId,
    occurrenceId: occurrence.occurrenceId,
    response: { kind: "test-response" },
    result: { earnedPoints: result === "correct" ? 1 : 0, kind: result, maxPoints: 1 },
    reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [] },
    sessionId: session.id,
    trackId: "coding-interview-dsa-problem-solving",
  });
}

test("Custom Practice resolves eligible and skipped reinserts only from its profile-owned immutable slots", async () => {
  const { session } = await prepareCustomPractice();
  const slot = session.conditionalReinsertSlots?.[0];
  assert.ok(slot);
  assert.equal(session.configurationSnapshot.reinsertEnabled, true);

  const eligible = resolveAlgorithmsConditionalReinsertPlan({
    materializedAttempts: [
      durableAttempt(session, 0, "incorrect"),
      durableAttempt(session, 1, "correct"),
      durableAttempt(session, 2, "correct"),
      durableAttempt(session, 3, "correct"),
    ],
    session,
  });
  assert.equal(eligible.slots[0]?.branch, "exact_source");
  assert.equal(eligible.itemOrder[4]?.occurrenceId, slot.exactSourceBranch?.occurrence.occurrenceId);

  const skipped = resolveAlgorithmsConditionalReinsertPlan({
    materializedAttempts: [
      durableAttempt(session, 0, "incorrect"),
      durableAttempt(session, 1, "correct"),
      durableAttempt(session, 2, "correct"),
    ],
    session,
  });
  assert.equal(skipped.slots[0]?.branch, "ordinary");
  assert.equal(skipped.itemOrder[4]?.occurrenceId, slot.ordinaryBranch.occurrence.occurrenceId);
});

test("Custom Practice rejects learner reinsert overrides before it prepares a session", async () => {
  const { catalog, runtime } = await prepareCustomPractice();
  const command = {
    attempts: [],
    modeId: "coding-interview-custom-practice",
    now: NOW,
    reviews: [],
    trackId: "coding-interview-dsa-problem-solving",
  } as const;

  for (const reinsertEnabled of [false, true]) {
    await assert.rejects(
      runtime.prepare({
        ...command,
        request: {
          feedbackMode: "afterEachAnswer",
          reinsertEnabled,
          requestedLength: 10,
          scope: { roadmapNodeId: catalog.getItems()[0]!.taxonomy.roadmapNodeId },
          sessionId: `custom-practice-invalid-reinsert-${reinsertEnabled}`,
        },
      }),
      /reinsert behavior is profile-owned/,
    );
  }
});
