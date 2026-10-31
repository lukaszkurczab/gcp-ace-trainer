import assert from "node:assert/strict";
import test from "node:test";
import { assertPackageCompletionRuleMatchesQuestions, createPackageCompletionRuleV2, createPackageCompletionRuleV3, evaluatePackageCompletion, minimumAttemptsForMentalUnits, type TrainingAttempt } from "..";
import { completionAttemptIdentity, qualifyPackageAttempts, type VerifiedPackageCompletionProfile } from "./packageCompletionRule";
import { projectLearningEvidence } from "../../application/learningPlan/learningEvidenceProjection";

const artifactSha256 = "a".repeat(64);
const rule = createPackageCompletionRuleV2({ ruleVersion: 2, chapters: [
  { nodeId: "chapter-a", mentalUnitCount: 1, minimumAttemptCount: 20, rollingWindowSize: 20, qualityThreshold: 0.8 },
  { nodeId: "chapter-b", mentalUnitCount: 2, minimumAttemptCount: 20, rollingWindowSize: 20, qualityThreshold: 0.8 },
] });
const profile = Object.freeze({ trackId: "track", contentVersion: "content-v2", artifactSha256, completionRule: rule });
const questionById = new Map([["question-a", { nodeId: "chapter-a", mentalUnitId: "unit-a" }], ["question-b", { nodeId: "chapter-b", mentalUnitId: "unit-b" }]]);

function attempt(id: string, questionId: string, index: number, kind: "correct" | "partial" | "incorrect" = "correct", overrides: Partial<TrainingAttempt<unknown>> = {}): TrainingAttempt<unknown> {
  const answeredAt = new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString();
  const result = kind === "correct" ? { kind, earnedPoints: 1, maxPoints: 1 } : kind === "partial" ? { kind, earnedPoints: 0.5, maxPoints: 1 } : { kind, earnedPoints: 0, maxPoints: 1 };
  const item = { trackId: "track", questionId, contentVersion: "content-v2", artifactSha256 };
  return { id, sessionId: `session-${id}`, occurrenceId: `occurrence-${id}`, trackId: "track", modeId: "mode", item, response: {}, result, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt, ...overrides } as TrainingAttempt<unknown>;
}

function evaluate(attempts: readonly TrainingAttempt<unknown>[], completionRule = rule) {
  return evaluatePackageCompletion({ ...profile, completionRule }, attempts, (questionId) => questionById.get(questionId));
}

function historical(value: TrainingAttempt<unknown>): TrainingAttempt<unknown> {
  const item = {...value.item,contentVersion:"old",artifactSha256:"b".repeat(64)};
  return {...value,item,reviewEvidence:{...value.reviewEvidence,sourceItem:item}};
}

test("durable unit attribution preserves partial progress, results and first completion without old material", () => {
  const attributed = (value: TrainingAttempt<unknown>) => ({ ...value, reviewEvidence: { ...value.reviewEvidence, taxonomyOrSkillRefs: [
    {axisId: "node", nodeId: "chapter-a", role: "primary"}, {axisId: "mental_unit", nodeId: "unit-a", role: "primary"},
  ] }});
  const old = Array.from({length:20}, (_, i) => attributed(historical(attempt(`a${i}`, "removed-a", i))));
  const before = structuredClone(old);
  const partial = evaluate(old.slice(0,10));
  assert.equal(partial.kind, "in_progress");
  assert.equal(partial.qualifyingAttemptCount, 10);
  assert.equal(qualifyPackageAttempts(profile,[...old,old[0]!], id => questionById.get(id)).length,20);
  const complete = evaluate([...old,...Array.from({length:20},(_,i)=>attempt(`b${i}`,"question-b",20+i))]);
  assert.equal(complete.kind,"completed");
  assert.equal(complete.chapters[0]!.completionSource?.contentVersion,profile.contentVersion,"provenance identifies the current rule, not the last old answer");
  assert.deepEqual(old,before);
});

