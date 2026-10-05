// Bounded evidence/flow preparation; never touches the device or changes delivery.
// Run from app root: node --import tsx <this-file> <private-hierarchy-json> <ordinal3..10>
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { scoreCanonicalQuestion } = require('../../../../src/content/canonical/questionScoring.ts');
const ordinal = Number(process.argv[3]);
assert(Number.isInteger(ordinal) && ordinal >= 3 && ordinal <= 10, 'stage: ordinal');
const raw = fs.readFileSync(process.argv[2], 'utf8');
const tree = JSON.parse(raw);
const nodes = [];
function walk(node) {
  if (node && typeof node === 'object') {
    if (node.attributes) nodes.push(node.attributes);
    for (const [key, value] of Object.entries(node)) if (key !== 'attributes') {
      if (Array.isArray(value)) value.forEach(walk); else walk(value);
    }
  }
}
walk(tree);
const ids = nodes.map(node => node['resource-id']).filter(Boolean);
const sessionId = 'google-cloud-associate-cloud-engineer:certification-focus-practice:2';
assert(ids.includes(`patternly:session:counter:${sessionId}:ordinal:${ordinal}:length:10`), 'stage: own-session position');
const questionIds = [...new Set(ids.filter(id => id.startsWith('patternly:session:question:')))];
assert.equal(questionIds.length, 1, 'stage: current-question identity');
const questionId = questionIds[0].slice('patternly:session:question:'.length);
const artifactPath = 'src/content/generated/canonical-content/google-cloud-associate-cloud-engineer.json';
const artifactBytes = fs.readFileSync(artifactPath);
const question = JSON.parse(artifactBytes).questions.find(item => item.questionId === questionId);
assert(question && question.interaction.type === 'choice_single', 'stage: supported authored interaction');
const sourceAnswer = question.answer.optionId;
const prefix = `patternly:session:option:${questionId}:`;
const nativeOptionIds = [...new Set(ids.filter(id => id.startsWith(prefix)).map(id => id.slice(prefix.length)))];
assert.deepEqual([...nativeOptionIds].sort(), question.interaction.options.map(option => option.optionId.toLowerCase()).sort(), 'stage: source/native membership');
const score = scoreCanonicalQuestion(question, { type: 'choice_single', optionId: sourceAnswer });
assert.equal(score.kind, 'correct');
const stem = `question-${ordinal}`;
const receipt = { sessionId, ordinal, questionId, artifactSha256: crypto.createHash('sha256').update(artifactBytes).digest('hex'), hierarchySha256: crypto.createHash('sha256').update(raw).digest('hex'), sourceAnswer, nativeEncodedAnswer: sourceAnswer.toLowerCase(), nativeOptionIds, expectedScore: score, interpretation: 'authored-key runtime probe; not content semantic acceptance' };
fs.writeFileSync(path.join(__dirname, `${stem}-preflight.json`), JSON.stringify(receipt, null, 2) + '\n');
let flow = `appId: com.lkurczab.patternly\nname: BIZQ01 native25 own question ${ordinal} authored correct\n---\n- assertVisible:\n    id: ${questionIds[0]}\n- assertNotVisible:\n    id: patternly:session:feedback:.*\n- assertNotVisible:\n    id: patternly:session:reason:.*\n- assertNotVisible:\n    id: patternly:session:details:.*\n- takeScreenshot: native25-q${ordinal}-before-submit\n- tapOn:\n    id: ${prefix}${sourceAnswer.toLowerCase()}\n- tapOn:\n    id: patternly:session:submit:${questionId}\n- extendedWaitUntil:\n    visible:\n      id: patternly:session:result:${questionId}:correct\n    timeout: 20000\n- takeScreenshot: native25-q${ordinal}-durable-correct\n- tapOn:\n    id: patternly:session:continue:${questionId}\n`;
if (ordinal < 10) flow += `- extendedWaitUntil:\n    visible:\n      id: patternly:session:counter:${sessionId}:ordinal:${ordinal + 1}:length:10\n    timeout: 15000\n`;
flow += `- takeScreenshot: native25-q${ordinal}-after-continue\n`;
fs.writeFileSync(path.join(__dirname, `${stem}.yaml`), flow);
console.log(`Prepared observed own question ${ordinal}: ${questionId}; authored stable ID ${sourceAnswer}; ${score.kind}.`);
