import type { ReviewReason, TrainingAttempt } from "../../domain";
import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "./algorithmQuestionTypes";
import { scoreAlgorithmQuestion, type AlgorithmQuestionScore } from "./algorithmScoring";
import type { AlgorithmResponse } from "./domain";

export type AlgorithmInteractionKind = "choice" | "ordering" | "complexity";
export type AlgorithmInteractionCompleteness = Readonly<{ complete: boolean; missing: readonly string[] }>;
export type AlgorithmAuthoredFeedback = Readonly<{
  details: string;
  omittedCorrectOptionExplanations: readonly Readonly<{ optionId: string; text: string }>[];
  reason: string;
  wrongOptionExplanations: readonly Readonly<{ optionId: string; text: string }>[];
}>;
export type AlgorithmRendererState =
  | Readonly<{ kind: "choice"; options: readonly Readonly<{ id: string; selected: boolean; text: string }>[] }>
  | Readonly<{ kind: "ordering"; elements: readonly Readonly<{ id: string; text: string }>[] }>
  | Readonly<{ dimensions: readonly Readonly<{ id: string; selectedValue?: string; values: readonly string[] }>[]; kind: "complexity" }>;
export type AlgorithmAccessibilityViewModel = Readonly<{
  controls: readonly Readonly<{ checked?: boolean; id: string; label: string; role: "checkbox" | "radio" | "option" | "select" }>[];
  interactionKind: AlgorithmInteractionKind;
  label: string;
}>;

export class AlgorithmInteractionContentError extends Error {
  constructor(readonly itemId: string, readonly defect: string) {
    super(`Algorithms content defect in ${itemId}: ${defect}`);
    this.name = "AlgorithmInteractionContentError";
  }
}

export function validateAlgorithmInteractionItem(question: AlgorithmQuestion): void {
  requireText(question, question.feedbackModel.decisionSignal, "missing authored Reason");
  requireText(question, question.feedbackModel.details, "missing authored Details");
  if (isAlgorithmChoiceQuestion(question)) {
    validateChoiceItem(question);
    return;
  }
  if (isAlgorithmOrderingQuestion(question)) {
    if (question.subgoals.length < 2 || question.correctOrder.length < 2) fail(question, "ordering requires at least two elements");
    const subgoalIds = question.subgoals.map((subgoal) => subgoal.id);
    if (new Set(subgoalIds).size !== subgoalIds.length || new Set(question.correctOrder).size !== question.correctOrder.length || question.correctOrder.length !== subgoalIds.length || question.correctOrder.some((id) => !subgoalIds.includes(id))) {
      fail(question, "ordering canonical order must contain each stable element exactly once");
    }
    return;
  }
  if (isAlgorithmComplexityQuestion(question)) {
    const { dimensions, maxPoints } = question.correctComplexity;
    if (dimensions.length === 0 || maxPoints !== dimensions.length) fail(question, "complexity must declare checked dimensions and matching maxPoints");
    if (new Set(dimensions.map((dimension) => dimension.id)).size !== dimensions.length) fail(question, "complexity dimension IDs must be unique");
    for (const dimension of dimensions) {
      if (!dimension.id.trim() || dimension.values.length === 0 || dimension.acceptedValues.length === 0 || dimension.acceptedValues.some((value) => !dimension.values.includes(value)) || new Set(dimension.values).size !== dimension.values.length) {
        fail(question, `complexity dimension ${dimension.id} is incomplete`);
      }
      if ((dimension.acceptedAliases ?? []).some((alias) => !alias.trim())) fail(question, `complexity dimension ${dimension.id} has an invalid alias`);
    }
    return;
  }
  fail(question, "unsupported active interaction type");
}

