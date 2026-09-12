import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { createCanonicalQuestionCatalog, isCanonicalResponseComplete, scoreCanonicalQuestion, validateCanonicalArtifact, validateQuestion, type CanonicalContentLockRecord, type Question } from ".";

const generated = path.resolve("src/content/generated/canonical-content");
const contentRoot = path.resolve("../patternly-content");
type Oracle = { scoreQuestion(question: unknown, response: unknown): { status: string; earnedPoints: number; maxPoints: number } };
const lock = JSON.parse(readFileSync(path.join(generated, "content-lock.json"), "utf8")) as { schemaVersion: string; tracks: CanonicalContentLockRecord[] };
const inputs = lock.tracks.map((entry) => ({ entry, artifact: JSON.parse(readFileSync(path.join(generated, `${entry.trackId}.json`), "utf8")) as unknown }));

const clone = <T>(value: T): T => structuredClone(value);
const sha256Utf8 = async (value: string): Promise<string> => createHash("sha256").update(value, "utf8").digest("hex");
function answerResponse(question: Question): unknown {
  if (question.interaction.type === "choice_single") { const value = question as Extract<Question, { interaction: { type: "choice_single" } }>; return { type: "choice_single", optionId: value.answer.optionId }; }
  if (question.interaction.type === "choice_multiple") { const value = question as Extract<Question, { interaction: { type: "choice_multiple" } }>; return { type: "choice_multiple", optionIds: [...value.answer.optionIds] }; }
  if (question.interaction.type === "ordering") { const value = question as Extract<Question, { interaction: { type: "ordering" } }>; return { type: "ordering", orderedElementIds: [...value.answer.orderedElementIds] }; }
  const value = question as Extract<Question, { interaction: { type: "complexity" | "decision_matrix" } }>;
  return { type: question.interaction.type, selectedValueIdsByDimension: structuredClone(value.answer.selectedValueIdsByDimension) };
}
function partialResponse(question: Question): unknown {
  if (question.interaction.type === "choice_single") return { type: "choice_single", optionId: "foreign" };
  if (question.interaction.type === "choice_multiple") { const value = question as Extract<Question, { interaction: { type: "choice_multiple" } }>; return { type: "choice_multiple", optionIds: value.answer.optionIds.slice(0, 1) }; }
  if (question.interaction.type === "ordering") { const value = question as Extract<Question, { interaction: { type: "ordering" } }>; return { type: "ordering", orderedElementIds: value.answer.orderedElementIds.slice(0, -1) }; }
  const first = question.interaction.dimensions[0]; return { type: question.interaction.type, selectedValueIdsByDimension: first ? { [first.dimensionId]: [...first.acceptedValueIds] } : {} };
}

test("all nine canonical artifacts validate with exact inventory and stable learner whitespace", () => {
  assert.equal(lock.schemaVersion, "patternly-content-lock-v1"); assert.equal(inputs.length, 9);
  let questions = 0; const nodes = new Set<string>(), units = new Set<string>(); let padded: Question | undefined;
  for (const { entry, artifact } of inputs) { const validated = validateCanonicalArtifact(artifact, entry, entry.trackId); questions += validated.questions.length; for (const question of validated.questions) { nodes.add(`${question.trackId}\0${question.nodeId}`); units.add(`${question.trackId}\0${question.nodeId}\0${question.mentalUnitId}`); if (question.questionId === "alg-linked-list-cycle-detection-11-entry-phase") padded = question; } }
  assert.deepEqual({ tracks: inputs.length, nodes: nodes.size, mentalUnits: units.size, questions }, { tracks: 9, nodes: 117, mentalUnits: 932, questions: 16_041 });
  assert.equal(padded?.prompt, "After Floyd's pointers meet, what transformation finds the cycle entry? ");
});

test("canonical scoring matches the producer oracle exhaustively", async () => {
  const oracle = await import(pathToFileURL(path.join(contentRoot, "scripts/content/question-contract.mjs")).href) as Oracle;
  for (const { entry, artifact } of inputs) { const validated = artifact as { questions: Question[] }; for (const question of validated.questions) for (const response of [answerResponse(question), partialResponse(question), { type: question.interaction.type }, null]) { const expected = oracle.scoreQuestion(question, response); const actual = scoreCanonicalQuestion(question, response); assert.deepEqual({ status: actual.kind, earnedPoints: actual.earnedPoints, maxPoints: actual.maxPoints }, { status: expected.status, earnedPoints: expected.earnedPoints, maxPoints: expected.maxPoints }, `${entry.trackId}/${question.questionId}`); } }
});

test("all interactions expose completeness and immutable AttemptResult semantics", () => {
  const byType = new Map<string, Question>(); for (const { artifact } of inputs) for (const question of (artifact as { questions: Question[] }).questions) if (!byType.has(question.interaction.type)) byType.set(question.interaction.type, question);
  assert.deepEqual([...byType.keys()].sort(), ["choice_multiple", "choice_single", "complexity", "decision_matrix", "ordering"]);
  for (const question of byType.values()) { const response = answerResponse(question); assert.equal(isCanonicalResponseComplete(question, response), true); const score = scoreCanonicalQuestion(question, response); assert.deepEqual([score.kind, score.earnedPoints, score.maxPoints], ["correct", score.maxPoints, score.maxPoints]); assert.equal(Object.isFrozen(score), true); assert.equal(isCanonicalResponseComplete(question, { ...response as object, extra: true }), false); }
  const multiple = byType.get("choice_multiple")!; assert.equal(isCanonicalResponseComplete(multiple, { type: "choice_multiple", optionIds: [] }), false);
  for (const type of ["complexity", "decision_matrix"] as const) { const question = byType.get(type)!; const dimension = (question as Extract<Question, { interaction: { dimensions: unknown } }>).interaction.dimensions[0]!; assert.equal(isCanonicalResponseComplete(question, { type, selectedValueIdsByDimension: { [dimension.dimensionId]: [] } }), false); }
});