test("missing historical unit attribution is explicitly unknown without losing recorded attempts", () => {
  const old = historical(attempt("unknown","question-a",0));
  assert.deepEqual(evaluate([old]), {kind:"unknown"});
  assert.equal(qualifyPackageAttempts(profile,[old], id => questionById.get(id)).length,0);
  const complete = [...Array.from({length:20},(_,i)=>attempt(`a${i}`,"question-a",i+1)),...Array.from({length:20},(_,i)=>attempt(`b${i}`,"question-b",i+21))];
  assert.equal(evaluate([old,...complete]).kind,"completed");
});

test("legacy completion uses an exact source only when every saved node ref agrees", () => {
  const resolveQuestion = (id: string) => questionById.get(id);
  const source = { ...profile, contentVersion: "old", artifactSha256: "b".repeat(64), getQuestion: resolveQuestion };
  const current = { ...profile, completionSources: [source] };
  for (const retained of [false, true]) {
    const records = Array.from({ length: 20 }, (_, index) => {
      const value = attempt(`legacy-${index}`, "question-a", index);
      return retained ? historical(value) : value;
    });
    for (const refs of [
      [{ axisId: "node", nodeId: "foreign-node", role: "primary" }],
      [{ axisId: "node", nodeId: "chapter-a" }, { axisId: "node", nodeId: "foreign-node", role: "secondary" }],
      [{ axisId: "node", nodeId: "" }],
      [{ axisId: "mental_unit", nodeId: "unit-a" }],
    ]) {
      const conflicting = records.map(value => ({ ...value, reviewEvidence: { ...value.reviewEvidence, taxonomyOrSkillRefs: refs } }));
      const before = structuredClone(conflicting);
      assert.equal(completionAttemptIdentity(current, conflicting[0]!, resolveQuestion), undefined);
      assert.deepEqual(qualifyPackageAttempts(current, conflicting, resolveQuestion), []);
      assert.deepEqual(evaluatePackageCompletion(current, conflicting, resolveQuestion), { kind: "unknown" });
      assert.deepEqual(conflicting, before, "unresolved attribution never rewrites historical evidence or results");
      const proven = Array.from({ length: 40 }, (_, index) => attempt(`proven-${index}`, index < 20 ? "question-a" : "question-b", index + 20));
      assert.equal(evaluatePackageCompletion(current, [...proven, ...conflicting], resolveQuestion).kind, "completed", "unresolved extra history cannot revoke a proven completion");
    }
    for (const refs of [[], [{ axisId: "node", nodeId: "chapter-a" }], [{ axisId: "node", nodeId: "chapter-a", role: "secondary" }]]) {
      const matching = records.map(value => ({ ...value, reviewEvidence: { ...value.reviewEvidence, taxonomyOrSkillRefs: refs } }));
      assert.deepEqual(completionAttemptIdentity(current, matching[0]!, resolveQuestion), { nodeId: "chapter-a", mentalUnitId: "unit-a" });
      assert.deepEqual(qualifyPackageAttempts(current, matching, resolveQuestion), matching);
      const completion = evaluatePackageCompletion(current, matching, resolveQuestion);
      assert.notEqual(completion.kind, "unknown");
      if (completion.kind !== "unknown") assert.equal(completion.chapters[0]!.status, "completed");
    }
  }
});

test("v2 validates exact chapter fields, distinct unit thresholds, and safe integer bounds", () => {
  assert.equal(minimumAttemptsForMentalUnits(1), 20);
  assert.equal(minimumAttemptsForMentalUnits(6), 40);
  assert.equal(minimumAttemptsForMentalUnits(7), 40);
  assert.throws(() => minimumAttemptsForMentalUnits(Number.MAX_SAFE_INTEGER), /safe integer range/);
  for (const invalid of [
    null,
    { ruleVersion: 1, chapters: rule.chapters },
    { ...rule, extra: true },
    { ruleVersion: 2, chapters: [] },
    { ruleVersion: 2, chapters: [{ ...rule.chapters[0], nodeId: "" }] },
    { ruleVersion: 2, chapters: [rule.chapters[0], rule.chapters[0]] },
    { ruleVersion: 2, chapters: [{ ...rule.chapters[0], minimumAttemptCount: 40 }] },
    { ruleVersion: 2, chapters: [{ ...rule.chapters[0], mentalUnitCount: Number.MAX_SAFE_INTEGER }] },
  ]) assert.throws(() => createPackageCompletionRuleV2(invalid));
});

