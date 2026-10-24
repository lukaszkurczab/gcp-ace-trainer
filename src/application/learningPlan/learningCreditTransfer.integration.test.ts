import { projectCodingProgress } from "../coding-interview/codingProgressProjection";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ContentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { verifyRetainedCompletionCatalogs } from "../../content/canonical/runtimeCatalog";
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
      const attempt=createTrainingAttempt({id:`credit-${serial}`,sessionId:"retained-credit-fixture",trackId:TRACK,modeId:"certification-focus-practice",occurrenceId:`credit-occurrence-${serial++}`,item,response:question.answer,result:evaluation.result,reviewEvidence:{sourceItem:item,taxonomyOrSkillRefs:[{axisId:"node",nodeId:question.nodeId,role:"primary"},{axisId:"mental_unit",nodeId:question.mentalUnitId,role:"primary"}]},answeredAt:instant,committedAt:instant});
      attempts.push(attempt);
      await addTrainingAttempt(attempt,admission);
    }
  }
  const before=storage.snapshot();
  const persisted=(await getTrainingAttempts(admission)).value;
  const evidence=projectLearningEvidence({profile:current.track,attempts:persisted,reviews:[],now:NOW});
  assert.equal(evidence.activityAttempts.length,attempts.length,"historical activity retains its original pin");
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

test("changed and removed questions retain unit progress without equivalence or old artifact availability", async () => {
  const instance=await owner();
  const current=(await instance.resolveForDiscovery(TRACK,"certification")).track;
  const changed=retained.artifact.questions.find((q:Question)=>rawById.has(q.questionId) && canonicalSerialize(q)!==canonicalSerialize(rawById.get(q.questionId))) as Question;
  const removed=retained.artifact.questions.find((q:Question)=>!rawById.has(q.questionId) && current.questions.some(now=>now.nodeId === q.nodeId && now.mentalUnitId === q.mentalUnitId)) as Question;
  assert.ok(changed);assert.ok(removed);
  const attempts=[changed,removed].map((question,index)=> {
    const item={...pin,questionId:question.questionId};
    return createTrainingAttempt({id:`unit-${index}`,sessionId:"unit-history",trackId:TRACK,modeId:"certification-focus-practice",occurrenceId:`unit-occurrence-${index}`,item,response:{},result:{kind:"incorrect",earnedPoints:0,maxPoints:1},reviewEvidence:{sourceItem:item,taxonomyOrSkillRefs:[{axisId:"node",nodeId:question.nodeId},{axisId:"mental_unit",nodeId:question.mentalUnitId}]},answeredAt:"2026-10-01T00:00:00.000Z",committedAt:"2026-10-01T00:00:00.000Z"});
  });
  const before=structuredClone(attempts);
  const projection=projectLearningEvidence({profile:{...current,completionSources:[]},attempts,reviews:[],now:NOW});
  assert.deepEqual(projection.attempts,attempts);
  assert.notEqual(projection.completion.kind,"unknown");
  if (projection.completion.kind === "unknown") throw Error("saved unit attribution must be usable without old material");
  assert.equal(projection.completion.qualifyingAttemptCount,2);
  const missing=attempts.map(attempt=>({...attempt,reviewEvidence:{...attempt.reviewEvidence,taxonomyOrSkillRefs:[]}}));
  assert.equal(projectLearningEvidence({profile:{...current,completionSources:[]},attempts:missing,reviews:[],now:NOW}).completion.kind,"unknown");
  assert.deepEqual(attempts,before);
  const corrupt=structuredClone(retained);corrupt.artifact.questions[0].prompt += " corrupted";
  assert.deepEqual(await verifyRetainedCompletionCatalogs([corrupt]),[],"historical display admission remains exact");
  const translate=(key:string)=>key;
  assert.equal(completionCopy({completionState:{kind:"unknown"}},translate),"The package’s full completion contract is unavailable.");
  assert.equal(targetCopy({kind:"unknown_completion_rule"},translate),"The package’s full completion contract is unavailable.");
});

