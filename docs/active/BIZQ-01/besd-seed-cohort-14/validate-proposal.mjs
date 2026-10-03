import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {validateQuestion,scoreQuestion} from '../../../../../patternly-content/scripts/content/question-contract.mjs';
const dir=fileURLToPath(new URL('./',import.meta.url));
const bytes=readFileSync(resolve(dir,process.argv[2]??'PROPOSAL.json'));
const proposal=JSON.parse(bytes),baseline=JSON.parse(readFileSync(resolve(dir,'PREFLIGHT.json')));
const expected=baseline.units.flatMap(unit=>unit.replacements);
assert.equal(expected.length,32);assert.equal(proposal.replacements.length,32);
const results=[];let scored=0;
for(let i=0;i<32;i++){
 const entry=proposal.replacements[i],prior=expected[i],q=entry.question;
 assert.equal(entry.beforeQuestionId,prior.beforeQuestionId);assert.equal(entry.questionId,prior.proposedQuestionId);
 assert.equal(q.questionId,entry.questionId);
 for(const key of ['trackId','nodeId','mentalUnitId'])assert.equal(q[key],prior.beforeQuestion[key]);
 assert.equal(typeof entry.learningObjective,'string');assert.ok(entry.learningObjective.trim());
 const validation=validateQuestion(q);assert.equal(validation.valid,true,JSON.stringify(validation));
 assert.equal(q.interaction.type,'choice_single');assert.equal(q.interaction.scoringMethod,'exact_selected_set');
 const ids=q.interaction.options.map(option=>option.optionId),oldIds=new Set(prior.beforeQuestion.interaction.options.map(option=>option.optionId));
 const wrong=ids.filter(id=>id!==q.answer.optionId);
 assert.deepEqual(new Set(q.feedback.messages.map(message=>message.targetId)),new Set(wrong));assert.equal(q.feedback.messages.length,wrong.length);
 for(const id of ids){assert.ok(!oldIds.has(id),'changed meaning receives a new option identity');const score=scoreQuestion(q,{type:'choice_single',optionId:id});assert.equal(score.status,id===q.answer.optionId?'correct':'incorrect');assert.equal(score.earnedPoints,id===q.answer.optionId?1:0);scored++;}
 results.push({questionId:q.questionId,validated:true,scoredOptions:ids.length});
}
console.log(JSON.stringify({scope:'actual producer validation/scoring; not semantic, pool eligibility, native or admission acceptance',proposalSha256:createHash('sha256').update(bytes).digest('hex'),validatedQuestions:results.length,scoredOptions:scored,results},null,2));