test("completion stays unknown without a rule and otherwise requires every chapter independently", () => {
  assert.deepEqual(evaluatePackageCompletion({ ...profile, completionRule: undefined }, [], () => undefined), { kind: "unknown" });
  const attempts = [...Array.from({ length: 40 }, (_, index) => attempt(`a-${index}`, "question-a", index)), ...Array.from({ length: 20 }, (_, index) => attempt(`b-${index}`, "question-b", 40 + index))];
  const result = evaluate(attempts);
  assert.equal(result.kind, "completed");
  if (result.kind !== "completed") return;
  assert.equal(result.completedChapterCount, 2);
  assert.equal(result.requiredChapterCount, 2);
  assert.equal(result.requiredAttemptCount, 40);
  assert.equal(result.remainingAttemptCount, 0);
  assert.deepEqual(result.chapters.map(({ nodeId, status }) => [nodeId, status]), [["chapter-a", "completed"], ["chapter-b", "completed"]]);
});

test("attempt overage in one chapter cannot compensate another and partial results count as attempts, not correct answers", () => {
  const attempts = [...Array.from({ length: 40 }, (_, index) => attempt(`a-${index}`, "question-a", index)), ...Array.from({ length: 10 }, (_, index) => attempt(`b-${index}`, "question-b", 40 + index, index === 9 ? "partial" : "correct"))];
  const result = evaluate(attempts);
  assert.equal(result.kind, "in_progress");
  if (result.kind !== "in_progress") return;
  assert.equal(result.qualifyingAttemptCount, 30, "completed chapter retains its first earning snapshot");
  assert.equal(result.remainingAttemptCount, 10);
  assert.equal(result.chapters[1]?.qualifyingAttemptCount, 10);
  assert.equal(result.chapters[1]?.quality, null);
});

test("latest 20 quality regression remains in progress with no fabricated remaining volume", () => {
  const attempts = [...Array.from({ length: 20 }, (_, index) => attempt(`a-${index}`, "question-a", index, index < 5 ? "incorrect" : "correct")), ...Array.from({ length: 20 }, (_, index) => attempt(`b-${index}`, "question-b", 20 + index))];
  const result = evaluate(attempts);
  assert.equal(result.kind, "in_progress");
  if (result.kind !== "in_progress") return;
  assert.equal(result.chapters[0]?.reason, "quality_unmet");
  assert.equal(result.chapters[0]?.quality, 0.75);
  assert.equal(result.remainingAttemptCount, 0);
});

test("exact package identity, retry deduplication, conflict detection, and unresolved node mappings are enforced", () => {
  const valid = attempt("same", "question-a", 0);
  const foreignItem = { ...valid.item, contentVersion: "other" };
  const foreign = attempt("foreign", "question-a", 1, "correct", { item: foreignItem, reviewEvidence: { ...valid.reviewEvidence, sourceItem: foreignItem } });
  assert.deepEqual(evaluate([valid, valid, foreign]), {kind:"unknown"}, "unattributed old evidence is visible as unknown");
  const result = evaluate([valid, valid]);
  assert.equal(result.kind, "in_progress");
  if (result.kind === "in_progress") assert.equal(result.qualifyingAttemptCount, 1);
  assert.throws(() => evaluate([valid, { ...valid, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } }]), /Conflicting/);
  assert.deepEqual(evaluate([attempt("unresolved", "not-in-artifact", 2)]), {kind:"unknown"});
  assert.throws(() => evaluate([attempt("bad-time", "question-a", 0, "correct", { answeredAt: "not-a-date" })]), /invalid/);
});

