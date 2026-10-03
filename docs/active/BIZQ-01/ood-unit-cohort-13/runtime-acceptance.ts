import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CanonicalTrainingRuntime } from "../../../../src/application/canonical/CanonicalTrainingRuntime";
import { prepareCanonicalOptionOrder } from "../../../../src/application/canonical/canonicalOptionOrder";
import { projectCanonicalChoiceFeedbackMessages } from "../../../../src/application/canonical/canonicalInteractionPresentation";
import { composeTrainingLifecycleUseCases } from "../../../../src/application/bootstrap/trainingLifecycleComposition";
import { getDesignInterviewPracticeProjection, submitDesignInterviewPracticeResponse } from "../../../../src/application/design-interview/designInterviewSessionFacade";
import { getForegroundSessionTimerFacade } from "../../../../src/application/trainingLifecycle";
import { commitTrainingSessionStart } from "../../../../src/application/learningMutations";
import { scoreCanonicalQuestion } from "../../../../src/content/canonical/questionScoring";
import { loadCanonicalRuntimeCatalog } from "../../../../src/content/canonical/runtimeCatalog";
import type { CanonicalTrackRuntime } from "../../../../src/content/canonical/runtimeCatalog";
import { createContentSessionPlanFingerprint } from "../../../../src/content/application/contentSessionIdentity";
import { createTrainingSession } from "../../../../src/domain";
import type { CanonicalQuestionResponse, Question } from "../../../../src/content/canonical/questionTypes";
import { getTrainingAttempts } from "../../../../src/storage/repositories";
import { STORAGE_KEYS } from "../../../../src/storage/keys";
import { installMemoryStorage } from "../../../../src/testing/journalTestSupport";

const TRACK_ID = "object-oriented-design-interview";
const MODE_ID = "design-interview-learn-framework";
const NEW_IDS = Array.from({length:15},(_,i)=>`ood-n01-b01-i${String(i+20).padStart(3,"0")}`);
const OLD_IDS = Array.from({length:15},(_,i)=>`ood-n01-b01-i${String(i+3).padStart(3,"0")}`);

const PRESERVED_IDS = ["ood-n01-b01-i018","ood-n01-b01-i019"];
const PREVIOUS_VERSION = "object-oriented-design-interview-authoring-v2026.10.03-bizq01-12";
const PREVIOUS_ARTIFACT_SHA256 = "00a6bf06a885e4b54c633297348d402c39732b8906b4ac844578d6276236c1bd";
const NOW = "2026-10-03T12:00:00.000Z";

function choice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

async function preparedPinnedSession(track: CanonicalTrackRuntime, sessionId: string, question: Extract<Question, { interaction: { type: "choice_single" } }>) {
  const runtime = new CanonicalTrainingRuntime(track);
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: MODE_ID, request: { sessionId, requestedLength: 1 }, attempts: [], reviews: [], now: NOW });
  assert.ok(track.getPool(MODE_ID).some((candidate) => candidate.questionId === question.questionId));
  const first = prepared.session.itemOrder[0];
  assert.ok(first);
  const itemOrder = prepared.session.itemOrder.map((entry, index) => index === 0
    ? { ...entry, item: { ...entry.item, questionId: question.questionId } }
    : entry);
  const optionOrderByOccurrence = {
    ...prepared.session.optionOrderByOccurrence,
    [first.occurrenceId]: prepareCanonicalOptionOrder(question, first.occurrenceId, itemOrder[0]!.item),
  };
  const unpinned = createTrainingSession({ ...prepared.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined });
  const session = createTrainingSession({
    ...unpinned,
    taxonomyVersion: "canonical-content-v1",
    planFingerprint: await createContentSessionPlanFingerprint({ ...unpinned, taxonomyVersion: "canonical-content-v1" }),
  });
  await runtime.validateResume({ session, draft: null });
  return { runtime, session };
}

