// Reproduce one observed contradiction; this is not a semantic bank verdict.
import { createContentReviewConsole } from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
const service = await createContentReviewConsole();
const rows = [];
for (const r of service.listItems()) {
  const q = r.item;
  if (q.interaction.type !== 'ordering') continue;
  const acceptedFirst = q.answer.orderedElementIds?.[0];
  const message = q.feedback.messages?.find(m => m.kind === 'wrong_element' &&
    m.targetId === acceptedFirst && m.text.includes('first or only step would hide'));
  if (message) rows.push({ trackId: r.trackId, questionId: r.questionId,
    sourceFile: r.sourceFile, sourceFileSha256: r.sourceFileSha256,
    itemFingerprint: r.itemFingerprint, acceptedFirst, feedback: message.text });
}
const byTrack = {};
for (const r of rows) byTrack[r.trackId] = (byTrack[r.trackId] ?? 0) + 1;
console.log(JSON.stringify({
  scope: 'Exact first-step feedback contradiction predicate; whole-question remediation scope still requires semantic review',
  matched: rows.length, byTrack, rows,
}, null, 2));