test("approach-challenge and unknown Coding modes cannot enter or poison legacy completion evidence", () => {
  const codingProfile = { ...profile, trackId: "coding-interview-dsa-problem-solving" };
  const codingAttempt = (modeId: string, id: string) => {
    const item = { ...attempt(id, "approach-question", 2).item, trackId: codingProfile.trackId };
    return {
      ...attempt(id, "approach-question", 2), trackId: codingProfile.trackId, modeId, item,
      result: modeId === "coding-interview-approach-challenge" ? { kind: "partial" as const, earnedPoints: 0, maxPoints: 1 } : { kind: "incorrect" as const, earnedPoints: 0, maxPoints: 1 },
      reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    } as TrainingAttempt<unknown>;
  };
  const baseline = projectLearningEvidence({
    profile: { ...codingProfile, getQuestion: ((questionId: string) => questionById.get(questionId)) as never },
    attempts: [], reviews: [], now: "2026-01-01T00:01:00.000Z",
  });
  for (const modeId of ["coding-interview-approach-challenge", "coding-interview-unregistered-mode"]) {
    const candidate = codingAttempt(modeId, `isolated-${modeId}`);
    assert.equal(completionAttemptIdentity(codingProfile, candidate, (id) => questionById.get(id)), undefined);
    assert.deepEqual(qualifyPackageAttempts(codingProfile, [candidate], (id) => questionById.get(id)), []);
    const projected = projectLearningEvidence({
      profile: { ...codingProfile, getQuestion: ((questionId: string) => questionById.get(questionId)) as never },
      attempts: [candidate], reviews: [], now: "2026-01-01T00:01:00.000Z",
    });
    assert.deepEqual(projected.activityAttempts, baseline.activityAttempts);
    assert.deepEqual(projected.attempts, baseline.attempts);
    assert.deepEqual(projected.completedFacts, baseline.completedFacts);
    assert.deepEqual(projected.completion, baseline.completion);
  }
});

const v3Rule = createPackageCompletionRuleV3({ ruleVersion: 3, chapters: [
  { nodeId: "chapter-a", mentalUnitCount: 1, minimumAttemptCount: 20, rollingWindowSize: 20, qualityThreshold: 0.8, units: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4 }] },
] });
const v3QuestionById = new Map(Array.from({ length: 5 }, (_, index) => [`unit-a-q${index + 1}`, { nodeId: "chapter-a", mentalUnitId: "unit-a" }]));
function evaluateV3(attempts: readonly TrainingAttempt<unknown>[]) {
  return evaluatePackageCompletion({ ...profile, completionRule: v3Rule }, attempts, (questionId) => v3QuestionById.get(questionId));
}

test("v3 validates exact unit inventory and the required four distinct questions", () => {
  for (const invalid of [
    null,
    { ...v3Rule, extra: true },
    { ruleVersion: 3, chapters: [{ ...v3Rule.chapters[0], mentalUnitCount: 2 }] },
    { ruleVersion: 3, chapters: [{ ...v3Rule.chapters[0], units: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 3 }] }] },
    { ruleVersion: 3, chapters: [{ ...v3Rule.chapters[0], units: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4 }, { mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4 }] }] },
    { ruleVersion: 3, chapters: [v3Rule.chapters[0], { ...v3Rule.chapters[0], nodeId: "chapter-b" }] },
  ]) assert.throws(() => createPackageCompletionRuleV3(invalid));

  const inventory = [...v3QuestionById].map(([questionId, identity]) => ({ questionId, ...identity }));
  assert.doesNotThrow(() => assertPackageCompletionRuleMatchesQuestions(v3Rule, inventory));
  assert.throws(() => assertPackageCompletionRuleMatchesQuestions(v3Rule, inventory.slice(0, 3)), /fewer distinct questions/);
  assert.throws(() => assertPackageCompletionRuleMatchesQuestions(v3Rule, [...inventory.slice(0, 3), { questionId: "foreign", nodeId: "chapter-a", mentalUnitId: "other-unit" }]), /chapter differs|unit inventory/);
  assert.throws(() => assertPackageCompletionRuleMatchesQuestions(v3Rule, [...inventory.slice(0, 3), { ...inventory[0]! }]), /duplicated/);
});

