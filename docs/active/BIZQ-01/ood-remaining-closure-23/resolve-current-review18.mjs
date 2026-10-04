// Match current objects to accepted evidence; do not inherit findings across edits.
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import {createHash} from 'node:crypto'; import {fileURLToPath} from 'node:url';
import {canonicalJson} from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
const packet=path.dirname(fileURLToPath(import.meta.url));
const read=n=>fs.readFileSync(path.join(packet,n)); const sha=b=>createHash('sha256').update(b).digest('hex');
const mapBytes=read('ROOT-N07-PRODUCER-MAP.json');
assert.equal(sha(mapBytes),'f64e82bdf4a997d28a30c44774cd1280beec303620bda3e758150638b2ba9414');
const map=JSON.parse(mapBytes); const raw=read('ROOT-REVIEW18-CURRENT.json');const reconciliation=JSON.parse(raw);
const previous=JSON.parse(fs.readFileSync(path.join(packet,'../ood-remaining-closure-22/ROOT-REVIEW18-CURRENT-ACCEPTANCE.json')));
const unitInputs={
 'OOD-N07-B01':['review-inputs/N07-B01-v2.json','SEMANTIC-N07-B01-v2-QA.json','4da84ceae4c65f476a6e36aec2b10d990e5a1026778e2b200580414591c5c8af'],
 'OOD-N07-B02':['review-inputs/N07-B02-v2.json','SEMANTIC-N07-B02-v2-QA.json','fb67163235ca1d3de62df8c41be9632f37bda37d73e3a5a82224676ced6c7d2b'],
 'OOD-N07-B05':['review-inputs/N07-B05-v3.json','SEMANTIC-N07-B05-v3-QA.json','df0b3f54f18d620c04a32a43b8daeba3c264e401797dfae96050f1534041c390'],
 'OOD-N07-B07':['review-inputs/N07-B07-v6.json','SEMANTIC-N07-B07-v6-QA.json','f402776ffdc4346229ca5be7da7b65cda4b3b45319ccd7bb8d7aa82fbe86cf0a']
};
const resolved=[];let currentN07=0;
for(const row of reconciliation.items){
 const entry=[...map.replacements,...map.sameIdCorrections].find(x=>x.beforeQuestionId===row.questionId);
 if(entry){
  assert.equal(sha(canonicalJson(entry.beforeQuestion)),row.priorItemFingerprint);
  const newId=entry.questionId;
  if(newId===row.questionId)assert.equal(row.currentItemFingerprint,sha(canonicalJson(entry.currentQuestion)));
  else assert.equal(row.currentItemFingerprint,null);
  const [input,report,reportHash]=unitInputs[entry.mentalUnitId];const bytes=read(report);assert.equal(sha(bytes),reportHash);
  const review=JSON.parse(bytes);assert.equal(review.verdict,'PASS');
  const objects=JSON.parse(read(input));assert.deepEqual(objects.find(q=>q.questionId===newId),entry.currentQuestion);
  resolved.push({...row,currentQuestionId:newId,currentDisposition:'CURRENT_OBJECT_SEMANTIC_REVIEW_PASS',currentReviewPath:report,currentReviewSha256:reportHash,inputPath:input,inputSha256:sha(read(input)),wholeCurrentObjectSha256:sha(canonicalJson(entry.currentQuestion)),basis:newId===row.questionId?'Exact current object accepted by its bounded semantic review':'Retired sample maps to independently accepted replacement through fixed proof23'});currentN07++;
 }else if(row.disposition==='CHANGED_OBJECT_REVIEW_REQUIRED'){
  const old=previous.resolved.find(x=>x.questionId===row.questionId);assert(old);assert.equal(row.currentItemFingerprint,old.currentItemFingerprint);assert.equal(row.priorItemFingerprint,old.priorItemFingerprint);
  resolved.push({...row,currentDisposition:old.currentDisposition,currentReviewPath:'../ood-remaining-closure-22/ROOT-REVIEW18-CURRENT-ACCEPTANCE.json',basis:'Whole object and matching accepted earlier evidence unchanged; no semantic review repeated'});
 }
}
assert.equal(currentN07,4);assert.equal(resolved.length,9);
const exact=reconciliation.items.filter(x=>x.disposition==='EXACT_OBJECT_REUSE');const defects=exact.filter(x=>x.priorVerdict!=='PASS');const severity={};for(const x of defects)severity[x.priorSeverity]=(severity[x.priorSeverity]??0)+1;
console.log(JSON.stringify({result:'PASS',scope:'Current source/runtime 216 historical sample reconciliation; own exact semantic evidence for four changed N07 samples plus five matching earlier accepted objects; not whole-bank rate, admission or full BIZQ acceptance',reconciliationSha256:sha(raw),mapSha256:sha(mapBytes),totals:{sample:216,exactPass:exact.length-defects.length,exactHistoricalDefect:defects.length,retired:reconciliation.items.filter(x=>x.disposition==='RETIRED_ID_ACCEPTANCE_LINK_REQUIRED').length,misattachedFindingExcluded:1,changedOrReplacedObjectsWithOwnSemanticPass:resolved.length,newN07Resolutions:currentN07},exactDefectSeverity:severity,resolved},null,2));
