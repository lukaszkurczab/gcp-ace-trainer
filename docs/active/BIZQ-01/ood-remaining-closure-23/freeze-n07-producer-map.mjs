// Prepare the exact reviewed mixed-identity package; no canonical source writes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {canonicalJson,sha256,validateTrack} from '../../../../../patternly-content/scripts/build.mjs';
import {fileURLToPath} from 'node:url';
const packet=new URL('./',import.meta.url),producer=new URL('../../../../../patternly-content/',packet);
const raw=n=>readFile(new URL(n,packet)),get=async n=>JSON.parse(await raw(n));
const manifest=await get('N07-MANIFEST.json');
const crossBytes=await raw('CROSS-UNIT-N07-CURRENT-v3.json');assert.equal(sha256(crossBytes),'fc49b4accdb22a631d9cc871f47018968e2b1b053e5cdb923ff0249e922952b7');
const cross=JSON.parse(crossBytes);assert.equal(cross.verdict,'PASS_IDENTITY_CROSS_SCOPE_WITH_LIMITS');assert.equal(cross.items.length,144);
assert.equal(cross.manifest.sha256,sha256(await raw('N07-MANIFEST.json')));
const semantic=await get('SEMANTIC-N07-B06-B08-CURRENT-v1.json');assert.equal(sha256(await raw('SEMANTIC-N07-B06-B08-CURRENT-v1.json')),'26bdefa7179203731fa20bc38c90e89de354030be8a8428a85721256d1773f53');
const b07=await get('SEMANTIC-N07-B07-v6-QA.json');assert.equal(sha256(await raw('SEMANTIC-N07-B07-v6-QA.json')),'f402776ffdc4346229ca5be7da7b65cda4b3b45319ccd7bb8d7aa82fbe86cf0a');assert.equal(b07.verdict,'PASS');
const notes=[...(await get('review-inputs/AUTHOR-B01-B04-v2.json')).items,...(await get('review-inputs/AUTHOR-B05-B08-v2.json')).items];
const receipts=['ROOT-N07-B01-v2-ACCEPTANCE.json','ROOT-N07-B02-v2-ACCEPTANCE.json','ROOT-N07-B03-v2-ACCEPTANCE.json','ROOT-N07-B04-v2-ACCEPTANCE.json','ROOT-N07-B05-v3-ACCEPTANCE.json'];
const evidence=[];for(const p of receipts){const bytes=await raw(p),r=JSON.parse(bytes);assert.equal(r.result,'PASS');assert.equal(r.wholeObjectsMatched,18);evidence.push({path:p,sha256:sha256(bytes)});}
const sourceFiles=[],replacements=[],sameIdCorrections=[],registry=[];
for(const input of cross.currentFrozenInputs){
 const bytes=await raw(input.path);assert.equal(sha256(bytes),input.sha256);const questions=JSON.parse(bytes).sort((a,b)=>a.questionId.localeCompare(b.questionId));assert.equal(questions.length,18);
 assert.equal(canonicalJson(questions),canonicalJson((await get('proposals/N07-'+input.unit.slice(-3)+'.json')).sort((a,b)=>a.questionId.localeCompare(b.questionId))));
 const unit=manifest.units.find(u=>u.mentalUnitId===input.unit);assert.ok(unit);assert.equal(sha256(await readFile(new URL(unit.sourcePath,producer))),unit.sourceSha256);
 assert.equal(sha256(JSON.stringify(unit.beforeItems.map(b=>b.beforeQuestion).sort((a,b)=>a.questionId.localeCompare(b.questionId)))),unit.sourceSha256);
 const source={sourceFile:unit.sourcePath,beforeSourceSha256:unit.sourceSha256,sourceSha256:sha256(JSON.stringify(questions)),nodeId:questions[0].nodeId,mentalUnitId:unit.mentalUnitId};sourceFiles.push(source);
 if(input.unit.match(/B0[1-5]$/)){const r=JSON.parse(await raw(receipts[Number(input.unit.slice(-1))-1]));assert.equal(r.inputSha256,sha256(bytes));}
 for(const q of questions){
  const row=cross.items.find(r=>r.currentQuestionId===q.questionId);assert.ok(row);const before=unit.beforeItems.find(b=>b.questionId===row.beforeQuestionId);assert.ok(before);
  assert.equal(sha256(canonicalJson(q)),row.currentWholeObjectSha256);assert.equal(sha256(canonicalJson(before.beforeQuestion)),row.beforeWholeObjectSha256);
  assert.equal(q.answer.optionId,row.currentAcceptedOptionId);assert.equal(q.interaction.options.find(o=>o.optionId===q.answer.optionId).text,row.currentAcceptedOptionText);
  if(input.unit.match(/B0[678]$/)){const sr=(input.unit.endsWith('B07')?b07.items:semantic.items).find(r=>r.currentQuestionId===q.questionId);assert.ok(sr);assert.equal(sr.contentVerdict,'PASS');assert.equal(sr.currentWholeObjectSha256,row.currentWholeObjectSha256);assert.equal(sr.beforeWholeObjectSha256,row.beforeWholeObjectSha256);assert.equal(sr.acceptedOptionId,q.answer.optionId);assert.equal(sr.acceptedOptionText,row.currentAcceptedOptionText);assert.deepEqual(sr.visibleFacts,{prompt:q.prompt,constraints:q.constraints});for(const d of sr.wrongOptionDiagnostics){assert.equal(q.interaction.options.find(o=>o.optionId===d.optionId)?.text,d.optionText);assert.equal(q.feedback.messages.find(m=>m.targetId===d.optionId)?.text,d.feedback);}}
  const replace=row.questionIdentityAction==='USE_RESERVED_QUESTION_ID';assert.equal(row.questionIdentityAction,replace?'USE_RESERVED_QUESTION_ID':'PRESERVE_QUESTION_ID');assert.equal(q.questionId,replace?before.reservedNewQuestionId:before.questionId);
  const note=notes.find(n=>n.beforeQuestionId===before.questionId);assert.ok(note);assert.ok(note.learningObjective.length>0);
  const item={...source,beforeQuestionId:before.questionId,questionId:q.questionId,nodeId:q.nodeId,mentalUnitId:q.mentalUnitId,learningObjective:note.learningObjective,confirmedDefects:before.findingCodes,identityAction:replace?'replace_question_with_new_id':'preserve_question_id',identityReason:row.identityRationale,acceptedOptionId:q.answer.optionId,sourceRefs:q.sourceRefs,beforeQuestion:before.beforeQuestion,currentQuestion:q};
  (replace?replacements:sameIdCorrections).push(item);registry.push({beforeQuestionId:before.questionId,questionId:q.questionId,beforeWholeQuestionSha256:row.beforeWholeObjectSha256,currentWholeQuestionSha256:row.currentWholeObjectSha256,identityAction:item.identityAction,acceptedOptionId:q.answer.optionId});
 }
}
assert.equal(sourceFiles.length,8);assert.equal(replacements.length,34);assert.equal(sameIdCorrections.length,110);
const current=await validateTrack({rootDirectory:fileURLToPath(producer),trackId:manifest.trackId});assert.equal(current.track.contentVersion,manifest.contentVersion);assert.equal(sha256(current.questions),manifest.questionSetSha256);
const remove=new Set(registry.map(r=>r.beforeQuestionId));const next=[...current.questions.filter(q=>!remove.has(q.questionId)),...[...replacements,...sameIdCorrections].map(i=>i.currentQuestion)].sort((a,b)=>a.questionId.localeCompare(b.questionId));assert.equal(next.length,1413);assert.equal(new Set(next.map(q=>q.questionId)).size,1413);
const proof={schemaVersion:'patternly-bizq-semantic-replacement-v1',scope:'BIZQ-01 OOD source23, fixed eight-unit N07 cohort; 34 question replacements and 110 same-ID corrections; not full-bank acceptance',trackId:manifest.trackId,beforeProducerCommit:manifest.producerRepositoryHead,beforeContentVersion:manifest.contentVersion,contentVersion:'object-oriented-design-interview-authoring-v2026.10.05-bizq01-23',beforeQuestionSetSha256:manifest.questionSetSha256,questionSetSha256:sha256(next),sourceFiles,replacements,sameIdCorrections};
const proofBytes=Buffer.from(JSON.stringify(proof,null,2)+'\n');
const reviews=[...evidence,...['SEMANTIC-N07-B06-B08-CURRENT-v1.json','SEMANTIC-N07-B07-v6-QA.json','CROSS-UNIT-N07-CURRENT-v3.json'].map(p=>({path:p}))];for(const r of reviews)r.sha256=sha256(await raw(r.path));
const map={result:'PASS',scope:'Exact reviewed144 semantic/identity producer-map preparation only; producer implementation/design/admission acceptance pending',manifestSha256:sha256(await raw('N07-MANIFEST.json')),semanticEvidence:reviews,registrySha256:sha256(registry),proofSha256:sha256(proofBytes),...proof};
await writeFile(new URL('PREPARED-FIXED-PROOF23.json',packet),proofBytes,{flag:'wx'});const mapBytes=Buffer.from(JSON.stringify(map,null,2)+'\n');await writeFile(new URL('ROOT-N07-PRODUCER-MAP.json',packet),mapBytes,{flag:'wx'});
console.log(JSON.stringify({result:'PASS',objects:144,replacements:34,sameIdCorrections:110,sourceFiles:8,questionSetSha256:proof.questionSetSha256,proofSha256:sha256(proofBytes),mapSha256:sha256(mapBytes),sourceActivation:false}));
