// Host-side acceptance oracle for native smoke receipts. Does not access the app.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const [directory, choice] = process.argv.slice(2);
if (!directory || !['transfer', 'discard'].includes(choice)) throw Error('arguments_rejected');
const root = resolve(directory);
const entries = readdirSync(root).filter(n => /^\d+-(seed|inspect|remote|continue|transfer|discard|register)\.json$/.test(n)).sort().map(name => ({name,receipt:JSON.parse(readFileSync(resolve(root,name),'utf8'))}));
const observed = entries.filter(e => e.receipt.kind === 'done').map(e => ({name:e.name,value:e.receipt.value.inspection??e.receipt.value}));
const seed = observed.find(e => e.name.endsWith('-seed.json'));
assert.ok(seed,'seed_required');
assert.equal(seed.value.recordCount,4,'seed_count');
assert.deepEqual(seed.value.records.map(r=>r.type).sort(),['active_track','goal','training_session_result','training_session_summary']);
const preview = observed.find(e=>e.name>seed.name&&e.name.endsWith('-inspect.json')&&e.value.status==='previewReady');
assert.ok(preview,'settled_preview_required');
assert.equal(preview.value.profile,'guest');
assert.equal(preview.value.ownedAccount,true);
const normalize = records => [...records].sort((a,b)=>`${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
assert.deepEqual(normalize(preview.value.records),normalize(seed.value.records),'preview_preserves_guest');
const completed = observed.filter(e=>e.name>preview.name&&e.name.endsWith('-inspect.json')&&e.value.status==='synced'&&e.value.profile==='account'&&e.value.ownedAccount);
assert.ok(completed.length>=2,'post_continue_and_cold_inspections_required');
const first=completed[0],cold=completed.at(-1);
for(const row of [first,cold]){
 assert.equal(row.value.choice,choice,'choice');assert.equal(row.value.binding,'verified','binding');assert.equal(row.value.homeFenceCurrent,true,'home_fence');
 assert.equal(row.value.recordCount,choice==='transfer'?4:0,'final_count');
 assert.deepEqual(normalize(row.value.records),choice==='transfer'?normalize(seed.value.records):[],'final_records');
}
assert.equal(first.value.runtimeMarker,preview.value.runtimeMarker,'unexpected_runtime_reload_on_continue');
assert.notEqual(cold.value.runtimeMarker,first.value.runtimeMarker,'cold_start_not_observed');
const remote=observed.filter(e=>e.name>preview.name&&e.name.endsWith('-remote.json')).at(-1);
assert.ok(remote,'remote_read_required');assert.equal(remote.value.recordCount,choice==='transfer'?4:0,'remote_count');assert.deepEqual(normalize(remote.value.records),choice==='transfer'?normalize(seed.value.records):[],'remote_records');
const receipt={schema:'patternly.guest-signup-acceptance.v1',choice,result:'PASS',seed:seed.name,preview:preview.name,postContinue:first.name,coldStart:cold.name,remote:remote.name,recordCount:first.value.recordCount,noRuntimeReload:true,verifiedBinding:true,homeFenceCurrent:true};
writeFileSync(resolve(root,'acceptance.json'),JSON.stringify(receipt,null,2),{mode:0o600});console.log(JSON.stringify(receipt));
