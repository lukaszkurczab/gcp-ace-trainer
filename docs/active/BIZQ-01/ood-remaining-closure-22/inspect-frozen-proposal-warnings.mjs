// Use the existing advisory console on exact frozen proposals; never record outcomes.
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createContentReviewConsole, LAUNCH_TRACK_IDS} from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';

const packet = new URL('./', import.meta.url);
const names = process.argv.slice(2);
assert(names.length > 0 && names.length <= 10);
assert.equal(new Set(names).size, names.length);
const root = await mkdtemp(join(tmpdir(), 'n06-frozen-warnings-'));
try {
  for (const track of LAUNCH_TRACK_IDS) await mkdir(join(root, 'content', track), {recursive:true});
  const inputs = [];
  const unitIds = new Set();
  for (const name of names) {
    assert(/^N06-B(?:0[1-9]|10)-v[1-9][0-9]?\.json$/.test(name));
    const bytes = await readFile(new URL('review-inputs/' + name, packet));
    const questions = JSON.parse(bytes);
    assert.equal(questions.length, 18);
    const {trackId, nodeId, mentalUnitId} = questions[0];
    assert.equal(trackId, 'object-oriented-design-interview');
    assert.equal(nodeId, 'behavior_state_commands_events_and_workflows');
    assert.equal(mentalUnitId, 'OOD-' + name.split('-v')[0]);
    assert(!unitIds.has(mentalUnitId)); unitIds.add(mentalUnitId);
    for (const q of questions) {
      assert.equal(q.trackId, trackId); assert.equal(q.nodeId, nodeId); assert.equal(q.mentalUnitId, mentalUnitId);
    }
    const directory = join(root, 'content', trackId, nodeId);
    await mkdir(directory, {recursive:true});
    await writeFile(join(directory, mentalUnitId + '.json'), bytes, {flag:'wx'});
    inputs.push({path:'review-inputs/' + name, sha256:sha256(bytes), mentalUnitId});
  }
  const service = await createContentReviewConsole({root});
  const rows = service.listItems();
  assert.equal(rows.length, names.length * 18);
  for (const row of rows) assert.equal(row.review.status, 'unreviewed');
  const warnings = rows.filter(row => row.riskFlags.length).map(row => ({questionId:row.questionId, mentalUnitId:row.mentalUnitId, riskFlags:row.riskFlags}));
  console.log(JSON.stringify({scope:'Existing console advisory flags on frozen proposals only; no canonical source, approval outcome or semantic acceptance', inputs, questionCount:rows.length, warningItemCount:warnings.length, warnings}, null, 2));
} finally {
  await rm(root, {recursive:true, force:true});
}
