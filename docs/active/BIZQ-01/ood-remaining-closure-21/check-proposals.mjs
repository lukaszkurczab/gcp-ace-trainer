// Fixed N05 proposal schema/identity/scorer checks, not semantic acceptance.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
import {validateQuestion,scoreQuestion} from '../../../../../patternly-content/scripts/content/question-contract.mjs';
const packet=new URL('./',import.meta.url);
const bytes=await readFile(new URL('N05-MANIFEST.json',packet));
assert.equal(sha256(bytes),'bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a');
const manifest=JSON.parse(bytes);
const selected=process.argv.slice(2);
assert(selected.every(x=>/^B0[1-9]$/.test(x)),'Select only literal B01–B09 units');
assert.equal(new Set(selected).size,selected.length,'Duplicate selected unit');
const units=manifest.units.filter(u=>selected.length===0||selected.includes(u.mentalUnitId.slice(-3)));
let scoreCases=0;const result=[];
for(const unit of units){
 const unitKey=unit.mentalUnitId.replace('OOD-','');
 const proposalBytes=await readFile(new URL(`proposals/${unitKey}.json`,packet));
 const rows=JSON.parse(proposalBytes);assert(Array.isArray(rows));assert.equal(rows.length,17);
 const beforeById=new Map(unit.items.flatMap(i=>[[i.beforeQuestionId,i],[i.reservedNewQuestionId,i]]));const seen=new Set();
 let retained=0,replaced=0,soleLongestCorrect=0,reasonEqualsKey=0;
 for(const q of rows){
  const item=beforeById.get(q.questionId);assert(item,`Outside fixed identity scope: ${q.questionId}`);assert(!seen.has(item.beforeQuestionId),`Duplicate predecessor: ${q.questionId}`);seen.add(item.beforeQuestionId);
  const validation=validateQuestion(q);assert(validation.valid,`${q.questionId}: ${validation.errors.join('; ')}`);
  const before=item.beforeQuestion;
  for(const field of ['trackId','nodeId','mentalUnitId','difficulty'])assert.equal(q[field],before[field],`${q.questionId}/${field}`);
  for(const field of ['type','scoringMethod'])assert.equal(q.interaction[field],before.interaction[field],`${q.questionId}/${field}`);
  assert.equal(q.interaction.type,'choice_single');
  q.questionId===item.beforeQuestionId?retained++:replaced++;
  const options=q.interaction.options;const key=options.find(o=>o.optionId===q.answer.optionId);assert(key);
  const words=text=>text.trim().split(/\s+/u).length;
  if(options.filter(o=>o!==key).every(o=>words(key.text)>words(o.text)))soleLongestCorrect++;
  if(q.feedback.reason===key.text)reasonEqualsKey++;
  for(const candidate of [q,{...q,interaction:{...q.interaction,options:[...options].reverse()}}])for(const option of options){
   const score=scoreQuestion(candidate,{type:'choice_single',optionId:option.optionId});
   assert.equal(score.earnedPoints,option.optionId===q.answer.optionId?1:0,`${q.questionId}/${option.optionId}`);
   assert.equal(score.status,option.optionId===q.answer.optionId?'correct':'incorrect');scoreCases++;
  }
 }
 assert.equal(seen.size,17);
 result.push({unit:unit.mentalUnitId,proposalSha256:sha256(proposalBytes),questionCount:rows.length,retainedIds:retained,reservedIdsUsed:replaced,advisory:{soleLongestCorrect,reasonEqualsKey},wholeObjectsSha256:sha256(canonicalJson(rows))});
}
console.log(JSON.stringify({result:'PASS',scope:'Fixed selected N05 proposal schema/taxonomy/reserved identity/ID scorer and reversed order only; identity semantics and style warnings require independent whole-object review',questionCount:units.length*17,scoreCases,units:result},null,2));
