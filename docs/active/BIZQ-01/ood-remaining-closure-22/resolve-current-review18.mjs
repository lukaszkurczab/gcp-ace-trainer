// Reuse matching historical evidence; changed objects require their own exact review.
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import {createHash} from 'node:crypto'; import {fileURLToPath} from 'node:url';
import {canonicalJson} from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
const packet=path.dirname(fileURLToPath(import.meta.url));const read=n=>fs.readFileSync(path.join(packet,n));const sha=b=>createHash('sha256').update(b).digest('hex');
const raw=read('ROOT-REVIEW18-CURRENT.json');const reconciliation=JSON.parse(raw);
const mapBytes=read('ROOT-N06-PRODUCER-MAP.json');assert.equal(sha(mapBytes),'9369a886d8c091b4ee68bbb34818ec2001f1ff42698e59721548074729ef9e68');const map=JSON.parse(mapBytes);
const reviewBytes=read('SEMANTIC-CURRENT-ACCEPTED-QA.json');assert.equal(sha(reviewBytes),'3ddac680b864069af4295ac5c2f90d8a83564431b996188b85bdc49effe84ff8');const review=JSON.parse(reviewBytes);assert.equal(review.verdict,'PASS');assert.equal(review.registry.sha256,map.registrySha256);
const previous=JSON.parse(fs.readFileSync(path.join(packet,'../ood-remaining-closure-21/ROOT-REVIEW18-CURRENT-ACCEPTANCE.json')));
const changed=reconciliation.items.filter(x=>x.disposition==='CHANGED_OBJECT_REVIEW_REQUIRED');assert.equal(changed.length,5);
const resolved=changed.map(row=>{
 const entry=map.sameIdCorrections.find(x=>x.questionId===row.questionId);
 if(!entry){const old=previous.resolved.find(x=>x.questionId===row.questionId);assert(old);assert.equal(row.currentItemFingerprint,old.currentItemFingerprint);assert.equal(row.priorItemFingerprint,old.priorItemFingerprint);return {...row,currentDisposition:old.currentDisposition,currentReviewPath:'../ood-remaining-closure-21/SEMANTIC-CURRENT-FINAL-QA.json',currentReviewSha256:old.currentReviewSha256,basis:'Unchanged full object and matching accepted N05 evidence; no review repeated for version metadata.'};}
 assert.equal(sha(canonicalJson(entry.beforeQuestion)),row.priorItemFingerprint);assert.equal(sha(canonicalJson(entry.currentQuestion)),row.currentItemFingerprint);
 assert.equal(row.currentContentVersion,map.contentVersion);const unit=review.unitReviews.find(x=>x.unit===entry.mentalUnitId);assert(unit);assert.equal(unit.verdict,'PASS');assert.equal(sha(read(unit.proposalPath)),unit.proposalSha256);
 const proposal=JSON.parse(read(unit.proposalPath));assert(Array.isArray(proposal));assert.deepEqual(proposal.find(x=>x.questionId===entry.questionId),entry.currentQuestion);
 return {...row,currentDisposition:'CURRENT_OBJECT_SEMANTIC_REVIEW_PASS',currentReviewPath:'SEMANTIC-CURRENT-ACCEPTED-QA.json',currentReviewSha256:sha(reviewBytes),unitReview:unit,wholeCurrentObjectSha256:sha(JSON.stringify(entry.currentQuestion))};
});
const exact=reconciliation.items.filter(x=>x.disposition==='EXACT_OBJECT_REUSE');const defects=exact.filter(x=>x.priorVerdict!=='PASS');const severity={};for(const x of defects)severity[x.priorSeverity]=(severity[x.priorSeverity]??0)+1;
console.log(JSON.stringify({result:'PASS',scope:'Current source/runtime matching fingerprints and own exact semantic reviews for five changed samples; not whole-bank rate, package admission or full BIZQ acceptance',reconciliationSha256:sha(raw),mapSha256:sha(mapBytes),currentReviewSha256:sha(reviewBytes),totals:{sample:216,exactPass:exact.length-defects.length,exactHistoricalDefect:defects.length,retired:reconciliation.items.filter(x=>x.disposition==='RETIRED_ID_ACCEPTANCE_LINK_REQUIRED').length,misattachedFindingExcluded:1,changedObjectsWithOwnSemanticPass:resolved.length},exactDefectSeverity:severity,resolved},null,2));
