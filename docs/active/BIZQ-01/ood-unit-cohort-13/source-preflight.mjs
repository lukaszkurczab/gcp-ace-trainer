import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import "tsx/cjs";
const require=createRequire(import.meta.url);
const appRoot=fileURLToPath(new URL("../../../../",import.meta.url));
const { loadCanonicalRuntimeCatalog }=require(resolve(appRoot,"src/content/canonical/runtimeCatalog.ts"));
const raw=readFileSync(resolve(appRoot,"../patternly-content/content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json"));
const rows=JSON.parse(raw);
const track=(await loadCanonicalRuntimeCatalog()).getTrack("object-oriented-design-interview");
const pool=track.getPool("design-interview-learn-framework");
const findings=[];
for(let n=3;n<=17;n++){
 const id=`ood-n01-b01-i${String(n).padStart(3,"0")}`;
 const source=rows.find(q=>q.questionId===id);
 assert.deepEqual(track.getQuestion(id),source);
 assert.ok(pool.some(q=>q.questionId===id));
 assert.equal(source.answer.optionId,"owner_preserves_contract");
 assert.match(source.feedback.messages.find(m=>m.targetId==="coordinator_exports_state").text,/It moves actors, goals, use cases, and system boundary is the primary decision;/u);
 findings.push({questionId:id,sourceEqualsCurrentRuntime:true,currentEligiblePoolMember:true,acceptedOptionId:source.answer.optionId,malformedFeedback:true});
}
assert.equal(rows.length,17);
assert.ok(rows.some(q=>q.questionId==="ood-n01-b01-i018"));
assert.ok(rows.some(q=>q.questionId==="ood-n01-b01-i019"));
console.log(JSON.stringify({status:"reproduced",sourceSha256:createHash("sha256").update(raw).digest("hex"),unitCount:rows.length,affectedCount:findings.length,poolCount:pool.length,findings,sessionPrepared:false,nativeOrPremiumProof:false},null,2));
