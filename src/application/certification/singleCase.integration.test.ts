import { isTrainingSession } from "../../storage/repositories/trainingModelGuards";
import { isCompletedTrainingSession } from "../../domain";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { validateCaseRecipes, indexCaseRecipes, type CaseRecipe } from "../../content/canonical/caseRecipe";
import { createCanonicalTrainingFamilyComposition } from "../canonicalTrainingFamilyComposition";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { getTrainingAttempts, getTrainingSessions, getActiveTrainingSession, getReviewQueueItems, getTrainingSessionResult, saveTrainingSession } from "../../storage/repositories";
import { productionTrackAdmissionContext as admission } from "../tracks/trackAdmissionContext";
import { qualifyPackageAttempts } from "../../domain/learning/packageCompletionRule";
import { isCaseAttemptEvidence } from "../../domain/learning/caseEvidence";
import { projectCertificationPracticeReview } from "./certificationPracticeReviewProjection";
import type { CanonicalContentLockRecord, Question } from "../../content/canonical/questionTypes";
import { selectSingleCase } from "./singleCaseRecommendation";
import { STORAGE_KEYS } from "../../storage/keys";
import { recoverPendingMutation } from "../learningMutations/recoverPendingMutation";
import { TrainingApplicationFailure } from "../trainingLifecycle/contracts";

const TRACK = "claude-certified-architect-professional-certification", NOW = "2026-10-13T12:00:00.000Z";
const candidate = (async () => {
  const app = process.cwd();
  const producer = resolve(app, "../patternly-content");
  const builder = await import(pathToFileURL(join(producer, "scripts/build.mjs")).href);
  const outputRoot = mkdtempSync(join(tmpdir(), "qle-v2-producer-test-"));
  try {
    const built = await builder.buildTrack({ rootDirectory: producer, outputRoot, trackId: TRACK });
    const root = join(app, "src/content/generated/canonical-content");
    const locks: CanonicalContentLockRecord[] = JSON.parse(readFileSync(join(root, "content-lock.json"), "utf8")).tracks;
    const artifacts = locks.map(lock => lock.trackId === TRACK ? JSON.parse(built.artifactBytes) : JSON.parse(readFileSync(join(root, `${lock.trackId}.json`), "utf8")));
    const catalog = await buildCanonicalRuntimeCatalog({ artifacts, locks: locks.map(lock => lock.trackId === TRACK ? built.lockEntry : lock) });
    return { catalog, track: catalog.getTrack(TRACK), built };
  } finally { rmSync(outputRoot, { recursive: true }); }
})();
async function harness(allowPremium: boolean | (() => boolean) = true) {
  const storage = installMemoryStorage();
  const { track } = await candidate;
  const family = createCanonicalTrainingFamilyComposition(track);
  let n = 0, now = NOW;
  const compose = () => composeTrainingLifecycleUseCases({ wallClock: { now: () => now }, sessionIds: { async create() { return `qle-case-${++n}`; } }, premiumSessionAdmission: { async authorize() { return (typeof allowPremium === "function" ? allowPremium() : allowPremium) ? "allowed" : "denied"; } }, packages: { async resolveForPreparation() { return { track: family.catalog, runtime: family.runtime }; }, async resolveExactArtifact() { return { track: family.catalog, runtime: family.runtime }; }, async resolveForDiscovery() { return { track: family.catalog, runtime: family.runtime }; } } });
  return { storage, track, family, compose, setNow: (value: string) => { now = value; } };
}
function command(recipe: CaseRecipe, questions: readonly Question[]) { return { trackId: TRACK, modeId: "certification-focus-practice", request: { preset: "single_case", caseId: recipe.caseId, nodeId: questions.find(q => q.questionId === recipe.steps[0]!.questionId)!.nodeId, requestedLength: recipe.steps.length } }; }

test("real producer → canonical admission → production lifecycle/journal → completion → exact review for every authored case", async () => {
  const h = await harness();
  const recipes = indexCaseRecipes(h.track.questions);
  assert.equal(recipes.length, 4);
  for (const recipe of recipes) {
    let lifecycle = h.compose();
    const prepared = await lifecycle.startSession(command(recipe, h.track.questions));
    assert.equal(prepared.session.requestedLength, 3); assert.equal(prepared.session.actualLength, 3);
    for (const [i, step] of recipe.steps.entries()) {
      const active = await getActiveTrainingSession(admission); assert.ok(active);
      assert.equal(active.currentItemIndex, i);
      const answer = h.track.getQuestion(step.questionId)!.answer;
      await lifecycle.submitPracticeResponse(answer);
      await lifecycle.submitPracticeResponse({ type: "choice_single", optionId: "nonexistent" }); // Durable first response is immutable.
      await lifecycle.recordCaseExposure("solution");
      lifecycle = h.compose(); // new application instance, same actual durable storage
      const resumed = await lifecycle.resumeActiveSession();
      assert.ok(resumed.caseState?.solutionExposedStepIds.includes(step.stepId));
      if (i < recipe.steps.length - 1) await lifecycle.advancePracticeSession();
    }
    const finalized = await lifecycle.completeActivePracticeSession(prepared.session.id);
    assert.equal(finalized.session.status, "completed"); assert.equal(finalized.result.totalOccurrences, 3);
    assert.equal(await getActiveTrainingSession(admission), null);
    const attempts = (await getTrainingAttempts(admission)).value;
    const ours = attempts.filter(a => a.sessionId === finalized.session.id).sort((a,b) => a.occurrenceId.localeCompare(b.occurrenceId));
    assert.equal(ours.length, 3);
    assert.deepEqual(ours.map(a => { const e = a.reviewEvidence.evidence?.details; assert.ok(isCaseAttemptEvidence(e)); return e.assistanceBeforeSubmit; }), [false, true, true]);
    assert.equal(qualifyPackageAttempts(h.family.catalog, ours).length, 1);
    assert.equal((await getReviewQueueItems(admission)).value.filter(r => r.sourceSessionId === finalized.session.id).length, 1);
    const review = await projectCertificationPracticeReview({ session: finalized.session as never, result: finalized.result, attempts, resolveQuestion: async item => ({ question: h.family.catalog.getQuestion(item.questionId)!, interactions: h.family.presentation }) });
    assert.equal(review.caseSummary?.steps.length, 3); assert.equal(review.overallPointsEarned, 6); // existing scorer retains diagnostic components; there are exactly three graded attempts
    assert.ok(await getTrainingSessionResult(finalized.session.id, admission));
    assert.ok((await getTrainingSessions(admission)).value.some(s => s.id === finalized.session.id));
  }
});

