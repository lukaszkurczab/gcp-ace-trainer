import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url),app=new URL('../../../../',packet), appRoot=fileURLToPath(app);
const baseline=JSON.parse(await readFile(new URL('ROOT-N24-PRESERVATION-BASELINE.json',packet)));
const proof=JSON.parse(await readFile(new URL('PREPARED-FIXED-PROOF24.json',packet)));
for(const [file,binding] of Object.entries(baseline.otherArtifacts))assert.equal(sha256(await readFile(new URL('src/content/generated/canonical-content/'+file,app))),binding.sha256,file);
const artifactPath='src/content/generated/canonical-content/object-oriented-design-interview.json';
const old=JSON.parse(execFileSync('git',['show',`HEAD:${artifactPath}`],{cwd:appRoot,maxBuffer:16*1024*1024}));
const raw=await readFile(new URL(artifactPath,app));const current=JSON.parse(raw);assert.equal(current.contentVersion,proof.contentVersion);assert.equal(current.questions.length,1413);assert.equal(sha256(canonicalJson(current.questions)),proof.questionSetSha256);
assert.deepEqual(current.simulationProfiles,old.simulationProfiles,'simulation profile and eligibility bytes unchanged');
const preserved=current.questions.filter(q=>!/^OOD-N0[89]-/.test(q.mentalUnitId));assert.equal(preserved.length,1089);assert.equal(sha256(canonicalJson(preserved)),'5e4e334f5acc89f44925c17926dddde2ebb55b6f11cee792c0dc89803da15377');
const currentById=new Map(current.questions.map(q=>[q.questionId,q]));for(const entry of [...proof.replacements,...proof.sameIdCorrections])assert.deepEqual(currentById.get(entry.questionId),entry.currentQuestion);
const history='integration/contracts/content-release/release.lock.historical-0024.json';assert.equal(sha256(await readFile(new URL(history,app))),'d5058e8678ceab38fbdb3fc6ea423b80e21571885549df9b42dd6e3916312195');
const policyPaths=['src/application/trainingLifecycle/premiumProductModePolicy.ts','src/tracks/design-interview/designModes.ts'];const policies=[];
for(const file of policyPaths){const actual=await readFile(new URL(file,app));assert.ok(actual.equals(execFileSync('git',['show',`HEAD:${file}`],{cwd:appRoot})),file);policies.push({file,sha256:sha256(actual)});}
console.log(JSON.stringify({result:'PASS',scope:'Actual generated source24 consumer preservation; no native/realPremium/admission/fullBIZQ claim',currentQuestions:1413,changedQuestions:324,preservedQuestions:1089,otherArtifacts:8,simulationProfilesUnchanged:true,historicalLockUnchanged:true,artifactSha256:sha256(raw),questionSetSha256:proof.questionSetSha256,premiumPolicyBytes:policies},null,2));
