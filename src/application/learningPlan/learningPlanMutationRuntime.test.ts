import assert from "node:assert/strict";
import test from "node:test";

import { LearningPlanMutationRuntimeCore } from "./learningPlanMutationRuntimeCore";
import type { LearningPlanMutationRuntimeDependencies } from "./learningPlanMutationRuntimeCore";
import type { LearningPlanAcceptResult, LearningPlanEditorCommitResult, LearningPlanSnapshot } from "./LearningPlanEditorCoordinator";
import type { LearningPlanReminderResult, PracticeReminderCopy } from "../notificationPreferences";
import { createLearningPlanSlotId, type LearningPlan, type TrackId } from "../../domain";
import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";

const trackId = "backend-system-design-interview" as TrackId;
const snapshot: LearningPlanSnapshot = {
  plan: {
    schemaVersion: 1,
    planId: "plan:runtime",
    trackId,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: "content-v1",
    contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
    acceptedTarget: { meaning: "none", targetDate: null },
    createdAt: "2027-01-01T10:00:00.000Z",
    updatedAt: "2027-01-01T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:runtime",
    slots: [{ slotId: createLearningPlanSlotId("runtime:slot:mon"), day: "mon", localTime: "09:00", sessionLength: 10 }],
  } satisfies LearningPlan,
  revision: 1,
};
const copy: PracticeReminderCopy = Object.freeze({ body: "body", title: "title" });


function dependencies(overrides: Partial<LearningPlanMutationRuntimeDependencies> = {}): LearningPlanMutationRuntimeDependencies {
  return {
    acceptProposal: async () => ({ kind: "accepted", snapshot }) as LearningPlanAcceptResult,
    commit: async () => ({ kind: "saved", snapshot }) as LearningPlanEditorCommitResult,
    reconcile: async () => ({ kind: "synced", status: "synced", identity: {} as never, schedules: [] }) as LearningPlanReminderResult,
    retry: async () => ({ kind: "synced", status: "synced", identity: {} as never, schedules: [] }) as LearningPlanReminderResult,
    ...overrides,
  };
}

test("plan accept saves first and returns the synced reminder outcome", async () => {
  let acceptCalls = 0;
  let reconcileCalls = 0;
  let reconciledExpectation: unknown;
  const runtime = new LearningPlanMutationRuntimeCore(dependencies({
    acceptProposal: async () => { acceptCalls += 1; return { kind: "accepted", snapshot }; },
    reconcile: async (_copy, expected) => { reconcileCalls += 1; reconciledExpectation = expected; return { kind: "synced", status: "synced", identity: {} as never, schedules: [] }; },
  }));

  const result = await runtime.acceptProposal("proposal-1", trackId, copy);

  assert.equal(result.kind, "plan_saved_reminders_synced");
  assert.equal(acceptCalls, 1);
  assert.equal(reconcileCalls, 1);
  assert.deepEqual(reconciledExpectation, {
    trackId,
    identity: {
      trackId,
      goalRevision: 1,
      planId: "plan:runtime",
      planRevision: 1,
      storageRevision: 1,
      commandId: "command:runtime",
      timezone: "Europe/Warsaw",
      contentVersion: "content-v1",
      contentPackagePin: TEST_CONTENT_PACKAGE_PIN,
    },
  });
});

test("a saved plan remains successful with a durable pending reminder result", async () => {
  const pending: LearningPlanReminderResult = { kind: "scheduler_failure", status: "pending" };
  const runtime = new LearningPlanMutationRuntimeCore(dependencies({ reconcile: async () => pending }));

  const result = await runtime.commit("editor-1", trackId, copy);

  assert.equal(result.kind, "plan_saved_reminders_pending");
  if (result.kind !== "plan_saved_reminders_pending") throw new Error("Expected pending reminder result.");
  assert.equal(result.snapshot, snapshot);
  assert.equal(result.reminder, pending);
});

test("a terminal cleared reminder outcome is not relabeled as pending", async () => {
  const cleared: LearningPlanReminderResult = { kind: "goal_paused", status: "cleared" };
  const runtime = new LearningPlanMutationRuntimeCore(dependencies({ reconcile: async () => cleared }));

  const result = await runtime.commit("editor-1", trackId, copy);

  assert.equal(result.kind, "plan_saved_reminders_cleared");
  if (result.kind !== "plan_saved_reminders_cleared") throw new Error("Expected cleared reminder result.");
  assert.equal(result.reminder, cleared);
});
