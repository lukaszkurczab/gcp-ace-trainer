import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url),web=new URL('../../../../../patternly-web/',packet),file='src/generated/demoQuestions.json';
const baseline=JSON.parse(await readFile(new URL('ROOT-N24-PRESERVATION-BASELINE.json',packet)));
const oldBytes=execFileSync('git',['show',`563eff9dc28ddce60c03a633edebf6db2c968a42:${file}`],{cwd:fileURLToPath(web),maxBuffer:16*1024*1024});assert.equal(sha256(oldBytes),baseline.webDemoSha256);
const old=JSON.parse(oldBytes),raw=await readFile(new URL(file,web)),current=JSON.parse(raw);assert.equal(current.schemaVersion,old.schemaVersion);assert.equal(current.demos.length,2);
const allowed=['appContentLockSha256','releaseLockSha256','admissionSha256','candidateId','sourceReleaseSha256','runtimeEvidenceSha256','releaseId','producerCommit'];
const omit=(x,keys)=>Object.fromEntries(Object.entries(x).filter(([k])=>!keys.includes(k)));const changes=[];
for(let i=0;i<2;i++){const before=old.demos[i],now=current.demos[i];assert.deepEqual(omit(now,['provenance']),omit(before,['provenance']));assert.deepEqual(omit(now.provenance,allowed),omit(before.provenance,allowed));const changed=Object.keys(now.provenance).filter(k=>JSON.stringify(now.provenance[k])!==JSON.stringify(before.provenance[k]));assert.deepEqual(changed.sort(),allowed.toSorted());changes.push({questionId:now.provenance.questionId,changedFields:changed});}
console.log(JSON.stringify({result:'PASS',scope:'Exact two authorised Free demo payloads retained; only eight provenance fields per demo changed; no native/fullBIZQ/publication claim',demoPayloadsUnchanged:true,beforeSha256:sha256(oldBytes),currentSha256:sha256(raw),changes},null,2));
