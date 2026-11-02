import assert from "node:assert/strict";
import test from "node:test";

import { approachChallengeDetailLines, detailLines } from "./feedbackDetails";

test("structured Claude feedback renders explanatory text without leaking block metadata", () => {
  assert.deepEqual(detailLines({
    blocks: [
      { text: "First explanation.", type: "paragraph" },
      { text: "Second explanation.", type: "paragraph" },
    ],
  }), ["First explanation.", "Second explanation."]);
});

test("feedback detail projection keeps scalar and nested explanatory values", () => {
  assert.deepEqual(detailLines({ heading: "Why", notes: ["One", "Two"], score: 2 }), ["Why", "One", "Two", "2"]);
});

test("ACM details use authored Q1 teaching text, keep the selected reason outside and never render grade or option IDs", () => {
  assert.deepEqual(approachChallengeDetailLines({
    reason: "Chosen approach has unnecessary preprocessing.",
    details: {},
    approachExplanation: { reason: "Match work to reuse.", options: [{ text: "Scan once.", reason: "Every relevant value is visited." }] },
  }), ["Match work to reuse.", "Scan once.", "Every relevant value is visited."]);
  assert.deepEqual(approachChallengeDetailLines({
    reason: "Every relevant value is visited.", details: {},
    approachExplanation: { reason: "Match work to reuse.", options: [{ text: "Scan once.", reason: "Every relevant value is visited." }] },
  }), ["Match work to reuse.", "Scan once."], "Reason remains visible without repeating it inside Details");
});

test("ACM Q2 preserves the complete evaluated details", () => {
  assert.deepEqual(approachChallengeDetailLines({ reason: "Inspect the loop.", details: { time: "O(k)", additionalSpace: "O(1)" }, approachExplanation: null }), ["O(k)", "O(1)"]);
});

test("ACM authored Details retain string, array, structured lesson and ID-like prose instead of the legacy fallback", () => {
  const base = { reason: "Selected partial reason", approachExplanation: { reason: "Fallback reason", options: [{ text: "Fallback option", reason: "Fallback rationale" }] } };
  for (const [details, expected] of [
    ["Authored lesson acm-looks-like-id", ["Authored lesson acm-looks-like-id"]],
    [["First", "Second"], ["First", "Second"]],
    [{ blocks: [{ type: "paragraph", text: "Object lesson" }] }, ["Object lesson"]],
  ] as const) assert.deepEqual(approachChallengeDetailLines({ ...base, details }), expected);
  assert.deepEqual(approachChallengeDetailLines({ ...base, details: {} }), ["Fallback reason", "Fallback option", "Fallback rationale"]);
});
