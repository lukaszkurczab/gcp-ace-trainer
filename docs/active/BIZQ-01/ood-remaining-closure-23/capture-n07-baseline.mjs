// Read-only source/consumer baseline for N07, using the existing canonical parser.
import assert from 'node:assert/strict';
import {readFile, readdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateTrack, canonicalJson, sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url);
const workspace=new URL('../../../../../',packet);
const content=new URL('patternly-content/',workspace);
const app=new URL('patternly/',workspace);
const read=async url=>({sha256:sha256(await readFile(url))});
const git=(repo,args)=>execFileSync('git',args,{cwd:fileURLToPath(repo),encoding:'utf8'}).trim();
const t=await validateTrack({rootDirectory:fileURLToPath(content),trackId:'object-oriented-design-interview'});
assert.equal(t.track.contentVersion,'object-oriented-design-interview-authoring-v2026.10.04-bizq01-22');
assert.equal(sha256(canonicalJson(t.questions)),'c6cf903178b823fb71ac29040f3c5fa5f72c619d3adbb525fc7791756654ac3e');
const scoped=t.questions.filter(q=>/^OOD-N07-B0[1-8]$/.test(q.mentalUnitId));
assert.equal(scoped.length,144);
const preserved=t.questions.filter(q=>!scoped.includes(q));assert.equal(preserved.length,1269);
const accepted=t.questions.filter(q=>/^OOD-N0[1-6]-/.test(q.mentalUnitId));assert.equal(accepted.length,945);
const artifactUrl=new URL('src/content/generated/canonical-content/object-oriented-design-interview.json',app);
const artifact=JSON.parse(await readFile(artifactUrl));assert.deepEqual(artifact.questions,t.questions);
const artifacts={};
for(const name of (await readdir(new URL('src/content/generated/canonical-content/',app))).filter(n=>n.endsWith('.json')).sort()){
 if(name==='object-oriented-design-interview.json'||name==='content-lock.json')continue;
 artifacts[name]=await read(new URL(`src/content/generated/canonical-content/${name}`,app));
}
assert.equal(Object.keys(artifacts).length,8);
const proofs={};
for(const name of git(content,['ls-files','evidence/business-quality']).split('\n').filter(n=>n.endsWith('.json')).sort()){
 proofs[name]=await read(new URL(name,content));
}
const untouchedContentFiles={};
for(const name of git(content,['ls-files','content']).split('\n').filter(Boolean).sort()){
 if(name==='content/catalog.json'||name.startsWith('content/object-oriented-design-interview/persistence_repositories_serialization_and_domain_boundaries/'))continue;
 untouchedContentFiles[name]=await read(new URL(name,content));
}
assert.equal(Object.keys(untouchedContentFiles).length,945);
const refs={};
for(const [name,repo] of [['app',app],['content',content],['web',new URL('patternly-web/',workspace)],['backend',new URL('patternly-backend/',workspace)]]){
 refs[name]={head:git(repo,['rev-parse','HEAD']),upstream:git(repo,['rev-parse','@{upstream}']),stashHashes:git(repo,['stash','list','--format=%H']).split('\n').filter(Boolean)};
}
const receipt={scope:'Actual readonly pre-N07 source/consumer baseline; no semantic, producer or package acceptance',contentVersion:t.track.contentVersion,questionSetSha256:sha256(canonicalJson(t.questions)),scopedQuestionCount:144,preservedOtherOODQuestionCount:1269,acceptedN01N06QuestionCount:945,preservedQuestions:preserved.map(q=>({questionId:q.questionId,wholeQuestionSha256:sha256(canonicalJson(q))})),acceptedN01N06QuestionSetSha256:sha256(canonicalJson(accepted)),oodArtifact:await read(artifactUrl),otherArtifacts:artifacts,immutableBusinessQualityProofs:proofs,untouchedContentFiles,catalog:JSON.parse(await readFile(new URL('content/catalog.json',content))),contentLock:await read(new URL('src/content/generated/canonical-content/content-lock.json',app)),currentReleaseLock:await read(new URL('integration/contracts/content-release/release.lock.json',app)),historicalReleaseLock:await read(new URL('integration/contracts/content-release/release.lock.historical-0024.json',app)),webDemo:await read(new URL('patternly-web/src/generated/demoQuestions.json',workspace)),refs};
await writeFile(new URL('ROOT-N07-BASELINE.json',packet),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({result:'PASS',scope:receipt.scope,scoped:144,preserved:1269,accepted:945,otherArtifacts:8,immutableProofs:Object.keys(proofs).length,sourceConsumerObjects:'byte-equivalent canonical objects'}));