test("v3 blocks a green volume and quality result until four distinct latest-correct questions cover the unit", () => {
  const repeated = Array.from({ length: 20 }, (_, index) => attempt(`repeat-${index}`, "unit-a-q1", index));
  const partialCoverage = evaluateV3(repeated);
  assert.equal(partialCoverage.kind, "in_progress");
  if (partialCoverage.kind !== "in_progress") return;
  assert.equal(partialCoverage.remainingAttemptCount, 0);
  assert.equal(partialCoverage.coverageDeficit, 3);
  assert.equal(partialCoverage.minimumAdditionalAttemptCount, 3);
  assert.equal(partialCoverage.chapters[0]?.coverage[0]?.latestCorrectQuestionCount, 1);
  assert.equal(partialCoverage.chapters[0]?.reason, "coverage_unmet");
  assert.equal(partialCoverage.chapters[0]?.quality, 1);

  const covered = evaluateV3([...repeated, ...[2, 3, 4].map((questionNumber, offset) => attempt(`new-${questionNumber}`, `unit-a-q${questionNumber}`, 20 + offset))]);
  assert.equal(covered.kind, "completed");
  if (covered.kind === "completed") {
    assert.equal(covered.coverageDeficit, 0);
    assert.equal(covered.minimumAdditionalAttemptCount, 0);
    assert.equal(covered.chapters[0]?.coverage[0]?.latestCorrectQuestionCount, 4);
  }
});

test("v3 preserves the first exact completion after later quality and coverage regression", () => {
  const firstTwenty = Array.from({ length: 20 }, (_, index) => attempt(`base-${index}`, `unit-a-q${(index % 4) + 1}`, index));
  const regression = attempt("regression", "unit-a-q4", 30, "incorrect");
  const before = evaluateV3(firstTwenty);
  const after = evaluateV3([...firstTwenty, regression]);
  assert.equal(after.kind, "completed");
  assert.deepEqual(after, before);
  assert.equal(after.chapters[0]?.completionSource?.attemptId, "base-19");
  assert.equal(after.chapters[0]?.coverage[0]?.latestCorrectQuestionCount, 4);
  const tied = evaluateV3([...firstTwenty.slice(0,19), attempt("z-final", "unit-a-q4", 19), attempt("a-final", "unit-a-q4", 19, "incorrect")].reverse());
  assert.equal(tied.kind, "completed");
  assert.equal(tied.chapters[0]?.completionSource?.attemptId, "z-final", "time then ID orders the first earning moment");
});

test("v3 exposes actual rolling quality even while attempt volume remains unmet", () => {
  const sixUnits = Array.from({ length: 6 }, (_, index) => ({ mentalUnitId: `unit-${index + 1}`, requiredCorrectQuestionCount: 4 }));
  const largeRule = createPackageCompletionRuleV3({ ruleVersion: 3, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 6, minimumAttemptCount: 40, rollingWindowSize: 20, qualityThreshold: 0.8, units: sixUnits }] });
  const largeQuestions = new Map<string, { nodeId: string; mentalUnitId: string }>();
  for (const unit of sixUnits) for (let index = 1; index <= 4; index += 1) largeQuestions.set(`${unit.mentalUnitId}-q${index}`, { nodeId: "chapter-a", mentalUnitId: unit.mentalUnitId });
  const attempts = Array.from({ length: 20 }, (_, index) => attempt(`quality-${index}`, `${sixUnits[index % sixUnits.length]!.mentalUnitId}-q${(index % 4) + 1}`, index, index < 5 ? "incorrect" : "correct"));
  const result = evaluatePackageCompletion({ ...profile, completionRule: largeRule }, attempts, (questionId) => largeQuestions.get(questionId));
  assert.equal(result.kind, "in_progress");
  if (result.kind !== "in_progress") return;
  assert.equal(result.remainingAttemptCount, 20);
  assert.equal(result.chapters[0]?.quality, 0.75);
  assert.equal(result.chapters[0]?.qualityRequirementUnmet, true);
  assert.equal(result.chapters[0]?.reason, "minimum_attempts_unmet");
});

