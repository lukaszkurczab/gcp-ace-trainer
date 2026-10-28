import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const TRACK = 'claude-certified-architect-professional-certification';
const DEVICE = '7F315654-3175-4F3C-BB24-B0263F59360C';
const APP = 'com.lkurczab.patternly';
const phase = process.argv[2];
if (!['demo', 'responses', 'responses-continue', 'responses-flag', 'resume-finish'].includes(phase)) throw Error('Use Node22 --import tsx scripts/runCcarpIosAcceptance.mjs <demo|responses|responses-continue|responses-flag|resume-finish> from APP root. Requires local candidate Metro8083, existing iPhone17 fixture, English UI, Claude selected.');
const output = '.agent/private/ccarp-realism-20261026/ios-acceptance';
mkdirSync(output, { recursive: true });
function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (command === 'maestro') writeFileSync(`${output}/${label}.log`, `${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  if (result.status !== 0) throw Error(`${label}_failed: see private acceptance log`);
  return result.stdout;
}
function capture(label, sessionId) {
  const value = JSON.parse(run(process.execPath, ['scripts/qa/readCcarpNativeState.mjs', ...(sessionId ? [sessionId] : [])], label));
  writeFileSync(`${output}/${label}.json`, `${JSON.stringify(value, null, 2)}\n`);
  return value;
}
function fixtureSame(before, after) {
  assert.equal(after.actorSha256, before.actorSha256);
  assert.equal(after.profileSha256, before.profileSha256);
  assert.equal(after.activeTrackId, TRACK);
}
const { loadCanonicalRuntimeCatalog } = require('../src/content/canonical/runtimeCatalog.ts');
const { createCanonicalTrainingFamilyComposition } = require('../src/application/canonicalTrainingFamilyComposition.ts');
const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
const prepared = await createCanonicalTrainingFamilyComposition(track).runtime.prepare({ trackId: TRACK, modeId: 'certification-exam-simulation', request: { sessionId: 'ccarp-ios-observation-plan' }, attempts: [], reviews: [], now: '2026-10-26T12:00:00.000Z' });
const questions = prepared.session.itemOrder.map(({ item }, index) => ({ index: index + 1, question: track.getQuestion(item.questionId) }));
const matrix = questions.find(({ question }) => question.interaction.type === 'decision_matrix');
const multiple = questions.find(({ question }) => question.interaction.type === 'choice_multiple' && question.interaction.requiredSelectionCount === 2 && question.interaction.options.length >= 3);
const single = questions.find(({ question }) => question.interaction.type === 'choice_single');
assert.ok(matrix && multiple && single);
const row = matrix.question.interaction.dimensions[0];
const negative = row.values.find(value => ['no', 'false'].includes(value.valueId));
assert.ok(negative);
const parameters = {
  MATRIX_INDEX: String(matrix.index), MATRIX_REVIEW_STEPS: String(matrix.index - 1), MATRIX_QID: matrix.question.questionId, MATRIX_DIM: row.dimensionId, MATRIX_VALUE: negative.valueId, MATRIX_VALUE_TEXT: negative.text,
  MULTI_INDEX: String(multiple.index), MULTI_QID: multiple.question.questionId, MULTI_O1: multiple.question.interaction.options[0].optionId, MULTI_O2: multiple.question.interaction.options[1].optionId, MULTI_O3: multiple.question.interaction.options[2].optionId,
  SINGLE_INDEX: String(single.index), SINGLE_QID: single.question.questionId, SINGLE_O1: single.question.interaction.options[0].optionId, SINGLE_O2: single.question.interaction.options[1].optionId,
};
writeFileSync(`${output}/observation-parameters.json`, `${JSON.stringify(parameters, null, 2)}\n`);
function flow(name) { run('maestro', ['--udid', DEVICE, 'test', '--test-output-dir', `${output}/maestro`, ...Object.entries(parameters).flatMap(([key, value]) => ['-e', `${key}=${value}`]), `.maestro/ccarp-realistic-exam-${name}.yaml`], name); }
if (phase === 'demo') {
  const before = capture('demo-before');
  assert.equal(before.activeTrackId, TRACK);
  assert.equal(before.session, null);
  flow('demo');
  const after = capture('demo-after');
  fixtureSame(before, after);
  assert.equal(after.session, null, 'demo must create no scored session or deadline');
  assert.deepEqual(after.history, before.history);
  assert.equal(after.attemptCount, before.attemptCount);
} else if (phase === 'responses' || phase === 'responses-continue') {
  const baseline = JSON.parse(readFileSync(`${output}/demo-after.json`));
  const before = capture(phase === 'responses' ? 'responses-before' : 'responses-continuation');
  fixtureSame(baseline, before);
  if (phase === 'responses') assert.equal(before.session, null);
  else {
    const started = JSON.parse(readFileSync(`${output}/responses-interrupted.json`));
    assert.equal(before.session.id, started.session.id);
    assert.equal(before.session.orderSha256, started.session.orderSha256);
    assert.equal(before.session.artifactSha256, track.trainingIdentity.artifactSha256);
    assert.ok(before.session.cursor <= matrix.index - 1);
    assert.ok(Object.keys(before.draft.responses).length <= 1);
    if (Object.keys(before.draft.responses).length) {
      const ownMatrix = before.session.occurrences.find(item => item.questionId === matrix.question.questionId).occurrenceId;
      assert.deepEqual(Object.keys(before.draft.responses), [ownMatrix]);
    }
    parameters.SKIP_START = 'true';
  }
  try { flow('responses'); } catch (cause) { capture('responses-interrupted'); throw cause; }
  const after = capture('before-cold');
  fixtureSame(baseline, after);
  assert.equal(after.session.count, 63);
  assert.equal(after.session.contentVersion, prepared.session.contentVersion);
  assert.equal(after.session.artifactSha256, track.trainingIdentity.artifactSha256);
  assert.equal(after.session.cursor, 62);
  assert.equal(after.session.configuration.scoringPolicyId, 'patternly-ccarp-complete-item-v1');
  const occurrence = questionId => after.session.occurrences.find(item => item.questionId === questionId).occurrenceId;
  assert.deepEqual(after.draft.responses[occurrence(matrix.question.questionId)].selectedValueIdsByDimension[row.dimensionId], [negative.valueId]);
  assert.deepEqual(after.draft.responses[occurrence(multiple.question.questionId)].optionIds, [parameters.MULTI_O1]);
  assert.equal(after.draft.responses[occurrence(single.question.questionId)].optionId, parameters.SINGLE_O1);
  assert.ok(after.draft.flags.includes(occurrence(single.question.questionId)));
} else if (phase === 'responses-flag') {
  const before = JSON.parse(readFileSync(`${output}/before-cold.json`));
  const current = capture('before-flag', before.session.id);
  fixtureSame(before, current);
  assert.equal(current.session.id, before.session.id);
  assert.equal(current.session.cursor, 62);
  assert.deepEqual(current.draft.responses, before.draft.responses);
  assert.equal(current.draft.flags.length, 0);
  flow('flag');
  const after = capture('before-cold');
  fixtureSame(before, after);
  assert.equal(after.session.id, before.session.id);
  assert.equal(after.session.orderSha256, before.session.orderSha256);
  assert.equal(after.session.optionsSha256, before.session.optionsSha256);
  assert.deepEqual(after.draft.responses, before.draft.responses);
  assert.ok(after.draft.flags.includes(after.session.occurrences.find(item => item.questionId === single.question.questionId).occurrenceId));
} else {
  const before = JSON.parse(readFileSync(`${output}/before-cold.json`));
  const baseline = JSON.parse(readFileSync(`${output}/demo-after.json`));
  run('xcrun', ['simctl', 'terminate', DEVICE, APP], 'terminate');
  run('xcrun', ['simctl', 'launch', DEVICE, APP, '-RCT_jsLocation', 'localhost:8083'], 'cold-launch');
  let restored;
  for (let attempt = 0; attempt < 30; attempt++) {
    try { restored = capture('cold-restored', before.session.id); break; } catch { await new Promise(resolve => setTimeout(resolve, 1000)); }
  }
  assert.ok(restored, 'local fixture must finish bootstrap');
  fixtureSame(before, restored);
  for (const key of ['id', 'contentVersion', 'artifactSha256', 'orderSha256', 'optionsSha256']) assert.equal(restored.session[key], before.session[key], key);
  assert.deepEqual(restored.session.configuration, before.session.configuration);
  assert.deepEqual(restored.draft.responses, before.draft.responses);
  assert.deepEqual(restored.draft.flags, before.draft.flags);
  flow('resume-finish');
  const after = capture('completed', before.session.id);
  fixtureSame(baseline, after);
  assert.equal(after.session, null);
  assert.equal(after.recordedSession.status, 'completed');
  assert.equal(after.recordedSession.orderSha256, before.session.orderSha256);
  assert.equal(after.recordedSession.optionsSha256, before.session.optionsSha256);
  assert.equal(after.result.total, 63);
  assert.equal(after.result.details.maxPoints, 63);
  assert.equal(after.result.answered.length, 1);
  assert.equal(after.result.unanswered.length, 62);
  assert.equal(Object.keys(after.result.details.partialResponsesByOccurrenceId).length, 2);
  assert.deepEqual(after.history, baseline.history, 'pre-existing session records must be byte-identical');
  assert.equal(after.attemptCount, baseline.attemptCount + 1, 'partial responses must not become scored attempts');
}
console.log(`CCARP_IOS_${phase.toUpperCase().replaceAll('-', '_')}=PASS`);
