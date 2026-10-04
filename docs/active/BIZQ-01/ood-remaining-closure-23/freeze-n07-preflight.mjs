import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packet = fileURLToPath(new URL('./', import.meta.url));
const app = path.resolve(packet, '../../../..');
const producer = path.resolve(app, '../patternly-content');
const priorPacket = path.resolve(app, '../patternly/docs/active/BIZQ-01/ood-remaining-closure-21');
const { canonicalJson, validateTrack } = await import(pathToFileURL(path.join(producer, 'scripts/build.mjs')));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hashCanonical = (value) => hash(canonicalJson(value));
const readJson = async (base, relativePath) => JSON.parse(await readFile(path.join(base, relativePath), 'utf8'));
const pretty = (value) => `${JSON.stringify(value, null, 2)}\n`;
const nodeId = 'persistence_repositories_serialization_and_domain_boundaries';
const trackId = 'object-oriented-design-interview';
const contentVersion = 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-22';
const qsetSha256 = 'c6cf903178b823fb71ac29040f3c5fa5f72c619d3adbb525fc7791756654ac3e';
const observationsBytes = await readFile(path.join(packet, 'N07-CURRENT-SOURCE-OBSERVATIONS.json'));
assert.equal(hash(observationsBytes), '2f3339224e39a762e1958d95cf3ee5d5deac8416c2d4f58c870037ed1515c6b4');
const observations = JSON.parse(observationsBytes);
const gapContext = Object.fromEntries(observations.items.filter(item => item.priorDisposition === 'CONTRACT_GAP').map(item => {
  assert.equal(item.targetedCurrentRecheck.currentAssessment, 'CONTRACT_GAP_RETAINED');
  return [item.questionId, item.targetedCurrentRecheck];
}));

const contract = await readJson(packet, 'N07-CONTRACT.json');
const contractBytes = await readFile(path.join(packet, 'N07-CONTRACT.json'));
const briefingBytes = await readFile(path.join(packet, 'N07-BRIEFING.md'));
const designQaBytes = await readFile(path.join(packet, 'N07-DESIGN-QA.md'));
const priorBytes = await readFile(path.join(priorPacket, 'SOURCE-PREFLIGHT.json'));
const prior = JSON.parse(priorBytes);
const priorN07 = prior.items.filter((item) => item.mentalUnitId?.startsWith('OOD-N07-'));
const priorById = new Map(priorN07.map((item) => [item.questionId, item]));
assert.equal(priorN07.length, 144);
assert.equal(priorById.size, 144);

const currentHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: producer, encoding: 'utf8' }).trim();
const dirtyN07 = execFileSync('git', ['status', '--porcelain', '--', 'content/object-oriented-design-interview/persistence_repositories_serialization_and_domain_boundaries'], { cwd: producer, encoding: 'utf8' }).trim();
assert.equal(dirtyN07, '', 'N07 source files must be committed and clean for this freeze');
const validation = await validateTrack({ rootDirectory: producer, trackId });
assert.equal(validation.track.contentVersion, contentVersion);
assert.equal(validation.questions.length, 1413);
assert.equal(validation.sourceFiles.length, 79);
const currentQuestions = [...validation.questions].sort((left, right) => left.questionId.localeCompare(right.questionId));
const currentQsetSha256 = hashCanonical(currentQuestions);
assert.equal(currentQsetSha256, qsetSha256);

const sourceProof = await readJson(producer, 'evidence/business-quality/bizq-01-ood-node-closure-22.json');
assert.equal(sourceProof.contentVersion, contentVersion);
assert.equal(sourceProof.questionSetSha256, currentQsetSha256);
const appRelease = await readJson(producer, 'reports/candidate-reconciliation/AWS-02-DRAFT/release/release.json');
const releaseOod = appRelease.artifacts.find((item) => item.trackId === trackId);
assert.ok(releaseOod);
assert.equal(releaseOod.contentVersion, contentVersion);
assert.equal(releaseOod.questionSetSha256, currentQsetSha256);
assert.equal(releaseOod.questionCount, validation.questions.length);

