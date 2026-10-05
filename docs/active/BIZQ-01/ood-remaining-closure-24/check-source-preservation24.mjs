import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {canonicalJson,sha256,validateTrack} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url),content=new URL('../../../../../patternly-content/',packet),app=new URL('../../../../',packet);
const baseline=JSON.parse(await readFile(new URL('ROOT-N24-PRESERVATION-BASELINE.json',packet)));
const proof=JSON.parse(await readFile(new URL('PREPARED-FIXED-PROOF24.json',packet)));
const track=await validateTrack({rootDirectory:fileURLToPath(content),trackId:proof.trackId});
assert.equal(track.track.contentVersion,proof.contentVersion);assert.equal(sha256(canonicalJson(track.questions)),proof.questionSetSha256);assert.equal(track.questions.length,1413);
const byId=new Map(track.questions.map(q=>[q.questionId,q]));
for(const item of [...proof.replacements,...proof.sameIdCorrections]) {assert.deepEqual(byId.get(item.questionId),item.currentQuestion);if(item.beforeQuestionId!==item.questionId)assert.equal(byId.has(item.beforeQuestionId),false);}
for(const source of proof.sourceFiles)assert.equal(sha256(await readFile(new URL(source.sourceFile,content))),source.sourceSha256);
const preserved=track.questions.filter(q=>!/^OOD-N0[89]-/.test(q.mentalUnitId));assert.equal(preserved.length,1089);assert.equal(sha256(canonicalJson(preserved)),'5e4e334f5acc89f44925c17926dddde2ebb55b6f11cee792c0dc89803da15377');
for(const [file,binding] of Object.entries(baseline.untouchedContentFiles))assert.equal(sha256(await readFile(new URL(file,content))),binding.sha256,file);
for(const [file,binding] of Object.entries(baseline.immutableBusinessQualityProofs))assert.equal(sha256(await readFile(new URL(file,content))),binding.sha256,file);
for(const [file,binding] of Object.entries(baseline.otherArtifacts))assert.equal(sha256(await readFile(new URL('src/content/generated/canonical-content/'+file,app))),binding.sha256,file);
const catalog=JSON.parse(await readFile(new URL('content/catalog.json',content)));const previous=structuredClone(catalog);previous.tracks.find(t=>t.trackId===proof.trackId).contentVersion=proof.beforeContentVersion;assert.deepEqual(previous,baseline.catalog,'only the OOD contentVersion changes');
console.log(JSON.stringify({result:'PASS',scope:'Actual current source24/all324/wholeQset and unchanged1089OOD/935content/15proofs/8app artifacts/catalog; does not establish migration, consumer synchronization, admission or native acceptance',wholeQuestions:1413,changedQuestions:324,preservedOOD:1089,untouchedContentFiles:Object.keys(baseline.untouchedContentFiles).length,immutableProofFiles:Object.keys(baseline.immutableBusinessQualityProofs).length,otherArtifacts:Object.keys(baseline.otherArtifacts).length,questionSetSha256:proof.questionSetSha256},null,2));
