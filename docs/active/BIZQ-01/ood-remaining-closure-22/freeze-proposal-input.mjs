// Preserve the exact complete unit submitted for independent review; no overwrite.
import assert from 'node:assert/strict';
import {readFile,mkdir,copyFile,constants} from 'node:fs/promises';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url);const [name,revision]=process.argv.slice(2);
assert.equal(process.argv.length,4);assert(/^N06-B(?:0[1-9]|10)\.json$/.test(name??''));assert(/^v[1-9][0-9]?$/.test(revision??''));
const source=new URL('proposals/'+name,packet);const raw=await readFile(source);assert.equal(JSON.parse(raw).length,18);
await mkdir(new URL('review-inputs/',packet),{recursive:true});
const targetName=name.replace('.json','-'+revision+'.json');const target=new URL('review-inputs/'+targetName,packet);
try{await copyFile(source,target,constants.COPYFILE_EXCL);}catch(error){if(error.code!=='EEXIST')throw error;}
assert((await readFile(target)).equals(raw),'Frozen revision exists with different bytes; use a new explicit revision');
assert((await readFile(source)).equals(raw),'Proposal changed during freeze; no readiness claim');
console.log(JSON.stringify({scope:'Exact submitted review input only; no semantic/identity acceptance',proposal:name,frozenInput:'review-inputs/'+targetName,sha256:sha256(raw),questionCount:18}));
