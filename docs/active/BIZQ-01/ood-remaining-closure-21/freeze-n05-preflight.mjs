// Read-only source capture for a closed proposal scope. Reserved IDs are conditional.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateTrack,canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url);
const root=fileURLToPath(new URL('../../../../../patternly-content/',import.meta.url));
const t=await validateTrack({rootDirectory:root,trackId:'object-oriented-design-interview'});
const qset=sha256(canonicalJson(t.questions));
assert.equal(qset,'5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72');
const pre=JSON.parse(await readFile(new URL('SOURCE-PREFLIGHT.json',packet)));
const findings=pre.items.filter(r=>/^OOD-N05-B0[1-9]$/.test(r.mentalUnitId));
assert.equal(findings.length,153);
const ids=new Set();const units=new Map();
for(const r of findings){
 assert(!ids.has(r.questionId));ids.add(r.questionId);
 const sourceBytes=await readFile(`${root}/${r.sourcePath}`);assert.equal(sha256(sourceBytes),r.sourceSha256);
 const q=JSON.parse(sourceBytes).find(q=>q.questionId===r.questionId);assert(q);assert.equal(sha256(canonicalJson(q)),r.wholeQuestionSha256);
 const unit=units.get(r.mentalUnitId)||{mentalUnitId:r.mentalUnitId,sourceFile:r.sourcePath,beforeSourceSha256:r.sourceSha256,items:[]};
 assert.equal(unit.sourceFile,r.sourcePath);assert.equal(unit.beforeSourceSha256,r.sourceSha256);
 const suffix=Number(q.questionId.match(/-i(\d+)$/)[1]);assert(suffix>=1&&suffix<=17);
 unit.items.push({beforeQuestionId:q.questionId,reservedNewQuestionId:q.questionId.replace(/i\d+$/,`i${String(suffix+17).padStart(3,'0')}`),identityAction:'UNDECIDED_BEFORE_PROPOSAL_REVIEW',beforeQuestionSha256:r.wholeQuestionSha256,objective:r.primaryLearningObjectiveHypothesis,confirmedFinding:r, beforeQuestion:q});
 units.set(r.mentalUnitId,unit);
}
assert.equal(units.size,9);for(const u of units.values())assert.equal(u.items.length,17);
const manifest={scope:'Closed N05 before-source/proposal manifest only; no identity or activation approval',trackId:t.trackId,beforeContentVersion:t.track.contentVersion,beforeQuestionSetSha256:qset,questionCount:t.questions.length,scopedQuestionCount:153,preservedOtherOODQuestionCount:1260,acceptedN01N04QuestionCount:612,unitCount:9,units:[...units.values()].sort((a,b)=>a.mentalUnitId.localeCompare(b.mentalUnitId)),identityRule:'Keep ID only when primary decision and accepted meaning remain; reserved unused i018–i034 apply only to a reviewed genuine primary-semantic change. Never reuse option IDs for new meanings.'};
await writeFile(new URL('N05-MANIFEST.json',packet),`${JSON.stringify(manifest,null,2)}\n`);
console.log(JSON.stringify({scope:manifest.scope,questionSetSha256:qset,sourceFiles:9,records:153,rawAndWholeBindings:'PASS',identityMap:'not approved'}));
