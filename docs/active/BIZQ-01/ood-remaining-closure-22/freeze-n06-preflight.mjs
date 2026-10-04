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
const nodeId = 'behavior_state_commands_events_and_workflows';
const trackId = 'object-oriented-design-interview';
const contentVersion = 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-21';
const qsetSha256 = '6d19a75e8eae86869b3ce31b63ad57a6be13fc30532c22e993db6fbc3d0d4d12';
const gapContext = {
  'ood-n06-b01-i005': {
    observedFacts: 'The active caption provider can change while stream timing/error behavior remains stable, and a deterministic test seam is requested.',
    unresolvedDecision: 'These facts make policy substitution plausible but do not say providers implement independently variable behavior behind one stable workflow; ordinary dependency replacement/test substitution also fits.',
  },
  'ood-n06-b02-i001': {
    observedFacts: 'Referral disclosure is subject to privacy and consent rules before routing.',
    unresolvedDecision: 'The ordering rule may be a state-dependent transition, but the prompt gives no named states or legal transition set; a direct pre-disclosure consent check also fits.',
  },
  'ood-n06-b02-i005': {
    observedFacts: 'A temporary role expires and is attributable to an approval.',
    unresolvedDecision: 'Expiry and provenance describe lifecycle facts, but no allowed/forbidden transition sequence is given; timestamp/approval validation could satisfy the stated contract.',
  },
  'ood-n06-b02-i007': {
    observedFacts: 'A seller payout is released idempotently and only for a settled order.',
    unresolvedDecision: 'The settled-order predicate and idempotency make current status relevant, but the prompt does not enumerate states/transitions; an atomic guarded release operation also fits.',
  },
  'ood-n06-b02-i008': {
    observedFacts: 'Platform changes are delivered in effective order, and invalid intermediate state must be rejected or unrepresentable.',
    unresolvedDecision: 'Ordering and validity make an explicit state model plausible, but do not identify legal states/transitions or exclude a direct ordered update plus validation.',
  },
  'ood-n06-b02-i013': {
    observedFacts: 'Reward rules depend on the campaign’s current legal state.',
    unresolvedDecision: 'The state dependency is explicit, but there is no state set, transition rule, or variation that distinguishes a state-machine representation from a guarded reward operation.',
  },
  'ood-n06-b02-i015': {
    observedFacts: 'Repayment allocation must not reduce an outstanding balance below zero.',
    unresolvedDecision: 'The stated invariant is a boundary check; the prompt does not describe lifecycle states/transitions, so a direct balance invariant remains adequate.',
  },
  'ood-n06-b02-i016': {
    observedFacts: 'A match can be forfeited after timeout, and the bracket advances only from a legal match state.',
    unresolvedDecision: 'A valid-state transition is plausible, but the prompt omits the bracket’s legal states and transition rules; a guarded forfeit operation could also enforce this one condition.',
  },
  'ood-n06-b03-i008': {
    observedFacts: 'An approval is attributable, bounded, and cannot bypass controls; receiver messages must carry their contract.',
    unresolvedDecision: 'Queue/retry/undo or durable command identity is not specified. A synchronous approval operation plus audit record could meet these facts without a command object.',
  },
  'ood-n06-b03-i012': {
    observedFacts: 'Payout release is idempotent and tied to a settled order.',
    unresolvedDecision: 'Idempotency is explicit but no request identity, replay boundary, queue, or undo requirement is stated; an idempotent domain operation is a plausible simpler implementation.',
  },
  'ood-n06-b04-i018': {
    observedFacts: 'Passengers must receive platform changes in effective order, and resource creation/use/disposal needs an owner.',
    unresolvedDecision: 'The prompt does not identify independently owned subscribers, subscription lifetime, or delivery semantics; direct ordered notification can also satisfy it.',
  },
  'ood-n06-b09-i007': {
    observedFacts: 'Passengers receive a platform change in effective order.',
    unresolvedDecision: 'This describes an observable side effect but does not state that it occurs after commit or must be decoupled; synchronous ordered delivery remains plausible.',
  },
  'ood-n06-b09-i018': {
    observedFacts: 'After accepting a comment, the assigned author must be notified, and accepted comments retain author and document revision.',
    unresolvedDecision: 'Notification is a named side effect, but no post-commit independence, retry/delivery contract, or other consumer is stated; direct notification from the accepting operation could satisfy the facts.',
  },
  'ood-n06-b10-i001': {
    observedFacts: 'Charger capacity and reservation expiry are coordinated.',
    unresolvedDecision: 'Coordination is explicit, but the prompt gives no ordered multi-step workflow, failure point, or compensation; one reservation operation could own both checks.',
  },
  'ood-n06-b10-i004': {
    observedFacts: 'A battery cannot be assigned to two aircraft at once and repeating the operation must not create a second effect.',
    unresolvedDecision: 'This supports uniqueness/idempotency, but no multi-step workflow or recovery sequence is described; an atomic idempotent assignment command could meet it.',
  },
  'ood-n06-b10-i005': {
    observedFacts: 'Referral disclosure must follow privacy and consent rules.',
    unresolvedDecision: 'A guarded route operation fits the stated precondition; no separate workflow steps, partial effects, or compensation are described.',
  },
  'ood-n06-b10-i008': {
    observedFacts: 'A recording is replaced while annotations follow stable segments rather than file offsets.',
    unresolvedDecision: 'This supports preserving cross-object references during replacement, but the prompt does not specify a multi-step migration or rollback path; a single atomic replacement operation also fits.',
  },
  'ood-n06-b10-i011': {
    observedFacts: 'Payout release is idempotent and tied to a settled order.',
    unresolvedDecision: 'The operation has an invariant and replay property, but no sequence, compensation, or independently committed effects are named; one guarded release operation remains plausible.',
  },
  'ood-n06-b10-i013': {
    observedFacts: 'A meter cannot be committed twice for an overlapping discharge window.',
    unresolvedDecision: 'This is a concrete overlap invariant, but the prompt does not state a workflow sequence or compensation boundary; an atomic reservation check can enforce it.',
  },
  'ood-n06-b10-i015': {
    observedFacts: 'Two volunteer assignments are swapped while both skills and availability constraints hold.',
    unresolvedDecision: 'The operation spans two assignments, so coordination is plausible, but no validation/commit sequence or partial-failure behavior is stated; one atomic domain swap operation could own the invariant.',
  },
  'ood-n06-b10-i018': {
    observedFacts: 'Shipment reassignment must carry temperature restrictions and hand-off ownership with the shipment.',
    unresolvedDecision: 'Transfer of related data is explicit, but no staged hand-off, failure, or rollback is described; a single reassignment operation can preserve those fields.',
  },
};

