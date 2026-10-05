// Read-only reconciliation of the original 216-item review sample against the
// actual N24 source, preserving prior review findings only for exact objects.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {canonicalJson} from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
import {validateTrack, sha256} from '../../../../../patternly-content/scripts/build.mjs';

const packet=fileURLToPath(new URL('.',import.meta.url));
const content=fileURLToPath(new URL('../../../../../patternly-content/',import.meta.url));
const app=fileURLToPath(new URL('../../../../',import.meta.url));
const prior=new URL('../closure-review-18/',import.meta.url);
const bytes=async p=>fs.readFile(p);
const readPacket=async p=>bytes(path.join(packet,p));
const fileSha=async p=>sha256(await bytes(p));
const json=async p=>JSON.parse(await bytes(p));
const sampleBytes=await bytes(new URL('SAMPLE.json',prior));
const sample=JSON.parse(sampleBytes);
assert.equal(sha256(sampleBytes),'d2c083f3f3ac02fdaa38de725c717d31c88ad227365c30fb54bd121c16241ad4');
const reviewReports=[]; const reviews=new Map();
for(const [name,key,statusKey] of [['SEMANTIC-CERTIFICATION.json','items','status'],['SEMANTIC-DESIGN-CODING.json','reviews','verdict']]) {
 const rb=await bytes(new URL(name,prior)); const report=JSON.parse(rb);
 assert.equal(report.sample.sha256,sha256(sampleBytes)); reviewReports.push({path:name,sha256:sha256(rb)});
 for(const r of report[key]) { const k=`${r.trackId}:${r.questionId}`; assert(!reviews.has(k)); reviews.set(k,{...r,priorVerdict:r[statusKey],priorReport:name}); }
}
const mapBytes=await readPacket('ROOT-N24-PRODUCER-MAP.json');
const map=JSON.parse(mapBytes);
const proofBytes=await readPacket('PREPARED-FIXED-PROOF24.json');
const proof=JSON.parse(proofBytes);
assert.equal(map.result,'PASS');
assert.equal(map.schemaVersion,proof.schemaVersion);
assert.equal(map.trackId,proof.trackId);
assert.equal(map.questionSetSha256,proof.questionSetSha256);
assert.deepEqual(map.sourceFiles,proof.sourceFiles);
assert.deepEqual(map.replacements,proof.replacements);
assert.deepEqual(map.sameIdCorrections,proof.sameIdCorrections);
const crossBytes=await readPacket('CROSS-UNIT-N24-CURRENT-v2.json');
const cross=JSON.parse(crossBytes);
assert.equal(sha256(crossBytes),map.finalCrossV2.sha256);
assert.equal(cross.verdict,'PASS_BOUNDED_CROSS_UNIT_AND_IDENTITY');
const sourceFileHashes=[];
for(const f of map.sourceFiles) {
 const actual=await fileSha(path.join(content,f.sourceFile));
 assert.equal(actual,f.sourceSha256,`${f.sourceFile} current source bytes`);
 sourceFileHashes.push({sourceFile:f.sourceFile,sha256:actual});
}

// Verify the actual current source artifacts and construct the accepted-object
// index from the N24 proof. No domain-enriched artifact fields are stripped.
const trackIds=[...new Set(sample.questions.map(x=>x.trackId))];
const tracks=new Map();
for(const trackId of trackIds) {
 const t=await validateTrack({rootDirectory:content,trackId});
 assert.equal(t.track.trackId,trackId);
 const byId=new Map(t.questions.map(q=>[q.questionId,q]));
 assert.equal(byId.size,t.questions.length);
 tracks.set(trackId,{track:t.track,byId,questions:t.questions});
}
const n24Entries=[...map.replacements,...map.sameIdCorrections];
const currentAcceptanceByQid=new Map();
const unitEvidence=new Map(map.unitEvidence.map(x=>[x.unit,x]));
for(const e of n24Entries) {
 const t=tracks.get(map.trackId); const q=t.byId.get(e.questionId); assert(q,`current N24 question ${e.questionId}`);
 assert.deepEqual(q,e.currentQuestion,`N24 current source object ${e.questionId}`);
 assert.equal(sha256(canonicalJson(q)),sha256(canonicalJson(e.currentQuestion)));
 currentAcceptanceByQid.set(e.questionId,{kind:e.identityAction,unit:e.mentalUnitId,questionId:e.questionId,sourceFile:e.sourceFile,review:unitEvidence.get(e.mentalUnitId)});
}
const ood=tracks.get(map.trackId);
assert.equal(ood.questions.length,1413);
assert.equal(sha256(canonicalJson([...ood.questions].sort((a,b)=>a.questionId.localeCompare(b.questionId)))),map.questionSetSha256);

