// Read-only evidence reuse: identity is necessary but does not establish that a
// historical finding actually describes its object. Contradicted findings are excluded.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalJson} from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
import {validateTrack,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const content=fileURLToPath(new URL('../../../../../patternly-content/',import.meta.url));
const app=fileURLToPath(new URL('../../../../',import.meta.url));
const prior=new URL('../closure-review-18/',import.meta.url);
const sampleBytes=await readFile(new URL('SAMPLE.json',prior));
assert.equal(sha256(sampleBytes),'d2c083f3f3ac02fdaa38de725c717d31c88ad227365c30fb54bd121c16241ad4');
const sample=JSON.parse(sampleBytes);
const reviews=new Map();
const reportBindings=[];
for(const [file,key,statusKey] of [['SEMANTIC-CERTIFICATION.json','items','status'],['SEMANTIC-DESIGN-CODING.json','reviews','verdict']]){
 const bytes=await readFile(new URL(file,prior));const report=JSON.parse(bytes);
 assert.equal(report.sample.sha256,sha256(sampleBytes));
 reportBindings.push({file,sha256:sha256(bytes)});
 for(const r of report[key]){const id=`${r.trackId}:${r.questionId}`;assert(!reviews.has(id));reviews.set(id,{...r,priorVerdict:r[statusKey],report:file});}
}
const tracks=new Map();
const rows=[];
for(const s of sample.questions){
 const r=reviews.get(`${s.trackId}:${s.questionId}`);assert(r);
 assert.equal(r.itemFingerprint,s.itemFingerprint);assert.equal(sha256(canonicalJson(s.item)),s.itemFingerprint);
 if(!tracks.has(s.trackId)){
  const validated=await validateTrack({rootDirectory:content,trackId:s.trackId});
  const bundled=JSON.parse(await readFile(new URL(`src/content/generated/canonical-content/${s.trackId}.json`,new URL('../../../../',import.meta.url))));
  assert.equal(bundled.contentVersion,validated.track.contentVersion);
  assert.equal(canonicalJson(bundled.questions),canonicalJson(validated.artifactQuestions));
  tracks.set(s.trackId,{validated,byId:new Map(validated.questions.map(q=>[q.questionId,q]))});
 }
 const t=tracks.get(s.trackId);const current=t.byId.get(s.questionId);
 const currentFingerprint=current?sha256(canonicalJson(current)):null;
 const exact=currentFingerprint===s.itemFingerprint;
 const finding=r.reviewNote||r.reason||r.finding||r.rationale;
 const misattached=exact&&s.trackId==='object-oriented-design-interview'&&s.questionId==='ood-n08-b02-i015';
 if(misattached){
  assert.equal(currentFingerprint,'2ba13008bd7a3672b83f09244173d6f57aebc926a1a24aa1639d7a195a8205c5');
  assert(finding.includes('lazy vs eager loading'));
  assert.equal(current.mentalUnitId,'OOD-N08-B02');
  assert(current.prompt.includes('Locks, immutability, actors, queues, and ownership transfer'));
 }
 rows.push({trackId:s.trackId,questionId:s.questionId,sourceFile:s.sourceFile,priorReport:r.report,priorVerdict:r.priorVerdict,priorSeverity:r.severity,priorItemFingerprint:s.itemFingerprint,currentItemFingerprint:currentFingerprint,currentContentVersion:t.validated.track.contentVersion,disposition:misattached?'EXACT_OBJECT_FINDING_REASSESSMENT_REQUIRED':exact?'EXACT_OBJECT_REUSE':current?'CHANGED_OBJECT_REVIEW_REQUIRED':'RETIRED_ID_ACCEPTANCE_LINK_REQUIRED',finding,...(misattached?{findingReassessmentReason:'Historical lazy/eager query-loading finding does not describe this invoice reissue/synchronization object. Excluded from reusable findings; current source assessment is separate and does not inherit its prior critical grade.'}:{})});
}
assert.equal(rows.length,216);
const byTrack={};for(const r of rows){const c=byTrack[r.trackId]??={reviewed:0,exactPass:0,exactDefect:0,changed:0,retired:0,findingReassessment:0};c.reviewed++;if(r.disposition==='EXACT_OBJECT_REUSE')c[r.priorVerdict==='PASS'?'exactPass':'exactDefect']++;else c[r.disposition==='EXACT_OBJECT_FINDING_REASSESSMENT_REQUIRED'?'findingReassessment':r.disposition==='CHANGED_OBJECT_REVIEW_REQUIRED'?'changed':'retired']++;}
console.log(JSON.stringify({scope:'216 prior whole objects reconciled to current source and all nine bundled artifacts; known misattached finding excluded despite exact fingerprint. No new semantic certification, whole-bank rate or full acceptance',contentHead:execFileSync('git',['rev-parse','HEAD'],{cwd:content,encoding:'utf8'}).trim(),appHead:execFileSync('git',['rev-parse','HEAD'],{cwd:app,encoding:'utf8'}).trim(),sampleSha256:sha256(sampleBytes),reportBindings,byTrack,items:rows},null,2));
