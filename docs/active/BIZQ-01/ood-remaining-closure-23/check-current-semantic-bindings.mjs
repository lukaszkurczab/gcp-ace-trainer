import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=dirname(fileURLToPath(import.meta.url));
const get=p=>JSON.parse(readFileSync(resolve(packet,p),'utf8'));
const manifest=get('N07-MANIFEST.json');
const report=get('SEMANTIC-N07-B06-B08-CURRENT-v1.json');
assert.equal(report.overallVerdict,'REVISE');assert.equal(report.items.length,54);
let count=0;const accepted=[];
for(const unit of report.units){
  const raw=readFileSync(resolve(packet,unit.inputPath));assert.equal(sha256(raw),unit.inputSha256);
  assert.equal(unit.manifestSha256,sha256(readFileSync(resolve(packet,'N07-MANIFEST.json'))));
  const source=manifest.units.find(u=>u.mentalUnitId===unit.unit);assert.ok(source);assert.equal(source.sourceSha256,unit.beforeSourceSha256);
  for(const q of JSON.parse(raw)){
    const row=report.items.find(r=>r.currentQuestionId===q.questionId);assert.ok(row);
    const before=source.beforeItems.find(b=>b.questionId===row.beforeQuestionId);assert.ok(before);
    assert.equal(sha256(canonicalJson(before.beforeQuestion)),row.beforeWholeObjectSha256);
    assert.equal(sha256(canonicalJson(q)),row.currentWholeObjectSha256);
    assert.equal(q.answer.optionId,row.acceptedOptionId);
    assert.equal(q.interaction.options.find(o=>o.optionId===q.answer.optionId).text,row.acceptedOptionText);
    assert.deepEqual(row.visibleFacts,{prompt:q.prompt,constraints:q.constraints});
    for(const d of row.wrongOptionDiagnostics){assert.equal(q.interaction.options.find(o=>o.optionId===d.optionId)?.text,d.optionText);assert.equal(q.feedback.messages.find(m=>m.targetId===d.optionId)?.text,d.feedback);}
    if(unit.verdict==='PASS'){assert.equal(row.contentVerdict,'PASS');accepted.push(q.questionId);}
    count++;
  }
}
assert.equal(accepted.length,36);
const old=get('review-inputs/N07-B07-v5.json'),current=get('review-inputs/N07-B07-v6.json');
const expected=['ood-n07-b07-i002','ood-n07-b07-i003','ood-n07-b07-i004','ood-n07-b07-i011','ood-n07-b07-i013'];
const changed=[];
for(let i=0;i<18;i++){assert.equal(current[i].questionId,old[i].questionId);assert.deepEqual(current[i].answer,old[i].answer);if(canonicalJson(current[i])!==canonicalJson(old[i]))changed.push(current[i].questionId);}
assert.deepEqual(changed,expected);
const mechanical=get('ROOT-N07-B07-v6-MECHANICAL.json');assert.equal(mechanical.result,'PASS');assert.equal(mechanical.proposalSha256,sha256(readFileSync(resolve(packet,'review-inputs/N07-B07-v6.json'))));assert.equal(mechanical.optionsChecked,88);
const result={result:'PASS_BINDINGS',scope:'Current54 report exact bindings, B06v7/B08v5 semantic PASS36; B07v6 five actual changes and13 unchanged only, independent v6 semantic acceptance pending; no source acceptance',reportSha256:sha256(readFileSync(resolve(packet,'SEMANTIC-N07-B06-B08-CURRENT-v1.json'))),objectsMatched:count,acceptedObjects:accepted,changedB07Objects:changed,unchangedB07Objects:13,actualB07OptionCases:88,sourceActivation:false};
writeFileSync(resolve(packet,'ROOT-N07-CURRENT54-SEMANTIC-BINDINGS.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