export function getAlgorithmInteractionCompleteness(question: AlgorithmQuestion, response: AlgorithmResponse | null): AlgorithmInteractionCompleteness {
  if (!response) return Object.freeze({ complete: false, missing: Object.freeze(["response"]) });
  if (isAlgorithmChoiceQuestion(question)) {
    return Object.freeze({ complete: response.kind === "choice" && response.selectedOptionIds.length > 0, missing: response.kind === "choice" && response.selectedOptionIds.length > 0 ? Object.freeze([]) : Object.freeze(["selection"]) });
  }
  if (isAlgorithmOrderingQuestion(question)) {
    return Object.freeze({ complete: response.kind === "ordering" && response.orderedSubgoalIds.length === question.correctOrder.length, missing: response.kind === "ordering" && response.orderedSubgoalIds.length === question.correctOrder.length ? Object.freeze([]) : Object.freeze(["ordered_elements"]) });
  }
  if (isAlgorithmComplexityQuestion(question)) {
    const missing = question.correctComplexity.dimensions.filter((dimension) => !response || response.kind !== "complexity" || !response.selectedValuesByDimension[dimension.id]).map((dimension) => dimension.id);
    return Object.freeze({ complete: response.kind === "complexity" && missing.length === 0, missing: Object.freeze(missing) });
  }
  return Object.freeze({ complete: false, missing: Object.freeze(["unsupported_interaction"]) });
}

/** Scores only a complete submitted response. Feedback is composed from authored fields only. */
export function submitAlgorithmInteraction(input: Readonly<{ question: AlgorithmQuestion; response: AlgorithmResponse }>): Readonly<{
  feedback: AlgorithmAuthoredFeedback;
  score: AlgorithmQuestionScore;
}> {
  validateAlgorithmInteractionItem(input.question);
  const completeness = getAlgorithmInteractionCompleteness(input.question, input.response);
  if (!completeness.complete) throw new Error(`Algorithms response for ${input.question.id} is incomplete: ${completeness.missing.join(", ")}.`);
  const score = scoreAlgorithmQuestion(input.question, input.response);
  return Object.freeze({ feedback: composeAlgorithmAuthoredFeedback(input.question, score), score });
}

export function composeAlgorithmAuthoredFeedback(question: AlgorithmQuestion, score: AlgorithmQuestionScore): AlgorithmAuthoredFeedback {
  validateAlgorithmInteractionItem(question);
  const explanations = question.feedbackModel.distractorExplanations ?? {};
  const omissions = question.feedbackModel.omittedCorrectOptionExplanations ?? {};
  const wrongOptionExplanations = score.diagnostics.selectedWrongOptionIds.map((optionId) => {
    const text = explanations[optionId];
    if (!text?.trim()) fail(question, `missing authored explanation for selected wrong option ${optionId}`);
    return Object.freeze({ optionId, text });
  });
  const omittedCorrectOptionExplanations = score.diagnostics.omittedCorrectOptionIds.map((optionId) => {
    const text = omissions[optionId];
    if (!text?.trim()) fail(question, `missing authored explanation for omitted correct option ${optionId}`);
    return Object.freeze({ optionId, text });
  });
  return Object.freeze({
    details: question.feedbackModel.details!,
    omittedCorrectOptionExplanations: Object.freeze(omittedCorrectOptionExplanations),
    reason: question.feedbackModel.decisionSignal,
    wrongOptionExplanations: Object.freeze(wrongOptionExplanations),
  });
}