async function runResponse(track: CanonicalTrackRuntime, question: Extract<Question, { interaction: { type: "choice_single" } }>, optionId: string, index: number) {
  const storage = installMemoryStorage();
  const sessionId = `bizq01-ood-cohort13-${index}`;
  const { session } = await preparedPinnedSession(track, sessionId, question);
  const occurrenceId = session.itemOrder[0]?.occurrenceId;
  assert.ok(occurrenceId);
  const visibleOptionOrder = session.optionOrderByOccurrence[occurrenceId];
  assert.deepEqual(new Set(visibleOptionOrder), new Set(question.interaction.options.map((option) => option.optionId)));
  const dependencies = {
    wallClock: { now: () => NOW },
    sessionIds: { create: async () => sessionId },
    // The probe verifies memory-backed lifecycle delivery, not provider Premium authorization.
    premiumSessionAdmission: { authorize: async () => "allowed" as const },
  };
  await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
  composeTrainingLifecycleUseCases(dependencies);
  await getForegroundSessionTimerFacade().initialize(session);
  const before = await getDesignInterviewPracticeProjection();
  assert.equal(before.feedback, null, "authored feedback is absent before submission");
  assert.equal(before.question.questionId, question.questionId);

  const response: CanonicalQuestionResponse = { type: "choice_single", optionId };
  const score = scoreCanonicalQuestion(question, response);
  const expected = projectCanonicalChoiceFeedbackMessages(question, response) ?? Object.freeze([]);
  await submitDesignInterviewPracticeResponse(response);
  const attempts = (await getTrainingAttempts()).value;
  assert.equal(attempts.length, 1);
  assert.deepEqual(attempts[0]?.response, response);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);

  composeTrainingLifecycleUseCases(dependencies);
  const after = await getDesignInterviewPracticeProjection();
  assert.equal(after.session.contentVersion, track.contentVersion);
  assert.equal(after.session.artifactSha256, track.artifactSha256);
  assert.equal(after.question.questionId, question.questionId, "rebind resolves the exact new item identity");
  assert.equal(after.feedback?.result, score.kind);
  assert.equal(after.feedback?.reason, question.feedback.reason, "facade retains the exact authored Reason after materialization/rebind");
  assert.deepEqual(after.feedback?.details, question.feedback.details, "facade retains the exact authored Details after materialization/rebind");
  assert.deepEqual(after.feedback?.messages, expected);
  if (optionId === question.answer.optionId) assert.deepEqual(after.feedback?.messages, []);
  else {
    const authored = question.feedback.messages?.find((message) => message.kind === "wrong_option" && message.targetId === optionId);
    assert.ok(authored);
    assert.equal(after.feedback?.messages?.[0]?.text, authored.text);
  }
  return Object.freeze({ questionId:question.questionId, optionId, visibleOptionOrder, score: score.kind, exactMessages: after.feedback?.messages, exactReason: after.feedback?.reason, exactDetails: after.feedback?.details, sessionVersion: after.session.contentVersion, artifactSha256: after.session.artifactSha256 });
}

async function main():Promise<void>{
 const track=(await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
 const sourceQuestions=JSON.parse(readFileSync(path.resolve("../patternly-content/content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json"),"utf8")) as readonly Question[];
 const cases=[];
 for(const id of NEW_IDS){
  const question=track.getQuestion(id);assert.ok(question&&choice(question),`app contains ${id}`);
  assert.deepEqual(question,sourceQuestions.find(q=>q.questionId===id));
  assert.equal(question.interaction.options.length,4);
  assert.equal(question.constraints,undefined);
  for(const option of question.interaction.options)cases.push(await runResponse(track,question,option.optionId,cases.length+1));
 }
 for(const id of OLD_IDS){assert.equal(track.getQuestion(id),undefined);assert.ok(!sourceQuestions.some(q=>q.questionId===id));}
 for(const id of PRESERVED_IDS)assert.deepEqual(track.getQuestion(id),sourceQuestions.find(q=>q.questionId===id));
 assert.notEqual(track.contentVersion,PREVIOUS_VERSION);assert.notEqual(track.artifactSha256,PREVIOUS_ARTIFACT_SHA256);
 const runtime=new CanonicalTrainingRuntime(track),storage=installMemoryStorage();
 const before=(await getTrainingAttempts()).value;
 const prepared=await runtime.prepare({trackId:TRACK_ID,modeId:MODE_ID,request:{sessionId:"bizq01-cohort13-stale",requestedLength:1},attempts:[],reviews:[],now:NOW});
 const staleBase=createTrainingSession({...prepared.session,contentVersion:PREVIOUS_VERSION,artifactSha256:PREVIOUS_ARTIFACT_SHA256,itemOrder:prepared.session.itemOrder.map((entry,index)=>index===0?{...entry,item:{...entry.item,questionId:OLD_IDS[0]!,contentVersion:PREVIOUS_VERSION,artifactSha256:PREVIOUS_ARTIFACT_SHA256}}:entry),planFingerprint:undefined,taxonomyVersion:undefined});
 const stale=createTrainingSession({...staleBase,taxonomyVersion:"canonical-content-v1",planFingerprint:await createContentSessionPlanFingerprint({...staleBase,taxonomyVersion:"canonical-content-v1"})});
 await assert.rejects(()=>runtime.validateResume({session:stale,draft:null}),/Canonical session content identity is unavailable/u);
 assert.deepEqual((await getTrainingAttempts()).value,before);assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL),false);
 console.log(JSON.stringify({evidence:"actual bundled catalog/runtime prepare/resume, memory journal, Design facade submit/materialization/rebind",contentVersion:track.contentVersion,artifactSha256:track.artifactSha256,validatedQuestions:NEW_IDS.length,responses:cases.length,retiredIdsAbsent:OLD_IDS,acceptedIdsPreserved:PRESERVED_IDS,staleSource12PinRejectedWithoutWrites:true,cases,boundaries:["memory repositories, no native SDK/provider claim","explicit Premium test stub; real gates unchanged","direct eligible-item fixture, not automatic selection proof"]},null,2));
}
void main();