const contract = await readJson(packet, 'N06-CONTRACT.json');
const contractBytes = await readFile(path.join(packet, 'N06-CONTRACT.json'));
const briefingBytes = await readFile(path.join(packet, 'N06-BRIEFING.md'));
const designQaBytes = await readFile(path.join(packet, 'N06-DESIGN-QA.md'));
const priorBytes = await readFile(path.join(priorPacket, 'SOURCE-PREFLIGHT.json'));
const prior = JSON.parse(priorBytes);
const priorN06 = prior.items.filter((item) => item.mentalUnitId?.startsWith('OOD-N06-'));
const priorById = new Map(priorN06.map((item) => [item.questionId, item]));
assert.equal(priorN06.length, 180);
assert.equal(priorById.size, 180);

const currentHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: producer, encoding: 'utf8' }).trim();
const dirtyN06 = execFileSync('git', ['status', '--porcelain', '--', 'content/object-oriented-design-interview/behavior_state_commands_events_and_workflows'], { cwd: producer, encoding: 'utf8' }).trim();
assert.equal(dirtyN06, '', 'N06 source files must be committed and clean for this freeze');
const validation = await validateTrack({ rootDirectory: producer, trackId });
assert.equal(validation.track.contentVersion, contentVersion);
assert.equal(validation.questions.length, 1413);
assert.equal(validation.sourceFiles.length, 79);
const currentQuestions = [...validation.questions].sort((left, right) => left.questionId.localeCompare(right.questionId));
const currentQsetSha256 = hashCanonical(currentQuestions);
assert.equal(currentQsetSha256, qsetSha256);