test("dimension scoring ignores inherited selections exactly like the producer oracle", async () => {
  const oracle = await import(pathToFileURL(path.join(contentRoot, "scripts/content/question-contract.mjs")).href) as Oracle;
  const questions = inputs.flatMap(({ artifact }) => (artifact as { questions: Question[] }).questions).filter((question) => question.interaction.type === "complexity" || question.interaction.type === "decision_matrix").slice(0, 12);
  for (const question of questions) { const dimension = question.interaction.type === "complexity" || question.interaction.type === "decision_matrix" ? question.interaction.dimensions[0]! : undefined; assert.ok(dimension); const inherited = Object.create({ [dimension.dimensionId]: [...dimension.acceptedValueIds] }) as Record<string, readonly string[]>; const response = { type: question.interaction.type, selectedValueIdsByDimension: inherited }; const expected = oracle.scoreQuestion(question, response); const actual = scoreCanonicalQuestion(question, response); assert.deepEqual({ status: actual.kind, earnedPoints: actual.earnedPoints, maxPoints: actual.maxPoints }, { status: expected.status, earnedPoints: expected.earnedPoints, maxPoints: expected.maxPoints }); }
});

test("dimension responses reject sparse arrays and alias-normalization collisions", () => {
  const complexityQuestion = inputs.flatMap(({ artifact }) => (artifact as { questions: Question[] }).questions).find((question) => question.interaction.type === "complexity" && question.interaction.dimensions.some((dimension) => "aliases" in dimension && Object.keys(dimension.aliases ?? {}).length > 0));
  assert.ok(complexityQuestion && complexityQuestion.interaction.type === "complexity");
  const dimension = complexityQuestion.interaction.dimensions.find((candidate) => "aliases" in candidate && Object.keys(candidate.aliases ?? {}).length > 0)!;
  const alias = Object.keys(dimension.aliases ?? {})[0]!, canonical = dimension.aliases![alias]!;
  const sparse = new Array(dimension.acceptedValueIds.length) as string[];
  const sparseResponse = answerResponse(complexityQuestion) as { type: "complexity"; selectedValueIdsByDimension: Record<string, readonly string[]> };
  sparseResponse.selectedValueIdsByDimension[dimension.dimensionId] = sparse;
  assert.equal(isCanonicalResponseComplete(complexityQuestion, sparseResponse), false);
  assert.deepEqual(scoreCanonicalQuestion(complexityQuestion, sparseResponse), { kind: "incorrect", earnedPoints: 0, maxPoints: complexityQuestion.interaction.dimensions.length, components: undefined });

  const collidingResponse = answerResponse(complexityQuestion) as { type: "complexity"; selectedValueIdsByDimension: Record<string, readonly string[]> };
  collidingResponse.selectedValueIdsByDimension[dimension.dimensionId] = [alias, canonical];
  assert.equal(isCanonicalResponseComplete(complexityQuestion, collidingResponse), false);
});

test("validator fails closed on exact keys, identities, membership and scoring consistency", () => {
  const source = (inputs[0]!.artifact as { questions: Question[] }).questions[0]!;
  const mutations: unknown[] = [
    { ...clone(source), extra: true },
    { ...clone(source), questionId: "../unsafe" },
    { ...clone(source), prompt: "\uFEFF\u2000" },
    { ...clone(source), interaction: { ...clone(source.interaction), scoringMethod: "family_magic" } },
    { ...clone(source), feedback: { ...clone(source.feedback), type: "ordering" } },
  ];
  for (const mutation of mutations) assert.ok(validateQuestion(mutation).length > 0);
  const foreign = clone(inputs[0]!.artifact) as { trackId: string }; foreign.trackId = "foreign";
  assert.throws(() => validateCanonicalArtifact(foreign, inputs[0]!.entry, inputs[0]!.entry.trackId));
  const duplicate = clone(inputs[0]!.artifact) as { questions: Question[] }; duplicate.questions[1] = duplicate.questions[0]!;
  assert.throws(() => validateCanonicalArtifact(duplicate, inputs[0]!.entry, inputs[0]!.entry.trackId));
});

test("catalog verifies bytes before exposing frozen lookups and one-way active package pin", async () => {
  const { entry, artifact } = inputs[0]!; const catalog = await createCanonicalQuestionCatalog(clone(artifact), entry, entry.trackId, sha256Utf8); const first = catalog.questions[0]!;
  assert.equal(catalog.getQuestionById(first.questionId), first); assert.ok(catalog.getQuestionsByNodeId(first.nodeId).includes(first)); assert.ok(catalog.getQuestionsByMentalUnitId(first.mentalUnitId).includes(first)); assert.equal(Object.isFrozen(catalog.questions), true);
  assert.deepEqual(catalog.packagePin, { packageIdentity: entry.sha256, packageVersion: entry.contentVersion, contentReleaseId: "canonical-content-v1" });
  assert.equal("getByPackagePin" in catalog, false); assert.equal("primaryMentalUnitId" in first, false); assert.equal("learningBlockId" in first, false);
  const mutated = clone(artifact) as { questions: Array<{ prompt: string }> }; mutated.questions[0]!.prompt += "changed";
  await assert.rejects(() => createCanonicalQuestionCatalog(mutated, entry, entry.trackId, sha256Utf8), /SHA-256/);
  await assert.rejects(() => createCanonicalQuestionCatalog(clone(artifact), { ...entry, sha256: "0".repeat(64) }, entry.trackId, sha256Utf8), /SHA-256/);
});