test("an exact old v2 completion survives expanded v3 requirements while new chapters stay open", () => {
  const oldProfile = {...profile, contentVersion:"old", artifactSha256:"b".repeat(64), getQuestion:(id:string)=>questionById.get(id)};
  const expanded = createPackageCompletionRuleV3({ruleVersion:3,chapters:[
    {nodeId:"chapter-a",mentalUnitCount:6,minimumAttemptCount:40,rollingWindowSize:20,qualityThreshold:0.8,units:Array.from({length:6},(_,i)=>({mentalUnitId:`expanded-${i}`,requiredCorrectQuestionCount:4}))},
    {nodeId:"new-chapter",mentalUnitCount:1,minimumAttemptCount:20,rollingWindowSize:20,qualityThreshold:0.8,units:[{mentalUnitId:"new-unit",requiredCorrectQuestionCount:4}]},
  ]});
  const old = Array.from({length:20},(_,i)=>historical(attempt(`old-${i}`,"question-a",i)));
  const before=structuredClone(old);
  const current={...profile,completionRule:expanded,completionSources:[oldProfile]};
  const completion=evaluatePackageCompletion(current,[...old,old[0]!],()=>undefined);
  assert.equal(completion.kind,"in_progress");
  assert.equal(completion.chapters[0]!.status,"completed");
  assert.equal(completion.chapters[0]!.requiredAttemptCount,20,"earning rule is not replaced by expanded requirements");
  assert.equal(completion.chapters[0]!.completionSource?.ruleVersion,2);
  assert.equal(completion.chapters[1]!.status,"in_progress");
  assert.equal(completion.minimumAdditionalAttemptCount,20);
  assert.deepEqual(old,before);
  const partial=evaluatePackageCompletion(current,old.slice(0,19),()=>undefined);
  assert.equal(partial.kind,"in_progress");
  assert.equal(partial.chapters[0]!.status,"in_progress");
});

test("unit progress combines versions and chooses the earliest verified completion deterministically", () => {
  const first=Array.from({length:20},(_,i)=>historical(attempt(`earlier-${i}`,"question-a",i)));
  const later=Array.from({length:20},(_,i)=>attempt(`later-${i}`,"question-a",100+i));
  const source={...profile,contentVersion:"old",artifactSha256:"b".repeat(64),getQuestion:(id:string)=>questionById.get(id)};
  const complete=evaluatePackageCompletion({...profile,completionSources:[source]},[...later,...first].reverse(),id=>questionById.get(id));
  if(complete.kind === "unknown") throw Error("verified source");
  assert.equal(complete.chapters[0]!.completionSource?.attemptId,"earlier-19");
  assert.equal(complete.chapters[0]!.completionSource?.contentVersion,"old","available legacy completion preserves its earning rule");
  const tiedOld=first.map((item,i)=>({...item,id:i===19 ? "a" : `old-tie-${i}`}));
  const tiedCurrent=later.map((item,i)=>({...item,id:i===19 ? "aa" : `current-tie-${i}`,answeredAt:first[i]!.answeredAt,committedAt:first[i]!.committedAt}));
  const tied=evaluatePackageCompletion({...profile,completionSources:[source]},[...tiedCurrent,...tiedOld].reverse(),id=>questionById.get(id));
  if(tied.kind === "unknown") throw Error("verified tied sources");
  assert.equal(tied.chapters[0]!.completionSource?.attemptId,"old-tie-9","merged unit attempts are ordered by time then ID; both pins contribute independent attempts");
  const split=evaluatePackageCompletion({...profile,completionSources:[source]},[...first.slice(0,10),...later.slice(0,10)],id=>questionById.get(id));
  assert.equal(split.kind,"in_progress");
  assert.equal(split.chapters[0]!.completionSource?.attemptId,"later-9");
});

