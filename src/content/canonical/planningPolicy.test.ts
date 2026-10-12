import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateLearningPlanningPolicy } from "./planningPolicy";
import { PRODUCT_MODE_CONFIGS, validateProductModeConfigsAgainstArtifacts, type ProductModeConfig } from "./productModeConfig";

const root = "src/content/generated/canonical-content/";
const lock = JSON.parse(readFileSync(`${root}content-lock.json`, "utf8"));
const artifacts = lock.tracks.map(({ trackId }: { trackId: string }) => JSON.parse(readFileSync(`${root}${trackId}.json`, "utf8")));
const modes = validateProductModeConfigsAgainstArtifacts(PRODUCT_MODE_CONFIGS, artifacts);
const invalid = /Canonical learning planning policy is invalid/;
const questions = [{ questionId: "q1", nodeId: "node1", mentalUnitId: "unit1" }, { questionId: "q2", nodeId: "node1", mentalUnitId: "unit2" }];
const mode: ProductModeConfig = { ...PRODUCT_MODE_CONFIGS[0]!, modeId: "test-mode", selection: { kind: "node", nodeId: "node1" } };
const estimate = (unit: string) => ({ estimateId: `estimate-${unit}`, modeId: mode.modeId,
  scopeRefs: [{ nodeId: "node1", mentalUnitId: unit }], minMinutesPerResponse: 1, typicalMinutesPerResponse: 2,
  maxMinutesPerResponse: 3, provenance: "authored", observationCount: 0, rationale: "Authored estimate",
  reviewReserve: { kind: "unavailable", reason: "Not calibrated" } });
const policy = () => ({ schemaVersion: "patternly-learning-planning-policy-v1", policyVersion: "test-policy",
  workEstimates: [estimate("unit1"), estimate("unit2")], unavailableScopes: [] as Array<{ scopeRef: { nodeId: string; mentalUnitId: string }; modeIds: string[]; reason: string }> });

function assertDeepFrozen(value: unknown): void {
  if (!value || typeof value !== "object") return;
  assert.ok(Object.isFrozen(value));
  for (const child of Object.values(value)) assertDeepFrozen(child);
}

test("all nine current planning policies retain exact values, immutability and input data", () => {
  for (const artifact of artifacts) {
    const before = JSON.stringify(artifact);
    const result = validateLearningPlanningPolicy(artifact.planningPolicy, artifact.questions,
      modes.filter((candidate) => candidate.trackId === artifact.trackId), artifact.completionRule);
    assert.deepEqual(result, artifact.planningPolicy, artifact.trackId);
    assertDeepFrozen(result);
    assert.equal(JSON.stringify(artifact), before);
  }
});

test("strict policy validation rejects malformed, duplicate, unknown and unaccounted scopes", () => {
  const mutations = [
    (p: ReturnType<typeof policy>) => { p.workEstimates[0]!.typicalMinutesPerResponse = 0; },
    (p: ReturnType<typeof policy>) => { p.workEstimates.push(structuredClone(p.workEstimates[0]!)); },
    (p: ReturnType<typeof policy>) => { p.workEstimates[0]!.scopeRefs.push({ nodeId: "node1", mentalUnitId: "unit1" }); },
    (p: ReturnType<typeof policy>) => { p.workEstimates[0]!.scopeRefs[0]!.mentalUnitId = "missing-unit"; },
    (p: ReturnType<typeof policy>) => { p.workEstimates.pop(); },
    (p: ReturnType<typeof policy>) => { p.unavailableScopes.push({ scopeRef: questions[0]!, modeIds: [mode.modeId], reason: "missing_authored_estimate" }); },
  ];
  for (const mutate of mutations) {
    const input = policy(); mutate(input);
    assert.throws(() => validateLearningPlanningPolicy(input, questions, [mode]), invalid);
  }
});

test("exact ordered, node-unit and evidence-conditioned selection preserve scope eligibility", () => {
  for (const selection of [
    { kind: "exact_ordered_questions", questionIds: ["q1"] },
    { kind: "node", nodeId: "node1", mentalUnitId: "unit1" },
    { kind: "evidence_conditioned", nodeId: "other-node", evidenceSources: ["due_queue"] },
  ] as const) {
    const selectedMode = { ...mode, selection };
    assert.throws(() => validateLearningPlanningPolicy(policy(), questions, [selectedMode]), invalid);
    const input = policy();
    const selected = selection.kind !== "evidence_conditioned";
    input.workEstimates = selected ? [estimate("unit1")] : [];
    input.unavailableScopes = (selected ? [questions[1]!] : questions).map((scope) => ({ scopeRef: { nodeId: scope.nodeId, mentalUnitId: scope.mentalUnitId }, modeIds: [mode.modeId], reason: "unknown_runtime_scope" }));
    assert.deepEqual(validateLearningPlanningPolicy(input, questions, [selectedMode]), input);
    input.unavailableScopes[0]!.reason = "missing_authored_estimate";
    assert.throws(() => validateLearningPlanningPolicy(input, questions, [selectedMode]), invalid);
  }
});

test("success followed by changed questions does not reuse previous selectable scopes", () => {
  const selectedMode: ProductModeConfig = { ...mode, selection: { kind: "exact_ordered_questions", questionIds: ["q1"] } };
  const first = policy(); first.workEstimates = [estimate("unit1")];
  const second = policy(); second.workEstimates = [estimate("unit2")];
  const movedQuestion = [{ ...questions[0]!, mentalUnitId: "unit2" }];
  assert.deepEqual(validateLearningPlanningPolicy(first, [questions[0]!], [selectedMode]), first);
  assert.deepEqual(validateLearningPlanningPolicy(second, movedQuestion, [selectedMode]), second);
  assert.throws(() => validateLearningPlanningPolicy(first, movedQuestion, [selectedMode]), invalid);
  assert.deepEqual(validateLearningPlanningPolicy(first, [questions[0]!], [selectedMode]), first);
});

test("required-unit focus errors retain first-use ordering and fresh completion rules", () => {
  const artifact = artifacts.find((candidate: { trackId: string }) => candidate.trackId === "claude-certified-architect-professional-certification")!;
  const trackModes = modes.filter((candidate) => candidate.trackId === artifact.trackId);
  const input = artifact.planningPolicy;
  assert.deepEqual(validateLearningPlanningPolicy(input, artifact.questions, trackModes, artifact.completionRule), input);
  const ambiguous = structuredClone(artifact.completionRule);
  ambiguous.chapters[1].units.push(structuredClone(ambiguous.chapters[0].units[0]));
  // An invalid estimate fails before selectable scopes are needed, even with a bad focus target.
  const malformed = structuredClone(input);
  malformed.workEstimates[0].minMinutesPerResponse = 0;
  assert.throws(() => validateLearningPlanningPolicy(malformed, artifact.questions, trackModes, ambiguous), invalid);
  assert.throws(() => validateLearningPlanningPolicy(input, artifact.questions, trackModes, ambiguous), /Required-unit focus target is unavailable or ambiguous/);
  assert.deepEqual(validateLearningPlanningPolicy(input, artifact.questions, trackModes, artifact.completionRule), input);
});
