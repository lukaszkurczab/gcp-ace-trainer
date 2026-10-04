import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const packet=fileURLToPath(new URL('./',import.meta.url));const app=path.resolve(packet,'../../../../..');const repo=path.resolve(app,'../patternly-content');
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifestBytes=readFileSync(path.join(packet,'MANIFEST.json'));assert.equal(hash(manifestBytes),'725750aa6c8ebdba357f2e892e7c6aa94c45202a97c677d41284b8d063e199bf');const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.beforeProducerCommit,'1d024bb62328bdb81490d713dc41a6f7d155e9b6');assert.equal(manifest.items.length,25);
const proposalBytes=readFileSync(path.join(packet,'PROPOSED-REASONS.json'));const proposal=JSON.parse(proposalBytes);assert(Array.isArray(proposal));assert.equal(proposal.length,25);
const {scoreQuestion,validateQuestion}=await import(pathToFileURL(path.join(repo,'scripts/content/question-contract.mjs')));
const sources=new Map();let optionCases=0;const reviewed=[];
for(const [i,row] of proposal.entries()){
 assert.deepEqual(Object.keys(row).sort(),['beforeReason','questionId','reason']);const item=manifest.items[i];assert.equal(row.questionId,item.itemId);assert.equal(typeof row.reason,'string');assert(row.reason.trim());assert.notEqual(row.reason,row.beforeReason);
 if(!sources.has(item.sourcePath)){const bytes=execFileSync('git',['show',`${manifest.beforeProducerCommit}:${item.sourcePath}`],{cwd:repo,maxBuffer:16*1024*1024});assert.equal(hash(bytes),item.sourceSha256);sources.set(item.sourcePath,JSON.parse(bytes));}
 const before=sources.get(item.sourcePath).find(q=>q.questionId===row.questionId);assert(before);assert.equal(hash(Buffer.from(JSON.stringify(before))),item.sourceEvidence.oldWholeObjectSha256);assert.equal(before.feedback.reason,row.beforeReason);
 const after={...before,feedback:{...before.feedback,reason:row.reason}};const result=validateQuestion(after);assert(result.valid,`${row.questionId}: ${result.errors.join('; ')}`);
 assert.deepEqual({...after,feedback:{...after.feedback,reason:before.feedback.reason}},before);
 const key=before.interaction.options.find(o=>o.optionId===before.answer.optionId);assert.equal(item.intendedDecision,key.text);
 for(const options of [after.interaction.options,[...after.interaction.options].reverse()])for(const option of options){const response={type:'choice_single',optionId:option.optionId};const current=scoreQuestion({...after,interaction:{...after.interaction,options}},response);assert.deepEqual(current,scoreQuestion({...before,interaction:{...before.interaction,options}},response));assert.equal(current.status,option.optionId===after.answer.optionId?'correct':'incorrect');assert.equal(current.earnedPoints,option.optionId===after.answer.optionId?1:0);optionCases++;}
 reviewed.push({questionId:row.questionId,sourcePath:item.sourcePath,beforeReason:row.beforeReason,reason:row.reason});
}
assert.equal(sources.size,3);assert.equal(optionCases,200);
const report={result:'PASS structural only; independent semantic acceptance pending',proposalSha256:hash(proposalBytes),manifestSha256:hash(manifestBytes),items:25,sourceFiles:3,scoringAndReversalCases:optionCases,identity:'all question/option IDs and all non-Reason fields unchanged by construction',reviewed};writeFileSync(path.join(packet,'ROOT-PROPOSAL-STRUCTURE.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,items:25,scoringAndReversalCases:optionCases,proposalSha256:report.proposalSha256}));