test("missing milestone proof is unknown even for deleted questions and cannot hide a verified completion", () => {
  const old=historical(attempt("removed", "removed-question", 0));
  const current={...profile,completionSources:[]};
  assert.deepEqual(evaluatePackageCompletion(current,[old],id=>questionById.get(id)),{kind:"unknown"});
  const complete=[...Array.from({length:20},(_,i)=>attempt(`ca${i}`,"question-a",i+1)),...Array.from({length:20},(_,i)=>attempt(`cb${i}`,"question-b",i+21))];
  assert.equal(evaluatePackageCompletion(current,[old,...complete],id=>questionById.get(id)).kind,"completed");
});

test("a retained v3 completion keeps its original unit coverage when the chapter gains units", () => {
  const expanded=createPackageCompletionRuleV3({ruleVersion:3,chapters:[{nodeId:"chapter-a",mentalUnitCount:6,minimumAttemptCount:40,rollingWindowSize:20,qualityThreshold:0.8,units:Array.from({length:6},(_,i)=>({mentalUnitId:`expanded-${i}`,requiredCorrectQuestionCount:4}))}]});
  const old=Array.from({length:20},(_,i)=>historical(attempt(`v3-old-${i}`,`unit-a-q${i%4+1}`,i)));
  const source={...profile,contentVersion:"old",artifactSha256:"b".repeat(64),completionRule:v3Rule,getQuestion:(id:string)=>v3QuestionById.get(id)};
  const completion=evaluatePackageCompletion({...profile,completionRule:expanded,completionSources:[source]},old,()=>undefined);
  assert.equal(completion.kind,"completed");
  assert.equal(completion.chapters[0]!.mentalUnitCount,1);
  assert.equal(completion.chapters[0]!.requiredAttemptCount,20);
  assert.equal(completion.chapters[0]!.completionSource?.ruleVersion,3);
  assert.equal(completion.chapters[0]!.coverage[0]!.latestCorrectQuestionCount,4);
});


test("new unit V inherits no U coverage after question replacement and no old package is needed", () => {
  const expanded=createPackageCompletionRuleV3({ruleVersion:3,chapters:[{nodeId:"chapter-a",mentalUnitCount:2,minimumAttemptCount:20,rollingWindowSize:20,qualityThreshold:0.8,units:[{mentalUnitId:"unit-a",requiredCorrectQuestionCount:4},{mentalUnitId:"unit-v",requiredCorrectQuestionCount:4}]}]});
  const old=Array.from({length:10},(_,i)=>{
    const value=historical(attempt(`unit-u-${i}`,`removed-u-${i%4}`,i));
    return {...value,reviewEvidence:{...value.reviewEvidence,taxonomyOrSkillRefs:[{axisId:"node",nodeId:"chapter-a"},{axisId:"mental_unit",nodeId:"unit-a"}]}};
  });
  const before=structuredClone(old);
  const result=evaluatePackageCompletion({...profile,completionRule:expanded},old,()=>undefined);
  assert.equal(result.kind,"in_progress");
  assert.equal(result.chapters[0]!.qualifyingAttemptCount,10);
  assert.deepEqual(result.chapters[0]!.coverage.map(unit=>[unit.mentalUnitId,unit.latestCorrectQuestionCount,unit.deficit]),[["unit-a",4,0],["unit-v",0,4]]);
  assert.deepEqual(old,before);
});
