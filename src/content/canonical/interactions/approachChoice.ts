import { createAttemptResult, type AttemptResult } from "../../../domain/learning/attemptResult";
import type { CanonicalFeedback, InteractionEvaluation, InteractionHandler, QuestionBase } from "./shared";
import { exactResponse } from "./utils";
import { exact, id, text, validateFeedback, validateQuestionBase } from "./validation";

export type ApproachChoiceGrade = "correct" | "partial" | "incorrect";
export type ApproachChoiceOption = Readonly<{ optionId: string; approachId: string; text: string; grade: ApproachChoiceGrade; feedback: string }>;
export type ApproachChoiceQuestion = QuestionBase<"approach_choice"> & Readonly<{
  interaction: Readonly<{ type: "approach_choice"; scoringMethod: "graded_option"; options: readonly ApproachChoiceOption[] }>;
  answer: Readonly<{ type: "approach_choice" }>;
}>;
export type ApproachChoiceResponse = Readonly<{ type: "approach_choice"; optionId: string }>;

export function validateApproachChoiceQuestion(value: unknown): readonly string[] {
  const errors: string[] = [];
  const question = validateQuestionBase(value, "approach_choice", errors);
  if (!question) return Object.freeze(errors);
  const interaction = question.interaction as Record<string, unknown>;
  const optionIds: string[] = [];
  const approachIds: string[] = [];
  if (exact(interaction, ["type", "scoringMethod", "options"], ["type", "scoringMethod", "options"], "question.interaction", errors)) {
    if (interaction.scoringMethod !== "graded_option") errors.push("question.interaction.scoringMethod: invalid method");
    if (!Array.isArray(interaction.options)) errors.push("question.interaction.options: must be an array");
    else {
      if (interaction.options.length < 2) errors.push("question.interaction.options: must contain at least two options");
      for (const [index, candidate] of interaction.options.entries()) {
        const path = `question.interaction.options[${index}]`;
        if (!exact(candidate, ["optionId", "approachId", "text", "grade", "feedback"], ["optionId", "approachId", "text", "grade", "feedback"], path, errors)) continue;
        if (id(candidate.optionId, `${path}.optionId`, errors)) optionIds.push(candidate.optionId);
        if (id(candidate.approachId, `${path}.approachId`, errors)) approachIds.push(candidate.approachId);
        text(candidate.text, `${path}.text`, errors);
        text(candidate.feedback, `${path}.feedback`, errors);
        if (candidate.grade !== "correct" && candidate.grade !== "partial" && candidate.grade !== "incorrect") errors.push(`${path}.grade: unsupported grade`);
      }
      if (new Set(optionIds).size !== optionIds.length) errors.push("question.interaction.options: option IDs must be unique");
      if (new Set(approachIds).size !== approachIds.length) errors.push("question.interaction.options: approach IDs must be unique");
    }
  }
  if (exact(question.answer, ["type"], ["type"], "question.answer", errors) && question.answer.type !== "approach_choice") errors.push("question.answer.type: mismatched type");
  validateFeedback(question.feedback, "approach_choice", [], () => false, errors);
  return Object.freeze(errors);
}

export function isApproachChoiceResponseComplete(question: ApproachChoiceQuestion, response: unknown): response is ApproachChoiceResponse {
  return exactResponse(response, "approach_choice", "optionId") && typeof response.optionId === "string" && question.interaction.options.some((option) => option.optionId === response.optionId);
}

export function scoreApproachChoiceResponse(question: ApproachChoiceQuestion, response: unknown): AttemptResult {
  const selected = isApproachChoiceResponseComplete(question, response) ? question.interaction.options.find((option) => option.optionId === response.optionId) : undefined;
  const grade = selected?.grade ?? "incorrect";
  return createAttemptResult({ kind: grade, earnedPoints: grade === "correct" ? 1 : 0, maxPoints: 1 }, { allowZeroPointPartial: grade === "partial" });
}

export const approachChoiceHandler: InteractionHandler<ApproachChoiceQuestion> = Object.freeze({
  type: "approach_choice",
  validate: validateApproachChoiceQuestion,
  controlIds: (question) => Object.freeze(question.interaction.options.map((option) => option.optionId)),
  randomizeControlOrder: true,
  present(question, response, displayOrder) {
    const selectedId = isApproachChoiceResponseComplete(question, response) ? response.optionId : null;
    const ids = displayOrder.length ? displayOrder : question.interaction.options.map((option) => option.optionId);
    if (ids.length !== question.interaction.options.length || new Set(ids).size !== ids.length || ids.some((optionId) => !question.interaction.options.some((option) => option.optionId === optionId))) throw new Error(`Canonical display order is invalid for ${question.questionId}.`);
    const options = Object.freeze(ids.map((optionId) => {
      const option = question.interaction.options.find((entry) => entry.optionId === optionId)!;
      return Object.freeze({ id: optionId, text: option.text, selected: selectedId === optionId });
    }));
    return Object.freeze({
      accessibility: Object.freeze({ controls: Object.freeze(options.map((option) => Object.freeze({ checked: option.selected, id: option.id, label: option.text, role: "radio" as const }))), interactionKind: "choice", label: question.prompt }),
      renderer: Object.freeze({ kind: "choice", options }),
    });
  },
  projectDiagnostics(question, response) {
    if (!isApproachChoiceResponseComplete(question, response)) return Object.freeze([]);
    return Object.freeze(question.interaction.options.map((option) => Object.freeze({ id: option.optionId, state: option.grade })));
  },
  presentReview(question, response, displayOrder) {
    const complete = isApproachChoiceResponseComplete(question, response);
    return Object.freeze({
      interactionType: "approach_choice",
      model: approachChoiceHandler.present(question, response, displayOrder),
      diagnostics: complete ? approachChoiceHandler.projectDiagnostics(question, response) : Object.freeze([]),
      feedback: complete ? approachChoiceHandler.projectFeedback(question, response) : null,
    });
  },
  projectFeedback(question, response): CanonicalFeedback | null {
    if (!isApproachChoiceResponseComplete(question, response)) return null;
    const selected = question.interaction.options.find((option) => option.optionId === response.optionId)!;
    return Object.freeze({ type: "approach_choice", reason: selected.feedback, details: Object.freeze({ grade: selected.grade, optionId: selected.optionId }) });
  },
  isComplete: isApproachChoiceResponseComplete,
  score: scoreApproachChoiceResponse,
  evaluate(question, response): InteractionEvaluation {
    const complete = isApproachChoiceResponseComplete(question, response);
    return Object.freeze({ complete, result: complete ? scoreApproachChoiceResponse(question, response) : null, diagnostics: approachChoiceHandler.projectDiagnostics(question, response), feedback: approachChoiceHandler.projectFeedback(question, response) });
  },
});