test("hint is durable before display, survives restart, and cannot become independent evidence", async () => {
  const h = await harness(); const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("policy"))!;
  let lifecycle = h.compose(); await lifecycle.startSession(command(recipe, h.track.questions));
  await lifecycle.recordCaseExposure("hint"); lifecycle = h.compose();
  const resumed = await lifecycle.resumeActiveSession(); assert.deepEqual(resumed.caseState?.hintShownStepIds, [recipe.steps[0]!.stepId]);
  await lifecycle.submitPracticeResponse(h.track.getQuestion(recipe.steps[0]!.questionId)!.answer);
  const attempts = (await getTrainingAttempts(admission)).value;
  assert.equal(qualifyPackageAttempts(h.family.catalog, attempts).length, 0);
  assert.equal((await getReviewQueueItems(admission)).value.length, 0);
  await assert.rejects(lifecycle.recordCaseExposure("hint"));
});

test("failed hint write rejects reveal; existing journal recovery preserves exposure without an attempt", async () => {
  const h = await harness(); const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("policy"))!;
  const lifecycle = h.compose(); const p = await lifecycle.startSession(command(recipe, h.track.questions));
  h.storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession(p.session.id) });
  await assert.rejects(lifecycle.recordCaseExposure("hint"));
  h.storage.setFailurePlan(null); await recoverPendingMutation();
  const active = await getActiveTrainingSession(admission); assert.ok(active?.caseState?.hintShownStepIds.includes(recipe.steps[0]!.stepId));
  assert.equal((await getTrainingAttempts(admission)).value.length, 0);
});

test("unknown case, requested length mismatch, denied Premium, and conflicting active session do not start another session", async () => {
  const h = await harness(false); const recipes = indexCaseRecipes(h.track.questions);
  const premium = recipes.find(c => c.caseId.includes("tenant"))!;
  await assert.rejects(h.compose().startSession(command(premium, h.track.questions)), /Premium|premium/u);
  assert.equal(await getActiveTrainingSession(admission), null);
  await assert.rejects(h.compose().startSession({ trackId: TRACK, modeId: "certification-focus-practice", request: { preset: "single_case", caseId: "missing" } }));
  const free = recipes.find(c => c.caseId.includes("policy"))!;
  await assert.rejects(h.compose().startSession({ ...command(free, h.track.questions), request: { ...command(free, h.track.questions).request, requestedLength: 10 } }));
  const active = await h.compose().startSession(command(free, h.track.questions));
  await assert.rejects(h.compose().startSession(command(free, h.track.questions)));
  assert.equal((await getActiveTrainingSession(admission))?.id, active.session.id);
});

test("normal Claude practice keeps its original independent pool; no incomplete case can enter Focus or Review", async () => {
  const { track, catalog } = await candidate;
  const family = createCanonicalTrainingFamilyComposition(track);
  const caseIds = new Set(indexCaseRecipes(track.questions).flatMap(c => c.steps.map(s => s.questionId)));
  const prepared = await family.runtime.prepare({ trackId: TRACK, modeId: "certification-focus-practice", request: { sessionId: "normal-qle-regression", requestedLength: 40 }, attempts: [], reviews: [], now: NOW });
  assert.equal(prepared.session.actualLength, 40); assert.ok(prepared.session.itemOrder.every(o => !caseIds.has(o.item.questionId)));
  assert.equal(prepared.session.caseState, undefined);
  for (const id of catalog.tracks.filter(id => id !== TRACK)) {
    const other = createCanonicalTrainingFamilyComposition(catalog.getTrack(id));
    await assert.rejects(other.runtime.prepare({ trackId: id, modeId: other.catalog.modes[0]!.modeId, request: { sessionId: "foreign-case", preset: "single_case", caseId: "qle-claude-policy-boundary", requestedLength: 3 }, attempts: [], reviews: [], now: NOW }));
  }
  assert.ok(selectSingleCase(family.catalog, [], [], NOW));
});

test("producer and consumer reject malformed recipes at actual artifact boundary", async () => {
  const { track } = await candidate;
  const producer = await import(pathToFileURL(resolve(process.cwd(), "../patternly-content/scripts/content/case-recipe.mjs")).href);
  const recipeOwner = track.questions.find(q => q.caseRecipe)!;
  for (const change of [ (r: any) => { r.steps = []; }, (r: any) => { r.steps[1].questionId = "foreign"; }, (r: any) => { r.steps[1].stepId = r.steps[0].stepId; }, (r: any) => { r.steps[0].baseStepId = r.steps[1].stepId; }, (r: any) => { r.steps[1].requiredContext = ""; }, (r: any) => { r.revealPolicy = "immediate"; } ]) {
    const questions = structuredClone(track.questions); const owner = questions.find(q => q.questionId === recipeOwner.questionId)!; change(owner.caseRecipe);
    assert.ok(validateCaseRecipes(questions).length); assert.deepEqual(producer.validateCaseRecipes(questions), validateCaseRecipes(questions));
  }
});


test("expiry or refund preserves the legally started Claude case but denies a fresh Premium case", async () => {
  for (const change of ["expiry", "refund"]) {
    let allowed = true, admissionChecks = 0;
    const h = await harness(() => { admissionChecks++; return allowed; });
    const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("tenant"))!;
    let lifecycle = h.compose();
    const prepared = await lifecycle.startSession(command(recipe, h.track.questions));
    const startChecks = admissionChecks; assert.ok(startChecks > 0);
    allowed = false; lifecycle = h.compose();
    assert.equal((await lifecycle.resumeActiveSession()).id, prepared.session.id, change);
    for (const [index, step] of recipe.steps.entries()) {
      await lifecycle.submitPracticeResponse(h.track.getQuestion(step.questionId)!.answer);
      await lifecycle.recordCaseExposure("solution");
      if (index < recipe.steps.length - 1) await lifecycle.advancePracticeSession();
    }
    await lifecycle.completeActivePracticeSession(prepared.session.id);
    assert.equal(admissionChecks, startChecks, change);
    assert.equal(await getActiveTrainingSession(admission), null);
    assert.equal((await getTrainingAttempts(admission)).value.length, 3);
    await assert.rejects(lifecycle.startSession(command(recipe, h.track.questions)), /Premium|premium/u);
    assert.equal(await getActiveTrainingSession(admission), null);
  }
});


test("abandon after durable help preserves known exposure in the next case without lifetime assistance", async () => {
  const h = await harness(); const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("policy"))!;
  const lifecycle = h.compose(); await lifecycle.startSession(command(recipe, h.track.questions));
  await lifecycle.recordCaseExposure("hint");
  await lifecycle.abandonActiveSession();
  const fresh = h.compose(); await fresh.startSession(command(recipe, h.track.questions));
  await fresh.submitPracticeResponse(h.track.getQuestion(recipe.steps[0]!.questionId)!.answer);
  const evidence = (await getTrainingAttempts(admission)).value[0]!.reviewEvidence.evidence?.details;
  assert.ok(isCaseAttemptEvidence(evidence)); assert.equal(evidence.priorExposure, "known"); assert.equal(evidence.assistanceBeforeSubmit, false);
  assert.equal(qualifyPackageAttempts(h.family.catalog, (await getTrainingAttempts(admission)).value).length, 1);
});

