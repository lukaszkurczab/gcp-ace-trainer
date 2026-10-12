import { createAttemptResult, type AttemptResult } from "../../../domain/learning/attemptResult";
import type { InteractionEvaluation, InteractionHandler, QuestionBase } from "./shared";
import type { CanonicalComplexityDimension } from "./shared";
import { canonicalEvaluation, exactResponse, isDenseArray, isRecord } from "./utils";
import { exact, exactSet, id, text, uniqueIds, validateFeedback, validateQuestionBase, type ValidationDimension } from "./validation";

export type ComplexityQuestion = QuestionBase<"complexity"> & Readonly<{
  interaction: Readonly<{ type: "complexity"; scoringMethod: "dimension_exact"; dimensions: readonly CanonicalComplexityDimension[] }>;
  answer: Readonly<{ type: "complexity"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>;
}>;
export type ComplexityResponse = Readonly<{ type: "complexity"; selectedValueIdsByDimension: Readonly<Record<string, readonly string[]>> }>;

export function validateComplexityQuestion(value: unknown): readonly string[] {
  return validateDimensionQuestion(value, "complexity", true);
}

export function validateDimensionQuestion(value: unknown, type: "complexity" | "decision_matrix", aliasesAllowed: boolean): readonly string[] {
  const errors: string[] = [], question = validateQuestionBase(value, type, errors);
  if (!question) return Object.freeze(errors);
  const refs: string[] = [], dimensions: ValidationDimension[] = [], interaction = question.interaction as Record<string, unknown>;
  if (exact(interaction, ["type", "scoringMethod", "dimensions"], ["type", "scoringMethod", "dimensions"], "question.interaction", errors)) {
    if (interaction.scoringMethod !== "dimension_exact") errors.push("question.interaction.scoringMethod: invalid method");
    if (!Array.isArray(interaction.dimensions)) errors.push("question.interaction.dimensions: must be an array");
    else {
      if (interaction.dimensions.length === 0) errors.push("question.interaction.dimensions: must be non-empty");
      for (const [i, dimension] of interaction.dimensions.entries()) {
        const path = `question.interaction.dimensions[${i}]`, keys = aliasesAllowed ? ["dimensionId", "label", "values", "acceptedValueIds", "aliases"] : ["dimensionId", "label", "values", "acceptedValueIds"];
        if (!exact(dimension, keys, ["dimensionId", "label", "values", "acceptedValueIds"], path, errors)) continue;
        const dimensionId = id(dimension.dimensionId, `${path}.dimensionId`, errors) ? dimension.dimensionId : "";
        text(dimension.label, `${path}.label`, errors);
        const values: string[] = [];
        if (!Array.isArray(dimension.values)) errors.push(`${path}.values: must be an array`);
        else {
          if (dimension.values.length < 2) errors.push(`${path}.values: must contain at least two values`);
          for (const [j, entry] of dimension.values.entries()) if (exact(entry, ["valueId", "text"], ["valueId", "text"], `${path}.values[${j}]`, errors)) {
            if (id(entry.valueId, `${path}.values[${j}].valueId`, errors)) values.push(entry.valueId);
            text(entry.text, `${path}.values[${j}].text`, errors);
          }
          if (new Set(values).size !== values.length) errors.push(`${path}.values: duplicate value IDs`);
        }
        const accepted = uniqueIds(dimension.acceptedValueIds, `${path}.acceptedValueIds`, errors, 1);
        if (accepted.some((entry) => !values.includes(entry))) errors.push(`${path}.acceptedValueIds: unknown value`);
        const aliases: Record<string, string> = {};
        if (Object.hasOwn(dimension, "aliases")) {
          if (!aliasesAllowed || !isRecord(dimension.aliases)) errors.push(`${path}.aliases: unsupported aliases`);
          else for (const [alias, target] of Object.entries(dimension.aliases)) {
            if (id(alias, `${path}.aliases.${alias}`, errors) && values.includes(alias)) errors.push(`${path}.aliases.${alias}: shadows a value`);
            if (!id(target, `${path}.aliases.${alias}`, errors) || !values.includes(target)) errors.push(`${path}.aliases.${alias}: unknown target`); else aliases[alias] = target;
          }
        }
        dimensions.push({ dimensionId, values, accepted, ...(aliasesAllowed ? { aliases } : {}) });
      }
      if (new Set(dimensions.map((dimension) => dimension.dimensionId)).size !== dimensions.length) errors.push("question.interaction.dimensions: duplicate dimension IDs");
    }
  }
  const answer = question.answer;
  if (exact(answer, ["type", "selectedValueIdsByDimension"], ["type", "selectedValueIdsByDimension"], "question.answer", errors)) {
    if (answer.type !== type) errors.push("question.answer.type: mismatched type");
    if (!isRecord(answer.selectedValueIdsByDimension)) errors.push("question.answer.selectedValueIdsByDimension: must be an object");
    else {
      const selected = answer.selectedValueIdsByDimension;
      exactSet(Object.keys(selected), dimensions.map((dimension) => dimension.dimensionId), "question.answer.selectedValueIdsByDimension", errors);
      for (const dimension of dimensions) {
        const values = uniqueIds(selected[dimension.dimensionId], `question.answer.selectedValueIdsByDimension.${dimension.dimensionId}`, errors, 1);
        if (values.some((entry) => !dimension.values.includes(entry) && !Object.hasOwn(dimension.aliases ?? {}, entry))) errors.push(`question.answer.selectedValueIdsByDimension.${dimension.dimensionId}: unknown value`);
        const normalized = values.map((entry) => dimension.aliases?.[entry] ?? entry);
        exactSet(normalized, dimension.accepted, `question.answer.selectedValueIdsByDimension.${dimension.dimensionId}`, errors);
      }
    }
  }
  validateFeedback(question.feedback, type, ["wrong_value", "omitted_dimension"], (kind, target) => kind === "omitted_dimension"
    ? dimensions.some((dimension) => dimension.dimensionId === target)
    : kind === "wrong_value" && dimensions.some((dimension) => dimension.values.some((entry) => target === `${dimension.dimensionId}|${entry}`)), errors);
  return Object.freeze(errors);
}

export function isComplexityResponseComplete(question: ComplexityQuestion, response: unknown): response is ComplexityResponse {
  if (!exactResponse(response, "complexity", "selectedValueIdsByDimension") || !isRecord(response.selectedValueIdsByDimension)) return false;
  const selected = response.selectedValueIdsByDimension, dimensions = question.interaction.dimensions;
  if (Object.keys(selected).some((id) => !dimensions.some((dimension) => dimension.dimensionId === id))) return false;
  return dimensions.every((dimension) => {
    const values = selected[dimension.dimensionId];
    if (!Object.hasOwn(selected, dimension.dimensionId) || !Array.isArray(values) || values.length === 0 || !isDenseArray(values) || new Set(values).size !== values.length) return false;
    const legal = new Set(dimension.values.map((value) => value.valueId)), aliases = dimension.aliases ?? {};
    if (!values.every((value) => typeof value === "string" && (legal.has(value) || Object.hasOwn(aliases, value)))) return false;
    return new Set(values.map((value) => aliases[value as string] ?? value)).size === values.length;
  });
}

export function scoreComplexityResponse(question: ComplexityQuestion, response: unknown): AttemptResult {
  return scoreDimensions(question.interaction.dimensions, response, "complexity", (dimension) => dimension.aliases ?? {});
}

export function complexityDiagnostics(question: ComplexityQuestion, response: unknown) {
  if (!isComplexityResponseComplete(question, response)) return Object.freeze([]);
  const selected = response.selectedValueIdsByDimension;
  return Object.freeze(question.interaction.dimensions.flatMap((dimension) => {
    const aliases = dimension.aliases ?? {}, normalized = selected[dimension.dimensionId]!.map((value) => aliases[value] ?? value), accepted = new Set(dimension.acceptedValueIds);
    const messages = (question.feedback.messages ?? []).filter((message) => message.kind === "wrong_value" && message.targetId.startsWith(`${dimension.dimensionId}|`) && !normalized.includes(message.targetId.slice(dimension.dimensionId.length + 1)) || message.kind === "omitted_dimension" && message.targetId === dimension.dimensionId && normalized.length !== accepted.size);
    return messages;
  }));
}

export const complexityHandler: InteractionHandler<ComplexityQuestion> = Object.freeze({
  type: "complexity",
  validate: validateComplexityQuestion,
  controlIds: (question) => Object.freeze(question.interaction.dimensions.map((dimension) => dimension.dimensionId)),
  randomizeControlOrder: false,
  present(question, response) {
    const selected = response && typeof response === "object" && (response as Record<string, unknown>).type === question.interaction.type
      ? (response as { selectedValueIdsByDimension?: Record<string, readonly string[]> }).selectedValueIdsByDimension ?? {}
      : {};
    const dimensions = Object.freeze(question.interaction.dimensions.map((dimension) => Object.freeze({ id: dimension.dimensionId, label: dimension.label, selectedValues: Object.freeze([...(selected[dimension.dimensionId] ?? [])]), values: Object.freeze(dimension.values.map((value) => Object.freeze({ id: value.valueId, text: value.text }))) })));
    return Object.freeze({
      accessibility: Object.freeze({ controls: Object.freeze(dimensions.map((entry) => Object.freeze({ id: entry.id, label: entry.id, role: "select" as const }))), interactionKind: "complexity", label: question.prompt }),
      renderer: Object.freeze({ kind: "complexity", dimensions }),
    });
  },
  presentReview(question, response, displayOrder) {
    const reviewResponse = response ?? Object.freeze({ type: "complexity" as const, selectedValueIdsByDimension: question.answer.selectedValueIdsByDimension });
    const diagnostics = complexityDiagnostics(question, reviewResponse);
    const { messages: _messages, ...unansweredFeedback } = question.feedback;
    return Object.freeze({ interactionType: "complexity", model: complexityHandler.present(question, reviewResponse, displayOrder), diagnostics,
      feedback: response === null ? Object.freeze(unansweredFeedback) : complexityHandler.projectFeedback(question, reviewResponse) });
  },
  projectDiagnostics: complexityDiagnostics,
  projectFeedback(question, response) {
    if (!isComplexityResponseComplete(question, response)) return null;
    return Object.freeze({ ...question.feedback, ...(question.feedback.messages === undefined ? {} : { messages: complexityDiagnostics(question, response) }) });
  },
  isComplete: isComplexityResponseComplete,
  score: scoreComplexityResponse,
  evaluate(question, response): InteractionEvaluation {
    const complete = isComplexityResponseComplete(question, response), diagnostics = complexityDiagnostics(question, response);
    const feedback = complete ? Object.freeze({ ...question.feedback, ...(question.feedback.messages === undefined ? {} : { messages: diagnostics }) }) : null;
    return canonicalEvaluation(question, response, complete, complete ? scoreComplexityResponse(question, response) : null, diagnostics, feedback);
  },
});

export function scoreDimensions<T extends Readonly<{ dimensionId: string; values: readonly Readonly<{ valueId: string }>[]; acceptedValueIds: readonly string[] }>>(
  dimensions: readonly T[], response: unknown, type: "complexity" | "decision_matrix", aliasesFor: (dimension: T) => Readonly<Record<string, string>>,
): AttemptResult {
  if (!exactResponse(response, type, "selectedValueIdsByDimension") || !isRecord(response.selectedValueIdsByDimension) || Object.keys(response.selectedValueIdsByDimension).some((id) => !dimensions.some((dimension) => dimension.dimensionId === id))) return createAttemptResult({ kind: "incorrect", earnedPoints: 0, maxPoints: dimensions.length });
  let earnedPoints = 0;
  for (const dimension of dimensions) {
    if (!Object.hasOwn(response.selectedValueIdsByDimension, dimension.dimensionId)) continue;
    const selected = response.selectedValueIdsByDimension[dimension.dimensionId], aliases = aliasesFor(dimension), legal = new Set(dimension.values.map((value) => value.valueId));
    if (!Array.isArray(selected) || !isDenseArray(selected) || new Set(selected).size !== selected.length || selected.some((value) => typeof value !== "string" || (!legal.has(value) && !Object.hasOwn(aliases, value)))) return createAttemptResult({ kind: "incorrect", earnedPoints: 0, maxPoints: dimensions.length });
    const normalized = selected.map((value) => aliases[value] ?? value);
    if (new Set(normalized).size !== normalized.length) return createAttemptResult({ kind: "incorrect", earnedPoints: 0, maxPoints: dimensions.length });
    const accepted = new Set(dimension.acceptedValueIds);
    if (normalized.length === accepted.size && normalized.every((value) => accepted.has(value))) earnedPoints += 1;
  }
  return createAttemptResult({ kind: earnedPoints === dimensions.length ? "correct" : earnedPoints > 0 ? "partial" : "incorrect", earnedPoints, maxPoints: dimensions.length });
}
