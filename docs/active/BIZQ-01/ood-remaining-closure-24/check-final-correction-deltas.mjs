import fs from 'node:fs';
import path from 'node:path';
import{fileURLToPath}from'node:url';
import{canonicalJson,sha256}from'../../../../../patternly-content/scripts/build.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f)));
const raw=f=>sha256(fs.readFileSync(path.join(root,f)));
const diff=(a,b,p='')=>{if(canonicalJson(a)===canonicalJson(b))return[];if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return[p];return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],p?`${p}.${k}`:k));};
const manifest=read('N08-N09-MANIFEST.json');let results=[];
for(const[unit,oldFile,newFile]of[['OOD-N09-B03','N09-B03-v2','N09-B03-v3'],['OOD-N09-B07','N09-B07-v3','N09-B07-v4'],['OOD-N08-B09','N08-B09-v4','N08-B09-v5']]){
 let old=read(`review-inputs/${oldFile}.json`),cur=read(`review-inputs/${newFile}.json`),m=manifest.units.find(x=>x.mentalUnitId===unit),items=[];
 for(let i=0;i<18;i++){
  const original=m.beforeItems.find(x=>x.questionId===old[i].questionId||x.reservedNewQuestionId===old[i].questionId);if(!original)throw Error('before binding');
  const q=cur.find(x=>x.questionId===original.questionId||x.questionId===original.reservedNewQuestionId);if(!q)throw Error('current binding');let leaves=diff(old[i],q);
  if(unit==='OOD-N09-B03'&&original.questionId!=='ood-n09-b03-i007'&&leaves.length)throw Error('B03 unrelated object');
  if(unit==='OOD-N09-B07'){
   let designated=['ood-n09-b07-i003','ood-n09-b07-i008','ood-n09-b07-i011'].includes(original.questionId);
   for(let l of leaves)if(!/^feedback\.messages\.\d+\.text$/.test(l)&&!(designated&&(/^(interaction\.options\.\d+\.(text|optionId)|feedback\.messages\.\d+\.targetId)$/.test(l))))throw Error('B07 scope '+original.questionId+' '+l);
  }
  if(unit==='OOD-N08-B09'&&(q.questionId!==original.reservedNewQuestionId||q.interaction.options.some(o=>old[i].interaction.options.some(x=>x.optionId===o.optionId))))throw Error('B09 replacement freshness');
  items.push({originalQuestionId:original.questionId,priorQuestionId:old[i].questionId,currentQuestionId:q.questionId,originalWholeSha256:sha256(canonicalJson(original.beforeQuestion)),priorWholeSha256:sha256(canonicalJson(old[i])),currentWholeSha256:sha256(canonicalJson(q)),changedLeaves:leaves});
 }
 results.push({unitId:unit,priorRawSha256:raw(`review-inputs/${oldFile}.json`),currentRawSha256:raw(`review-inputs/${newFile}.json`),exactUnchangedObjects:items.filter(x=>!x.changedLeaves.length).length,totalChangedLeaves:items.reduce((n,x)=>n+x.changedLeaves.length,0),items});
}
const result={scope:'Root exact correction-delta and preservation probe only; independent semantic acceptance pending',manifestSha256:raw('N08-N09-MANIFEST.json'),results};if(process.argv[2])fs.writeFileSync(path.join(root,process.argv[2]),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(results.map(({unitId,exactUnchangedObjects,totalChangedLeaves})=>({unitId,exactUnchangedObjects,totalChangedLeaves}))));