test("bundled owner admits only current matching case/node; retained exact identities never enter discovery", async () => {
  const { ContentPackageRuntimeOwner } = await import("../contentPackageRuntimeOwner");
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  await owner.verifyBundledPackages();
  const current = await owner.resolveForDiscovery(TRACK, "certification");
  assert.equal(indexCaseRecipes(current.track.questions).length, 4);
  for (const recipe of indexCaseRecipes(current.track.questions)) {
    const nodeId = current.track.getQuestion(recipe.steps[0]!.questionId)!.nodeId;
    const actual = await owner.resolveForPreparation({ trackId: TRACK, familyId: "certification", modeId: "certification-focus-practice", nodeId, caseId: recipe.caseId });
    assert.equal(actual.track.artifactSha256, current.track.artifactSha256);
    await assert.rejects(owner.resolveForPreparation({ trackId: TRACK, familyId: "certification", modeId: "certification-focus-practice", nodeId: "foreign", caseId: recipe.caseId }));
  }
  for (const file of ["claude-pre-qle-v2", "claude-qle-v2-first-cases"]) {
  const retained = JSON.parse(readFileSync(resolve(process.cwd(), `src/content/generated/retained-content/${file}.json`), "utf8"));
  for (const identity of [{ trackId: TRACK, contentVersion: retained.lock.contentVersion, artifactSha256: retained.lock.sha256 }, { trackId: TRACK, ...retained.ledger.training }]) {
    const old = await owner.resolveExactArtifact(identity);
    assert.equal(old.track.questions.length, retained.artifact.questions.length);
    const item = await owner.resolveItem({ trackId: identity.trackId, contentVersion: identity.contentVersion, artifactSha256: identity.artifactSha256, questionId: retained.artifact.questions[0].questionId });
    assert.equal(item.question.questionId, retained.artifact.questions[0].questionId);
    assert.equal(item.question.prompt, retained.artifact.questions[0].prompt);
    const q = old.track.getQuestion(retained.artifact.questions[0].questionId); assert.equal(q?.prompt, retained.artifact.questions[0].prompt);
    assert.equal(owner.getPreparedDiscovery(TRACK).track.artifactSha256, current.track.artifactSha256);
    assert.equal((await owner.resolveForDiscovery(TRACK, "certification")).track.artifactSha256, current.track.artifactSha256);
  }
  }
  await assert.rejects(owner.resolveExactArtifact({ trackId: TRACK, contentVersion: "unknown-old-pin", artifactSha256: "0".repeat(64) }));
});

test("due baseline repair advances only for an independent after-due answer; assistance leaves it pending", async () => {
  const h = await harness(); const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("policy"))!;
  const q = h.track.getQuestion(recipe.steps[0]!.questionId)!;
  assert.equal(q.answer.type, "choice_single"); assert.equal(q.interaction.type, "choice_single");
  if (q.answer.type !== "choice_single" || q.interaction.type !== "choice_single") throw Error("fixture");
  let lifecycle = h.compose(); await lifecycle.startSession(command(recipe, h.track.questions));
  await lifecycle.submitPracticeResponse({type:"choice_single",optionId:q.interaction.options.find(o => o.optionId !== (q.answer as {optionId:string}).optionId)!.optionId});
  await lifecycle.abandonActiveSession();
  const original = (await getReviewQueueItems(admission)).value.find(r => r.sourceItem.questionId === q.questionId)!;
  assert.equal(original.stage, "repair24");
  h.setNow("2026-10-14T13:00:00.000Z"); lifecycle = h.compose();
  const assisted = await lifecycle.startSession(command(recipe, h.track.questions));
  assert.equal(assisted.session.itemOrder[0]!.reviewSourceSnapshot?.reviewEntryId, original.id);
  await lifecycle.recordCaseExposure("hint"); await lifecycle.submitPracticeResponse(q.answer);
  assert.deepEqual((await getReviewQueueItems(admission)).value.find(r => r.id === original.id), original);
  await lifecycle.abandonActiveSession(); lifecycle = h.compose();
  await lifecycle.startSession(command(recipe, h.track.questions)); await lifecycle.submitPracticeResponse(q.answer);
  const advanced = (await getReviewQueueItems(admission)).value.find(r => r.id === original.id)!;
  assert.equal(advanced.stage, "repair7"); assert.ok(advanced.dueAt! > "2026-10-14T13:00:00.000Z");
});

test("a due contrast makes its whole case eligible, but assisted correct keeps the exact due obligation", async () => {
  const h = await harness(); const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("policy"))!;
  let lifecycle = h.compose(); await lifecycle.startSession(command(recipe, h.track.questions));
  await lifecycle.submitPracticeResponse(h.track.getQuestion(recipe.steps[0]!.questionId)!.answer); await lifecycle.recordCaseExposure("solution"); await lifecycle.advancePracticeSession();
  const q = h.track.getQuestion(recipe.steps[1]!.questionId)!;
  if (q.answer.type !== "choice_single" || q.interaction.type !== "choice_single") throw Error("fixture");
  await lifecycle.submitPracticeResponse({type:"choice_single",optionId:q.interaction.options.find(o => o.optionId !== (q.answer as {optionId:string}).optionId)!.optionId}); await lifecycle.abandonActiveSession();
  h.setNow("2026-10-14T13:00:00.000Z"); const reviews = (await getReviewQueueItems(admission)).value;
  const due = reviews.find(r => r.sourceItem.questionId === q.questionId)!;
  const selected = selectSingleCase(h.family.catalog, [], reviews, "2026-10-14T13:00:00.000Z");
  assert.equal(selected?.recipe.caseId, recipe.caseId); assert.equal(selected?.due, true);
  lifecycle = h.compose(); await lifecycle.startSession(command(recipe, h.track.questions));
  await lifecycle.submitPracticeResponse(h.track.getQuestion(recipe.steps[0]!.questionId)!.answer); await lifecycle.recordCaseExposure("solution"); await lifecycle.advancePracticeSession();
  await lifecycle.submitPracticeResponse(q.answer);
  assert.deepEqual((await getReviewQueueItems(admission)).value.find(r => r.id === due.id), due);
  const ordinary = h.track.questions.find(question => !question.questionId.includes("-qle-v2-"))!;
  const outside = {...due, id:"outside-case", sourceItem:{...due.sourceItem,questionId:ordinary.questionId}, dueAt:"2026-10-12T00:00:00.000Z"};
  assert.equal(selectSingleCase(h.family.catalog, [], [outside, due], "2026-10-14T13:00:00.000Z"), null);
});

