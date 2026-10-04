// Link changed historical sample objects to their own current review, never
// transfer an old verdict by ID alone or alter the raw reconciliation result.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {canonicalJson} from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
const packet=fileURLToPath(new URL('./',import.meta.url));
const bytes=p=>fs.readFileSync(packet+p);
const hash=b=>createHash('sha256').update(b).digest('hex');
const mapBytes=bytes('ROOT-N05-PRODUCER-MAP.json');
assert.equal(hash(mapBytes),'0d95dbf77a32f657197fa4789166a24fd68edad81cd367e9ea7b29c8578e6b70');
const map=JSON.parse(mapBytes); const reviewBytes=bytes('SEMANTIC-CURRENT-FINAL-QA.json');
assert.equal(hash(reviewBytes),'17d0d3752efbf4b65bdb5a5f802809b36ba280404e20013991c51d3c01e57d3e');
const review=JSON.parse(reviewBytes);assert.equal(review.verdict,'PASS');assert.equal(review.registry.sha256,map.registrySha256);
const reconciliationBytes=bytes('ROOT-REVIEW18-CURRENT.json');const reconciliation=JSON.parse(reconciliationBytes);
const changed=reconciliation.items.filter(x=>x.disposition==='CHANGED_OBJECT_REVIEW_REQUIRED');
assert.equal(changed.length,1);
const resolved=changed.map(row=>{
 assert.equal(row.trackId,'object-oriented-design-interview');
 const entry=map.sameIdCorrections.find(x=>x.questionId===row.questionId);assert.ok(entry);
 assert.equal(hash(canonicalJson(entry.beforeQuestion)),row.priorItemFingerprint);
 assert.equal(hash(canonicalJson(entry.currentQuestion)),row.currentItemFingerprint);
 assert.equal(row.currentContentVersion,map.contentVersion);
 const item=review.items.find(x=>x.questionId===row.questionId);assert.ok(item);
 assert.equal(hash(JSON.stringify(entry.currentQuestion)),item.wholeObjectSha256CompactInsertionOrder);
 assert.equal(item.answerOptionId,entry.acceptedOptionId);
 return {...row,currentDisposition:'CURRENT_OBJECT_SEMANTIC_REVIEW_PASS',currentReviewPath:'SEMANTIC-CURRENT-FINAL-QA.json',currentReviewSha256:hash(reviewBytes),currentWholeObjectSha256CompactInsertionOrder:item.wholeObjectSha256CompactInsertionOrder};
});
console.log(JSON.stringify({result:'PASS',scope:'One changed review18 sample has its own exact current N05 semantic PASS; raw historical reconciliation preserved. Not whole N05 consumer/admission or full BIZQ acceptance.',reconciliationSha256:hash(reconciliationBytes),mapSha256:hash(mapBytes),currentReviewSha256:hash(reviewBytes),resolved},null,2));
