import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ContentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { verifyRetainedCompletionCatalogs } from "../../content/canonical/runtimeCatalog";
import { createCompletionCreditClassifier } from "../../content/canonical/completionCredit";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";
import { createTrainingAttempt, type TrainingAttempt } from "../../domain";
import type { Question } from "../../content/canonical/questionTypes";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { addTrainingAttempt, getTrainingAttempts } from "../../storage/repositories";
import { productionTrackAdmissionContext as admission } from "../tracks/trackAdmissionContext";
import { projectLearningEvidence } from "./learningEvidenceProjection";
import { projectFullGoalWorkload } from "./fullGoalWorkloadProjection";
import { completionCopy, targetCopy } from "../../features/home/homePlanUiContract";
import type { ChapterCompletionStatus } from "../../domain/learning/packageCompletionRule";

const TRACK = "claude-certified-architect-professional-certification";
const NOW = "2026-10-21T12:00:00.000Z";
const retained = JSON.parse(readFileSync("src/content/generated/retained-content/claude-qle-v2-before-identity.json","utf8"));
const rawCurrent = JSON.parse(readFileSync(`src/content/generated/canonical-content/${TRACK}.json`,"utf8"));
const rawById = new Map<string,Question>(rawCurrent.questions.map((q:Question)=>[q.questionId,q]));
const pin = {trackId:TRACK,contentVersion:retained.lock.contentVersion,artifactSha256:retained.lock.sha256};

async function owner() {
  const instance = new ContentPackageRuntimeOwner(()=>null,async()=>[]);
  await instance.verifyBundledPackages();
  return instance;
}

test("production discovery transfers identical retained credit and unchanged chapter completion without rewriting persisted attempts", async () => {
  const storage = installMemoryStorage();
  const instance = await owner();
  // Discovery alone must prepare credit; opening historical content first is unnecessary.
  const current = await instance.resolveForDiscovery(TRACK,"certification");
  const old = await instance.resolveExactArtifact(pin);
  assert.equal(current.track.completionRule?.ruleVersion,3);
  const rule = current.track.completionRule!;
  if(rule.ruleVersion !== 3) throw Error("fixture requires the current unit-coverage rule");
  const chapters = rule.chapters.filter(chapter=>["evaluation_diagnosis_and_optimization","model_prompt_and_context_decisions"].includes(chapter.nodeId));
  assert.equal(chapters.length,2);
  let serial=0;
  const attempts: TrainingAttempt<unknown>[] = [];
  for(const chapter of chapters) {
    const selected = chapter.units.flatMap(unit=>retained.artifact.questions.filter((q:Question)=>q.nodeId === chapter.nodeId && q.mentalUnitId === unit.mentalUnitId && canonicalSerialize(q) === canonicalSerialize(rawById.get(q.questionId))).slice(0,4));
    assert.equal(selected.length,chapter.units.length*4);
    for(let index=0;index<chapter.minimumAttemptCount;index++) {
      const question:Question = selected[index%selected.length];
      const item={...pin,questionId:question.questionId};
      const instant=new Date(Date.UTC(2026,9,1,0,0,serial)).toISOString();
      const evaluation=old.presentation.evaluate(question.questionId,question.answer);
      assert.ok(evaluation.result);
      const attempt=createTrainingAttempt({id:`credit-${serial}`,sessionId:"retained-credit-fixture",trackId:TRACK,modeId:"certification-focus-practice",occurrenceId:`credit-occurrence-${serial++}`,item,response:question.answer,result:evaluation.result,reviewEvidence:{sourceItem:item,taxonomyOrSkillRefs:[]},answeredAt:instant,committedAt:instant});
      attempts.push(attempt);
      await addTrainingAttempt(attempt,admission);
    }
  }
  const before=storage.snapshot();
  const persisted=(await getTrainingAttempts(admission)).value;
  const evidence=projectLearningEvidence({profile:current.track,attempts:persisted,reviews:[],now:NOW});
  assert.equal(evidence.activityAttempts.length,0,"current activity is not relabelled");
  assert.equal(evidence.attempts.length,attempts.length);
  assert.deepEqual(evidence.attempts,persisted,"credited records retain every historical field");
  assert.notEqual(evidence.completion.kind,"unknown");
  if(evidence.completion.kind === "unknown") throw Error("admitted retained credit is available");
  for(const chapter of chapters) {
    const chapterStatus: ChapterCompletionStatus=evidence.completion.chapters.find(c=>c.nodeId === chapter.nodeId)!;
    assert.equal(chapterStatus.status,"completed"); assert.equal(chapterStatus.coverageDeficit,0);
    assert.equal(chapterStatus.qualifyingAttemptCount,chapter.minimumAttemptCount);
    assert.equal(chapterStatus.quality,1);
  }
  const partial=projectLearningEvidence({profile:current.track,attempts:persisted.slice(0,10),reviews:[],now:NOW});
  assert.equal(partial.completion.kind,"in_progress");
  assert.equal(partial.completion.qualifyingAttemptCount,10);
  const practice=current.track.getMode("certification-focus-practice");
  const workload=projectFullGoalWorkload({track:current.track,policy:current.planningPolicy,planningPolicyIdentity:current.planningPolicyIdentity,completion:evidence.completion,sessions:[],attempts:evidence.attempts,reviews:[],practiceMode:practice});
  for(const chapter of chapters) assert.equal(workload.chapters.find(c=>c.nodeId === chapter.nodeId)!.requiredResponses,0);
  const restarted=await owner();
  const afterRestart=projectLearningEvidence({profile:(await restarted.resolveForDiscovery(TRACK,"certification")).track,attempts:(await getTrainingAttempts(admission)).value,reviews:[],now:NOW});
  assert.deepEqual(afterRestart.completion,evidence.completion);
  assert.deepEqual(storage.snapshot(),before,"projection and a new owner write no learning or account data");
});