test("ordinary exact due Review can repair a contrast independently after assisted same-session work stays pending", async () => {
  const h = await harness(); const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("policy"))!;
  let lifecycle = h.compose(); await lifecycle.startSession(command(recipe, h.track.questions));
  for (const [index, step] of recipe.steps.slice(0,2).entries()) {
    const q = h.track.getQuestion(step.questionId)!;
    if (q.answer.type !== "choice_single" || q.interaction.type !== "choice_single") throw Error("fixture");
    await lifecycle.submitPracticeResponse({type:"choice_single", optionId:q.interaction.options.find(option => option.optionId !== (q.answer as {optionId:string}).optionId)!.optionId});
    await lifecycle.recordCaseExposure("solution"); if (index === 0) await lifecycle.advancePracticeSession();
  }
  await lifecycle.abandonActiveSession(); h.setNow("2026-10-14T13:00:00.000Z"); lifecycle = h.compose();
  const reviewCommand = {trackId:TRACK,modeId:"certification-weak-area-review",request:{requestedLength:10,reviewSource:"due_queue"}};
  const review = await lifecycle.startSession(reviewCommand); assert.equal(review.session.actualLength,2);
  assert.equal(review.session.caseState,undefined);
  for (const [index, occurrence] of review.session.itemOrder.entries()) {
    assert.ok(occurrence.reviewSourceSnapshot);
    const q = h.track.getQuestion(occurrence.item.questionId)!; await lifecycle.submitPracticeResponse(q.answer);
    const attempt = (await getTrainingAttempts(admission)).value.find(a => a.sessionId === review.session.id && a.occurrenceId === occurrence.occurrenceId)!;
    const evidence = attempt.reviewEvidence.evidence?.details; assert.ok(isCaseAttemptEvidence(evidence));
    assert.equal(evidence.assistanceBeforeSubmit,index > 0);
    await lifecycle.recordCaseExposure("solution");
    if (index === 0) await lifecycle.advancePracticeSession();
  }
  const contrast = (await getReviewQueueItems(admission)).value.find(r => r.sourceItem.questionId === recipe.steps[1]!.questionId)!;
  assert.equal(contrast.stage,"repair24");
  await lifecycle.abandonActiveSession(); lifecycle = h.compose();
  const isolated = await lifecycle.startSession(reviewCommand); assert.equal(isolated.session.actualLength,1);
  assert.equal(isolated.session.itemOrder[0]!.item.questionId,recipe.steps[1]!.questionId);
  await lifecycle.submitPracticeResponse(h.track.getQuestion(recipe.steps[1]!.questionId)!.answer);
  const attempt = (await getTrainingAttempts(admission)).value.find(a => a.sessionId === isolated.session.id)!;
  const evidence = attempt.reviewEvidence.evidence?.details; assert.ok(isCaseAttemptEvidence(evidence));
  assert.equal(evidence.role,"contrast"); assert.equal(evidence.assistanceBeforeSubmit,false); assert.equal(evidence.priorExposure,"known");
  assert.equal((await getReviewQueueItems(admission)).value.find(r => r.id === contrast.id)!.stage,"repair7");
  lifecycle = h.compose();
  const resumed = await lifecycle.resumeActiveSession();
  assert.ok(resumed.caseStates?.length);
  assert.equal(resumed.caseStates[0]!.solutionExposedStepIds.length,0);
  await assert.rejects(lifecycle.completeActivePracticeSession(isolated.session.id), error => { assert.match(String((error as Error).cause), /explanation/u); return true; });
  await lifecycle.recordCaseExposure("solution");
  const completed = await lifecycle.completeActivePracticeSession(isolated.session.id);
  const result = await getTrainingSessionResult(isolated.session.id, admission); assert.ok(result);
  assert.ok(isCompletedTrainingSession(completed.session));
  const projection = await projectCertificationPracticeReview({session:completed.session,result,attempts:(await getTrainingAttempts(admission)).value,resolveQuestion:async item => ({question:h.family.catalog.getQuestion(item.questionId)!,interactions:h.family.presentation})});
  assert.equal(projection.items.length,1); assert.equal(projection.caseSummaries,undefined); assert.equal(projection.caseSummary,undefined);

});

test("a case id cannot fall back to Focus; Premium Review checks fresh admission and preserves active continuity", async () => {
  let premium = true; const h = await harness(() => premium);
  const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("tenant"))!;
  let lifecycle = h.compose(); const invalid = command(recipe,h.track.questions);
  await assert.rejects(lifecycle.startSession({...invalid,request:{...invalid.request,preset:undefined}}), /preset/u);
  assert.equal(await getActiveTrainingSession(admission),null);
  await lifecycle.startSession(command(recipe,h.track.questions));
  const q = h.track.getQuestion(recipe.steps[0]!.questionId)!;
  if (q.answer.type !== "choice_single" || q.interaction.type !== "choice_single") throw Error("fixture");
  await lifecycle.submitPracticeResponse({type:"choice_single",optionId:q.interaction.options.find(o => o.optionId !== (q.answer as {optionId:string}).optionId)!.optionId}); await lifecycle.abandonActiveSession();
  h.setNow("2026-10-14T13:00:00.000Z"); lifecycle = h.compose();
  const reviewCommand = {trackId:TRACK,modeId:"certification-weak-area-review",request:{requestedLength:10,reviewSource:"due_queue"}};
  premium = false; await assert.rejects(lifecycle.startSession(reviewCommand), /Premium|premium/u); assert.equal(await getActiveTrainingSession(admission),null);
  premium = true; await lifecycle.startSession(reviewCommand); premium = false;
  await lifecycle.resumeActiveSession(); await lifecycle.submitPracticeResponse(q.answer); await lifecycle.recordCaseExposure("solution");
  const active = await getActiveTrainingSession(admission); assert.ok(active);
  await lifecycle.completeActivePracticeSession(active.id);
  assert.equal(await getActiveTrainingSession(admission), null);
  await assert.rejects(lifecycle.startSession(command(recipe,h.track.questions)), /Premium|premium/u);
});