const sourceProof = await readJson(producer, 'evidence/business-quality/bizq-01-ood-node-closure-21.json');
assert.equal(sourceProof.contentVersion, contentVersion);
assert.equal(sourceProof.questionSetSha256, currentQsetSha256);
const appRelease = await readJson(producer, 'reports/candidate-reconciliation/AWS-02-DRAFT/release/release.json');
const releaseOod = appRelease.artifacts.find((item) => item.trackId === trackId);
assert.ok(releaseOod);
assert.equal(releaseOod.contentVersion, contentVersion);
assert.equal(releaseOod.questionSetSha256, currentQsetSha256);
assert.equal(releaseOod.questionCount, validation.questions.length);

const allIds = new Set(currentQuestions.map((question) => question.questionId));
const n01N05 = currentQuestions.filter((question) => /^OOD-N0[1-5]-/u.test(question.mentalUnitId ?? ''));
const n06Current = currentQuestions.filter((question) => /^OOD-N06-/u.test(question.mentalUnitId ?? ''));
assert.equal(n01N05.length, 765);
assert.equal(n06Current.length, 180);
assert.equal(currentQuestions.length - n06Current.length, 1233);

const scopeDirectory = path.join(producer, 'content', trackId, nodeId);
const expectedFiles = Array.from({ length: 10 }, (_, index) => `OOD-N06-B${String(index + 1).padStart(2, '0')}.json`);
const unitSummaries = [];
const manifestUnits = [];
const preflightItems = [];
const rawFiles = [];
for (let index = 0; index < expectedFiles.length; index += 1) {
  const fileName = expectedFiles[index];
  const unitNumber = index + 1;
  const mentalUnitId = `OOD-N06-B${String(unitNumber).padStart(2, '0')}`;
  const sourcePath = path.posix.join('content', trackId, nodeId, fileName);
  const sourceFile = path.join(scopeDirectory, fileName);
  const raw = await readFile(sourceFile);
  const questions = JSON.parse(raw.toString('utf8'));
  const sourceSha256 = hash(raw);
  const priorRows = priorN06.filter((item) => item.mentalUnitId === mentalUnitId);
  assert.equal(questions.length, 18, `${mentalUnitId} retains its 18 before objects`);
  assert.equal(priorRows.length, 18, `${mentalUnitId} has 18 prior whole-object findings`);
  for (const row of priorRows) assert.equal(row.sourceSha256, sourceSha256, `${row.questionId} file hash still matches the previous whole-object review`);
  const objectives = [...new Set(priorRows.map((item) => item.primaryLearningObjectiveHypothesis))];
  assert.equal(objectives.length, 1, `${mentalUnitId} has one current objective hypothesis`);
  const expectedQuestionIds = Array.from({ length: 18 }, (_, itemIndex) => `ood-n06-b${String(unitNumber).padStart(2, '0')}-i${String(itemIndex + 1).padStart(3, '0')}`);
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
    assert.ok(Number.isInteger(oldIndex) && oldIndex >= 1 && oldIndex <= 18, `expected a current N06 question ID: ${question.questionId}`);
    const reservedNewQuestionId = question.questionId.replace(/-i\d{3}$/u, `-i${String(oldIndex + 18).padStart(3, '0')}`);
    assert.equal(allIds.has(reservedNewQuestionId), false, `corresponding reserved ID is unused in the complete OOD track: ${reservedNewQuestionId}`);
    const disposition = priorItem.disposition;
    assert.ok(['CONFIRMED', 'CONTRACT_GAP'].includes(disposition));
    const identityHypothesis = disposition === 'CONTRACT_GAP'
      ? 'UNDECIDED: preserve the supported facet of the existing decision while clarifying the nearest adequate alternative; this ambiguity is not proof the keyed answer is wrong. Keep this question ID if the primary decision and accepted meaning remain; consider the unit-reserved ID only if reviewed facts require a genuine primary-semantic/archetype change.'
      : 'UNDECIDED: address the recorded finding against this existing objective. Keep this question ID if the primary decision and accepted answer meaning remain; consider the unit-reserved ID only if review establishes a genuine primary-semantic/archetype change.';
    const reservedIds = Array.from({ length: 18 }, (_, reservedIndex) => `ood-n06-b${String(unitNumber).padStart(2, '0')}-i${String(reservedIndex + 19).padStart(3, '0')}`);
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
  const reservedIds = Array.from({ length: 18 }, (_, reservedIndex) => `ood-n06-b${String(unitNumber).padStart(2, '0')}-i${String(reservedIndex + 19).padStart(3, '0')}`);
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

assert.equal(preflightItems.length, 180);
assert.equal(Object.keys(gapContext).length, 21);
assert.equal(preflightItems.filter((item) => item.priorDisposition === 'CONTRACT_GAP').length, 21);
assert.equal(preflightItems.filter((item) => item.priorDisposition === 'CONFIRMED').length, 159);
assert.ok(preflightItems.filter((item) => item.priorDisposition === 'CONTRACT_GAP').every((item) => item.gapContextReview));
assert.ok(preflightItems.filter((item) => item.priorDisposition === 'CONFIRMED').every((item) => item.gapContextReview === null));

const guidelinesPath = contract.canonicalFile;
const guidelinesBytes = await readFile(guidelinesPath);
assert.equal(hash(guidelinesBytes), contract.sha256);
const priorSourcePreflightSha256 = hash(priorBytes);
const manifest = {
  schemaVersion: 'patternly-bizq01-ood-n06-manifest-v22-v1',
  stage: 'read-only-current-source-freeze; identity-actions-undecided',
  trackId,
  producerRepositoryHead: currentHead,
  contentVersion,
  questionSetSha256: currentQsetSha256,
  sourceQuestionCount: validation.questions.length,
  sourceFileCount: validation.sourceFiles.length,
  objectiveScope: { nodeId, questionCount: 180, unitCount: 10, otherCurrentOodQuestionCount: 1233, acceptedN01N05QuestionCount: 765 },
  previousPreflight: {
    path: '../ood-remaining-closure-21/SOURCE-PREFLIGHT.json',
    sha256: priorSourcePreflightSha256,
    contentVersion: prior.track.contentVersion,
    questionSetSha256: prior.track.questionSetSha256,
    itemCount: 180,
    dispositionCounts: { CONFIRMED: 159, CONTRACT_GAP: 21 },
  },
  canonicalGuidelineContract: {
    contractPath: 'N06-CONTRACT.json',
    contractSha256: hash(contractBytes),
    briefingPath: 'N06-BRIEFING.md',
    briefingSha256: hash(briefingBytes),
    designReviewPath: 'N06-DESIGN-QA.md',
    designReviewSha256: hash(designQaBytes),
    canonicalFile: guidelinesPath,
    beforeSha256: contract.beforeSha256,
    currentSha256: hash(guidelinesBytes),
  },
  reservedIdentityPolicy: {
    interpretation: 'Unused candidates only; no per-item identity action is approved by this source preflight.',
    candidateIndexes: [19, 36],
    verifiedUnusedAcrossAllCurrentOodQuestions: true,
    totalUnusedCandidates: 180,
  },
  unitSummaries,
  sourceFiles: rawFiles,
  units: manifestUnits,
};
const manifestBytes = Buffer.from(pretty(manifest));
const preflight = {
  schemaVersion: 'patternly-bizq01-ood-n06-source-preflight-v22-v1',
  stage: 'read-only-current-source-preflight-complete; no authoring or identity approval',
  track: { trackId, contentVersion, questionCount: validation.questions.length, sourceFileCount: validation.sourceFiles.length, questionSetSha256: currentQsetSha256, producerRepositoryHead: currentHead },
  scope: { nodeId, sourceFiles: rawFiles.length, questions: preflightItems.length, dispositionCounts: { CONFIRMED: 159, CONTRACT_GAP: 21 }, acceptedN01N05Questions: n01N05.length, otherCurrentOodQuestions: validation.questions.length - n06Current.length },
  manifest: { path: 'N06-MANIFEST.json', sha256: hash(manifestBytes) },
  previousAssessment: { path: '../ood-remaining-closure-21/SOURCE-PREFLIGHT.json', sha256: priorSourcePreflightSha256, exactUnchangedObjectsReused: 180 },
  n06Contract: { path: 'N06-CONTRACT.json', sha256: hash(contractBytes), canonicalGuidelineSha256: hash(guidelinesBytes), unchangedN05PrefixSha256: contract.beforeSha256 },
  dispositionMeaning: 'CONFIRMED means the prior whole-object review found a current objective/decision or feedback mismatch. CONTRACT_GAP means current facts make the key plausible but do not separate it from an adequate simpler alternative; it is not a finding that the answer is false.',
  contractGapContextAssessment: Object.entries(gapContext).map(([questionId, assessment]) => ({ questionId, ...assessment, verdictLimit: 'ambiguity only; not a proven wrong key' })),
  exactPriorReviewReuse: [
    { questionId: 'ood-n06-b01-i017', fingerprint: 'ec323feef1348b356e99c84748aa98df85a44db96fe82946b9c8c5f76486fa23', finding: 'Revocation before access is stated, but no independent policy variation or stable workflow requires interchangeable strategy behavior.' },
    { questionId: 'ood-n06-b04-i015', fingerprint: 'd6a798f40bb07eef01b515ebb968f1acd033e9e1fbd98eca4efce60eac8041e7', finding: 'Temporary role expiry and approval attribution do not establish independent subscribers, delivery guarantees, or subscription lifetime.' },
    { questionId: 'ood-n06-b07-i011', fingerprint: '97a73f8fc82e62ca83c80549a2a70282584b09a4c4bc5e0ef7c86c3f8d019c6b', finding: 'The pre-access revocation invariant does not state bounded subclass variation or an invariant algorithm skeleton for Template Method.' },
    { questionId: 'ood-n06-b10-i014', fingerprint: '9d310d40456e4f83874c855ca59bcc0753ce91491c9dcfbe7ff76e85422e5ec7', finding: 'Provider switching preserves timing/error behavior, but no multi-step workflow, compensation, or cross-object invariant needs orchestration.' },
  ],
  items: preflightItems,
};
const preflightBytes = Buffer.from(pretty(preflight));

await writeFile(path.join(packet, 'N06-MANIFEST.json'), manifestBytes);
await writeFile(path.join(packet, 'N06-PREFLIGHT.json'), preflightBytes);
process.stdout.write(`${JSON.stringify({
  result: 'PASS',
  producerRepositoryHead: currentHead,
  contentVersion,
  questionSetSha256: currentQsetSha256,
  sourceFileCount: rawFiles.length,
  questionCount: preflightItems.length,
  sourceHashesAndWholeObjectsUnchanged: true,
  confirmed: 159,
  contractGaps: 21,
  acceptedN01N05Questions: n01N05.length,
  preservedOtherOodQuestions: validation.questions.length - n06Current.length,
  reservedQuestionIdsUnusedAcross1413: 180,
  manifestSha256: hash(manifestBytes),
  preflightSha256: hash(preflightBytes),
}, null, 2)}\n`);
