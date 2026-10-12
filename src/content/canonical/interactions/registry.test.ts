import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createElement } from "react";
import test, { afterEach } from "node:test";
import { createAttemptResult } from "../../../domain/learning/attemptResult";
import { createCanonicalQuestionCatalog } from "../questionCatalog";
import { validateNodePayload } from "../../runtime/nodeContentPackage";
import type { VerifiedNodePackage } from "../../runtime/nodeContentPackage";
import { createNodePackageStore, type NodePackageFilePort } from "../../runtime/nodePackageStorage";
import { createCanonicalInteractionRegistry } from "./registry";
import { choiceSingleHandler } from "./choiceSingle";
import { choiceMultipleHandler } from "./choiceMultiple";
import { orderingHandler } from "./ordering";
import { complexityHandler } from "./complexity";
import { decisionMatrixHandler } from "./decisionMatrix";
import type { InteractionHandler } from "./shared";
import { createPracticeResponseRendererRegistry, PracticeResponseRendererHost, type PracticeResponseRenderer, type PracticeResponseRendererProps } from "../../../features/practice/practiceResponseRendererRegistry";
import { ContentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import { createAlgorithmsPracticeFacade, startAlgorithmsSession } from "../../../application/coding-interview/codingInterviewSessionFacade";
import { composeTrainingLifecycleUseCases } from "../../../application/bootstrap/trainingLifecycleComposition";
import type { ContentPackageRuntimePort } from "../../../application/trainingLifecycle/contracts";
import { getForegroundSessionTimerFacade, installForegroundSessionTimerFacade } from "../../../application/trainingLifecycle";
import { installMemoryStorage } from "../../../testing/journalTestSupport";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../../infrastructure/storage/mmkvClient";
import { getActiveTrainingSession, getTrainingAttempts } from "../../../storage/repositories";
import { productionTrackAdmissionContext } from "../../../application/tracks/trackAdmissionContext";
import type { PremiumNodeOffer } from "../../application/premiumNodeOffers";
import { getProductModeConfig } from "../productModeConfig";

afterEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

const interactionType = "test_toggle_v1";
const codingTrackId = "coding-interview-dsa-problem-solving";
const codingNodeId = "complexity_and_constraints";
let scoreCalls = 0;
let evaluateCalls = 0;
const question = Object.freeze({
  questionId: "test-question",
  trackId: codingTrackId,
  nodeId: codingNodeId,
  mentalUnitId: "test-unit",
  prompt: "Select the enabled value.",
  difficulty: null,
  interaction: Object.freeze({ type: interactionType, values: Object.freeze(["enabled", "disabled"]) }),
  answer: Object.freeze({ type: interactionType, value: "enabled" }),
  feedback: Object.freeze({ type: interactionType, reason: "Check the value.", details: "Exact test feedback." }),
});
const questions = Object.freeze(Array.from({ length: 10 }, (_, index) => Object.freeze({ ...question, questionId: `test-question-${index + 1}` })));

const isComplete = (response: unknown) => !!response && typeof response === "object" && (response as Record<string, unknown>).type === interactionType && ["enabled", "disabled"].includes(String((response as Record<string, unknown>).value));
const score = (response: unknown) => {
  scoreCalls += 1;
  const correct = (response as Record<string, unknown>).value === "enabled";
  return createAttemptResult({ kind: correct ? "correct" : "incorrect", earnedPoints: correct ? 1 : 0, maxPoints: 1 });
};

const handler: InteractionHandler<unknown> = Object.freeze({
  type: interactionType,
  controlIds: () => Object.freeze(["enabled", "disabled"]),
  randomizeControlOrder: false,
  present: (_candidate, response) => Object.freeze({ value: response && typeof response === "object" ? (response as Record<string, unknown>).value : null }),
  projectDiagnostics: () => null,
  presentReview: (_candidate, response) => { const reviewResponse = (response ?? question.answer) as { value: string }; return Object.freeze({ interactionType, model: Object.freeze({ value: reviewResponse.value }), diagnostics: null, feedback: question.feedback }); },
  projectFeedback: (_candidate, response) => isComplete(response) ? question.feedback : null,
  validate(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return Object.freeze(["question: must be an object"]);
    const candidate = value as Record<string, unknown>;
    const keys = ["questionId", "trackId", "nodeId", "mentalUnitId", "prompt", "difficulty", "interaction", "answer", "feedback"];
    if (Object.keys(candidate).length !== keys.length || Object.keys(candidate).some((key) => !keys.includes(key))) return Object.freeze(["question: unsupported test contract"]);
    if (JSON.stringify(candidate.interaction) !== JSON.stringify(question.interaction) || JSON.stringify(candidate.answer) !== JSON.stringify(question.answer)) return Object.freeze(["question: unsupported test contract"]);
    return Object.freeze([]);
  },
  isComplete(_candidate, response) { return isComplete(response); },
  score(_candidate, response) { return score(response); },
  evaluate(candidate, response) {
    evaluateCalls += 1;
    const complete = isComplete(response);
    return Object.freeze({ complete, result: complete ? score(response) : null, diagnostics: null, feedback: complete ? question.feedback : null });
  },
});

test("an additional registered handler validates a complete exact-hash artifact and evaluates without changing shared unions", async () => {
  const registry = createCanonicalInteractionRegistry([
    choiceSingleHandler,
    choiceMultipleHandler,
    orderingHandler,
    complexityHandler,
    decisionMatrixHandler,
    handler,
  ]);
  const artifact = Object.freeze({ schemaVersion: "patternly-content-artifact-v1", trackId: question.trackId, contentVersion: "1", questions });
  const serialized = JSON.stringify(artifact);
  const sha256 = createHash("sha256").update(serialized).digest("hex");
  const catalog = await createCanonicalQuestionCatalog(artifact, { trackId: question.trackId, contentVersion: "1", questionCount: questions.length, sha256 }, question.trackId, async (value) => createHash("sha256").update(value).digest("hex"), registry);
  const exact = catalog.getQuestionById(questions[0]!.questionId)!;
  assert.equal(registry.isComplete(exact, { type: interactionType, value: "enabled" }), true);
  scoreCalls = 0;
  evaluateCalls = 0;
  const response = { type: interactionType, value: "enabled" };
  const submitted = registry.evaluate(exact, response);
  assert.equal(submitted.result?.kind, "correct");
  assert.deepEqual(registry.projectFeedback(exact, response), question.feedback, "feedback selection reuses the persisted response and does not score again");
  assert.equal(evaluateCalls, 1);
  assert.equal(scoreCalls, 1);
  assert.deepEqual(registry.present(exact, { type: interactionType, value: "enabled" }), { interactionType, model: { value: "enabled" } }, "a new interaction supplies its own opaque presentation data without editing a shared union");
  scoreCalls = 0;
  const review = registry.presentReview(exact, null);
  assert.deepEqual(review.model, { value: "enabled" }, "an unanswered terminal review can reveal the authored correct control through the exact owner");
  assert.deepEqual(review.feedback, question.feedback);
  assert.equal(scoreCalls, 0, "terminal feedback projection does not score a second time");
  assert.deepEqual(registry.validate({ ...question, extra: true }), ["question: unsupported test contract"]);
  assert.deepEqual(registry.validate({ ...question, interaction: { type: "unregistered" } }), ["question.interaction.type: unsupported interaction"]);
  const payload = { schemaVersion: "patternly-content-node-payload-v1", trackId: question.trackId, nodeId: question.nodeId, contentVersion: "1", contentReleaseId: "release-1", items: questions };
  assert.equal(validateNodePayload(payload, { trackId: question.trackId, nodeId: question.nodeId, contentVersion: "1", contentReleaseId: "release-1" }, registry).items.length, questions.length);
  assert.throws(() => validateNodePayload(payload, undefined), /invalid_response/u, "default product registration must fail closed for the test-only interaction");

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const artifactSha256 = createHash("sha256").update(payloadBytes).digest("hex");
  const identity = { trackId: question.trackId, nodeId: question.nodeId, contentVersion: "1", artifactSha256 };
  const manifest = { ...identity, packageSha256: "c".repeat(64), contentReleaseId: "release-1", minimumAppVersion: "0.1.0", packageSize: payloadBytes.length, artifactSize: payloadBytes.length };
  const verified = { identity, manifest, artifactBytes: payloadBytes, payload: validateNodePayload(payload, { ...identity, contentReleaseId: "release-1" }, registry) } as VerifiedNodePackage;
  const storedFiles = new Map<string, Uint8Array>();
  const pointerValues = new Map<string, string>();
  const files: NodePackageFilePort = {
    async write(path, bytes) { storedFiles.set(path, new Uint8Array(bytes)); },
    async read(path) { const bytes = storedFiles.get(path); return bytes ? new Uint8Array(bytes) : null; },
    async move(source, destination) { const bytes = storedFiles.get(source); if (!bytes) throw new Error("missing_test_stage"); storedFiles.set(destination, bytes); storedFiles.delete(source); },
    async remove(path) { storedFiles.delete(path); },
    async list(prefix) { return [...storedFiles.keys()].filter((path) => path.startsWith(prefix)); },
  };
  const pointers = { getString: (key: string) => pointerValues.get(key), setString: (key: string, value: string) => { pointerValues.set(key, value); }, remove: (key: string) => { pointerValues.delete(key); }, getAllKeys: () => [...pointerValues.keys()] };
  const createStore = () => createNodePackageStore({ files, pointers, ids: { createId: () => "stage" }, interactionRegistry: registry });
  await createStore().writeImmutable(verified);
  await createStore().activate(question.trackId, question.nodeId, identity);
  const restarted = createStore();
  const readback = await restarted.read(identity);
  assert.equal(readback?.payload.items[0]?.questionId, questions[0]?.questionId, "exact package readback validates a registered sixth interaction through the injected registry");
  assert.deepEqual(await restarted.getActive(question.trackId, question.nodeId), identity);
  let renderedModel: unknown;
  const renderedResponses: unknown[] = [];
  const testOnlyRenderer: PracticeResponseRenderer = ({ control, interactionResponse, onInteractionResponseChange }) => {
    renderedModel = control.model;
    renderedResponses.push(interactionResponse);
    if (interactionResponse === null) onInteractionResponseChange?.(response);
    return createElement("registered-test-interaction", { model: control.model, restoredResponse: interactionResponse });
  };
  const renderers = createPracticeResponseRendererRegistry([[interactionType, testOnlyRenderer]]);

  installMemoryStorage();
  const scopeKey = "registered-interaction-profile";
  const modeId = "coding-interview-guided-practice";
  const mode = getProductModeConfig(question.trackId, modeId);
  const offer: PremiumNodeOffer = Object.freeze({ offerId: "registered-interaction-offer", trackId: question.trackId, familyId: "coding_interview", nodeId: question.nodeId,
    contentVersion: identity.contentVersion, artifactSha256: identity.artifactSha256, mode, source: "local_smoke_fixture" });
  const owner = new ContentPackageRuntimeOwner(
    () => scopeKey,
    async () => restarted.listActive(),
    (candidate) => candidate.trackId === offer.trackId && candidate.nodeId === offer.nodeId && candidate.contentVersion === offer.contentVersion && candidate.artifactSha256 === offer.artifactSha256 ? offer : undefined,
    (trackId, requestedModeId) => trackId === offer.trackId && requestedModeId === modeId ? offer : undefined,
    registry,
  );
  await owner.verifyInstalledPackages();
  const installedResolution = await owner.resolveForPreparation({ trackId: question.trackId, familyId: "coding_interview", modeId, nodeId: question.nodeId });
  assert.equal(installedResolution.track.artifactSha256, identity.artifactSha256, "the owner binds the lifecycle runtime to the exact installed artifact pin");
  const lifecyclePackages: ContentPackageRuntimePort = {
    async resolveForPreparation(input) {
      const resolved = await owner.resolveForPreparation(input);
      return Object.freeze({ track: resolved.track, runtime: resolved.runtime });
    },
    async resolveExactArtifact(input) {
      const resolved = await owner.resolveExactArtifact(input);
      return Object.freeze({ track: resolved.track, runtime: resolved.runtime });
    },
    async resolveForDiscovery(trackId, familyId) {
      const resolved = await owner.resolveForDiscovery(trackId, familyId);
      return Object.freeze({ track: resolved.track, runtime: resolved.runtime });
    },
  };
  composeTrainingLifecycleUseCases({
    packages: lifecyclePackages,
    sessionIds: { async create() { return "registered-interaction-session"; } },
    wallClock: { now: () => "2026-10-12T12:00:00.000Z" },
    premiumSessionAdmission: { async authorize() { return "allowed"; } },
  });
  const timer = getForegroundSessionTimerFacade();
  let timerCheckpointCalls = 0;
  const timerWithCheckpointCount = new Proxy(timer, {
    get(target, property) {
      if (property === "checkpointForResponseSave") return async (...args: Parameters<typeof target.checkpointForResponseSave>) => {
        timerCheckpointCalls += 1;
        return target.checkpointForResponseSave(...args);
      };
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  installForegroundSessionTimerFacade(timerWithCheckpointCount);
  const facade = createAlgorithmsPracticeFacade(owner);
  const prepared = await startAlgorithmsSession({ modeId, nodeId: question.nodeId, requestedLength: 10 });
  assert.equal(prepared.session.requestedLength, 10);
  assert.equal(prepared.session.actualLength, 10, "the extension uses the real Coding mode minimum rather than a test-only shortened mode");
  assert.deepEqual(
    prepared.session.itemOrder.map((entry) => entry.item.questionId).sort(),
    questions.map((entry) => entry.questionId).sort(),
    "the lifecycle plan contains all ten questions from the exact active package pin",
  );
  assert.equal(await facade.isInteractionResponseComplete({ type: interactionType, value: "unknown" }), false);
  await assert.rejects(facade.submitInteractionResponse({ type: interactionType, value: "unknown" }), /incomplete or invalid/u);
  assert.equal(timerCheckpointCalls, 0, "an invalid opaque response is rejected before timer checkpointing and before a journal can be written");
  const unansweredProjection = await facade.getProjection();
  assert.equal(unansweredProjection.response, null);
  assert.equal(unansweredProjection.operation.kind, "unanswered", "an invalid opaque response leaves the lifecycle unanswered");
  let responseEmittedByRenderer: unknown;
  const lifecycleElement = PracticeResponseRendererHost({ control: unansweredProjection.interaction, editable: true, interactionResponse: null, onChoicePress: () => assert.fail("The registered interaction has its own response binding."), onComplexityValuePress: () => assert.fail("The registered interaction has its own response binding."), onOrderingMove: () => assert.fail("The registered interaction has its own response binding."), onInteractionResponseChange: (value) => { responseEmittedByRenderer = value; }, bindings: renderers });
  assert.equal(lifecycleElement.type, testOnlyRenderer, "the exact package's registered sixth renderer is selected after lifecycle resolution");
  const rendered = testOnlyRenderer(lifecycleElement.props as PracticeResponseRendererProps);
  assert.ok(rendered && typeof rendered === "object" && "type" in rendered && "props" in rendered);
  assert.equal(rendered.type, "registered-test-interaction");
  assert.strictEqual((rendered.props as Readonly<{ model: unknown }>).model, unansweredProjection.interaction.model, "the exact stored package reaches the explicitly registered UI binding without a shared response union");
  assert.equal(renderedModel, unansweredProjection.interaction.model);
  assert.deepEqual(responseEmittedByRenderer, response, "the renderer emits the opaque value through the production response-change callback");
  const evaluationsBeforeLifecycleSubmit = evaluateCalls;
  await facade.submitInteractionResponse(responseEmittedByRenderer);
  assert.equal(timerCheckpointCalls, 1);
  assert.equal(evaluateCalls, evaluationsBeforeLifecycleSubmit + 1, "the real family submit path evaluates the opaque response exactly once");
  assert.equal(scoreCalls, 1);
  const durableAttempt = (await getTrainingAttempts(productionTrackAdmissionContext)).value.find((attempt) => attempt.sessionId === prepared.session.id);
  assert.deepEqual(durableAttempt?.response, response);
  assert.equal(durableAttempt?.result.kind, "correct");
  assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.id, prepared.session.id);
  const freshFacade = createAlgorithmsPracticeFacade(owner);
  const persistedProjection = await freshFacade.getProjection();
  assert.deepEqual(persistedProjection.response?.value, durableAttempt!.response, "the fresh facade reads the exact opaque response back from durable state");
  const persistedElement = PracticeResponseRendererHost({ control: persistedProjection.interaction, editable: false, interactionResponse: persistedProjection.response!.value, onChoicePress: () => {}, onComplexityValuePress: () => {}, onOrderingMove: () => {}, bindings: renderers });
  const persistedRendered = testOnlyRenderer(persistedElement.props as PracticeResponseRendererProps);
  assert.ok(persistedRendered && typeof persistedRendered === "object" && "props" in persistedRendered);
  assert.deepEqual((persistedRendered.props as Readonly<{ restoredResponse: unknown }>).restoredResponse, durableAttempt!.response, "a new read after persistence forwards the exact saved opaque response to the registered renderer");
  assert.deepEqual(renderedResponses, [null, durableAttempt!.response]);

  assert.throws(() => createCanonicalInteractionRegistry([handler, handler]), /duplicated/u);
  for (const malformed of [
    { ...handler, validate: undefined },
    { ...handler, controlIds: undefined },
    { ...handler, present: undefined },
    { ...handler, projectDiagnostics: undefined },
    { ...handler, presentReview: undefined },
    { ...handler, projectFeedback: undefined },
    { ...handler, randomizeControlOrder: undefined },
  ]) {
    assert.throws(() => createCanonicalInteractionRegistry([malformed as unknown as InteractionHandler<unknown>]), /handler is invalid/u);
  }
});