test("standard scoped Focus persists complete case blocks and atomic deferred exposure through restart", async () => {
  for (const feedbackTiming of ["after_each_durable_submit", "after_session_completion"]) {
    const h = await harness(); let lifecycle = h.compose();
    const prepared = await lifecycle.startSession({ trackId: TRACK, modeId: "certification-focus-practice", request: { requestedLength: 40, mentalUnitId: "CCARP-D01-O01", feedbackTiming } });
    assert.equal(prepared.session.requestedLength, 40);
    assert.equal(prepared.session.actualLength, 23);
    assert.equal(prepared.session.caseState, undefined);
    assert.equal(prepared.session.caseStates?.length, 1);
    const recipe = indexCaseRecipes(h.track.questions).find(candidate => candidate.caseId.includes("policy"))!;
    const caseIds = new Set(recipe.steps.map(step => step.questionId));
    const ids = prepared.session.itemOrder.map(occurrence => occurrence.item.questionId);
    const first = ids.indexOf(recipe.steps[0]!.questionId);
    assert.deepEqual(ids.slice(first, first + 3), recipe.steps.map(step => step.questionId));
    for (const occurrence of prepared.session.itemOrder) {
      lifecycle = h.compose(); await lifecycle.resumeActiveSession();
      await lifecycle.submitPracticeResponse(h.track.getQuestion(occurrence.item.questionId)!.answer);
      if (caseIds.has(occurrence.item.questionId)) {
        if (feedbackTiming === "after_each_durable_submit") await lifecycle.recordCaseExposure("solution");
        else {
          assert.deepEqual((await getActiveTrainingSession(admission))!.caseStates![0]!.solutionExposedStepIds, []);
          await assert.rejects(lifecycle.recordCaseExposure("solution"), /Deferred|deferred/u);
        }
      }
      const active = await getActiveTrainingSession(admission); assert.ok(active);
      if (active.currentItemIndex < active.actualLength - 1) await lifecycle.advancePracticeSession();
    }
    if (feedbackTiming === "after_session_completion") {
      h.storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSessionResult(prepared.session.id) });
      await assert.rejects(lifecycle.completeActivePracticeSession(prepared.session.id));
      await assert.rejects(lifecycle.loadSummary(prepared.session.id));
      h.storage.setFailurePlan(null); await recoverPendingMutation(); await recoverPendingMutation();
    } else {
      const exposed = await getActiveTrainingSession(admission); assert.ok(exposed?.caseStates);
      await assert.rejects(saveTrainingSession({ ...exposed, caseStates: exposed.caseStates.map(state => ({ ...state, solutionExposedStepIds: [] })) }, admission), /Case exposure/u);
    }
    const completion = await lifecycle.completeActivePracticeSession(prepared.session.id);
    assert.equal(completion.session.caseStates![0]!.solutionExposedStepIds.length, 3);
    assert.equal(await getActiveTrainingSession(admission), null);
    const attempts = (await getTrainingAttempts(admission)).value;
    assert.equal(attempts.length, 23);
    for (const [index, step] of recipe.steps.entries()) {
      const evidence = attempts.find(attempt => attempt.item.questionId === step.questionId)!.reviewEvidence.evidence!.details;
      assert.ok(isCaseAttemptEvidence(evidence));
      assert.equal(evidence.assistanceBeforeSubmit, feedbackTiming === "after_each_durable_submit" && index > 0);
    }
    const result = await getTrainingSessionResult(prepared.session.id, admission); assert.ok(result);
    assert.ok(isCompletedTrainingSession(completion.session));
    const review = await projectCertificationPracticeReview({ session: completion.session, result, attempts, resolveQuestion: async item => ({ question: h.family.catalog.getQuestion(item.questionId)!, interactions: h.family.presentation }) });
    assert.equal(review.caseSummary, undefined);
    assert.equal(review.caseSummaries?.length, 1);
    assert.equal(review.caseSummaries![0]!.steps.length, 3);
    assert.equal(review.items.length, 23);
  }
});

test("current-version account roundtrip and replay preserve an abandoned block's last revealed step", async () => {
  const { buildAccountDataSnapshot, applyRemoteAccountData, assertValidAccountDataRecords } = await import("../../storage/repositories/accountDataRepository");
  const { provisionGuestInstallation } = await import("../../storage/repositories/guestInstallationRepository");
  const { productionLearningDataAdmissionContext: context } = await import("../tracks/trackAdmissionContext");
  const provision = () => provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  const h = await harness(); await provision(); const lifecycle = h.compose();
  const prepared = await lifecycle.startSession({ trackId: TRACK, modeId: "certification-focus-practice", request: { requestedLength: 40, mentalUnitId: "CCARP-D01-O01" } });
  const recipe = indexCaseRecipes(h.track.questions).find(candidate => candidate.caseId.includes("policy"))!;
  const caseIds = new Set(recipe.steps.map(step => step.questionId));
  for (const occurrence of prepared.session.itemOrder) {
    await lifecycle.submitPracticeResponse(h.track.getQuestion(occurrence.item.questionId)!.answer);
    if (caseIds.has(occurrence.item.questionId)) await lifecycle.recordCaseExposure("solution");
    const active = await getActiveTrainingSession(admission); assert.ok(active);
    if (active.currentItemIndex < active.actualLength - 1) await lifecycle.advancePracticeSession();
  }
  await lifecycle.abandonActiveSession();
  const snapshot = await buildAccountDataSnapshot(context);
  const summary = snapshot.records.find(record => record.recordType === "training_session_summary")!;
  assert.deepEqual((summary.state.caseStates as { solutionExposedStepIds: string[] }[])[0]!.solutionExposedStepIds, recipe.steps.map(step => step.stepId));
  const { caseStates: omittedStates, ...corruptState } = summary.state;
  assert.ok(omittedStates);
  const corruptRecords = snapshot.records.map(record => record === summary ? {...record,state:corruptState} : record);
  assert.throws(() => assertValidAccountDataRecords(corruptRecords,context));
  installMemoryStorage(); await provision();
  await assert.rejects(applyRemoteAccountData(corruptRecords,context));
  assert.equal((await getTrainingSessions(admission)).value.length,0);
  await applyRemoteAccountData(snapshot.records, context);
  await applyRemoteAccountData(snapshot.records, context, { preserveLocalContext: true });
  const imported = (await getTrainingSessions(admission)).value.find(session => session.id === prepared.session.id)!;
  assert.equal(imported.status, "abandoned");
  assert.deepEqual(imported.caseStates, summary.state.caseStates);
  assert.equal((await getTrainingAttempts(admission)).value.length, prepared.session.actualLength);
  assert.equal(await getActiveTrainingSession(admission), null);
  const fresh = await h.compose().startSession({ trackId: TRACK, modeId: "certification-focus-practice", request: { requestedLength: 40, mentalUnitId: "CCARP-D01-O01" } });
  assert.deepEqual(new Set(fresh.session.caseStates![0]!.priorExposedStepIds), new Set(recipe.steps.map(step => step.stepId)));
});


test("case block state cannot disappear in active or terminal imported sessions", async () => {
  const h = await harness();
  const { session } = await h.compose().startSession({trackId:TRACK,modeId:"certification-focus-practice",request:{requestedLength:40,mentalUnitId:"CCARP-D01-O01"}});
  for (const status of ["active", "completed", "abandoned"]) {
    const { caseStates, ...missing } = session;
    assert.ok(caseStates?.length);
    assert.equal(isTrainingSession({...missing,status,...(status === "completed" ? {completedAt:NOW} : {})},admission),false);
  }
});


