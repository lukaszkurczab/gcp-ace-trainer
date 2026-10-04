// Reviewed source/proof writes for verification only; no source/admission acceptance.
import assert from 'node:assert/strict';
import {readFile,writeFile,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url),producer=new URL('../../../../../patternly-content/',packet);
const read=name=>readFile(new URL(name,packet));
const designBytes=await read('PRODUCER-DESIGN-QA.json');assert.equal(sha256(designBytes),'536926e5d6d860a8987f358249bd69e167ce22cfe2e06fb27992f84d51b3d86a');
const design=JSON.parse(designBytes);assert.equal(design.verdict,'PASS');assert.equal(design.decisionBoundary.sourceAndProofWritesForVerificationMayProceedAfterDesignPass,true);
for(const binding of Object.values(design.inputs))assert.equal(sha256(await read(binding.path)),binding.sha256);
assert.equal(sha256(await read('PRODUCER-DESIGN-QA.md')),'a2cf7657939f8481a77e316b3a6fd6afb84f425338877da38f1b9bc5deb12bd3');
const proofBytes=await read('PREPARED-FIXED-PROOF22.json');const proof=JSON.parse(proofBytes);assert.equal(proof.sameIdCorrections.length,180);assert.deepEqual(proof.replacements,[]);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:fileURLToPath(producer),encoding:'utf8'}).trim();assert.equal(head,proof.beforeProducerCommit);
const baseline=JSON.parse(await read('ROOT-N06-BASELINE.json'));const catalogUrl=new URL('content/catalog.json',producer);const catalogBytes=await readFile(catalogUrl);const catalog=JSON.parse(catalogBytes);assert.deepEqual(catalog,baseline.catalog);
const canonicalProof=new URL('evidence/business-quality/bizq-01-ood-node-closure-22.json',producer);assert.equal(await lstat(canonicalProof).catch(e=>{if(e.code==='ENOENT')return undefined;throw e;}),undefined);
const writes=[];
for(const source of proof.sourceFiles){const url=new URL(source.sourceFile,producer),info=await lstat(url);assert(info.isFile()&&!info.isSymbolicLink());const old=await readFile(url);assert.equal(sha256(old),source.beforeSourceSha256);const questions=proof.sameIdCorrections.filter(i=>i.sourceFile===source.sourceFile).map(i=>i.currentQuestion).sort((a,b)=>a.questionId.localeCompare(b.questionId));assert.equal(questions.length,18);const bytes=Buffer.from(JSON.stringify(questions));assert.equal(sha256(bytes),source.sourceSha256);writes.push({url,bytes,sourceFile:source.sourceFile});}
await writeFile(new URL('BEFORE-SOURCE-ACTIVATION-CATALOG.json',packet),JSON.stringify({catalog,catalogRawSha256:sha256(catalogBytes)},null,2)+'\n',{flag:'wx'});
for(const {url,bytes} of writes)await writeFile(url,bytes);
const next={...catalog,tracks:catalog.tracks.map(t=>t.trackId===proof.trackId?{...t,contentVersion:proof.contentVersion}:t)};
await writeFile(catalogUrl,JSON.stringify(next)+'\n');await writeFile(canonicalProof,proofBytes,{flag:'wx'});
const receipt={result:'WRITTEN_FOR_VERIFICATION',scope:'Exact reviewed180 source/proof writes only; no producer/consumer/source/admission acceptance',beforeProducerCommit:head,sourceFiles:writes.map(w=>w.sourceFile),sameIdCorrections:180,replacements:0,contentVersion:proof.contentVersion,questionSetSha256:proof.questionSetSha256,proofSha256:sha256(proofBytes),designReviewSha256:sha256(designBytes)};
await writeFile(new URL('ROOT-SOURCE-WRITES-FOR-VERIFICATION.json',packet),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
