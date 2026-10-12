import type { Question } from "../../content/canonical/questionTypes";
import type { ResolvedContentRef } from "../../domain";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { canonicalInteractionRegistry, type InteractionQuestionLike } from "../../content/canonical/interactions/registry";
import type { TrainingInteractionPort, TrainingQuestionSummary } from "../trainingLifecycle/contracts";

type QuestionLike = Question | TrainingQuestionSummary;
function controlIds(question: QuestionLike, interactions?: TrainingInteractionPort): readonly string[] {
  return interactions ? interactions.controlIds(question.questionId) : canonicalInteractionRegistry.controlIds(question as InteractionQuestionLike);
}
function randomizeControlOrder(question: QuestionLike, interactions?: TrainingInteractionPort): boolean {
  return interactions ? interactions.randomizeControlOrder(question.questionId) : canonicalInteractionRegistry.randomizeControlOrder(question as InteractionQuestionLike);
}

/** Prepare once. Runtime occurrence IDs include the existing unique session ID. */
export function prepareCanonicalOptionOrder(question: QuestionLike, occurrenceId: string, pin: Pick<ResolvedContentRef, "contentVersion" | "artifactSha256">, interactions?: TrainingInteractionPort): readonly string[] {
  const ids = controlIds(question, interactions);
  if (!randomizeControlOrder(question, interactions)) return Object.freeze([...ids]);
  const ranked = ids.map((id) => ({ id, rank: sha256Utf8(JSON.stringify(["canonical-choice-order-v1", occurrenceId, question.trackId, question.questionId, pin.contentVersion, pin.artifactSha256, id])) }));
  ranked.sort((a, b) => a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return Object.freeze(ranked.map(({ id }) => id));
}

/** Validate persisted membership, never regenerate an already prepared order. */
export function isCanonicalOptionOrder(question: QuestionLike, order: unknown, interactions?: TrainingInteractionPort): order is readonly string[] {
  const ids = controlIds(question, interactions);
  if (!Array.isArray(order) || order.length !== ids.length || new Set(order).size !== ids.length || ids.some((_, index) => !Object.hasOwn(order, index))) return false;
  return randomizeControlOrder(question, interactions) ? order.every((id) => typeof id === "string" && ids.includes(id)) : ids.every((id, index) => order[index] === id);
}

/** Apply the saved occurrence plan before the question crosses to practice UI. */
export function projectCanonicalQuestionInSessionOrder(question: Question, order: unknown): Question {
  if (!isCanonicalOptionOrder(question, order)) throw new Error("Saved control order is unavailable for this session occurrence.");
  const interaction = question.interaction;
  if (interaction.type !== "choice_single" && interaction.type !== "choice_multiple") return question;
  const options = Object.freeze(order.map(id => interaction.options.find(option => option.optionId === id)!));
  // Only order changes; the original matching interaction/answer union is retained.
  return Object.freeze({ ...question, interaction: Object.freeze({ ...interaction, options }) }) as Question;
}
