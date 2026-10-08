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
  assert.deepEqual({ tracks: inputs.length, nodes: nodes.size, mentalUnits: units.size, questions }, { tracks: 9, nodes: 117, mentalUnits: 943, questions: 16_622 });
  assert.equal(padded?.prompt, "After Floyd's pointers meet, what transformation finds the cycle entry? ");
});

test("optional question relations require reciprocal same-unit peers with matching rationales", () => {
  const source = inputs.find(({ entry }) => entry.trackId === "google-cloud-associate-cloud-engineer")!;
  const artifact = clone(source.artifact) as { schemaVersion: string; trackId: string; contentVersion: string; questions: Question[]; simulationProfiles?: unknown[] };
  const firstIndex = artifact.questions.findIndex((question, index) => artifact.questions.some((candidate, candidateIndex) =>
    candidateIndex > index && candidate.nodeId === question.nodeId && candidate.mentalUnitId === question.mentalUnitId));
  assert.ok(firstIndex >= 0, "fixture needs two questions in the same mental unit");
  const first = artifact.questions[firstIndex]!;
  const secondIndex = artifact.questions.findIndex((question, index) => index > firstIndex && question.nodeId === first.nodeId && question.mentalUnitId === first.mentalUnitId);
  const second = artifact.questions[secondIndex]!;
  const relation = (counterpartQuestionId: string) => ({ counterpartQuestionId, kind: "near_variant" as const, changedCondition: "The caller may now retry.", decisionBoundary: "Retry is safe only when the operation is idempotent." });
  artifact.questions[firstIndex] = { ...first, questionRelation: relation(second.questionId) } as Question;
  artifact.questions[secondIndex] = { ...second, questionRelation: relation(first.questionId) } as Question;
  assert.doesNotThrow(() => validateCanonicalArtifact(artifact, source.entry, source.entry.trackId));

  const invalidVariants = [
    (copy: typeof artifact) => {
      const { questionRelation: _relation, ...withoutRelation } = copy.questions[secondIndex]!;
      copy.questions[secondIndex] = withoutRelation as Question;
    },
    (copy: typeof artifact) => { copy.questions[secondIndex] = { ...copy.questions[secondIndex]!, questionRelation: relation("missing-peer") } as Question; },
    (copy: typeof artifact) => { copy.questions[secondIndex] = { ...copy.questions[secondIndex]!, questionRelation: { ...relation(first.questionId), kind: "condition_contrast" } } as Question; },
    (copy: typeof artifact) => { copy.questions[secondIndex] = { ...copy.questions[secondIndex]!, questionRelation: { ...relation(first.questionId), decisionBoundary: "A different boundary." } } as Question; },
    (copy: typeof artifact) => { copy.questions[secondIndex] = { ...copy.questions[secondIndex]!, mentalUnitId: "another-unit", questionRelation: relation(first.questionId) } as Question; },
    (copy: typeof artifact) => { copy.questions[secondIndex] = { ...copy.questions[secondIndex]!, nodeId: "another-node", questionRelation: relation(first.questionId) } as Question; },
    (copy: typeof artifact) => { copy.questions[secondIndex] = { ...copy.questions[secondIndex]!, trackId: "another-track", questionRelation: relation(first.questionId) } as Question; },
  ];
  for (const mutate of invalidVariants) {
    const copy = clone(artifact);
    mutate(copy);
    assert.throws(() => validateCanonicalArtifact(copy, source.entry, source.entry.trackId));
  }
  assert.ok(validateQuestion({ ...first, questionRelation: relation(first.questionId) }).some((error) => error.includes("cannot reference the same question")));
});

