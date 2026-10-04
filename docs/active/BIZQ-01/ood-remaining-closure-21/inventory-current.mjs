// Read-only inventory of the accepted source20 baseline for closure planning.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateTrack,canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const root=fileURLToPath(new URL('../../../../../patternly-content/',import.meta.url));
const track=await validateTrack({rootDirectory:root,trackId:'object-oriented-design-interview'});
assert.equal(track.track.contentVersion,'object-oriented-design-interview-authoring-v2026.10.04-bizq01-20');
const qset=sha256(canonicalJson(track.questions));
assert.equal(qset,'5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72');
const nodes=new Map();
for(const q of track.questions){const n=nodes.get(q.nodeId)||{questions:0,units:new Map(),genericOwnerLeads:0};n.questions++;n.units.set(q.mentalUnitId,(n.units.get(q.mentalUnitId)||0)+1);if(q.answer?.optionId==='owner_preserves_contract')n.genericOwnerLeads++;nodes.set(q.nodeId,n);}
const rows=[...nodes].map(([nodeId,n])=>({nodeId,questions:n.questions,mentalUnits:n.units.size,genericOwnerLeads:n.genericOwnerLeads,unitCounts:Object.fromEntries(n.units)}));
const remaining=rows.filter(n=>n.genericOwnerLeads>0);
assert.equal(remaining.reduce((sum,n)=>sum+n.questions,0),801);
assert.equal(remaining.reduce((sum,n)=>sum+n.mentalUnits,0),45);
console.log(JSON.stringify({scope:'Current exact inventory; generic owner key is a risk lead, not per-item defect verdict or acceptance',contentHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),contentVersion:track.track.contentVersion,questionSetSha256:qset,trackQuestions:track.questions.length,acceptedNodeQuestions:612,remainingSourceQuestions:801,remainingMentalUnits:45,nodes:rows},null,2));