test("removed retained questions stay in completed history but cannot enter a new due Review", async () => {
  const { ContentPackageRuntimeOwner } = await import("../contentPackageRuntimeOwner");
  const retained = JSON.parse(readFileSync("src/content/generated/retained-content/claude-pre-qle-v2.json", "utf8"));
  const removedId = "CCARP-D05-O02-expansion-17";
  for (const withSurvivingDue of [false, true]) {
    const storage = installMemoryStorage();
    const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
    await owner.verifyBundledPackages();
    const pin = {trackId:TRACK,contentVersion:retained.lock.contentVersion,artifactSha256:retained.lock.sha256};
    const old = await owner.resolveExactArtifact(pin);
    const current = await owner.resolveForDiscovery(TRACK,"certification");
    assert.equal(current.track.getQuestion(removedId),undefined);
    let seed = true, serial = 0, now = NOW;
    const compose = () => composeTrainingLifecycleUseCases({wallClock:{now:()=>now},sessionIds:{async create(){return `removed-review-${++serial}`;}},premiumSessionAdmission:{async authorize(){return "allowed";}},packages:{
      async resolveForPreparation(input){return seed ? old : owner.resolveForPreparation(input);},
      async resolveExactArtifact(input){return owner.resolveExactArtifact(input);},
      async resolveForDiscovery(trackId,familyId){return owner.resolveForDiscovery(trackId,familyId);},
    }});
    const lifecycle = compose();
    const opened = await lifecycle.startSession({trackId:TRACK,modeId:"certification-focus-practice",request:{requestedLength:40,mentalUnitId:"CCARP-D05-O02"}});
    assert.ok(opened.session.itemOrder.some(item=>item.item.questionId === removedId));
    const survivor = opened.session.itemOrder.find(item=>current.track.getQuestion(item.item.questionId) && retained.artifact.questions.find((q:Question)=>q.questionId === item.item.questionId)?.answer.type === "choice_single")!.item.questionId;
    for (let index=0; index<opened.session.actualLength; index++) {
      const active = (await getActiveTrainingSession(admission))!;
      const id = active.itemOrder[active.currentItemIndex]!.item.questionId;
      const question = retained.artifact.questions.find((q:Question)=>q.questionId === id) as Question;
      let response = question.answer;
      if (id === removedId || (withSurvivingDue && id === survivor)) {
        assert.equal(question.answer.type,"choice_single"); assert.equal(question.interaction.type,"choice_single");
        if (question.answer.type !== "choice_single" || question.interaction.type !== "choice_single") throw Error("fixture requires single choice");
        const correct = question.answer.optionId;
        response = {type:"choice_single",optionId:question.interaction.options.find(option=>option.optionId !== correct)!.optionId};
      }
      await lifecycle.submitPracticeResponse(response);
      if (active.currentItemIndex < active.actualLength-1) await lifecycle.advancePracticeSession();
    }
    const completed = await lifecycle.completeActivePracticeSession(opened.session.id);
    assert.ok(isCompletedTrainingSession(completed.session));
    seed = false; now = "2026-10-14T13:00:00.000Z";
    const before = storage.snapshot();
    const reviews = (await getReviewQueueItems(admission)).value;
    assert.ok(reviews.some(entry=>entry.sourceItem.questionId === removedId));
    const attempts = (await getTrainingAttempts(admission)).value;
    const command = {trackId:TRACK,modeId:"certification-weak-area-review",request:{requestedLength:10,reviewSource:"due_queue"}};
    if (withSurvivingDue) {
      const next = await compose().startSession(command);
      assert.equal(next.session.artifactSha256,pin.artifactSha256);
      assert.deepEqual(next.session.itemOrder.map(item=>item.item.questionId),[survivor]);
      assert.equal((await compose().resumeActiveSession()).artifactSha256,pin.artifactSha256);
    } else {
      await assert.rejects(compose().startSession(command),(error:unknown)=>error instanceof TrainingApplicationFailure && error.code === "unknown_mode" && error.cause instanceof Error && /eligible content/u.test(error.cause.message));
      assert.deepEqual(storage.snapshot(),before,"empty eligible queue writes no data");
      assert.equal(await getActiveTrainingSession(admission),null);
    }
    assert.deepEqual((await getReviewQueueItems(admission)).value,reviews);
    assert.deepEqual((await getTrainingAttempts(admission)).value,attempts);
    assert.deepEqual(await getTrainingSessionResult(opened.session.id,admission),completed.result);
    assert.deepEqual((await getTrainingSessions(admission)).value.find(session=>session.id === opened.session.id),completed.session);
    const history = await projectCertificationPracticeReview({session:completed.session,result:completed.result,attempts,resolveQuestion:item=>owner.resolveItem(item)});
    assert.ok(history.items.some(item=>item.questionId === removedId));
  }
});

