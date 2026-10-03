import {readFileSync,readdirSync,statSync} from "node:fs";
import {resolve,relative} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
const appRoot=fileURLToPath(new URL("../../../../",import.meta.url));
const root=resolve(appRoot,"../patternly-content");
const rows=[];let inventory=0;
function visit(dir){for(const name of readdirSync(dir)){const p=resolve(dir,name);if(statSync(p).isDirectory())visit(p);else if(name.endsWith(".json")){const bytes=readFileSync(p);const value=JSON.parse(bytes);if(!Array.isArray(value))continue;for(const q of value){if(!q.questionId)continue;inventory++;if(q.feedback?.messages?.some(m=>m.kind==="wrong_option"&&/^It moves .+ is the primary decision;/u.test(m.text)))rows.push({questionId:q.questionId,trackId:q.trackId,mentalUnitId:q.mentalUnitId,sourcePath:relative(root,p),sourceSha256:createHash("sha256").update(bytes).digest("hex")});}}}}
const catalog=JSON.parse(readFileSync(resolve(root,"content/catalog.json"),"utf8"));
for(const track of catalog.tracks)visit(resolve(root,"content",track.trackId));
const byTrack={};for(const row of rows)byTrack[row.trackId]=(byTrack[row.trackId]??0)+1;
console.log(JSON.stringify({scope:"exact malformed-feedback template occurrence inventory, automated candidates; not semantic PASS/critical classification",predicate:"wrong_option text /^It moves .+ is the primary decision;/",inventory,matched:rows.length,byTrack,rows},null,2));