// Read replacement mappings from the fixed, previously accepted N19/N20 chain.
const migration19Bytes=await bytes(new URL('../ood-node-closure-19/ROOT-MIGRATION.json',import.meta.url));
const migration20Bytes=await bytes(new URL('../ood-node-closure-20/ROOT-MIGRATION.log',import.meta.url));
const migration19=JSON.parse(migration19Bytes), migration20=JSON.parse(migration20Bytes);
const checkpoint19Bytes=await bytes(new URL('../ood-node-closure-19/SOURCE-CHECKPOINT.json',import.meta.url));
const checkpoint20Bytes=await bytes(new URL('../ood-node-closure-20/SOURCE-CHECKPOINT.json',import.meta.url));
const checkpoint19aBytes=await bytes(new URL('../ood-node-closure-19/reason-amendment-19a/SOURCE-CHECKPOINT.json',import.meta.url));
const checkpoint19=JSON.parse(checkpoint19Bytes), checkpoint20=JSON.parse(checkpoint20Bytes);
const checkpoint19a=JSON.parse(checkpoint19aBytes);
const priorReplacementPairs=[];
for(const [version,m,relativePath,rawBytes] of [['19',migration19,'../ood-node-closure-19/ROOT-MIGRATION.json',migration19Bytes],['20',migration20,'../ood-node-closure-20/ROOT-MIGRATION.log',migration20Bytes]]) {
 const p=m.semanticReplacementProof;
 const commit=version==='19'?checkpoint19.commit:checkpoint20.sourceImplementationCommit;
 if(p?.trackId===map.trackId) for(const x of p.replacements) priorReplacementPairs.push({version,beforeQuestionId:x.beforeQuestionId,questionId:x.questionId,proofPath:relativePath,proofSha256:sha256(rawBytes),producerCommit:commit});
}
// Add every later fixed OOD identity map through N24.
const predecessorMaps=[];
for (const [version,file] of [['21','../ood-remaining-closure-21/ROOT-N05-PRODUCER-MAP.json'],['22','../ood-remaining-closure-22/ROOT-N06-PRODUCER-MAP.json'],['23','../ood-remaining-closure-23/ROOT-N07-PRODUCER-MAP.json']]) {
 const b=await bytes(new URL(file,import.meta.url)); const m=JSON.parse(b); predecessorMaps.push({version,file,bytes:b,map:m,sha256:sha256(b)});
 for(const e of [...(m.replacements??[]),...(m.sameIdCorrections??[])]) if(e.beforeQuestionId!==e.questionId) priorReplacementPairs.push({version,beforeQuestionId:e.beforeQuestionId,questionId:e.questionId,proofPath:file,proofSha256:sha256(b)});
}
for(const e of [...map.replacements,...map.sameIdCorrections]) if(e.beforeQuestionId!==e.questionId) priorReplacementPairs.push({version:'24',beforeQuestionId:e.beforeQuestionId,questionId:e.questionId,proofPath:'ROOT-N24-PRODUCER-MAP.json',proofSha256:sha256(mapBytes)});
const historicalCurrentEvidence=new Map();
for(const pm of predecessorMaps) for(const e of [...(pm.map.replacements??[]),...(pm.map.sameIdCorrections??[])]) historicalCurrentEvidence.set(`${e.mentalUnitId}:${e.questionId}`,{version:pm.version,mapPath:pm.file,mapSha256:pm.sha256,map:pm.map,entry:e});
for(const e of n24Entries) historicalCurrentEvidence.set(`${e.mentalUnitId}:${e.questionId}`,{version:'24',mapPath:'ROOT-N24-PRODUCER-MAP.json',mapSha256:sha256(mapBytes),map,entry:e});
const acceptanceRefsFor=async(mapped)=>{
 if(!mapped)return [];
 if(mapped.version==='24'){const u=unitEvidence.get(mapped.entry.mentalUnitId);return u?[{path:u.independentReview.path,sha256:u.independentReview.sha256,kind:'independent semantic review'},{path:u.rootAcceptance.path,sha256:u.rootAcceptance.sha256,kind:'root exact binding acceptance'}]:[];}
 if(mapped.version==='23'){const unit=mapped.entry.mentalUnitId.replace('OOD-','').toLowerCase();const ev=(mapped.map.semanticEvidence??[]).filter(x=>x.path.toLowerCase().includes(unit));return ev.map(x=>({path:`../ood-remaining-closure-23/${x.path}`,sha256:x.sha256,kind:'unit acceptance receipt'}));}
 if(mapped.version==='22')return [{path:'../ood-remaining-closure-22/SEMANTIC-CURRENT-ACCEPTED-QA.json',sha256:sha256(await bytes(path.join(packet,'../ood-remaining-closure-22/SEMANTIC-CURRENT-ACCEPTED-QA.json'))),kind:'accepted semantic map'}];
 if(mapped.version==='21')return [{path:'../ood-remaining-closure-21/SEMANTIC-CURRENT-FINAL-QA.json',sha256:sha256(await bytes(path.join(packet,'../ood-remaining-closure-21/SEMANTIC-CURRENT-FINAL-QA.json'))),kind:'accepted semantic map'}];
 return [];
};

