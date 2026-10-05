import assert from "node:assert/strict";
import test from "node:test";
import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { commitTrainingSessionStart } from "../learningMutations";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { getForegroundSessionTimerFacade, getTrainingLifecycleUseCases } from "../trainingLifecycle";
import { getDesignInterviewPracticeProjection, submitDesignInterviewPracticeResponse } from "../design-interview/designInterviewSessionFacade";
import { getCertificationPracticeProjection, submitCertificationPracticeResponse } from "../certification/certificationSessionFacade";
import { toCanonicalQuestionViewModel } from "../../features/practice/canonicalQuestionViewModel";
import { scoreCanonicalQuestion } from "../../content/canonical/questionScoring";
import { getTrainingAttempts } from "../../storage/repositories";
import { projectCanonicalQuestionInSessionOrder } from "./canonicalOptionOrder";

const NOW = "2026-10-05T12:00:00.000Z";
const CASES = [
  { trackId: "object-oriented-design-interview", modeId: "design-interview-learn-framework", projection: getDesignInterviewPracticeProjection, submit: submitDesignInterviewPracticeResponse },
  { trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-focus-practice", projection: getCertificationPracticeProjection, submit: submitCertificationPracticeResponse },
] as const;

for (const config of CASES) test(`${config.trackId} actual practice facade presents persisted choice order across submit and memory rebind`, async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(config.trackId);
  const runtime = new CanonicalTrainingRuntime(track);
  for (const correct of [false, true]) {
    const storage = installMemoryStorage();
    const sessionId = `bizq24-ui-order:${config.trackId}`;
    const { session } = await runtime.prepare({ trackId: config.trackId, modeId: config.modeId, request: { sessionId, requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
    await runtime.validateResume({ session, draft: null });
    const occurrence = session.itemOrder[0]!;
    const question = track.getQuestion(occurrence.item.questionId)!;
    assert.equal(question.interaction.type, "choice_single");
    assert.equal(question.answer.type, "choice_single");
    if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Expected actual single-choice fixture");
    const sourceSnapshot = JSON.stringify(question);
    const savedOrder = session.optionOrderByOccurrence[occurrence.occurrenceId]!;
    assert.notDeepEqual(savedOrder, question.interaction.options.map(o => o.optionId), "Fixture must distinguish saved and source order");
    await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
    const dependencies = {
      wallClock: { now: () => NOW },
      sessionIds: { create: async () => sessionId },
      // Memory-only application tests: no account, provider, device or Premium proof.
      premiumSessionAdmission: { authorize: async () => "allowed" as const },
    };
    composeTrainingLifecycleUseCases(dependencies);
    await getForegroundSessionTimerFacade().initialize(session);
    const before = await config.projection();
    assert.equal(before.feedback, null);
    const visibleIds = (projection: Awaited<ReturnType<typeof config.projection>>) => {
      const view = toCanonicalQuestionViewModel(projection.question);
      assert.equal(view.interaction.kind, "choice");
      if (view.interaction.kind !== "choice") throw new Error("Expected actual choice view");
      return view.interaction.options.map(o => o.id);
    };
    assert.deepEqual(visibleIds(before), savedOrder, "Actual facade and production UI adapter must consume saved occurrence order");
    assert.deepEqual(visibleIds(await config.projection()), savedOrder, "Rerender must not regenerate order");
    if (config.trackId === "google-cloud-associate-cloud-engineer") {
      assert.equal("answer" in before.question, false);
      assert.equal("feedback" in before.question, false);
      assert.equal(before.question.interaction.type === "choice_single" && before.question.interaction.options.some(o => "explanation" in o), false);
    }
    const acceptedOptionId = question.answer.optionId;
    const optionId = correct ? acceptedOptionId : question.interaction.options.find(o => o.optionId !== acceptedOptionId)!.optionId;
    const response = { type: "choice_single" as const, optionId };
    assert.equal(scoreCanonicalQuestion(question, response).kind, correct ? "correct" : "incorrect");
    await config.submit(response);
    const attempts = (await getTrainingAttempts()).value;
    assert.equal(attempts.length, 1);
    assert.deepEqual(attempts[0]!.response, response);
    installKeyValueStorageForTests(storage);
    composeTrainingLifecycleUseCases(dependencies);
    await getTrainingLifecycleUseCases().resumeActiveSession();
    const after = await config.projection();
    assert.deepEqual(visibleIds(after), savedOrder);
    assert.equal(after.feedback?.result, correct ? "correct" : "incorrect");
    if (!correct) assert.equal(after.feedback?.messages?.some(m => m.targetId === optionId), true, "Authored feedback remains bound to selected stable ID");
    assert.deepEqual(after.session.optionOrderByOccurrence, session.optionOrderByOccurrence);
    assert.equal(JSON.stringify(question), sourceSnapshot, "Canonical source object remains unchanged");
  }
});

test("saved-order projection preserves ID scoring and feedback for actual single/multiple choices and rejects invalid plans", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const questions = catalog.tracks.flatMap(id => catalog.getTrack(id).questions);
  for (const type of ["choice_single", "choice_multiple"] as const) {
    const question = questions.find(q => q.interaction.type === type)!;
    assert(question);
    if (question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") throw new Error("Expected actual choice");
    const source = JSON.stringify(question);
    const order = question.interaction.options.map(o => o.optionId).reverse();
    const projected = projectCanonicalQuestionInSessionOrder(question, order);
    assert(projected.interaction.type === "choice_single" || projected.interaction.type === "choice_multiple");
    assert.deepEqual(projected.interaction.options.map(o => o.optionId), order);
    assert.equal(Object.isFrozen(projected), true);
    assert.equal(Object.isFrozen(projected.interaction.options), true);
    assert.equal(projected.answer, question.answer);
    assert.equal(projected.feedback, question.feedback);
    const response = question.answer.type === "choice_single" ? { type: "choice_single" as const, optionId: question.answer.optionId } : question.answer.type === "choice_multiple" ? { type: "choice_multiple" as const, optionIds: question.answer.optionIds } : null;
    assert(response);
    assert.deepEqual(scoreCanonicalQuestion(projected, response), scoreCanonicalQuestion(question, response));
    for (const invalid of [undefined, [], [...order, "foreign"], order.map(() => order[0]), order.map((id, i) => i ? id : "foreign"), new Array(order.length)]) assert.throws(() => projectCanonicalQuestionInSessionOrder(question, invalid), /Saved control order is unavailable/);
    assert.equal(JSON.stringify(question), source);
  }
});

test("non-choice projection retains the exact declared order and source object", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const questions = catalog.tracks.flatMap(id => catalog.getTrack(id).questions);
  for (const type of ["ordering", "complexity", "decision_matrix"] as const) {
    const question = questions.find(q => q.interaction.type === type)!;
    assert(question, `Actual ${type} question exists`);
    const interaction = question.interaction;
    if (interaction.type === "choice_single" || interaction.type === "choice_multiple") throw new Error("Expected non-choice fixture");
    const order = interaction.type === "ordering" ? interaction.elements.map(e => e.elementId) : interaction.dimensions.map(d => d.dimensionId);
    assert.equal(projectCanonicalQuestionInSessionOrder(question, order), question);
    assert.throws(() => projectCanonicalQuestionInSessionOrder(question, [...order, "foreign"]), /Saved control order is unavailable/);
  }
});
