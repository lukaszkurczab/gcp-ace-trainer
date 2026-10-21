import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createCompletionCreditClassifier } from "./completionCredit";
import type { Question } from "./questionTypes";

const source = JSON.parse(readFileSync("src/content/generated/retained-content/claude-pre-qle-v2.json", "utf8"));
const original: Question = source.artifact.questions.find((q: Question) => q.answer.type === "choice_single");
const current = {trackId: original.trackId, contentVersion:"new",artifactSha256:"a".repeat(64),questions:[original]};
const old = {...current,contentVersion:"old",artifactSha256:"b".repeat(64)};
const ref = {trackId: original.trackId,questionId:original.questionId,contentVersion:old.contentVersion,artifactSha256:old.artifactSha256};

test("credit compares the entire question and exact predecessor pin, independent of object key order", () => {
  const reordered = Object.fromEntries(Object.entries(original).reverse()) as Question;
  const classifier = createCompletionCreditClassifier(current, [{...old,questions:[reordered]}]);
  assert.equal(classifier(ref),"equivalent");
  assert.equal(classifier({...ref,artifactSha256:"c".repeat(64)}),"unavailable");
  assert.equal(classifier({...ref,contentVersion:"new"}),"unavailable");
  assert.equal(classifier({...ref,trackId:"another-track"}),"different");
  assert.equal(classifier({...ref,questionId:"removed"}),"different");
  assert.throws(()=>createCompletionCreditClassifier(current,[{...old,trackId:"another-track"}]),/another track/u);
  assert.throws(()=>createCompletionCreditClassifier(current,[old,old]),/duplicated/u);
});

test("same ID cannot transfer a change to prompt, answer, options, feedback, unit or metadata", () => {
  const changes: Array<(q: any) => void> = [
    q=>{q.prompt += " revised";}, q=>{q.answer.optionId = "changed-key";},
    q=>{q.interaction.options[0].text += " changed";}, q=>{q.interaction.options.reverse();},
    q=>{q.feedback.reason += " revised";},q=>{q.nodeId += "-other";},q=>{q.mentalUnitId += "-other";},
    q=>{q.sourceRefs = ["https://example.invalid/other"];},q=>{q.difficulty = "other";},
  ];
  for(const change of changes) {
    const question = structuredClone(original); change(question);
    const classifier = createCompletionCreditClassifier(current,[{...old,questions:[question]}]);
    assert.equal(classifier(ref),"different");
  }
  // A missing/failed proof is distinct from an admitted predecessor lacking this ID.
  assert.equal(createCompletionCreditClassifier(current,[])(ref),"unavailable");
  assert.equal(createCompletionCreditClassifier(current,[{...old,questions:[]}])(ref),"different");
});
