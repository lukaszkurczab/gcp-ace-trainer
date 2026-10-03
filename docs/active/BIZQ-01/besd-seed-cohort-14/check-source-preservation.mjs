import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateQuestion,scoreQuestion} from '../../../../../patternly-content/scripts/content/question-contract.mjs';
const packet=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(packet,'../../../../../patternly-content');
const pre=JSON.parse(await readFile(path.join(packet,'PREFLIGHT.json'),'utf8'));
const proposal=JSON.parse(await readFile(path.join(packet,'REVIEWED-PROPOSAL-v5.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const base=p=>execFileSync('git',['show',`${pre.sourceCommit}:${p}`],{cwd:repo,maxBuffer:64*1024*1024});
const changed=new Set(['content/catalog.json',...pre.units.map(u=>u.sourceFile)]);
const tracks=JSON.parse(await readFile(path.join(repo,'content/catalog.json'),'utf8')).tracks;
const files=execFileSync('git',['ls-files','content'],{cwd:repo,encoding:'utf8'}).trim().split('\n');
let preservedFiles=0,total=0;
for(const f of files){
 const current=await readFile(path.join(repo,f));
 if(!changed.has(f)){assert.deepEqual(current,base(f),f);preservedFiles++;}
 if(tracks.some(t=>f.startsWith(`content/${t.trackId}/`))&&f.endsWith('.json')){
  const value=JSON.parse(current);if(Array.isArray(value))total+=value.length;
 }
}
const beforeCatalog=JSON.parse(base('content/catalog.json'));
for(const t of tracks){const before=beforeCatalog.tracks.find(x=>x.trackId===t.trackId);assert.deepEqual(t,t.trackId==='backend-system-design-interview'?{...before,contentVersion:'backend-system-design-interview-authoring-v2026.10.03-bizq01-14'}:before);}
const units=[];let validated=0,scored=0;
for(const u of pre.units){
 const before=base(u.sourceFile);assert.equal(hash(before),u.beforeSourceSha256);
 const old=JSON.parse(before),bytes=await readFile(path.join(repo,u.sourceFile)),now=JSON.parse(bytes);
 assert.equal(now.length,u.unitCount);assert.deepEqual(now.find(q=>q.questionId===u.preservedQuestionId),u.preservedQuestion);
 const subset=proposal.replacements.filter(r=>r.question.mentalUnitId===u.preservedQuestion.mentalUnitId);
 for(const r of subset){assert.equal(now.some(q=>q.questionId===r.beforeQuestionId),false);assert.equal(old.some(q=>q.questionId===r.questionId),false);const q=now.find(q=>q.questionId===r.questionId);assert.equal(stable(q),stable(r.question));assert.equal(validateQuestion(q).valid,true);validated++;for(const option of q.interaction.options){const actual=scoreQuestion(q,{type:'choice_single',optionId:option.optionId});assert.equal(actual.status,option.optionId===r.question.answer.optionId?'correct':'incorrect');assert.equal(actual.earnedPoints,option.optionId===r.question.answer.optionId?1:0);scored++;}}
 const ids=new Set(subset.map(r=>r.questionId));
 const reconstructed=now.filter(q=>!ids.has(q.questionId)).concat(old.filter(q=>q.questionId!==u.preservedQuestionId)).sort((a,b)=>a.questionId<b.questionId?-1:1);
 assert.equal(hash(Buffer.from(stable(reconstructed))),u.beforeSourceSha256);
 units.push({path:u.sourceFile,count:now.length,replacements:subset.length,preserved:u.preservedQuestionId,beforeSha256:hash(before),currentSha256:hash(bytes),predecessorReconstruction:'byte-exact'});
}
assert.equal(total,16077);assert.equal(proposal.replacements.length,32);
const immutable=[];
for(const name of ['bizq-01-besd-slice-01.json','bizq-01-ood-source-11.json','bizq-01-ood-source-12.json','bizq-01-ood-unit-cohort-13.json']){const f=`evidence/business-quality/${name}`;const b=await readFile(path.join(repo,f));assert.deepEqual(b,base(f));immutable.push({path:f,sha256:hash(b)});}
const result={result:'PASS',sourceBefore:pre.sourceCommit,proposalSha256:hash(await readFile(path.join(packet,'REVIEWED-PROPOSAL-v5.json'))),canonicalQuestionCount:total,unchangedQuestionObjects:total-32,preservedTrackedContentFiles:preservedFiles,validatedActualSourceQuestions:validated,scoredActualSourceOptions:scored,units,immutableProofs:immutable,limits:'Source preservation and exact proposal integration only; no admission, consumer, native or full-bank acceptance claim.'};
await writeFile(path.join(packet,'ROOT-SOURCE-PRESERVATION.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