test("admission failures yield unavailable credit, while changed/removed IDs cannot qualify by ID alone", async () => {
  const instance=await owner();
  const current=(await instance.resolveForDiscovery(TRACK,"certification")).track;
  const classifier=current.classifyCompletionItem!;
  const changed=retained.artifact.questions.find((q:Question)=>rawById.has(q.questionId) && canonicalSerialize(q)!==canonicalSerialize(rawById.get(q.questionId))) as Question;
  const removed=retained.artifact.questions.find((q:Question)=>!rawById.has(q.questionId)) as Question;
  assert.ok(changed);assert.ok(removed);
  assert.equal(classifier({...pin,questionId:changed.questionId}),"different");
  assert.equal(classifier({...pin,questionId:removed.questionId}),"different");
  assert.equal(classifier({...pin,questionId:changed.questionId,artifactSha256:"f".repeat(64)}),"unavailable");
  const corrupt=structuredClone(retained);corrupt.artifact.questions[0].prompt += " corrupted";
  const proofs=await verifyRetainedCompletionCatalogs([corrupt]);
  assert.deepEqual(proofs,[],"the real artifact checksum guard refuses corrupted source");
  const withoutProof=createCompletionCreditClassifier({...current,questions:rawCurrent.questions},proofs);
  assert.equal(withoutProof({...pin,questionId:changed.questionId}),"unavailable");
  const aws=(await instance.resolveForDiscovery("aws-certified-solutions-architect-associate","certification")).track;
  assert.equal(aws.classifyCompletionItem,undefined,"other tracks keep strict exact qualification");
  const translate=(key:string)=>key;
  assert.equal(completionCopy({completionState:{kind:"unknown"}},translate),"The package’s full completion contract is unavailable.");
  assert.equal(targetCopy({kind:"unknown_completion_rule"},translate),"The package’s full completion contract is unavailable.");
});