test("historical Claude due Review resolves actual retained pins and never substitutes current content", async () => {
  const { ContentPackageRuntimeOwner } = await import("../contentPackageRuntimeOwner");
  for (const file of ["claude-pre-qle-v2", "claude-qle-v2-first-cases"]) {
  const retained = JSON.parse(readFileSync(resolve(process.cwd(), `src/content/generated/retained-content/${file}.json`), "utf8"));
  for (const pin of [{trackId:TRACK,contentVersion:retained.lock.contentVersion,artifactSha256:retained.lock.sha256},{trackId:TRACK,...retained.ledger.training}]) {
    installMemoryStorage();
    const owner = new ContentPackageRuntimeOwner(() => null, async () => []); await owner.verifyBundledPackages();
    const old = await owner.resolveExactArtifact(pin);
    let seed = true, unavailable = false, premium = true, now = NOW, serial = 0;
    const compose = () => composeTrainingLifecycleUseCases({wallClock:{now:() => now},sessionIds:{async create(){return `qle-historical-${++serial}`;}},premiumSessionAdmission:{async authorize(){return premium ? "allowed" : "denied";}},packages:{
      async resolveForPreparation(input){return seed ? old : owner.resolveForPreparation(input);},
      async resolveExactArtifact(input){if (unavailable) throw new Error("Exact retained content unavailable"); return owner.resolveExactArtifact(input);},
      async resolveForDiscovery(trackId,familyId){return owner.resolveForDiscovery(trackId,familyId);},
    }});
    let lifecycle = compose();
    const seeded = await lifecycle.startSession({trackId:TRACK,modeId:"certification-focus-practice",request:{requestedLength:10,mentalUnitId:"CCARP-D05-O06"}});
    const source = retained.artifact.questions.find((question:Question) => question.questionId === seeded.session.itemOrder[0]!.item.questionId) as Question;
    if (source.answer.type !== "choice_single" || source.interaction.type !== "choice_single") throw Error("historical fixture requires single choice");
    const answer = source.answer;
    await lifecycle.submitPracticeResponse({type:"choice_single",optionId:source.interaction.options.find(option => option.optionId !== answer.optionId)!.optionId});
    await lifecycle.abandonActiveSession(); seed = false; now = "2026-10-13T12:01:00.000Z";
    lifecycle = compose();
    const currentSeed = await lifecycle.startSession({trackId:TRACK,modeId:"certification-focus-practice",request:{requestedLength:10,mentalUnitId:"CCARP-D01-O01"}});
    const currentQuestion = (await candidate).track.getQuestion(currentSeed.session.itemOrder[0]!.item.questionId)!;
    if (currentQuestion.answer.type !== "choice_single" || currentQuestion.interaction.type !== "choice_single") throw Error("current fixture requires single choice");
    const currentAnswer = currentQuestion.answer;
    await lifecycle.submitPracticeResponse({type:"choice_single",optionId:currentQuestion.interaction.options.find(option => option.optionId !== currentAnswer.optionId)!.optionId});
    await lifecycle.abandonActiveSession(); now = "2026-10-14T13:00:00.000Z";
    const before = (await getReviewQueueItems(admission)).value;
    assert.equal(before.length,2);
    const oldDue = before.find(entry => entry.sourceItem.artifactSha256 === pin.artifactSha256)!; assert.ok(oldDue);
    const reviewCommand = {trackId:TRACK,modeId:"certification-weak-area-review",request:{requestedLength:10}};
    unavailable = true; lifecycle = compose();
    await assert.rejects(lifecycle.startSession(reviewCommand));
    assert.equal(await getActiveTrainingSession(admission),null); assert.deepEqual((await getReviewQueueItems(admission)).value,before);
    unavailable = false; premium = false;
    await assert.rejects(lifecycle.startSession(reviewCommand),/Premium|premium/u);
    assert.equal(await getActiveTrainingSession(admission),null); assert.deepEqual((await getReviewQueueItems(admission)).value,before);
    premium = true; lifecycle = compose(); const started = await lifecycle.startSession(reviewCommand);
    assert.equal(started.session.artifactSha256,pin.artifactSha256); assert.equal(started.session.actualLength,1);
    assert.equal(started.session.itemOrder[0]!.item.questionId,source.questionId);
    assert.equal(started.session.itemOrder[0]!.reviewSourceSnapshot?.reviewEntryId,oldDue.id);
    assert.deepEqual((await getReviewQueueItems(admission)).value,before);
    premium = false; lifecycle = compose(); await lifecycle.resumeActiveSession(); await lifecycle.submitPracticeResponse(source.answer);
    if (started.session.caseStates?.length) await lifecycle.recordCaseExposure("solution");
    const completion = await lifecycle.completeActivePracticeSession(started.session.id).catch(error => {
      const cause = error.cause;
      throw new Error(`Historical completion failed for ${file}/${pin.contentVersion}: ${cause instanceof Error ? cause.message : error.message}`, { cause: error });
    });
    const attempts = (await getTrainingAttempts(admission)).value;
    assert.ok(isCompletedTrainingSession(completion.session));
    const result = await getTrainingSessionResult(started.session.id,admission); assert.ok(result);
    const projection = await projectCertificationPracticeReview({session:completion.session,result,attempts,resolveQuestion:item => owner.resolveItem(item)});
    assert.equal(projection.items.length,1);
    assert.equal((await getReviewQueueItems(admission)).value.find(entry => entry.id === oldDue.id)!.stage,"repair7");
    premium = true; const next = await compose().startSession({...reviewCommand,request:{requestedLength:10,reviewSource:"due_queue"}});
    assert.equal(next.session.artifactSha256,currentSeed.session.artifactSha256); assert.equal(next.session.actualLength,1);
    await compose().abandonActiveSession();
    assert.notEqual((await owner.resolveForDiscovery(TRACK,"certification")).track.artifactSha256,pin.artifactSha256);
  }
  }
});


test("real unscoped Focus eventually packs both authored Free-node cases and completes their separate durable states", async () => {
  const h = await harness();
  const completed = new Set<string>();
  let sawBoth = false;
  for (let round = 0; round < 8 && !sawBoth; round++) {
    let lifecycle = h.compose();
    const prepared = await lifecycle.startSession({trackId:TRACK,modeId:"certification-focus-practice",request:{requestedLength:40,feedbackTiming:"after_each_durable_submit"}});
    assert.equal(prepared.session.actualLength,40);
    const recipes = indexCaseRecipes(h.track.questions).filter(recipe => prepared.session.caseStates?.some(state => state.caseId === recipe.caseId));
    sawBoth = recipes.length === 2;
    for (const recipe of recipes) {
      const ids = prepared.session.itemOrder.map(item => item.item.questionId);
      const first = ids.indexOf(recipe.steps[0]!.questionId);
      assert.deepEqual(ids.slice(first,first+recipe.steps.length),recipe.steps.map(step => step.questionId));
    }
    for (const occurrence of prepared.session.itemOrder) {
      await lifecycle.submitPracticeResponse(h.track.getQuestion(occurrence.item.questionId)!.answer);
      if (recipes.some(recipe => recipe.steps.some(step => step.questionId === occurrence.item.questionId))) await lifecycle.recordCaseExposure("solution");
      completed.add(occurrence.item.questionId);
      lifecycle = h.compose(); const active = await lifecycle.resumeActiveSession();
      if (active.currentItemIndex < active.actualLength - 1) await lifecycle.advancePracticeSession();
    }
    const completion = await lifecycle.completeActivePracticeSession(prepared.session.id);
    if (sawBoth) {
      assert.equal(completion.session.caseStates!.length,2);
      assert.ok(completion.session.caseStates!.every(state => state.solutionExposedStepIds.length===3));
      assert.ok(isCompletedTrainingSession(completion.session));
      const result = await getTrainingSessionResult(prepared.session.id,admission); assert.ok(result);
      const review = await projectCertificationPracticeReview({session:completion.session,result,attempts:(await getTrainingAttempts(admission)).value,resolveQuestion:async item => ({question:h.family.catalog.getQuestion(item.questionId)!,interactions:h.family.presentation})});
      assert.equal(review.caseSummaries?.length,2);
    }
  }
  assert.equal(sawBoth,true,`both authored blocks not selected after ${completed.size} distinct actual answers`);
});

