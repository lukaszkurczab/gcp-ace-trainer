// Reuse existing critical findings; observe actual source/catalog/pools only.
// No new bank review, content repair, selector change or learner-profile claim.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadCanonicalRuntimeCatalog } from "../../../../src/content/canonical/runtimeCatalog";
import { canonicalSerialize as canonicalJson } from "../../../../src/infrastructure/identity/canonicalSerialization";
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
async function main() {
 const priorBytes=readFileSync(new URL("../ood-remaining-closure-22/ROOT-REVIEW18-CURRENT.json",import.meta.url));
 assert.equal(sha(priorBytes),"40ed59983895b67be9f6de908fac693a5c75817c657d3a457feda56275906bdc");
 const prior=JSON.parse(priorBytes.toString("utf8"));
 const items=prior.items.filter((i: any)=>i.trackId!=="object-oriented-design-interview"&&i.priorVerdict==="DEFECT"&&i.priorSeverity==="critical"&&i.disposition==="EXACT_OBJECT_REUSE");
 assert.equal(items.length,46);
 const runtime=await loadCanonicalRuntimeCatalog();
 const observations=items.map((item: any)=>{
  const track=runtime.getTrack(item.trackId), question=track.getQuestion(item.questionId);
  assert(question,item.questionId);
  assert.equal(sha(canonicalJson(question)),item.currentItemFingerprint,item.questionId);
  const sourceBytes=readFileSync(new URL("../../../../../patternly-content/"+item.sourceFile,import.meta.url));
  const sourceQuestion=JSON.parse(sourceBytes.toString("utf8")).find((q: any)=>q.questionId===item.questionId);
  assert.deepEqual(question,sourceQuestion,item.questionId);
  const modes=track.modes.filter(m=>track.getPool(m.modeId).some(q=>q.questionId===item.questionId)).map(m=>({modeId:m.modeId,availability:m.availability,selection:m.selection,poolCount:track.getPool(m.modeId).length}));
  return {...item,sourcePath:fileURLToPath(new URL("../../../../../patternly-content/"+item.sourceFile,import.meta.url)),currentWholeObjectFingerprint:sha(canonicalJson(question)),sourceSha256:sha(sourceBytes),learnerVisibleConstraints:question.constraints,ordinaryConfiguredPools:modes,observationLimit:"Configured pool membership only; no learner selection, Premium bypass, simulation/verified-review eligibility or native renderer proof."};
 });
 console.log(JSON.stringify({result:"PASS",scope:"Actual current source/bundled runtime/pool observation for46 already-reviewed exact critical non-OOD items. No new semantic review/repair of deferred banks; not release readiness or actual learner-profile acceptance.",runtime:process.version,priorReconciliationSha256:sha(priorBytes),knownExactCriticalObjects:observations.length,ordinaryConfiguredPoolMembers:observations.filter((i: any)=>i.ordinaryConfiguredPools.length>0).length,ordinaryConfiguredPoolAbsent:observations.filter((i: any)=>i.ordinaryConfiguredPools.length===0).length,items:observations},null,2));
}
main().catch(error=>{ console.error(error instanceof Error?error.message:"Known-finding runtime observation failed");process.exitCode=1; });
