// Reproduce the exact facts required before N06 proposal authoring.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateTrack,canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url);
const read=name=>readFile(new URL(name,packet));
const manifestBytes=await read('N06-MANIFEST.json');const manifest=JSON.parse(manifestBytes);
const preflightBytes=await read('N06-PREFLIGHT.json');const preflight=JSON.parse(preflightBytes);
const qaBytes=await read('N06-DESIGN-QA.json');const qa=JSON.parse(qaBytes);
assert.equal(sha256(qaBytes),'21dc5e01a76de8cb7ce3cd33cfc8f0cd295289d9b59e5a55d51e61d415671e5c');
assert.equal(qa.verdict,'PASS');assert(qa.scores.minimum>=.8);
assert.equal(sha256(await read('N06-BRIEFING.md')),qa.briefing.sha256);
const contractBytes=await read('N06-CONTRACT.json');assert.equal(sha256(contractBytes),qa.contract.sha256);
const contract=JSON.parse(contractBytes);const canonical=await readFile(contract.canonicalFile);
assert.equal(sha256(canonical),contract.sha256);
const suffix=Buffer.from('\n'+contract.clause+'\n');assert(canonical.subarray(-suffix.length).equals(suffix));
assert.equal(sha256(canonical.subarray(0,-suffix.length)),contract.beforeSha256);
assert.equal(sha256(manifestBytes),preflight.manifest.sha256);
assert.equal(sha256(contractBytes),manifest.canonicalGuidelineContract.contractSha256);
assert.equal(sha256(await read('N06-BRIEFING.md')),manifest.canonicalGuidelineContract.briefingSha256);
const priorBytes=await read('../ood-remaining-closure-21/SOURCE-PREFLIGHT.json');
assert.equal(sha256(priorBytes),manifest.previousPreflight.sha256);
const prior=new Map(JSON.parse(priorBytes).items.map(x=>[x.questionId,x]));
const t=await validateTrack({rootDirectory:fileURLToPath(new URL('../../../../../patternly-content/',packet)),trackId:'object-oriented-design-interview'});
assert.equal(t.track.contentVersion,'object-oriented-design-interview-authoring-v2026.10.04-bizq01-21');
assert.equal(sha256(canonicalJson(t.questions)),'6d19a75e8eae86869b3ce31b63ad57a6be13fc30532c22e993db6fbc3d0d4d12');
const current=new Map(t.questions.map(q=>[q.questionId,q]));const seen=new Set();let confirmed=0,gaps=0;
assert.equal(manifest.units.length,10);
for(const u of manifest.units){
 assert.equal(u.beforeItems.length,18);
 const raw=await readFile(new URL('../../../../../patternly-content/'+u.sourcePath,packet));assert.equal(sha256(raw),u.sourceSha256);
 for(const item of u.beforeItems){
  assert(!seen.has(item.questionId));seen.add(item.questionId);
  const old=prior.get(item.questionId);const q=current.get(item.questionId);assert(q&&old);
  assert.deepEqual(q,item.beforeQuestion);assert.equal(sha256(canonicalJson(q)),old.wholeQuestionSha256);
  assert.equal(item.beforeQuestionSha256,old.wholeQuestionSha256);assert.equal(item.priorDisposition,old.disposition);
  const reserved=item.questionId.replace(/i(\d+)$/,(_,n)=>'i'+String(Number(n)+18).padStart(3,'0'));
  assert.equal(item.reservedNewQuestionId,reserved);assert(!current.has(reserved));
  if(old.disposition==='CONFIRMED')confirmed++;else {assert.equal(old.disposition,'CONTRACT_GAP');assert(item.gapContextReview);gaps++;}
 }
}
assert.equal(seen.size,180);assert.equal(confirmed,159);assert.equal(gaps,21);
const receipt={result:'PASS',scope:'Root actual pre-authoring prerequisites only; no proposal/identity/source/runtime acceptance',runtime:process.version,questionCount:180,sourceFiles:10,confirmed:159,contractGaps:21,currentWholeBindings:180,reservedCorrespondingUnused:180,manifestSha256:sha256(manifestBytes),preflightSha256:sha256(preflightBytes),briefingSha256:qa.briefing.sha256,contractSha256:qa.contract.sha256,designQaSha256:sha256(qaBytes),canonicalUnchangedPrefix:true,proposalAuthoringPrerequisites:'resolved'};
await writeFile(new URL('ROOT-PRE-AUTHORING-BINDINGS.json',packet),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