test("conflicting legacy node refs remain stored without contributing completion, activity or pace credit", async () => {
  const storage = installMemoryStorage();
  const instance = await owner();
  const current = (await instance.resolveForDiscovery(TRACK, "certification")).track;
  for (const catalog of [current, (await instance.resolveExactArtifact(pin)).track]) {
    const question = catalog.questions[0]!;
    const item = { trackId: TRACK, questionId: question.questionId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 };
    const instant = "2026-10-01T00:00:00.000Z";
    await addTrainingAttempt(createTrainingAttempt({
      id: `conflicting-node-${catalog.artifactSha256}`, sessionId: "conflicting-node-session", trackId: TRACK,
      modeId: "certification-focus-practice", occurrenceId: `conflicting-node-occurrence-${catalog.artifactSha256}`,
      item, response: {}, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
      reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: "foreign-node", role: "primary" }] },
      answeredAt: instant, committedAt: instant,
    }), admission);
  }
  const persisted = (await getTrainingAttempts(admission)).value;
  assert.equal(persisted.length, 2);
  const before = storage.snapshot();
  const evidence = projectLearningEvidence({ profile: current, attempts: persisted, reviews: [], now: NOW });
  assert.deepEqual(evidence.completion, { kind: "unknown" });
  assert.deepEqual(evidence.attempts, []);
  assert.deepEqual(evidence.activityAttempts, []);
  assert.deepEqual(evidence.completedFacts.attempts, []);
  assert.deepEqual((await getTrainingAttempts(admission)).value, persisted);
  assert.deepEqual(storage.snapshot(), before, "projection preserves every durable attempt and its recorded result");
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
    await addTrainingAttempt(createTrainingAttempt({id:`sticky-${index}`,sessionId:"retained-completion-fixture",trackId:TRACK,modeId:"certification-focus-practice",occurrenceId:`sticky-occurrence-${index}`,item,response:question.answer,result,reviewEvidence:{sourceItem:item,taxonomyOrSkillRefs:[{axisId:"node",nodeId:question.nodeId,role:"primary"},{axisId:"mental_unit",nodeId:question.mentalUnitId,role:"primary"}]},answeredAt:instant,committedAt:instant}),admission);
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
  assert.equal(evidence.attempts.length,persisted.length,"unit attribution retains all durable attempts");
  const withoutSource=project({...current.track,completionSources:[]});
  assert.notEqual(withoutSource.completion.kind,"unknown","attributed unit progress needs no historical artifact");
  const workload=projectFullGoalWorkload({track:current.track,policy:current.planningPolicy,planningPolicyIdentity:current.planningPolicyIdentity,completion:evidence.completion,sessions:[],attempts:evidence.attempts,reviews:[],practiceMode:current.track.getMode("certification-focus-practice")});
  assert.equal(workload.chapters.find(c=>c.nodeId === chapter.nodeId)!.requiredResponses,0);
  const restarted=await owner();
  assert.deepEqual(project((await restarted.resolveForDiscovery(TRACK,"certification")).track).completion,evidence.completion);
  assert.deepEqual(storage.snapshot(),before);
  const future=persisted.map(attempt=>({...attempt,answeredAt:"2026-10-22T00:00:00.000Z",committedAt:"2026-10-22T00:00:00.000Z"}));
  assert.throws(()=>project(current.track,future),/answer time/);
});


test("Coding Progress retains unit practice and performance after replacement and an added sibling question",async()=>{
  const instance=await owner();
  const {track}=await instance.resolveForDiscovery("coding-interview-dsa-problem-solving","coding_interview");
  const question=track.questions[0]!;
  const item={trackId:track.trackId,questionId:"removed-coding-A",contentVersion:"absent-old-bank",artifactSha256:"d".repeat(64)};
  const attempts=[createTrainingAttempt({id:"coding-unit-attempt",sessionId:"coding-old",trackId:track.trackId,modeId:"algorithms-topic-practice",occurrenceId:"coding-old-occurrence",item,response:{},result:{kind:"correct",earnedPoints:1,maxPoints:1},reviewEvidence:{sourceItem:item,taxonomyOrSkillRefs:[{axisId:"node",nodeId:question.nodeId},{axisId:"mental_unit",nodeId:question.mentalUnitId}]},answeredAt:"2026-10-01T00:00:00.000Z",committedAt:"2026-10-01T00:00:00.000Z"})];
  const profile={...track,completionSources:[]};
  const evidence=projectLearningEvidence({profile,attempts,reviews:[],now:NOW});
  const before=projectCodingProgress(profile,evidence,NOW);
  assert.equal(before.hasData,true);
  assert.equal(before.algorithmsProgress!.currentFocus.nodeId,question.nodeId);
  assert.ok(before.algorithmsProgress!.currentFocus.progressPercent! > 0);
  const extra={...question,questionId:"new-coding-B"};
  const expanded={...profile,questions:[...profile.questions,extra],getQuestion:(id:string)=>id === extra.questionId ? extra : profile.getQuestion(id)};
  const after=projectCodingProgress(expanded,projectLearningEvidence({profile:expanded,attempts,reviews:[],now:NOW}),NOW);
  assert.deepEqual(after,before,"new questions in U do not reset or inflate U's practice coverage");
});
