import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const packet=path.dirname(fileURLToPath(import.meta.url));
const app=path.resolve(packet,'../../../..'); const web=path.resolve(app,'../patternly-web');
const json=p=>JSON.parse(fs.readFileSync(p)); const hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=json(path.join(packet,'ROOT-N06-BASELINE.json'));
const map=json(path.join(packet,'ROOT-N06-PRODUCER-MAP.json'));
const oldFile=(root,commit,p)=>execFileSync('git',['show',`${commit}:${p}`],{cwd:root,maxBuffer:64*1024*1024});
assert(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--consumer-only'));
const consumerOnly=process.argv[2]==='--consumer-only';
const oodPath='src/content/generated/canonical-content/object-oriented-design-interview.json';
const oldBytes=oldFile(app,baseline.refs.app.head,oodPath); assert.equal(hash(oldBytes),baseline.oodArtifact.sha256);
const old=JSON.parse(oldBytes); const current=json(path.join(app,oodPath));
assert.equal(current.contentVersion,map.contentVersion); assert.equal(old.contentVersion,map.beforeContentVersion); assert.equal(current.questions.length,1413);
const ids=new Set(map.sameIdCorrections.map(x=>x.questionId)); assert.equal(ids.size,180);
const outside=x=>x.questions.filter(q=>!ids.has(q.questionId));
assert.equal(outside(old).length,1233); assert.deepEqual(outside(current),outside(old));
for(const item of map.sameIdCorrections) assert.deepEqual(current.questions.find(q=>q.questionId===item.questionId),item.currentQuestion);
const omit=(x,keys)=>Object.fromEntries(Object.entries(x).filter(([k])=>!keys.includes(k)));
assert.deepEqual(omit(current,['contentVersion','questions']),omit(old,['contentVersion','questions']));
for(const [name,item] of Object.entries(baseline.otherArtifacts)) assert.equal(hash(fs.readFileSync(path.join(app,'src/content/generated/canonical-content',name))),item.sha256,name);
assert.equal(hash(fs.readFileSync(path.join(app,'integration/contracts/content-release/release.lock.historical-0024.json'))),baseline.historicalReleaseLock.sha256);
const changes=[];
if(!consumerOnly){
 const demoPath='src/generated/demoQuestions.json';
 const oldDemoBytes=oldFile(web,baseline.refs.web.head,demoPath); assert.equal(hash(oldDemoBytes),baseline.webDemo.sha256);
 const oldDemo=JSON.parse(oldDemoBytes); const demo=json(path.join(web,demoPath));
 assert.equal(demo.schemaVersion,oldDemo.schemaVersion); assert.equal(demo.demos.length,2);
 const allowed=['appContentLockSha256','releaseLockSha256','admissionSha256','candidateId','sourceReleaseSha256','runtimeEvidenceSha256','releaseId','producerCommit'];
 for(let i=0;i<2;i++){
  const before=oldDemo.demos[i]; const now=demo.demos[i];
  assert.deepEqual(omit(now,['provenance']),omit(before,['provenance'])); assert.deepEqual(omit(now.provenance,allowed),omit(before.provenance,allowed));
  const changed=Object.keys(now.provenance).filter(k=>JSON.stringify(now.provenance[k])!==JSON.stringify(before.provenance[k]));
  assert.deepEqual(changed.sort(),allowed.toSorted()); changes.push({questionId:now.provenance.questionId,changedFields:changed});
 }
}
console.log(JSON.stringify({verdict:'PASS',scope:consumerOnly?'N06/22 actual consumer preservation only; admission/demo/native/full BIZQ pending':'N06/22 consumer and demo preservation; no native/full BIZQ acceptance',contentVersion:current.contentVersion,reviewedN06:180,preservedOtherOOD:1233,unchangedArtifacts:8,historicalLockSha256:baseline.historicalReleaseLock.sha256,oodArtifactSha256:hash(fs.readFileSync(path.join(app,oodPath))),demoPayloadsUnchanged:consumerOnly?null:true,changes},null,2));
