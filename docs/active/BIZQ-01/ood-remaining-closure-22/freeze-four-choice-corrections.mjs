import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url);
const cases=[['B01','v1','v2'],['B03','v1','v2'],['B05','v2','v3'],['B08','v3','v4']];
const changes=[];
for(const [unit,oldVersion,newVersion] of cases){
 const old=JSON.parse(await readFile(new URL(`review-inputs/N06-${unit}-${oldVersion}.json`,packet)));
 const bytes=await readFile(new URL(`proposals/N06-${unit}.json`,packet));const current=JSON.parse(bytes);
 assert.equal(current.length,18);
 const fields=[];
 function diff(a,b,path){if(JSON.stringify(a)===JSON.stringify(b))return; if(a&&b&&typeof a==='object'&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const key of Object.keys(a))diff(a[key],b[key],path.concat(key));}else fields.push({path,before:a,after:b});}
 diff(old,current,[]);
 for(const f of fields){const [index,...path]=f.path;const q=old[index];
  if(unit!=='B08')assert(path.length===4&&path[0]==='interaction'&&path[1]==='options'&&path[3]==='text'&&q.interaction.options[path[2]].optionId===q.answer.optionId);
  else assert(path[0]==='interaction'||path[0]==='feedback','B08 correction outside submitted choice/feedback scope');
 }
 const freeze=JSON.parse(execFileSync(process.execPath,[new URL('freeze-proposal-input.mjs',packet).pathname,`N06-${unit}.json`,newVersion],{encoding:'utf8'})); assert.equal(freeze.sha256,sha256(bytes));
 const checkBytes=execFileSync(process.execPath,[new URL('check-proposal-unit.mjs',packet).pathname,`N06-${unit}.json`]);
 await writeFile(new URL(`ROOT-PROPOSAL-N06-${unit}-${newVersion}.json`,packet),checkBytes,{flag:'wx'});
 const source=unit==='B08'?'AUTHOR-NOTES-B06-B10.json':'AUTHOR-NOTES-B01-B05.json';const notesBytes=await readFile(new URL(source,packet));
 const notes={scope:'Unit author hypotheses at corrected submission; independent review required',sourceNotes:source,sourceNotesSha256:sha256(notesBytes),unit:`OOD-N06-${unit}`,items:JSON.parse(notesBytes).items.filter(i=>i.mentalUnitId===`OOD-N06-${unit}`)};
 assert.equal(notes.items.length,18);
 const name=unit==='B01'||unit==='B03'?`AUTHOR-NOTES-N06-${unit}-${newVersion}.json`:`N06-${unit}-${newVersion}-NOTES.json`;
 await writeFile(new URL(`review-inputs/${name}`,packet),JSON.stringify(notes,null,2)+'\n',{flag:'wx'});
 changes.push({unit,oldVersion,newVersion,proposalSha256:sha256(bytes),fields});
}
await writeFile(new URL('ROOT-FOUR-CHOICE-CORRECTION-DELTA.json',packet),JSON.stringify({result:'PASS',scope:'Actual field deltas and existing structural/scoring checks; no semantic acceptance',changes},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(changes.map(({fields,...x})=>({...x,changedFields:fields.length}))));
