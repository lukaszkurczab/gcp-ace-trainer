// Reproduce the N05 acceptance facts not established by unit counts alone:
// exact unchanged 1260 runtime objects, eight other artifact bytes, historical
// lock bytes, and unchanged public demo payloads with only current provenance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const packet=fileURLToPath(new URL('./',import.meta.url));
const app=path.resolve(packet,'../../../..');
const web=path.resolve(app,'../patternly-web');
const json=p=>JSON.parse(fs.readFileSync(p));
const hash=b=>createHash('sha256').update(b).digest('hex');
assert(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--consumer-only'));
const consumerOnly=process.argv[2]==='--consumer-only';
const before=json(path.join(packet,'BEFORE-CONSUMER.json'));
const map=json(path.join(packet,'ROOT-N05-PRODUCER-MAP.json'));
const oldFile=(root,commit,p)=>execFileSync('git',['show',`${commit}:${p}`],{cwd:root,maxBuffer:64*1024*1024});
const oodPath='src/content/generated/canonical-content/object-oriented-design-interview.json';
const oldBytes=oldFile(app,before.applicationBefore,oodPath);
assert.equal(hash(oldBytes),before.files.find(f=>f.path===oodPath).sha256);
const oldOod=JSON.parse(oldBytes); const current=json(path.join(app,oodPath));
assert.equal(current.contentVersion,map.contentVersion);
assert.equal(oldOod.contentVersion,map.beforeContentVersion);
assert.equal(current.questions.length,1413);
const ids=new Set(map.sameIdCorrections.map(x=>x.questionId));
const oldOutside=oldOod.questions.filter(q=>!ids.has(q.questionId));
const newOutside=current.questions.filter(q=>!ids.has(q.questionId));
assert.equal(oldOutside.length,1260); assert.deepEqual(newOutside,oldOutside);
for(const entry of map.sameIdCorrections) assert.deepEqual(current.questions.find(q=>q.questionId===entry.questionId),entry.currentQuestion);
const omit=(x,fields)=>Object.fromEntries(Object.entries(x).filter(([k])=>!fields.includes(k)));
assert.deepEqual(omit(current,['contentVersion','questions']),omit(oldOod,['contentVersion','questions']));
const unchangedArtifacts=[];
for(const f of before.files.filter(f=>f.path.endsWith('.json')&&f.path.includes('/canonical-content/')&&!f.path.endsWith('/content-lock.json')&&f.path!==oodPath)){
 assert.equal(hash(fs.readFileSync(path.join(app,f.path))),f.sha256); unchangedArtifacts.push(f.path);
}
assert.equal(unchangedArtifacts.length,8);
const historical=before.files.find(f=>f.path.includes('release.lock.historical'));
assert.equal(hash(fs.readFileSync(path.join(app,historical.path))),historical.sha256);
const changes=[];
if(!consumerOnly){
const oldDemoBytes=oldFile(web,before.webBefore,before.webDemo.path);
assert.equal(hash(oldDemoBytes),before.webDemo.sha256);
const oldDemo=JSON.parse(oldDemoBytes); const demo=json(path.join(web,before.webDemo.path));
assert.equal(demo.schemaVersion,oldDemo.schemaVersion); assert.equal(demo.demos.length,2);
const allowed=['appContentLockSha256','releaseLockSha256','admissionSha256','candidateId','sourceReleaseSha256','runtimeEvidenceSha256','releaseId','producerCommit'];
for(let i=0;i<2;i++){
 const old=oldDemo.demos[i]; const now=demo.demos[i];
 assert.deepEqual(omit(now,['provenance']),omit(old,['provenance']));
 assert.deepEqual(omit(now.provenance,allowed),omit(old.provenance,allowed));
 const changed=Object.keys(now.provenance).filter(k=>now.provenance[k]!==old.provenance[k]);
 assert.deepEqual([...changed].sort(),[...allowed].sort());
 changes.push({questionId:now.provenance.questionId,changedProvenanceFields:changed});
}
}
console.log(JSON.stringify({verdict:'PASS',scope:consumerOnly?'Exact accepted N05 runtime objects, eight artifacts and historical lock; demo/admission pending, not native or full BIZQ acceptance':'Exact accepted N05 runtime objects and preserved consumers; not native or full BIZQ acceptance',contentVersion:current.contentVersion,reviewedN05Objects:153,preservedOtherOodObjects:1260,unchangedArtifacts,historicalLockSha256:historical.sha256,demoPayloadsUnchanged:consumerOnly?null:true,changes,oodArtifactSha256:hash(fs.readFileSync(path.join(app,oodPath))),demoFileSha256:hash(fs.readFileSync(path.join(web,before.webDemo.path)))},null,2));
