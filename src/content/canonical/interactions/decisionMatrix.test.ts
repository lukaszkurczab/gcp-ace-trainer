import assert from "node:assert/strict";
import test from "node:test";
import { decisionMatrixDiagnostics, decisionMatrixHandler, type DecisionMatrixQuestion } from "./decisionMatrix";

const question: DecisionMatrixQuestion = {
  questionId: "matrix-diagnostics",
  trackId: "frontend-system-design-interview",
  nodeId: "security_privacy_authentication_and_untrusted_content",
  mentalUnitId: "FESD-N09-B03",
  prompt: "Select both required protections and the script policy.",
  difficulty: null,
  constraints: [],
  interaction: {
    type: "decision_matrix", scoringMethod: "dimension_exact",
    dimensions: [
      { dimensionId: "layers", label: "Required protections", acceptedValueIds: ["safe_sink", "authorization"], values: [
        { valueId: "safe_sink", text: "Use a safe sink." },
        { valueId: "authorization", text: "Authorize the operation." },
        { valueId: "csp_only", text: "Replace both with CSP." },
      ] },
      { dimensionId: "policy", label: "Script policy", acceptedValueIds: ["enforce"], values: [
        { valueId: "enforce", text: "Enforce the reviewed policy." },
        { valueId: "report", text: "Only report violations." },
      ] },
    ],
  },
  answer: { type: "decision_matrix", selectedValueIdsByDimension: { layers: ["safe_sink", "authorization"], policy: ["enforce"] } },
  feedback: {
    type: "decision_matrix", reason: "The controls have distinct responsibilities.", details: { statementExplanations: {
      layers: "Safe sinks constrain rendering; authorization separately determines whether the operation is permitted.",
      policy: "Enforcement blocks violating scripts; report-only mode records them without blocking.",
    } },
    messages: [
      { kind: "wrong_value", targetId: "layers|csp_only", text: "CSP does not replace safe sinks or authorization." },
      { kind: "wrong_value", targetId: "policy|report", text: "Report-Only does not block execution." },
      { kind: "omitted_dimension", targetId: "layers", text: "A required protection is missing." },
      { kind: "omitted_dimension", targetId: "policy", text: "The enforced policy is missing." },
    ],
  },
};
const response = (layers: string[], policy = ["enforce"]) => ({ type: "decision_matrix" as const, selectedValueIdsByDimension: { layers, policy } });
const targets = (value: unknown) => decisionMatrixDiagnostics(question, value).map((message) => message.targetId);

test("correct matrices have no error feedback through submit, projection, or review", () => {
  assert.deepEqual(decisionMatrixHandler.validate(question), []);
  const result = decisionMatrixHandler.evaluate(question, question.answer);
  assert.equal(result.result?.earnedPoints, 2);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.feedback?.messages, []);
  assert.deepEqual(decisionMatrixHandler.projectFeedback(question, question.answer)?.messages, []);
  const review = decisionMatrixHandler.presentReview(question, question.answer, []);
  assert.deepEqual(review.diagnostics, []);
  assert.equal(review.statementRows?.[0]?.explanation, "Safe sinks constrain rendering; authorization separately determines whether the operation is permitted.");
  assert.equal(review.statementRows?.[1]?.explanation, "Enforcement blocks violating scripts; report-only mode records them without blocking.");
});

test("only selected wrong values and actually missing accepted values receive diagnostics", () => {
  assert.deepEqual(targets(response(["safe_sink", "authorization", "csp_only"])), ["layers|csp_only"]);
  assert.deepEqual(targets(response(["safe_sink"])), ["layers"]);
  assert.deepEqual(targets(response(["safe_sink", "csp_only"])), ["layers|csp_only", "layers"]);
  assert.deepEqual(targets(response(["safe_sink", "authorization"], ["report"])), ["policy|report", "policy"]);
  assert.equal(decisionMatrixHandler.score(question, response(["safe_sink"])).earnedPoints, 1);
  assert.equal(decisionMatrixHandler.score(question, response(["safe_sink", "authorization", "csp_only"])).earnedPoints, 1);
});

test("incomplete and illegal matrix responses remain ineligible for submitted feedback", () => {
  for (const value of [response([]), response(["unknown"]), { type: "decision_matrix", selectedValueIdsByDimension: { policy: ["enforce"] } }]) {
    assert.equal(decisionMatrixHandler.isComplete(question, value), false);
    assert.deepEqual(targets(value), []);
    assert.equal(decisionMatrixHandler.evaluate(question, value).feedback, null);
  }
});

test("partial matrix review preserves explicit selections and row diagnostics without affecting submitted feedback", () => {
  const partial = { type: "decision_matrix" as const, selectedValueIdsByDimension: { layers: ["csp_only"] } };
  assert.deepEqual(decisionMatrixHandler.evaluate(question, partial).feedback, null);
  const review = decisionMatrixHandler.presentReview(question, partial, []);
  assert.deepEqual(review.statementRows?.map((row) => [row.dimensionId, row.label, row.selectedValueIds]), [
    ["layers", "Required protections", ["csp_only"]],
    ["policy", "Script policy", []],
  ]);
  assert.deepEqual((review.diagnostics as readonly Readonly<{ targetId: string }>[]).map((message) => message.targetId), ["layers|csp_only", "layers", "policy"]);
  assert.equal(review.statementRows?.[0]?.explanation, "Safe sinks constrain rendering; authorization separately determines whether the operation is permitted.");
  assert.deepEqual(review.statementRows?.[0]?.messages?.map((message) => message.targetId), ["layers|csp_only", "layers"]);
  assert.deepEqual(review.statementRows?.[1]?.messages?.map((message) => message.targetId), ["policy"]);
  assert.ok(review.feedback);
});

test("legacy non-CCAR-P rows may reuse authored omission text without invented explanations", () => {
  const { statementRows } = decisionMatrixHandler.presentReview(question, question.answer, []);
  assert.equal(statementRows?.[0]?.explanation, "Safe sinks constrain rendering; authorization separately determines whether the operation is permitted.");
  const legacy = { ...question, feedback: { ...question.feedback, details: "Legacy overall feedback." } };
  assert.equal(decisionMatrixHandler.presentReview(legacy, legacy.answer, []).statementRows?.[0]?.explanation, "A required protection is missing.");
  const noAuthoredRowText = { ...question, feedback: { ...legacy.feedback, messages: [] } };
  assert.equal(decisionMatrixHandler.presentReview(noAuthoredRowText, noAuthoredRowText.answer, []).statementRows?.[0]?.explanation, undefined);
});