const allIds = new Set(currentQuestions.map((question) => question.questionId));
const n01N06 = currentQuestions.filter((question) => /^OOD-N0[1-6]-/u.test(question.mentalUnitId ?? ''));
const n07Current = currentQuestions.filter((question) => /^OOD-N07-/u.test(question.mentalUnitId ?? ''));
assert.equal(n01N06.length, 945);
assert.equal(n07Current.length, 144);
assert.equal(currentQuestions.length - n07Current.length, 1269);

const scopeDirectory = path.join(producer, 'content', trackId, nodeId);
const expectedFiles = Array.from({ length: 8 }, (_, index) => `OOD-N07-B${String(index + 1).padStart(2, '0')}.json`);
const unitSummaries = [];
const manifestUnits = [];
const preflightItems = [];
const rawFiles = [];
for (let index = 0; index < expectedFiles.length; index += 1) {
  const fileName = expectedFiles[index];
  const unitNumber = index + 1;
  const mentalUnitId = `OOD-N07-B${String(unitNumber).padStart(2, '0')}`;
  const sourcePath = path.posix.join('content', trackId, nodeId, fileName);
  const sourceFile = path.join(scopeDirectory, fileName);
  const raw = await readFile(sourceFile);
  const questions = JSON.parse(raw.toString('utf8'));
  const sourceSha256 = hash(raw);
  const priorRows = priorN07.filter((item) => item.mentalUnitId === mentalUnitId);
  assert.equal(questions.length, 18, `${mentalUnitId} retains its 18 before objects`);
  assert.equal(priorRows.length, 18, `${mentalUnitId} has 18 prior whole-object findings`);
  for (const row of priorRows) assert.equal(row.sourceSha256, sourceSha256, `${row.questionId} file hash still matches the previous whole-object review`);
  const objectives = [...new Set(priorRows.map((item) => item.primaryLearningObjectiveHypothesis))];
  assert.equal(objectives.length, 1, `${mentalUnitId} has one current objective hypothesis`);
  const expectedQuestionIds = Array.from({ length: 18 }, (_, itemIndex) => `ood-n07-b${String(unitNumber).padStart(2, '0')}-i${String(itemIndex + 1).padStart(3, '0')}`);
  assert.deepEqual(questions.map((question) => question.questionId).sort(), expectedQuestionIds);

  const beforeItems = [];
  for (const question of questions) {
    const priorItem = priorById.get(question.questionId);
    assert.ok(priorItem, `prior item exists for ${question.questionId}`);
    assert.equal(question.mentalUnitId, mentalUnitId);
    assert.equal(question.trackId, trackId);
    const currentQuestionSha256 = hashCanonical(question);
    assert.equal(currentQuestionSha256, priorItem.wholeQuestionSha256, `whole object remains exact: ${question.questionId}`);
    assert.deepEqual(question, validation.questions.find((item) => item.questionId === question.questionId));
    const oldIndex = Number(question.questionId.match(/-i(\d{3})$/u)?.[1]);
    assert.ok(Number.isInteger(oldIndex) && oldIndex >= 1 && oldIndex <= 18, `expected a current N07 question ID: ${question.questionId}`);
    const reservedNewQuestionId = question.questionId.replace(/-i\d{3}$/u, `-i${String(oldIndex + 18).padStart(3, '0')}`);
    assert.equal(allIds.has(reservedNewQuestionId), false, `corresponding reserved ID is unused in the complete OOD track: ${reservedNewQuestionId}`);
    const disposition = priorItem.disposition;
    assert.ok(['CONFIRMED', 'CONTRACT_GAP'].includes(disposition));
    const identityHypothesis = disposition === 'CONTRACT_GAP'
      ? 'UNDECIDED: preserve the supported facet of the existing decision while clarifying the nearest adequate alternative; this ambiguity is not proof the keyed answer is wrong. Keep this question ID if the primary decision and accepted meaning remain; consider the unit-reserved ID only if reviewed facts require a genuine primary-semantic/archetype change.'
      : 'UNDECIDED: address the recorded finding against this existing objective. Keep this question ID if the primary decision and accepted answer meaning remain; consider the unit-reserved ID only if review establishes a genuine primary-semantic/archetype change.';
    const reservedIds = Array.from({ length: 18 }, (_, reservedIndex) => `ood-n07-b${String(unitNumber).padStart(2, '0')}-i${String(reservedIndex + 19).padStart(3, '0')}`);
    for (const reservedId of reservedIds) assert.equal(allIds.has(reservedId), false, `reserved ID is unused in the complete OOD track: ${reservedId}`);
    const entry = {
      questionId: question.questionId,
      reservedNewQuestionId,
      beforeQuestionSha256: currentQuestionSha256,
      currentQuestionSha256,
      currentMatchesPriorReview: true,
      priorDisposition: disposition,
      findingCodes: priorItem.findingCodes,
      learningObjectiveHypothesis: priorItem.primaryLearningObjectiveHypothesis,
      visibleScenarioFacts: priorItem.visibleScenarioFacts,
      statedConstraints: priorItem.statedConstraints,
      keyedOptionId: priorItem.keyedOptionId,
      keyedDecision: priorItem.keyedDecision,
      caseToDecisionFinding: priorItem.caseToDecisionFinding,
      nearestAlternativeFinding: priorItem.nearestAlternativeFinding,
      explanationFinding: priorItem.explanationFinding,
      checkedFields: priorItem.checkedFields,
      identityHypothesis,
      gapContextReview: gapContext[question.questionId] ?? null,
      beforeQuestion: question,
    };
    beforeItems.push(entry);
    const { beforeQuestion: _beforeQuestion, ...preflightItem } = entry;
    preflightItems.push({
      ...preflightItem,
      mentalUnitId,
      sourcePath,
      sourceSha256,
    });
  }
  const reservedIds = Array.from({ length: 18 }, (_, reservedIndex) => `ood-n07-b${String(unitNumber).padStart(2, '0')}-i${String(reservedIndex + 19).padStart(3, '0')}`);
  const gapCount = priorRows.filter((item) => item.disposition === 'CONTRACT_GAP').length;
  unitSummaries.push({
    mentalUnitId,
    sourcePath,
    sourceSha256,
    currentQuestionCount: questions.length,
    priorDispositionCounts: {
      CONFIRMED: priorRows.filter((item) => item.disposition === 'CONFIRMED').length,
      CONTRACT_GAP: gapCount,
    },
    learningObjectiveHypothesis: objectives[0],
    reservedNewQuestionIds: reservedIds,
  });
  manifestUnits.push({ mentalUnitId, sourcePath, sourceSha256, beforeItems });
  rawFiles.push({ sourcePath, sha256: sourceSha256, questionCount: questions.length });
}