test("case submit and solution reveal failures before ACK recover once without losing response or assistance", async () => {
  const h = await harness();
  const recipe = indexCaseRecipes(h.track.questions).find(c => c.caseId.includes("policy"))!;
  let lifecycle = h.compose();
  const prepared = await lifecycle.startSession(command(recipe, h.track.questions));
  const first = recipe.steps[0]!;
  const response = h.track.getQuestion(first.questionId)!.answer;
  const { createAttemptId } = await import("../learningMutations/identity");
  const attemptId = await createAttemptId(prepared.session.id, prepared.session.itemOrder[0]!.occurrenceId, response);
  h.storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(attemptId) });
  await assert.rejects(lifecycle.submitPracticeResponse(response));
  h.storage.setFailurePlan(null);
  await recoverPendingMutation();
  await recoverPendingMutation();
  lifecycle = h.compose();
  await lifecycle.resumeActiveSession();
  let attempts = (await getTrainingAttempts(admission)).value;
  assert.equal(attempts.length, 1);
  assert.deepEqual(attempts[0]!.response, response);
  await lifecycle.submitPracticeResponse(response);
  assert.equal(lifecycle.getOperationProjection(prepared.session.id)?.kind, "feedback");
  const { getActiveMutationJournal } = await import("../../storage/repositories/mutationJournalRepository");
  const { productionLearningDataAdmissionContext } = await import("../tracks/trackAdmissionContext");
  assert.equal(getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  assert.deepEqual((await getActiveTrainingSession(admission))!.caseState!.solutionExposedStepIds, []);

  h.storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession(prepared.session.id) });
  await assert.rejects(lifecycle.recordCaseExposure("solution")); // Caller cannot reveal before verified persistence.
  h.storage.setFailurePlan(null);
  await recoverPendingMutation();
  await recoverPendingMutation();
  lifecycle = h.compose();
  const resumed = await lifecycle.resumeActiveSession();
  assert.equal(resumed.currentItemIndex, 0);
  assert.deepEqual(resumed.caseState!.solutionExposedStepIds, [first.stepId]);
  await lifecycle.recordCaseExposure("solution"); // Repeated reveal is idempotent.
  await lifecycle.advancePracticeSession();
  await lifecycle.submitPracticeResponse(h.track.getQuestion(recipe.steps[1]!.questionId)!.answer);
  attempts = (await getTrainingAttempts(admission)).value;
  assert.equal(attempts.length, 2);
  const second = attempts.find(a => a.item.questionId === recipe.steps[1]!.questionId)!;
  assert.ok(isCaseAttemptEvidence(second.reviewEvidence.evidence?.details));
  assert.equal(second.reviewEvidence.evidence.details.assistanceBeforeSubmit, true);
  assert.equal(qualifyPackageAttempts(h.family.catalog, attempts).length, 1);
});


test("historical active scoped Claude resume fails closed on missing exact pin and never starts a discovery replacement", async () => {
  installMemoryStorage();
  const { ContentPackageRuntimeOwner } = await import("../contentPackageRuntimeOwner");
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  await owner.verifyBundledPackages();
  const retained = JSON.parse(readFileSync("src/content/generated/retained-content/claude-pre-qle-v2.json", "utf8"));
  const old = await owner.resolveExactArtifact({ trackId: TRACK, contentVersion: retained.lock.contentVersion, artifactSha256: retained.lock.sha256 });
  let unavailable = false, starts = 0;
  const compose = () => composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW }, sessionIds: { async create() { starts += 1; return "historical-active-scoped"; } }, premiumSessionAdmission: { async authorize() { return "allowed"; } }, packages: {
    async resolveForPreparation() { return old; },
    async resolveExactArtifact(input) { if (unavailable) throw new Error("Exact retained artifact unavailable"); return owner.resolveExactArtifact(input); },
    resolveForDiscovery: (trackId, familyId) => owner.resolveForDiscovery(trackId, familyId),
  } });
  const prepared = await compose().startSession({ trackId: TRACK, modeId: "certification-focus-practice", request: { requestedLength: 40, mentalUnitId: "CCARP-D05-O02" } });
  const before = await getActiveTrainingSession(admission);
  unavailable = true;
  await assert.rejects(compose().resumeActiveSession());
  assert.deepEqual(await getActiveTrainingSession(admission), before);
  assert.equal(starts, 1);
  assert.equal((await getTrainingAttempts(admission)).value.length, 0);
  unavailable = false;
  const resumed = await compose().resumeActiveSession();
  assert.equal(resumed.id, prepared.session.id);
  assert.equal(resumed.artifactSha256, retained.lock.sha256);
  assert.deepEqual(resumed.itemOrder, prepared.session.itemOrder);
});

test("terminal single-case account roundtrip preserves exact exposure, evidence and result; validly fingerprinted omission is rejected", async () => {
  const { buildAccountDataSnapshot, applyRemoteAccountData, assertValidAccountDataRecords, accountDataRecordFingerprint } = await import("../../storage/repositories/accountDataRepository");
  const { provisionGuestInstallation } = await import("../../storage/repositories/guestInstallationRepository");
  const { productionLearningDataAdmissionContext: context } = await import("../tracks/trackAdmissionContext");
  const provision = () => provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  const h = await harness(); await provision(); const lifecycle = h.compose();
  const recipe = indexCaseRecipes(h.track.questions).find(candidate => candidate.caseId.includes("policy"))!;
  const prepared = await lifecycle.startSession(command(recipe, h.track.questions));
  for (const [index, step] of recipe.steps.entries()) {
    await lifecycle.submitPracticeResponse(h.track.getQuestion(step.questionId)!.answer);
    await lifecycle.recordCaseExposure("solution");
    if (index < recipe.steps.length - 1) await lifecycle.advancePracticeSession();
  }
  const completed = await lifecycle.completeActivePracticeSession(prepared.session.id);
  const attempts = (await getTrainingAttempts(admission)).value;
  const reviews = (await getReviewQueueItems(admission)).value;
  const snapshot = await buildAccountDataSnapshot(context);
  const summary = snapshot.records.find(record => record.recordType === "training_session_summary")!;
  assert.deepEqual(summary.state.caseState, completed.session.caseState);
  assert.equal(summary.state.caseStates, undefined);
  assert.deepEqual(completed.session.caseState!.solutionExposedStepIds, recipe.steps.map(step => step.stepId));
  installMemoryStorage(); await provision();
  await applyRemoteAccountData(snapshot.records, context);
  await applyRemoteAccountData(snapshot.records, context, { preserveLocalContext: true });
  assert.deepEqual((await getTrainingSessions(admission)).value, [completed.session]);
  assert.deepEqual(await getTrainingSessionResult(completed.session.id, admission), completed.result);
  assert.deepEqual((await getTrainingAttempts(admission)).value, attempts);
  assert.deepEqual((await getReviewQueueItems(admission)).value, reviews);
  assert.equal(await getActiveTrainingSession(admission), null);
  assert.equal(qualifyPackageAttempts(h.family.catalog, (await getTrainingAttempts(admission)).value).length, 1);
  const { caseState: omitted, ...state } = summary.state;
  assert.ok(omitted);
  const corrupted = { ...summary, state, fingerprint: accountDataRecordFingerprint({ ...summary, state }) };
  const corruptRecords = snapshot.records.map(record => record === summary ? corrupted : record);
  assert.equal(isTrainingSession(state, admission), false);
  assert.throws(() => assertValidAccountDataRecords(corruptRecords, context));
  installMemoryStorage(); await provision();
  await assert.rejects(applyRemoteAccountData(corruptRecords, context));
  assert.equal((await getTrainingSessions(admission)).value.length, 0);
  assert.equal((await getTrainingAttempts(admission)).value.length, 0);
});