/** Safe before the feedback boundary: it carries only prompts, response state and available controls. */
export function buildAlgorithmInteractionViewModel(question: AlgorithmQuestion, response: AlgorithmResponse | null): Readonly<{
  accessibility: AlgorithmAccessibilityViewModel;
  renderer: AlgorithmRendererState;
}> {
  validateAlgorithmInteractionItem(question);
  if (isAlgorithmChoiceQuestion(question)) {
    const selected = response?.kind === "choice" ? new Set(response.selectedOptionIds) : new Set<string>();
    const multiple = question.options.filter((option) => option.isCorrect).length > 1;
    const options = Object.freeze(question.options.map((option) => Object.freeze({ id: option.id, selected: selected.has(option.id), text: option.text })));
    return Object.freeze({
      accessibility: Object.freeze({ controls: Object.freeze(options.map((option) => Object.freeze({ checked: option.selected, id: option.id, label: option.text, role: multiple ? "checkbox" as const : "radio" as const }))), interactionKind: "choice", label: question.prompt }),
      renderer: Object.freeze({ kind: "choice", options }),
    });
  }
  if (isAlgorithmOrderingQuestion(question)) {
    const ordered = response?.kind === "ordering" ? response.orderedSubgoalIds : question.subgoals.map((subgoal) => subgoal.id);
    const textById = new Map(question.subgoals.map((subgoal) => [subgoal.id, subgoal.text]));
    const elements = Object.freeze(ordered.map((id) => Object.freeze({ id, text: textById.get(id) ?? id })));
    return Object.freeze({ accessibility: Object.freeze({ controls: Object.freeze(elements.map((element) => Object.freeze({ id: element.id, label: element.text, role: "option" as const }))), interactionKind: "ordering", label: question.prompt }), renderer: Object.freeze({ elements, kind: "ordering" }) });
  }
  if (isAlgorithmComplexityQuestion(question)) {
    const selected = response?.kind === "complexity" ? response.selectedValuesByDimension : {};
    const dimensions = Object.freeze(question.correctComplexity.dimensions.map((dimension) => Object.freeze({ id: dimension.id, ...(selected[dimension.id] ? { selectedValue: selected[dimension.id] } : {}), values: Object.freeze([...dimension.values]) })));
    return Object.freeze({ accessibility: Object.freeze({ controls: Object.freeze(dimensions.map((dimension) => Object.freeze({ id: dimension.id, label: dimension.id, role: "select" as const }))), interactionKind: "complexity", label: question.prompt }), renderer: Object.freeze({ dimensions, kind: "complexity" }) });
  }
  fail(question, "unsupported active interaction type");
}

export function deriveAlgorithmReviewReasons(input: Readonly<{ priorAttemptsForSameItem: readonly TrainingAttempt[]; score: AlgorithmQuestionScore }>): readonly ReviewReason[] {
  if (input.score.status === "correct") return Object.freeze([]);
  const reasons = new Set<ReviewReason>([input.score.status]);
  if (input.score.diagnostics.selectedWrongOptionIds.length > 0) reasons.add("wrong_strategy");
  if (input.score.diagnostics.incorrectComplexityDimensionIds.length > 0) reasons.add("complexity_error");
  if (input.score.diagnostics.brokenOrderingRelations.length > 0) reasons.add("wrong_pattern");
  if (input.priorAttemptsForSameItem.some((attempt) => attempt.result.kind !== "correct")) reasons.add("repeated_mistake");
  return Object.freeze([...reasons]);
}

function validateChoiceItem(question: Extract<AlgorithmQuestion, { options: readonly unknown[] }>): void {
  if (question.options.length < 2 || new Set(question.options.map((option) => option.id)).size !== question.options.length || question.options.some((option) => !option.id.trim() || !option.text.trim())) fail(question, "choice options must have unique stable IDs and text");
  const correct = question.options.filter((option) => option.isCorrect);
  if (correct.length === 0) fail(question, "choice requires at least one correct option");
  const wrong = question.options.filter((option) => !option.isCorrect);
  const distractors = question.feedbackModel.distractorExplanations ?? {};
  if (wrong.some((option) => !distractors[option.id]?.trim())) fail(question, "every wrong choice option requires an authored stable-ID explanation");
  if (correct.length > 1) {
    const omissions = question.feedbackModel.omittedCorrectOptionExplanations ?? {};
    if (correct.some((option) => !omissions[option.id]?.trim())) fail(question, "multiple-choice requires authored omitted-correct explanations");
  }
}

function requireText(question: AlgorithmQuestion, value: string | undefined, defect: string): void { if (!value?.trim()) fail(question, defect); }
function fail(question: AlgorithmQuestion, defect: string): never { throw new AlgorithmInteractionContentError(question.id, defect); }
