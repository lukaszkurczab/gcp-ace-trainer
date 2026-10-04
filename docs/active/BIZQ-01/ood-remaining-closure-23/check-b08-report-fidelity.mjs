import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=dirname(fileURLToPath(import.meta.url));const raw=p=>readFileSync(resolve(packet,p));const get=p=>JSON.parse(raw(p));
const oldJson='review-inputs/SEMANTIC-N07-B08-v4-QA-original.json';const oldMd='review-inputs/SEMANTIC-N07-B08-v4-QA-original.md';
assert.equal(sha256(raw(oldJson)),'e3c6e4b1c93f9ba6f67ff82a7a9f659e55564e483eaa6364a98a8d88e641617d');
assert.equal(sha256(raw(oldMd)),'3c751aaa036a767708ce31b3a63cbee29b93b9252abb272f44a4829ec2efbbe3');
const current=get('SEMANTIC-N07-B08-v4-QA.json');const normalized=structuredClone(current);for(const row of normalized.items){delete row.beforeWholeObjectSha256;delete row.currentWholeObjectSha256;}assert.equal(canonicalJson(normalized),canonicalJson(get(oldJson)));
const m=get('N07-MANIFEST.json');const before=m.units.find(x=>x.mentalUnitId==='OOD-N07-B08').beforeItems;const objects=get(current.input.path);assert.equal(sha256(raw(current.input.path)),current.input.sha256);
for(const row of current.items){const q=objects.find(x=>x.questionId===row.questionId);const b=before.find(x=>x.questionId===row.questionId);assert.ok(q&&b);assert.equal(sha256(canonicalJson(q)),row.currentWholeObjectSha256);assert.equal(sha256(canonicalJson(b.beforeQuestion)),row.beforeWholeObjectSha256);assert.equal(row.contentVerdict,'PASS');assert.equal(row.questionIdentity.reservedQuestionId,b.reservedNewQuestionId);}
const correction=get('REPORT-FIDELITY-CORRECTION-N07-B08-v4.json');assert.equal(sha256(raw(correction.correctedReport.path)),correction.correctedReport.sha256);assert.equal(sha256(raw(correction.correctedJson.path)),correction.correctedJson.sha256);
const result={result:'PASS',scope:'Exact recovered original reports and corrected metadata bindings only; no semantic/source/producer/admission acceptance',recovery:'Original v4 reports were overwritten; recovered copies match both independently recorded original raw SHA256 values exactly. Current JSON adds only whole-object fingerprints; all18 content/identity conclusions are unchanged. MD corrected to agree with those existing actions.',originalJson:{path:oldJson,sha256:sha256(raw(oldJson))},originalMd:{path:oldMd,sha256:sha256(raw(oldMd))},currentJsonSha256:sha256(raw('SEMANTIC-N07-B08-v4-QA.json')),currentMdSha256:sha256(raw('SEMANTIC-N07-B08-v4-QA.md')),wholeObjectBindingsMatched:18,contentVerdict:'PASS',identityDisposition:'REPLACE18_WITH_MANIFEST_RESERVED_IDS',sourceActivation:false};
writeFileSync(resolve(packet,'ROOT-N07-B08-v4-REPORT-RECOVERY.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:'PASS',originalReportsRecoveredExact:2,wholeObjectsMatched:18}));