test("canonical scoring matches the producer oracle exhaustively", async () => {
  const oracle = await import(pathToFileURL(path.join(contentRoot, "scripts/content/question-contract.mjs")).href) as Oracle;
  for (const { entry, artifact } of inputs) { const validated = artifact as { questions: Question[] }; for (const question of validated.questions) for (const response of [answerResponse(question), partialResponse(question), { type: question.interaction.type }, null]) { const { contentDomainId: _contentDomainId, ...oracleQuestion } = question; const expected = oracle.scoreQuestion(oracleQuestion, response); const actual = scoreCanonicalQuestion(question, response); assert.deepEqual({ status: actual.kind, earnedPoints: actual.earnedPoints, maxPoints: actual.maxPoints }, { status: expected.status, earnedPoints: expected.earnedPoints, maxPoints: expected.maxPoints }, `${entry.trackId}/${question.questionId}`); } }
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

test("ordering response completeness rejects sparse own slots and inherited holes", () => {
  const question = inputs.flatMap(({ artifact }) => (artifact as { questions: Question[] }).questions).find((candidate) => candidate.interaction.type === "ordering");
  assert.ok(question && question.interaction.type === "ordering");
  const correct = (question as Extract<Question, { interaction: { type: "ordering" } }>).answer.orderedElementIds;
  const sparse = [...correct];
  delete sparse[1];
  assert.equal(isCanonicalResponseComplete(question, { type: "ordering", orderedElementIds: sparse }), false);

  const inherited = [...correct];
  delete inherited[1];
  Object.setPrototypeOf(inherited, Object.assign(Object.create(Array.prototype), { 1: correct[1] }));
  assert.equal(isCanonicalResponseComplete(question, { type: "ordering", orderedElementIds: inherited }), false);
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

test("catalog verifies bytes before exposing frozen lookups and exact artifact metadata", async () => {
  const { entry, artifact } = inputs[0]!; const catalog = await createCanonicalQuestionCatalog(clone(artifact), entry, entry.trackId, sha256Utf8); const first = catalog.questions[0]!;
  assert.equal(catalog.getQuestionById(first.questionId), first); assert.ok(catalog.getQuestionsByNodeId(first.nodeId).includes(first)); assert.ok(catalog.getQuestionsByMentalUnitId(first.mentalUnitId).includes(first)); assert.equal(Object.isFrozen(catalog.questions), true);
  assert.deepEqual(catalog.artifactMetadata, { artifactSha256: entry.sha256, contentVersion: entry.contentVersion, contentReleaseId: "canonical-content-v1" });
  assert.equal(Object.isFrozen(catalog.artifactMetadata), true);
  assert.equal("packagePin" in catalog, false);
  assert.equal("getByPackagePin" in catalog, false); assert.equal("primaryMentalUnitId" in first, false); assert.equal("learningBlockId" in first, false);
  const mutated = clone(artifact) as { questions: Array<{ prompt: string }> }; mutated.questions[0]!.prompt += "changed";
  await assert.rejects(() => createCanonicalQuestionCatalog(mutated, entry, entry.trackId, sha256Utf8), /SHA-256/);
  await assert.rejects(() => createCanonicalQuestionCatalog(clone(artifact), { ...entry, sha256: "0".repeat(64) }, entry.trackId, sha256Utf8), /SHA-256/);
});

test("optional GCP simulation profile is strict, complete, immutable and covered by its artifact hash", async () => {
  const gcp = inputs.find(({ entry }) => entry.trackId === "google-cloud-associate-cloud-engineer");
  assert.ok(gcp);
  const artifact = gcp.artifact as { questions: Question[]; simulationProfiles: Array<Record<string, unknown>> };
  const profile = artifact.simulationProfiles[0]!;
  assert.equal(profile.schemaVersion, "patternly-simulation-profile-envelope-v1");
  assert.equal(profile.familyId, "certification");
  assert.equal(profile.modeId, "certification-exam-simulation");
  const familyConfig = profile.familyConfig as Record<string, unknown>;
  assert.equal(familyConfig.schemaVersion, "patternly-certification-simulation-config-v1");
  const nodeIds = [...new Set(artifact.questions.map((question) => question.nodeId))].sort();
  assert.deepEqual(Object.keys(familyConfig.nodeDomainMap as object).sort(), nodeIds);
  const evidence = familyConfig.nodeDomainMapEvidence as Record<string, unknown>;
  assert.notEqual(evidence.contentVersion, gcp.entry.contentVersion);
  assert.equal(evidence.artifactPath, `artifacts/tracks/${gcp.entry.trackId}/${String(evidence.contentVersion)}/track-artifact.json`);
  assert.equal(evidence.itemCount, gcp.entry.questionCount);
  assert.equal(evidence.nodeCount, nodeIds.length);
  assert.equal(evidence.ambiguousNodeCount, 0);
  const sourceDerivedNode = Object.entries(familyConfig.nodeDomainMap as Record<string, string>).find(([, domain]) => domain === "gcp-ace-standard-domain-3")?.[0];
  assert.ok(sourceDerivedNode);

  const catalog = await createCanonicalQuestionCatalog(clone(gcp.artifact), gcp.entry, gcp.entry.trackId, sha256Utf8);
  assert.equal(catalog.simulationProfiles?.[0]?.profileId, profile.profileId);
  assert.equal(Object.isFrozen(catalog.simulationProfiles), true);
  assert.equal(Object.isFrozen(catalog.simulationProfiles?.[0]), true);

  const mutations = [
    (copy: Record<string, unknown>) => { copy.simulationProfiles = []; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; first.familyId = "coding_interview"; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; first.modeId = "certification-focus-practice"; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; first.profileVersion = "2"; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; const config = first.familyConfig as Record<string, unknown>; config.schemaVersion = "patternly-certification-simulation-config-v2"; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; const config = first.familyConfig as Record<string, unknown>; delete (config.nodeDomainMap as Record<string, string>)[nodeIds[0]!]; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; const config = first.familyConfig as Record<string, unknown>; (config.nodeDomainMap as Record<string, string>)[nodeIds[0]!] = "unknown-domain"; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; const config = first.familyConfig as Record<string, unknown>; (config.nodeDomainMap as Record<string, string>)[sourceDerivedNode!] = "gcp-ace-standard-domain-2"; },
    (copy: Record<string, unknown>) => { ((copy.questions as Array<Record<string, unknown>>).find((question) => question.nodeId === sourceDerivedNode)!).contentDomainId = "gcp-ace-standard-domain-2"; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; const config = first.familyConfig as Record<string, unknown>; (config.nodeDomainMapEvidence as Record<string, unknown>).contentVersion = "foreign-version"; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; const config = first.familyConfig as Record<string, unknown>; (config.nodeDomainMapEvidence as Record<string, unknown>).contentVersion = "../foreign"; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; const config = first.familyConfig as Record<string, unknown>; (config.questionCount as Record<string, unknown>).maximum = 61; },
    (copy: Record<string, unknown>) => { const first = (copy.simulationProfiles as Array<Record<string, unknown>>)[0]!; const config = first.familyConfig as Record<string, unknown>; (config.interactionPolicy as Record<string, unknown>).feedbackTiming = "after_each_answer"; },
  ];
  for (const mutate of mutations) {
    const copy = clone(gcp.artifact) as Record<string, unknown>;
    mutate(copy);
    assert.throws(() => validateCanonicalArtifact(copy, gcp.entry, gcp.entry.trackId));
  }

  const legacy = clone(inputs.find(({ entry }) => entry.trackId !== gcp.entry.trackId)!.artifact) as Record<string, unknown>;
  assert.equal(Object.hasOwn(legacy, "simulationProfiles"), false);
  assert.doesNotThrow(() => validateCanonicalArtifact(legacy, inputs.find(({ entry }) => entry.trackId !== gcp.entry.trackId)!.entry, inputs.find(({ entry }) => entry.trackId !== gcp.entry.trackId)!.entry.trackId));
});

test("Coding Mock profile validation requires its strict declared ordered 40-question pool", () => {
  const coding = inputs.find(({ entry }) => entry.trackId === "coding-interview-dsa-problem-solving");
  assert.ok(coding);
  const source = coding.artifact as { questions: Question[] };
  const eligibleQuestionIds = source.questions.slice(0, 40).map((question) => question.questionId);
  const policy = {
    requireUniqueItemIds: true,
    requireDeclaredSimulationEligibility: true,
    requireMultipleMentalUnits: true,
    requireMultiplePatternFamilies: true,
    requireEveryActiveInteractionTypeRepresented: true,
    prohibitConsecutiveSameMentalUnitWhenAlternativeExists: true,
    prohibitDuplicateContentIdentity: true,
    prohibitTaxonomyWidening: true,
    prohibitFallbackItems: true,
  };
  const profile = {
    schemaVersion: "patternly-simulation-profile-envelope-v1",
    profileId: "algorithms-interview-simulation-v1",
    profileVersion: "1",
    familyId: "coding_interview",
    modeId: "coding-interview-simulation",
    familyConfig: {
      schemaVersion: "patternly-coding-interview-simulation-config-v1",
      blueprintId: "coding-interview-interview-simulation-v1",
      blueprintVersion: "1",
      requestedLength: 40,
      actualLength: 40,
      shorteningPolicy: "prohibited",
      uniqueItemsRequired: 40,
      timerKind: "foreground_countdown",
      durationMinutes: 45,
      navigationPolicy: "free_navigation",
      answerChangePolicy: "editable_until_finalization",
      reinsertPolicy: "disabled",
      feedbackTiming: "after_verified_finalization",
      learningStages: ["simulation"],
      selectionPolicy: policy,
      poolId: "algorithms-interview-simulation-v1",
      poolVersion: "1",
      eligibleQuestionIds,
    },
  };
  const artifact = clone(coding.artifact) as Record<string, unknown>;
  artifact.simulationProfiles = [profile];
  const validated = validateCanonicalArtifact(artifact, coding.entry, coding.entry.trackId);
  const codingProfile = validated.simulationProfiles?.[0];
  assert.ok(codingProfile?.familyId === "coding_interview");
  assert.deepEqual(codingProfile.familyConfig.eligibleQuestionIds, eligibleQuestionIds);

  for (const mutate of [
    (copy: typeof profile) => { copy.familyConfig.eligibleQuestionIds[1] = copy.familyConfig.eligibleQuestionIds[0]!; },
    (copy: typeof profile) => { (copy.familyConfig.selectionPolicy as Record<string, unknown>).prohibitFallbackItems = false; },
    (copy: typeof profile) => { (copy.familyConfig as unknown as Record<string, unknown>).durationMinutes = 60; },
    (copy: typeof profile) => { (copy.familyConfig as unknown as Record<string, unknown>).extra = true; },
  ]) {
    const changed = clone(profile);
    mutate(changed);
    const candidate = clone(coding.artifact) as Record<string, unknown>;
    candidate.simulationProfiles = [changed];
    assert.throws(() => validateCanonicalArtifact(candidate, coding.entry, coding.entry.trackId));
  }
});
