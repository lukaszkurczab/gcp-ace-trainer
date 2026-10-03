import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {validateQuestion,scoreQuestion} from '../../../../../patternly-content/scripts/content/question-contract.mjs';
const dir=fileURLToPath(new URL('./',import.meta.url));
const bytes=readFileSync(resolve(dir,process.argv[2]??'PROPOSAL.json'));
const p=JSON.parse(bytes),baseline=JSON.parse(readFileSync(resolve(dir,'PREFLIGHT.json')));
assert.equal(p.sourceSha256,baseline.sourceSha256);assert.equal(p.replacements.length,15);
const allOptions=new Set();const results=[];let scored=0;
for(let i=0;i<15;i++){
 const r=p.replacements[i],q=r.newQuestion;
 assert.equal(r.oldId,baseline.replacements[i].oldId);assert.equal(r.newId,baseline.replacements[i].newId);
 assert.equal(q.questionId,r.newId);assert.equal(q.mentalUnitId,'OOD-N01-B01');assert.equal(q.trackId,'object-oriented-design-interview');assert.equal(q.nodeId,'requirements_use_cases_domain_vocabulary_and_model_boundaries');
 const validation=validateQuestion(q);assert.equal(validation.valid,true,JSON.stringify(validation));
 assert.equal(q.interaction.type,'choice_single');assert.equal(q.interaction.scoringMethod,'exact_selected_set');
 const ids=q.interaction.options.map(o=>o.optionId);assert.equal(ids.length,4);assert.equal(new Set(ids).size,4);
 const oldIds=new Set(baseline.replacements[i].beforeQuestion.interaction.options.map(o=>o.optionId));
 const wrong=ids.filter(id=>id!==q.answer.optionId);assert.deepEqual(new Set(q.feedback.messages.map(m=>m.targetId)),new Set(wrong));assert.equal(q.feedback.messages.length,wrong.length);
 for(const id of ids){assert.ok(!oldIds.has(id));allOptions.add(id);const s=scoreQuestion(q,{type:'choice_single',optionId:id});assert.equal(s.status,id===q.answer.optionId?'correct':'incorrect');assert.equal(s.earnedPoints,id===q.answer.optionId?1:0);scored++;}
 results.push({questionId:q.questionId,validated:true,scoredOptions:ids.length});
}
console.log(JSON.stringify({scope:'actual producer validation/scoring, not semantic/runtime/admission acceptance',proposalSha256:createHash('sha256').update(bytes).digest('hex'),validatedQuestions:results.length,scoredOptions:scored,uniqueOptionIds:allOptions.size,results},null,2));
