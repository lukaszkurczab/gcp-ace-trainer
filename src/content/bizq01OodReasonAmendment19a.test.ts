import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";

import {
  buildCanonicalInteractionViewModel,
  composeCanonicalFeedback,
} from "../application/canonical/canonicalInteractionPresentation";
import { toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
import { scoreCanonicalQuestion } from "./canonical/questionScoring";
import type { Question } from "./canonical/questionTypes";

const PACKET = "docs/active/BIZQ-01/ood-node-closure-19";
const AMENDMENT_PATH = `${PACKET}/reason-amendment-19a/PROPOSED-REASONS.json`;
const AMENDMENT_SHA256 = "76fd88c540bd1b6ffe83eb2034cbf565b2ac030454e80511e56a341555edfa15";
const TRACK = "object-oriented-design-interview";
const NODE = "relationships_composition_ownership_lifecycle_and_dependencies";
const PROPOSALS = [
  { path: `${PACKET}/proposals/OOD-N03-B02.json`, sha256: "d70ee871a3ee7087c1b5d3d03f2feaedf041fd1d1cbb6267df2439a953abd237" },
  { path: `${PACKET}/proposals/OOD-N03-B03.json`, sha256: "830a1fb12385d084279054f3d32db5261af24e7501700847b75e25f1c83ef0de" },
  { path: `${PACKET}/proposals/OOD-N03-B08.json`, sha256: "68ca04a4849f4d1c7e20ff9592c4dbd2a028f7be86e51241015f91d3f7e56058" },
] as const;

type ReasonAmendment = Readonly<{ questionId: string; beforeReason: string; reason: string }>;

function isSingleChoice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

function readBytes(relativePath: string): Buffer {
  return readFileSync(path.resolve(relativePath));
}

function readAmendments(): readonly ReasonAmendment[] {
  const bytes = readBytes(AMENDMENT_PATH);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), AMENDMENT_SHA256, "fixed 19a Reason amendment bytes");
  const entries = JSON.parse(bytes.toString("utf8")) as readonly ReasonAmendment[];
  assert.equal(entries.length, 25);
  assert.equal(new Set(entries.map((entry) => entry.questionId)).size, 25);
  return entries;
}

function readFrozenQuestions(): readonly Question[] {
  return PROPOSALS.flatMap((proposal) => {
    const bytes = readBytes(proposal.path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), proposal.sha256, `${proposal.path} immutable v19 bytes`);
    return JSON.parse(bytes.toString("utf8")) as readonly Question[];
  });
}

function sourceQuestion(unitSuffix: string, questionId: string): Question {
  const filename = `OOD-N03-B${unitSuffix.toUpperCase()}.json`;
  const sourcePath = path.resolve(
    "../patternly-content/content/object-oriented-design-interview",
    NODE,
    filename,
  );
  const questions = JSON.parse(readFileSync(sourcePath, "utf8")) as readonly Question[];
  const question = questions.find((candidate) => candidate.questionId === questionId);
  assert.ok(question, `${questionId} exists in canonical source`);
  return question;
}

test("OOD19a applies exactly 25 Reason-only changes over immutable v19 payloads", async () => {
  const amendments = readAmendments();
  const baseline = readFrozenQuestions();
  assert.equal(baseline.length, 54, "the three source arrays retain their 18-item immutable v19 payloads");
  const baselineById = new Map(baseline.map((question) => [question.questionId, question]));
  assert.equal(baselineById.size, baseline.length);
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);

  for (const amendment of amendments) {
    const before = baselineById.get(amendment.questionId);
    assert.ok(before, `${amendment.questionId} appears in the frozen v19 arrays`);
    assert.ok(isSingleChoice(before), `${amendment.questionId} retains its single-choice interaction`);
    assert.equal(before.feedback.type, "choice_single", `${amendment.questionId} retains single-choice feedback`);
    assert.equal(before.nodeId, NODE);
    assert.equal(before.feedback.reason, amendment.beforeReason, `${amendment.questionId} old Reason is exact`);
    assert.notEqual(amendment.reason, amendment.beforeReason);
    const expected: Question = {
      ...before,
      feedback: { ...before.feedback, reason: amendment.reason },
    };
    const suffix = amendment.questionId.slice("ood-n03-b".length, "ood-n03-b".length + 2);
    const source = sourceQuestion(suffix, amendment.questionId);
    const runtime = track.getQuestion(amendment.questionId);
    assert.ok(runtime, `${amendment.questionId} exists in current runtime`);

    // Equality to this exact overlay proves prompt, options and IDs, answer,
    // Details, diagnostics, scoring and every other source field are unchanged.
    assert.deepEqual(source, expected, `${amendment.questionId} source differs from v19 only at feedback.reason`);
    assert.deepEqual(runtime, expected, `${amendment.questionId} runtime differs from v19 only at feedback.reason`);
    assert.deepEqual(source, runtime, `${amendment.questionId} source and runtime are identical`);

    const optionIds = before.interaction.options.map((option) => option.optionId);
    const answerId = before.answer.optionId;
    assert.deepEqual(runtime.interaction.options.map((option) => option.optionId), optionIds);
    assert.equal(runtime.answer.optionId, answerId);
    assert.deepEqual(runtime.feedback.details, before.feedback.details);
    assert.deepEqual(runtime.feedback.messages, before.feedback.messages);
    const preAnswerBefore = toCanonicalQuestionViewModel(before);
    const preAnswerAfter = toCanonicalQuestionViewModel(runtime);
    assert.deepEqual(preAnswerAfter, preAnswerBefore, `${amendment.questionId} hidden feedback does not change its pre-answer view`);
    assert.equal(JSON.stringify(preAnswerAfter).includes(amendment.reason), false);

    const currentControls = buildCanonicalInteractionViewModel(runtime, null, optionIds);
    const baselineControls = buildCanonicalInteractionViewModel(before, null, optionIds);
    assert.deepEqual(currentControls, baselineControls, `${amendment.questionId} choice presentation is unchanged before submit`);
    for (const optionId of optionIds) {
      const response = { type: "choice_single", optionId } as const;
      assert.deepEqual(
        scoreCanonicalQuestion(runtime, response),
        scoreCanonicalQuestion(before, response),
        `${amendment.questionId}/${optionId} answer and scoring are unchanged`,
      );
      const currentFeedback = composeCanonicalFeedback(runtime, response);
      const baselineFeedback = composeCanonicalFeedback(before, response);
      assert.equal(currentFeedback.correctness, baselineFeedback.correctness);
      assert.equal(currentFeedback.reason, amendment.reason);
      assert.deepEqual(currentFeedback.details, baselineFeedback.details);
      assert.deepEqual(currentFeedback.messages, baselineFeedback.messages);
    }
  }
});