test("verified retained completion survives changed content, retry and owner reconstruction without storage writes", async () => {
  const storage=installMemoryStorage();
  const instance=await owner();
  const current=await instance.resolveForDiscovery(TRACK,"certification");
  const old=await instance.resolveExactArtifact(pin);
  for (const source of current.track.completionSources ?? []) {
    const question=source.getQuestion(retained.artifact.questions[0].questionId);
    if(question) assert.deepEqual(Object.keys(question).sort(),["mentalUnitId","nodeId"],"completion source exposes no answer or raw question");
  }
  const oldRule=old.track.completionRule!;
  if(oldRule.ruleVersion !== 3) throw Error("retained v3 fixture");
  const changed=retained.artifact.questions.find((q:Question)=>rawById.has(q.questionId) && canonicalSerialize(q)!==canonicalSerialize(rawById.get(q.questionId))) as Question;
  const chapter=oldRule.chapters.find(c=>c.nodeId === changed.nodeId)!;
  const selected=chapter.units.flatMap(unit=>{
    const candidates=retained.artifact.questions.filter((q:Question)=>q.nodeId === chapter.nodeId && q.mentalUnitId === unit.mentalUnitId) as Question[];
    return unit.mentalUnitId === changed.mentalUnitId ? [changed,...candidates.filter(q=>q.questionId !== changed.questionId).slice(0,3)] : candidates.slice(0,4);
  });
  for(let index=0;index<chapter.minimumAttemptCount;index++) {
    const question=selected[index%selected.length]!;
    const item={...pin,questionId:question.questionId};
    const instant=new Date(Date.UTC(2026,9,1,0,0,index)).toISOString();
    const result=old.presentation.evaluate(question.questionId,question.answer).result!;
    await addTrainingAttempt(createTrainingAttempt({id:`sticky-${index}`,sessionId:"retained-completion-fixture",trackId:TRACK,modeId:"certification-focus-practice",occurrenceId:`sticky-occurrence-${index}`,item,response:question.answer,result,reviewEvidence:{sourceItem:item,taxonomyOrSkillRefs:[]},answeredAt:instant,committedAt:instant}),admission);
  }
  const persisted=(await getTrainingAttempts(admission)).value;
  const before=storage.snapshot();
  const project=(profile:typeof current.track,attempts=persisted)=>projectLearningEvidence({profile,attempts,reviews:[],now:NOW});
  const evidence=project(current.track,[...persisted,persisted[0]!]);
  assert.notEqual(evidence.completion.kind,"unknown");
  if(evidence.completion.kind === "unknown") throw Error("verified milestone");
  const earned=evidence.completion.chapters.find(c=>c.nodeId === chapter.nodeId)!;
  assert.equal(earned.status,"completed");
  assert.equal(earned.completionSource?.contentVersion,pin.contentVersion);
  assert.equal(earned.completionSource?.artifactSha256,pin.artifactSha256);
  assert.equal(earned.qualifyingAttemptCount,chapter.minimumAttemptCount);
  assert.ok(evidence.attempts.length < persisted.length,"changed content has no new question credit");
  const withoutSource=project({...current.track,completionSources:[]});
  assert.equal(withoutSource.completion.kind,"unknown","missing old milestone proof is unavailable, even when changed IDs cannot transfer");
  const workload=projectFullGoalWorkload({track:current.track,policy:current.planningPolicy,planningPolicyIdentity:current.planningPolicyIdentity,completion:evidence.completion,sessions:[],attempts:evidence.attempts,reviews:[],practiceMode:current.track.getMode("certification-focus-practice")});
  assert.equal(workload.chapters.find(c=>c.nodeId === chapter.nodeId)!.requiredResponses,0);
  const restarted=await owner();
  assert.deepEqual(project((await restarted.resolveForDiscovery(TRACK,"certification")).track).completion,evidence.completion);
  assert.deepEqual(storage.snapshot(),before);
  const future=persisted.map(attempt=>({...attempt,answeredAt:"2026-10-22T00:00:00.000Z",committedAt:"2026-10-22T00:00:00.000Z"}));
  assert.throws(()=>project(current.track,future),/answer time/);
});
