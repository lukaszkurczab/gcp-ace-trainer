import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const packet=fileURLToPath(new URL('./',import.meta.url));
const app=path.resolve(packet,'../../../..');
const before=JSON.parse(readFileSync(path.join(packet,'BEFORE-CONSUMER.json')));
assert.equal(before.applicationBefore,'62f01a6dbbcd0abe85fe29118e59a5b50184a44d');
const hash=b=>createHash('sha256').update(b).digest('hex');
const oldBytes=p=>execFileSync('git',['show',`${before.applicationBefore}:${p}`],{cwd:app,maxBuffer:64*1024*1024});
const proof=JSON.parse(readFileSync(path.resolve(app,'../patternly-content/evidence/business-quality/bizq-01-ood-node-closure-19.json')));
assert.equal(proof.replacements.length,162);
let unaffectedArtifacts=0;
for(const f of before.files){assert.equal(hash(oldBytes(f.path)),f.sha256);if(f.path.includes('/canonical-content/')&&f.path.endsWith('.json')&&!f.path.endsWith('content-lock.json')&&!f.path.endsWith('object-oriented-design-interview.json')){assert.equal(hash(readFileSync(path.join(app,f.path))),f.sha256);unaffectedArtifacts++;}if(f.path.endsWith('release.lock.historical-0024.json'))assert.equal(hash(readFileSync(path.join(app,f.path))),f.sha256);}
assert.equal(unaffectedArtifacts,8);
const artifactPath='src/content/generated/canonical-content/object-oriented-design-interview.json';
const old=JSON.parse(oldBytes(artifactPath));const current=JSON.parse(readFileSync(path.join(app,artifactPath)));
const oldIds=new Set(proof.replacements.map(x=>x.beforeQuestionId));const newIds=new Set(proof.replacements.map(x=>x.questionId));
assert.equal(oldIds.size,162);assert.equal(newIds.size,162);
assert.equal(old.questions.length,1413);assert.equal(current.questions.length,1413);
assert.deepEqual(current.questions.filter(q=>!newIds.has(q.questionId)),old.questions.filter(q=>!oldIds.has(q.questionId)));
for(const x of proof.replacements){assert.deepEqual(current.questions.find(q=>q.questionId===x.questionId),x.currentQuestion);assert.equal(current.questions.some(q=>q.questionId===x.beforeQuestionId),false);}
const metadata=o=>Object.fromEntries(Object.entries(o).filter(([k])=>k!=='questions'&&k!=='contentVersion'));
assert.deepEqual(metadata(current),metadata(old));
assert.equal(current.contentVersion,'object-oriented-design-interview-authoring-v2026.10.04-bizq01-19');
const report={result:'PASS',unchangedArtifacts:8,unchangedOodObjects:1251,reviewedNewObjects:162,retiredIdsAbsent:162,historicalLock:'byte-exact',artifactSha256:hash(readFileSync(path.join(app,artifactPath))),scope:'Actual current consumer artifact preservation; focused runtime scoring/pools and admission are separate gates.'};
writeFileSync(path.join(packet,'ROOT-CONSUMER-PRESERVATION.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