assert.equal(preflightItems.length, 144);
assert.equal(Object.keys(gapContext).length, 11);
assert.equal(preflightItems.filter((item) => item.priorDisposition === 'CONTRACT_GAP').length, 11);
assert.equal(preflightItems.filter((item) => item.priorDisposition === 'CONFIRMED').length, 133);
assert.ok(preflightItems.filter((item) => item.priorDisposition === 'CONTRACT_GAP').every((item) => item.gapContextReview));
assert.ok(preflightItems.filter((item) => item.priorDisposition === 'CONFIRMED').every((item) => item.gapContextReview === null));

const guidelinesPath = contract.canonicalFile;
const guidelinesBytes = await readFile(guidelinesPath);
assert.equal(hash(guidelinesBytes), contract.sha256);
const suffix = Buffer.from('\n' + contract.clause + '\n');
assert.ok(guidelinesBytes.subarray(-suffix.length).equals(suffix));
assert.equal(hash(guidelinesBytes.subarray(0, -suffix.length)), contract.beforeSha256);
const priorSourcePreflightSha256 = hash(priorBytes);
const manifest = {
  schemaVersion: 'patternly-bizq01-ood-n07-manifest-v23-v1',
  stage: 'read-only-current-source-freeze; identity-actions-undecided',
  trackId,
  producerRepositoryHead: currentHead,
  contentVersion,
  questionSetSha256: currentQsetSha256,
  sourceQuestionCount: validation.questions.length,
  sourceFileCount: validation.sourceFiles.length,
  objectiveScope: { nodeId, questionCount: 144, unitCount: 8, otherCurrentOodQuestionCount: 1269, acceptedN01N06QuestionCount: 945 },
  previousPreflight: {
    path: '../ood-remaining-closure-21/SOURCE-PREFLIGHT.json',
    sha256: priorSourcePreflightSha256,
    contentVersion: prior.track.contentVersion,
    questionSetSha256: prior.track.questionSetSha256,
    itemCount: 144,
    dispositionCounts: { CONFIRMED: 133, CONTRACT_GAP: 11 },
  },
  canonicalGuidelineContract: {
    contractPath: 'N07-CONTRACT.json',
    contractSha256: hash(contractBytes),
    briefingPath: 'N07-BRIEFING.md',
    briefingSha256: hash(briefingBytes),
    designReviewPath: 'N07-DESIGN-QA.md',
    designReviewSha256: hash(designQaBytes),
    canonicalFile: guidelinesPath,
    beforeSha256: contract.beforeSha256,
    currentSha256: hash(guidelinesBytes),
  },
  reservedIdentityPolicy: {
    interpretation: 'Unused candidates only; no per-item identity action is approved by this source preflight.',
    candidateIndexes: [19, 36],
    verifiedUnusedAcrossAllCurrentOodQuestions: true,
    totalUnusedCandidates: 144,
  },
  unitSummaries,
  sourceFiles: rawFiles,
  units: manifestUnits,
};
const manifestBytes = Buffer.from(pretty(manifest));
const preflight = {
  schemaVersion: 'patternly-bizq01-ood-n07-source-preflight-v23-v1',
  stage: 'read-only-current-source-preflight-complete; no authoring or identity approval',
  track: { trackId, contentVersion, questionCount: validation.questions.length, sourceFileCount: validation.sourceFiles.length, questionSetSha256: currentQsetSha256, producerRepositoryHead: currentHead },
  scope: { nodeId, sourceFiles: rawFiles.length, questions: preflightItems.length, dispositionCounts: { CONFIRMED: 133, CONTRACT_GAP: 11 }, acceptedN01N06Questions: n01N06.length, otherCurrentOodQuestions: validation.questions.length - n07Current.length },
  manifest: { path: 'N07-MANIFEST.json', sha256: hash(manifestBytes) },
  previousAssessment: { path: '../ood-remaining-closure-21/SOURCE-PREFLIGHT.json', sha256: priorSourcePreflightSha256, exactUnchangedObjectsReused: 144 },
  n07Contract: { path: 'N07-CONTRACT.json', sha256: hash(contractBytes), canonicalGuidelineSha256: hash(guidelinesBytes), unchangedN06PrefixSha256: contract.beforeSha256 },
  dispositionMeaning: 'CONFIRMED means the prior whole-object review found a current objective/decision or feedback mismatch. CONTRACT_GAP means current facts make the key plausible but do not separate it from an adequate simpler alternative; it is not a finding that the answer is false.',
  contractGapContextAssessment: Object.entries(gapContext).map(([questionId, assessment]) => ({ questionId, ...assessment, verdictLimit: 'ambiguity only; not a proven wrong key' })),
  currentObservations: {path: 'N07-CURRENT-SOURCE-OBSERVATIONS.json', sha256: hash(observationsBytes)},
  items: preflightItems,
};
const preflightBytes = Buffer.from(pretty(preflight));

await writeFile(path.join(packet, 'N07-MANIFEST.json'), manifestBytes);
await writeFile(path.join(packet, 'N07-PREFLIGHT.json'), preflightBytes);
process.stdout.write(`${JSON.stringify({
  result: 'PASS',
  producerRepositoryHead: currentHead,
  contentVersion,
  questionSetSha256: currentQsetSha256,
  sourceFileCount: rawFiles.length,
  questionCount: preflightItems.length,
  sourceHashesAndWholeObjectsUnchanged: true,
  confirmed: 133,
  contractGaps: 11,
  acceptedN01N06Questions: n01N06.length,
  preservedOtherOodQuestions: validation.questions.length - n07Current.length,
  reservedQuestionIdsUnusedAcross1413: 144,
  manifestSha256: hash(manifestBytes),
  preflightSha256: hash(preflightBytes),
}, null, 2)}\n`);
