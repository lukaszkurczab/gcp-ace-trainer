// Mechanical contract/identity correspondence only; independent QA owns semantics.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
import {validateQuestion,scoreQuestion} from '../../../../../patternly-content/scripts/content/question-contract.mjs';
const packet=new URL('./',import.meta.url);const name=process.argv[2];
assert.equal(process.argv.length,3);assert(/^N06-B(?:0[1-9]|10)\.json$/.test(name??''));
const manifestBytes=await readFile(new URL('N06-MANIFEST.json',packet));
const manifest=JSON.parse(manifestBytes);const unitId='OOD-'+name.slice(0,-5);
const unit=manifest.units.find(u=>u.mentalUnitId===unitId);assert(unit);
const bytes=await readFile(new URL('proposals/'+name,packet));const questions=JSON.parse(bytes);assert.equal(questions.length,18);
const seen=new Set();const identities=[];let optionsChecked=0;
for(const q of questions){
 assert(!seen.has(q.questionId));seen.add(q.questionId);
 const entry=unit.beforeItems.find(i=>i.questionId===q.questionId||i.reservedNewQuestionId===q.questionId);assert(entry,q.questionId);
 const old=entry.beforeQuestion;
 for(const key of ['trackId','nodeId','mentalUnitId','difficulty'])assert.equal(q[key],old[key],q.questionId+':'+key);
 assert.equal(q.interaction.type,old.interaction.type);assert.equal(q.interaction.scoringMethod,old.interaction.scoringMethod);
 assert.equal(q.answer.type,old.answer.type);assert.equal(q.feedback.type,old.feedback.type);
 const result=validateQuestion(q);assert.equal(result.valid,true,JSON.stringify({questionId:q.questionId,errors:result.errors}));
 assert.deepEqual(Object.keys(q.feedback.details).sort(),Object.keys(old.feedback.details).sort());
 const wrong=q.interaction.options.filter(o=>o.optionId!==q.answer.optionId).map(o=>o.optionId).sort();
 const diagnostics=q.feedback.messages.filter(m=>m.kind==='wrong_option').map(m=>m.targetId).sort();assert.deepEqual(diagnostics,wrong,q.questionId);
 for(const option of q.interaction.options){
  const response={type:'choice_single',optionId:option.optionId};const normal=scoreQuestion(q,response);
  const reversed=scoreQuestion({...q,interaction:{...q.interaction,options:[...q.interaction.options].reverse()}},response);
  assert.deepEqual(reversed,normal);assert.equal(normal.earnedPoints,option.optionId===q.answer.optionId?1:0);optionsChecked++;
 }
 identities.push({beforeQuestionId:old.questionId,questionId:q.questionId,identityShape:q.questionId===old.questionId?'same-ID proposal; meaning review pending':'reserved replacement proposal; meaning review pending',beforeQuestionSha256:sha256(canonicalJson(old)),currentWholeObjectSha256:sha256(canonicalJson(q)),acceptedOptionId:q.answer.optionId});
}
assert.equal(new Set(identities.map(i=>i.beforeQuestionId)).size,18);
console.log(JSON.stringify({result:'PASS',scope:'Mechanical schema/count/taxonomy/identity correspondence, actual scoring/reversal and exact wrong-diagnostic bindings only; no semantic or identity-action acceptance',unit:unitId,proposal:name,proposalSha256:sha256(bytes),manifestSha256:sha256(manifestBytes),wholeObjectCount:18,optionsChecked,items:identities},null,2));