const reconciliations=[];
for(const folder of ['ood-remaining-closure-21','ood-remaining-closure-22','ood-remaining-closure-23']) {
 const rb=await bytes(new URL(`../${folder}/ROOT-REVIEW18-CURRENT.json`,import.meta.url));
 const ab= folder==='ood-remaining-closure-21' ? null : await bytes(new URL(`../${folder}/ROOT-REVIEW18-CURRENT-ACCEPTANCE.json`,import.meta.url));
 reconciliations.push({folder,raw:JSON.parse(rb),rawSha256:sha256(rb),acceptance:ab?JSON.parse(ab):null,acceptanceSha256:ab?sha256(ab):null});
}
const latest=reconciliations.at(-1);
const historicalMap=new Map(latest.raw.items.map(x=>[`${x.trackId}:${x.questionId}`,x]));
const resolved23=new Map((latest.acceptance?.resolved??[]).map(x=>[`${x.trackId}:${x.questionId}`,x]));
const currentRows=[];
for(const s of sample.questions) {
 const review=reviews.get(`${s.trackId}:${s.questionId}`); assert(review,`historical sample review ${s.questionId}`);
 const oldFp=s.itemFingerprint; assert.equal(sha256(canonicalJson(s.item)),oldFp);
 let qid=s.questionId; const lineage=[];
 if(s.trackId===map.trackId) {
   // Follow only explicit accepted producer mappings, never infer by array order.
   for(let pass=0;pass<3;pass++) {
     const edge=priorReplacementPairs.find(x=>x.beforeQuestionId===qid && x.questionId!==qid);
     if(!edge) break;
     lineage.push({...edge}); qid=edge.questionId;
   }
 }
 const track=tracks.get(s.trackId); const current=track.byId.get(qid)??null;
 const currentFp=current?sha256(canonicalJson(current)):null;
 const predecessorSnapshotBindings=[];
 if(current && lineage.some(x=>x.version==='19'||x.version==='20')) {
   const edge=lineage.find(x=>x.version==='19'||x.version==='20');
   const settledCommit=(edge.version==='19' && s.sourceFile.includes('/OOD-N03-B02.json'))?checkpoint19a.commit:edge.producerCommit;
   const historicalBytes=execFileSync('git',['show',`${settledCommit}:${s.sourceFile}`],{cwd:content});
   const currentBytes=await bytes(path.join(content,s.sourceFile));
   assert.equal(sha256(historicalBytes),sha256(currentBytes),`accepted predecessor source file unchanged: ${s.sourceFile}`);
   const historicalQuestions=JSON.parse(historicalBytes);
   assert.deepEqual(historicalQuestions.find(q=>q.questionId===qid),current,`replacement object matches its accepted predecessor source snapshot: ${qid}`);
   predecessorSnapshotBindings.push({commit:settledCommit,sourceFile:s.sourceFile,sourceSha256:sha256(historicalBytes),currentSourceSha256:sha256(currentBytes),wholeObjectSha256:currentFp});
 }
 const oldRow=historicalMap.get(`${s.trackId}:${s.questionId}`);
 const currentN24=current && currentAcceptanceByQid.get(qid);
 const currentMapped=current && historicalCurrentEvidence.get(`${current.mentalUnitId}:${qid}`);
 const currentReviewLinks=await acceptanceRefsFor(currentMapped);
 if(currentMapped) assert.deepEqual(current,currentMapped.entry.currentQuestion,`current object matches fixed accepted proof ${qid}`);
 let disposition, evidence=null, rationale='';
 const misattached=(s.trackId===map.trackId && s.questionId==='ood-n08-b02-i015');
 if(!current) {
   disposition='RETIRED_OR_MISSING_WITHOUT_RESOLVED_CURRENT_OBJECT';
   rationale='No current object was found under the original ID or an explicitly accepted replacement mapping.';
 } else if(misattached) {
   disposition=currentMapped?'HISTORICAL_FINDING_EXCLUDED_CURRENT_FIXED_OBJECT_ACCEPTED':'HISTORICAL_FINDING_EXCLUDED_CURRENT_OBJECT_REQUIRES_SEPARATE_BINDING';
   rationale='The historical note says lazy/eager query loading; it does not describe the invoice-reissue/synchronization object. Exclude that finding despite the exact historical fingerprint. Current-object evidence is assessed independently.';
   evidence=currentMapped?{producerMapPath:currentMapped.mapPath,producerMapSha256:currentMapped.mapSha256,version:currentMapped.version,unit:current.mentalUnitId,acceptedWholeObjectSha256:currentFp,semanticAcceptance:currentReviewLinks}:null;
 } else if(lineage.length) {
   const v23=resolved23.get(`${s.trackId}:${s.questionId}`);
   const mapped=currentMapped;
   if(mapped) {
     disposition='REPLACED_ID_CURRENT_FIXED_ACCEPTED_OBJECT';
     evidence={lineage,producerMapPath:mapped.mapPath,producerMapSha256:mapped.mapSha256,version:mapped.version,unit:current.mentalUnitId,acceptedWholeObjectSha256:currentFp,semanticAcceptance:currentReviewLinks};
     rationale='The sampled ID was retired through an explicit producer replacement chain. The current target is present in the current validated source and exactly matches its accepted current object descriptor.';
   } else {
     disposition='REPLACED_ID_CURRENT_PREDECESSOR_OBJECT';
     const semanticAcceptance=(await Promise.all(lineage.map(async x=>{
       if(x.version==='20')return [{path:'../ood-node-closure-20/SEMANTIC-REVIEW-B02-B04-v1.md',sha256:sha256(await bytes(new URL('../ood-node-closure-20/SEMANTIC-REVIEW-B02-B04-v1.md',import.meta.url))),kind:'item-unit semantic review'},{path:'../ood-node-closure-20/SEMANTIC-FINAL-QA.json',sha256:sha256(await bytes(new URL('../ood-node-closure-20/SEMANTIC-FINAL-QA.json',import.meta.url))),kind:'package semantic acceptance'}];
       const n03report=current.mentalUnitId==='OOD-N03-B05'?'SEMANTIC-REVIEW-B05-B09-v1.md':current.mentalUnitId==='OOD-N03-B02'?'reason-amendment-19a/SEMANTIC-QA.json':'SEMANTIC-REVIEW-B01-B04-v1.md';
       const n03base=current.mentalUnitId==='OOD-N03-B02'?'../ood-node-closure-19/':'../ood-node-closure-19/';
       return [{path:`${n03base}${n03report}`,sha256:sha256(await bytes(new URL(`${n03base}${n03report}`,import.meta.url))),kind:'item-unit semantic review'},{path:'../ood-node-closure-19/FINAL-QA.md',sha256:sha256(await bytes(new URL('../ood-node-closure-19/FINAL-QA.md',import.meta.url))),kind:'package semantic acceptance'}];
     }))).flat();
     evidence={lineage,producerProofs:[...new Map(lineage.map(x=>[x.proofPath,{path:x.proofPath,sha256:x.proofSha256}])).values()],predecessorSnapshotBindings,acceptedCurrentObjectSha256:currentFp,semanticAcceptance,scope:'The replacement edge is from a fixed accepted predecessor proof; current object hash is recomputed from actual current source. This records lineage, not transfer of the retired sample verdict.'};
     rationale='The sampled ID was retired by a previously accepted source replacement; the current replacement ID is present in the actual current source. The predecessor proof and current source file binding are recorded; no sample verdict is transferred to the replacement.';
   }
 } else if(currentFp===oldFp) {
   disposition=review.priorVerdict==='PASS'?'EXACT_OBJECT_PRIOR_PASS_REMAINS_MATCHED':'EXACT_OBJECT_PRIOR_FINDING_REMAINS_MATCHED';
   rationale='Current question ID and complete canonical object fingerprint match the historical sample. The historical verdict therefore still refers to this exact object; this is not a whole-bank rate claim.';
 } else if(currentMapped) {
   disposition='SAME_ID_CHANGED_CURRENT_FIXED_ACCEPTED_OBJECT';
   evidence={producerMapPath:currentMapped.mapPath,producerMapSha256:currentMapped.mapSha256,version:currentMapped.version,unit:current.mentalUnitId,acceptedWholeObjectSha256:currentFp,semanticAcceptance:currentReviewLinks};
   rationale='The stable question ID now has a different whole object, but that exact current object is in the accepted N24 unit map and its bounded semantic review.';
 } else if(oldRow && oldRow.currentItemFingerprint===currentFp && resolved23.has(`${s.trackId}:${s.questionId}`)) {
   disposition='SAME_ID_CHANGED_PREVIOUSLY_ACCEPTED_OBJECT_STILL_EXACT';
   const resolved=resolved23.get(`${s.trackId}:${s.questionId}`);
   evidence={priorCurrentAcceptance:resolved.currentReviewPath,priorCurrentObjectSha256:currentFp,latestReconciliationSha256:latest.rawSha256,latestAcceptanceSha256:latest.acceptanceSha256};
   rationale='The object changed since the original sample, but the current whole-object fingerprint matches the previously accepted current-object receipt exactly. Reuse is item-bound, not inferred from content version or ID alone.';
 } else if(oldRow && oldRow.currentItemFingerprint===currentFp && oldRow.disposition==='EXACT_OBJECT_REUSE') {
   disposition=oldRow.priorVerdict==='PASS'?'CURRENT_EXACT_PRIOR_PASS':'CURRENT_EXACT_PRIOR_FINDING';
   rationale='The current object fingerprint matches the latest reconciliation; the original review finding remains attached only where its whole-object fingerprint is exact.';
 } else {
   disposition='SAME_ID_CHANGED_NO_MATCHING_ACCEPTANCE_RECEIPT';
   rationale='Same ID is insufficient. Current object differs from both the original sample and the latest available reconciliation/accepted proof; do not transfer a verdict.';
 }
 currentRows.push({trackId:s.trackId,sourceFile:s.sourceFile,originalQuestionId:s.questionId,originalItemFingerprint:oldFp,originalWholeObjectSha256:oldFp,priorReport:review.priorReport,priorVerdict:review.priorVerdict,priorSeverity:review.severity??null,currentQuestionId:qid,currentWholeObjectSha256:currentFp,currentPresent:!!current,explicitReplacementLineage:lineage,priorCurrentDisposition:oldRow?.disposition??null,priorCurrentFingerprint:oldRow?.currentItemFingerprint??null,disposition,rationale,evidence,historicalFindingExcluded:misattached});
}
assert.equal(currentRows.length,216);
const counts={};for(const r of currentRows)counts[r.disposition]=(counts[r.disposition]??0)+1;
const result={schemaVersion:'bizq01-review18-current24-reconciliation-v1',scope:'Item-bound reconciliation of the historical closure-review-18 sample against actual current source24 and fixed accepted replacement evidence. Not a current whole-bank quality estimate, full semantic re-review, producer/runtime/admission acceptance, or full BIZQ-01 sign-off.',inputs:{samplePath:'../closure-review-18/SAMPLE.json',sampleSha256:sha256(sampleBytes),originalReviews:reviewReports,manifestPath:'N08-N09-MANIFEST.json',manifestSha256:map.manifestSha256,sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:content,encoding:'utf8'}).trim(),sourceContentVersion:ood.track.contentVersion,trackCount:tracks.size,questionCount:trackIds.reduce((n,id)=>n+tracks.get(id).questions.length,0),n24MapPath:'ROOT-N24-PRODUCER-MAP.json',n24MapSha256:sha256(mapBytes),n24ProofPath:'PREPARED-FIXED-PROOF24.json',n24ProofSha256:sha256(proofBytes),crossReviewPath:'CROSS-UNIT-N24-CURRENT-v2.json',crossReviewSha256:sha256(crossBytes),historicalProducerBindings:[{path:'../ood-node-closure-19/SOURCE-CHECKPOINT.json',sha256:sha256(checkpoint19Bytes)},{path:'../ood-node-closure-20/SOURCE-CHECKPOINT.json',sha256:sha256(checkpoint20Bytes)},{path:'../ood-node-closure-19/reason-amendment-19a/SOURCE-CHECKPOINT.json',sha256:sha256(checkpoint19aBytes)},{path:'../ood-node-closure-19/ROOT-MIGRATION.json',sha256:sha256(migration19Bytes)},{path:'../ood-node-closure-19/FINAL-QA.md',sha256:sha256(await bytes(new URL('../ood-node-closure-19/FINAL-QA.md',import.meta.url)))},{path:'../ood-node-closure-20/ROOT-MIGRATION.log',sha256:sha256(migration20Bytes)},{path:'../ood-node-closure-20/SEMANTIC-FINAL-QA.json',sha256:sha256(await bytes(new URL('../ood-node-closure-20/SEMANTIC-FINAL-QA.json',import.meta.url)))},...predecessorMaps.map(x=>({path:x.file,sha256:x.sha256}))],previousReconciliation:reconciliations.map(x=>({folder:x.folder,sha256:x.rawSha256,acceptanceSha256:x.acceptanceSha256}))},sourceChecks:{validatedTracks:[...tracks].map(([trackId,t])=>({trackId,contentVersion:t.track.contentVersion,questionCount:t.questions.length})),n24SourceFiles:sourceFileHashes,allN24CurrentObjectsExact:true,questionSetSha256:map.questionSetSha256},totals:counts,items:currentRows};
console.log(JSON.stringify(result,null,2));
