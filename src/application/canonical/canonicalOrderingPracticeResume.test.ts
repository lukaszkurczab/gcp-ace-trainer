import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { commitTrainingSessionStart } from "../learningMutations";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { getForegroundSessionTimerFacade, getTrainingLifecycleUseCases } from "../trainingLifecycle";
import { advanceDesignInterviewPracticeSession, getDesignInterviewPracticeProjection, submitDesignInterviewPracticeResponse } from "../design-interview/designInterviewSessionFacade";
import { getTrainingAttempts } from "../../storage/repositories";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";

const NOW = "2026-10-20T12:00:00.000Z";

// Exercise the ordinary production selector, without adding an N09/Premium selector.
// N09 source presentation is covered separately against the real shared handlers.
test("actual Design Interview ordering submissions survive storage rebind with their response order", async () => {
  const trackId = "frontend-system-design-interview";
  const { runtime } = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "design_interview");
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(trackId);
  for (const correct of [true, false]) {
    const storage = installMemoryStorage();
    const sessionId = `n09-ordering-resume-${correct}`;
    const { session } = await runtime.prepare({ trackId, modeId: "design-interview-tradeoff-practice", request: { sessionId, requestedLength: 40 }, attempts: [], reviews: [], now: NOW });
    const index = session.itemOrder.findIndex((o) => track.getQuestion(o.item.questionId)?.interaction.type === "ordering");
    assert.ok(index >= 0, "The ordinary 40-item plan must contain an ordering for this regression");
    await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
    const dependencies = { wallClock: { now: () => NOW }, sessionIds: { create: async () => sessionId }, premiumSessionAdmission: { authorize: async () => "allowed" as const } };
    composeTrainingLifecycleUseCases(dependencies);
    await getForegroundSessionTimerFacade().initialize(session);
    for (let i = 0; i < index; i++) {
      const q = track.getQuestion(session.itemOrder[i]!.item.questionId)!;
      await submitDesignInterviewPracticeResponse(q.answer);
      await advanceDesignInterviewPracticeSession();
    }
    const occurrence = session.itemOrder[index]!;
    const question = track.getQuestion(occurrence.item.questionId)!;
    if (question.answer.type !== "ordering") throw new Error("Expected selected ordering");
    const ids = [...question.answer.orderedElementIds];
    if (!correct) [ids[0], ids[1]] = [ids[1]!, ids[0]!];
    const response = { type: "ordering" as const, orderedElementIds: ids };
    assert.equal((await getDesignInterviewPracticeProjection()).feedback, null);
    await submitDesignInterviewPracticeResponse(response);
    const persisted = (await getTrainingAttempts(productionTrackAdmissionContext)).value.find((a) => a.occurrenceId === occurrence.occurrenceId);
    assert.deepEqual(persisted?.response, response);
    installKeyValueStorageForTests(storage);
    composeTrainingLifecycleUseCases(dependencies);
    await getTrainingLifecycleUseCases().resumeActiveSession();
    const after = await getDesignInterviewPracticeProjection();
    assert.deepEqual(after.response?.value, response);
    const renderer = after.interaction.model as { renderer: { elements: readonly { id: string }[] } };
    assert.deepEqual(renderer.renderer.elements.map((e) => e.id), ids);
    assert.equal(after.feedback?.result, correct ? "correct" : "partial");
    assert.deepEqual(after.feedback?.controls, []);
    assert.deepEqual(after.session.optionOrderByOccurrence, session.optionOrderByOccurrence);
    if (correct) assert.deepEqual(after.feedback?.messages, []);
    else {
      assert.ok(after.feedback?.messages?.length);
      assert.ok(after.feedback.messages.every((m) => m.kind === "broken_relation"));
    }
  }
});
